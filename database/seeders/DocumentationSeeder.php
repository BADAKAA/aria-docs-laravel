<?php

namespace Database\Seeders;

use App\Enums\PostStatus;
use App\Enums\PostType;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class DocumentationSeeder extends Seeder
{
    /**
     * Cache of converted BlockNote JSON by file path.
     * @var array<string,string>
     */
    private array $blocksCache = [];

    /**
     * Seed docs from the Next project's contents/docs directory.
     */
    public function run(): void
    {
        // Root of Next project contents/docs (adjust if needed)
        $docsRoot = __DIR__.DIRECTORY_SEPARATOR.'docs';
        if (!$docsRoot || !is_dir($docsRoot)) {
            $this->command?->warn('Docs path not found: '.$docsRoot);
            return;
        }

        $defaultAuthor = User::first();
        if (!$defaultAuthor) {
            $defaultAuthor = User::create([
                'name' => 'Docs Bot',
                'email' => 'docs@example.com',
                'password' => 'password',
                'email_verified_at' => now(),
            ]);
        }

        // Precompute blocks for all markdown pages in a single Node process
        $allFiles = $this->listIndexMarkdownFiles($docsRoot);
        $fileBodies = [];
        foreach ($allFiles as $fp) {
            $raw = File::get($fp);
            [, $mdBody] = $this->splitFrontmatter($raw);
            $fileBodies[$fp] = $mdBody;
        }
        $this->blocksCache = $this->convertMarkdownBatch($fileBodies) ?? [];

        $this->seedDirectory($docsRoot, $defaultAuthor->id, $docsRoot);
    }

    private function seedDirectory(string $dir, int $authorId, string $root, string $category = 'General', ?int $parentId = null): void
    {
        // Create/update the page for this directory if index.md exists, once.
        $indexPath = $dir.DIRECTORY_SEPARATOR.'index.md';
        $currentParentId = $parentId;
        if (is_file($indexPath)) {
            $currentParentId = $this->createOrUpdateFromMarkdown($indexPath, $authorId, $root, $category, $parentId);
        }

        // Recurse into subdirectories, passing the current directory's id as parent
        foreach (scandir($dir) as $entry) {
            if ($entry === '.' || $entry === '..') continue;
            $full = $dir.DIRECTORY_SEPARATOR.$entry;
            if (is_dir($full)) {
                $this->seedDirectory($full, $authorId, $root, $category, $currentParentId);
            }
        }
    }

    /**
     * Parse MDX frontmatter and content; authors are ignored.
     * Returns the Post id.
     */
    private function createOrUpdateFromMarkdown(string $filePath, int $authorId, string $root, string $category, ?int $parentId = null): int
    {
        $slug = Str::of($filePath)
            ->after($root.DIRECTORY_SEPARATOR)
            ->replace(DIRECTORY_SEPARATOR, '/')
            ->replace('/index.md', '')
            ->replace('.md', '')
            ->lower()
            ->toString();
        $raw = File::get($filePath);
        [$frontmatter, $mdBody] = $this->splitFrontmatter($raw);
        $content = $this->blocksCache[$filePath] ?? $mdBody;

        $title = $frontmatter['title'] ?? $this->titleFromPath($filePath, $root);
        $summary = $frontmatter['description'] ?? null;

        $post = Post::updateOrCreate(
            ['slug' => $slug, 'type' => PostType::DOC->value],
            [
                'author_id' => $authorId,
                'category' => $category,
                'parent_id' => $parentId,
                'title' => $title,
                'summary' => $summary,
                'status' => PostStatus::PUBLIC->value,
                'content' => $content,
                'published_at' => now()->format('Y-m-d'),
            ]
        );

        return $post->id;
    }

    /**
     * Very small frontmatter parser: expects ---\nYAML\n--- at top.
     * Returns [assoc array, content string]
     */
    private function splitFrontmatter(string $raw): array
    {
        if (Str::startsWith($raw, '---')) {
            $parts = preg_split('/\R?---\R/', $raw, 3);
            if ($parts && count($parts) >= 3) {
                $yaml = $parts[1];
                $content = $parts[2];
                $data = $this->parseSimpleYaml($yaml);
                // Explicitly ignore authors
                unset($data['authors']);
                return [$data, $content];
            }
        }
        return [[], $raw];
    }

    /**
     * Minimal YAML parser for simple key: value pairs and arrays like [a, b].
     */
    private function parseSimpleYaml(string $yaml): array
    {
        $result = [];
        foreach (preg_split('/\R/', $yaml) as $line) {
            $line = trim($line);
            if ($line === '' || Str::startsWith($line, '#')) continue;
            if (!str_contains($line, ':')) continue;
            [$key, $val] = array_map('trim', explode(':', $line, 2));
            // strip quotes
            $val = trim($val, " \"'\t");
            // handle inline arrays [a, b]
            if (Str::startsWith($val, '[') && Str::endsWith($val, ']')) {
                $inner = trim($val, '[]');
                $items = array_filter(array_map(fn($v) => trim(trim($v), "\"'"), explode(',', $inner)));
                $result[$key] = array_values($items);
            } else {
                $result[$key] = $val;
            }
        }
        return $result;
    }

    private function titleFromPath(string $path, string $root): string
    {
        $relative = trim(str_replace(['\\', $root], ['/', ''], $path), '/');
        $dir = Str::beforeLast($relative, '/index.md');
        $last = Str::afterLast($dir, '/');
        return Str::title(str_replace(['-', '_'], ' ', $last));
    }

    /**
     * Recursively list all index.md files under a directory.
     * @return array<int,string>
     */
    private function listIndexMarkdownFiles(string $dir): array
    {
        $files = [];
        foreach (scandir($dir) as $entry) {
            if ($entry === '.' || $entry === '..') continue;
            $full = $dir.DIRECTORY_SEPARATOR.$entry;
            if (is_dir($full)) {
                $files = array_merge($files, $this->listIndexMarkdownFiles($full));
            } elseif (is_file($full) && Str::endsWith($full, DIRECTORY_SEPARATOR.'index.md')) {
                $files[] = $full;
            } elseif (is_file($full) && Str::endsWith($full, 'index.md')) {
                $files[] = $full;
            }
        }
        return $files;
    }

    /**
     * Batch convert multiple markdown bodies to BlockNote blocks via Node script.
     * @param array<string,string> $fileBodies Map of filePath => markdownBody
     * @return array<string,string>|null Map of filePath => blocks JSON string
     */
    private function convertMarkdownBatch(array $fileBodies): ?array
    {
        if (empty($fileBodies)) return [];
        try {
            $script = base_path('scripts/md-to-blocks-batch.js');
            if (!is_file($script)) return null;
            $tmp = tempnam(sys_get_temp_dir(), 'mdbatch_');
            if ($tmp === false) return null;
            File::put($tmp, json_encode($fileBodies, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
            $cmd = 'node ' . escapeshellarg($script) . ' ' . escapeshellarg($tmp);
            $out = @shell_exec($cmd);
            @unlink($tmp);
            if (!is_string($out)) return null;
            $map = json_decode($out, true);
            if (!is_array($map)) return null;
            // Ensure values are strings
            $result = [];
            foreach ($map as $k => $v) {
                $result[$k] = is_string($v) ? $v : json_encode($v);
            }
            return $result;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
