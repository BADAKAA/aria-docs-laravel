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

        $this->seedDirectory($docsRoot, $defaultAuthor->id, $docsRoot);
    }

    private function seedDirectory(string $dir, int $authorId, string $root, string $category = 'General', ?int $parentId = null): void
    {
        // Create/update the page for this directory if index.mdx exists, once.
        $indexPath = $dir.DIRECTORY_SEPARATOR.'index.mdx';
        $currentParentId = $parentId;
        if (is_file($indexPath)) {
            $currentParentId = $this->createOrUpdateFromMdx($indexPath, $authorId, $root, $category, $parentId);
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
    private function createOrUpdateFromMdx(string $filePath, int $authorId, string $root, string $category, ?int $parentId = null): int
    {
        $slug = Str::of($filePath)
            ->after($root.DIRECTORY_SEPARATOR)
            ->replace(DIRECTORY_SEPARATOR, '/')
            ->replace('/index.mdx', '')
            ->replace('.mdx', '')
            ->lower()
            ->toString();
        $raw = File::get($filePath);
        [$frontmatter, $content] = $this->splitFrontmatter($raw);

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
        $dir = Str::beforeLast($relative, '/index.mdx');
        $last = Str::afterLast($dir, '/');
        return Str::title(str_replace(['-', '_'], ' ', $last));
    }
}
