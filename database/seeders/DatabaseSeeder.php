<?php

namespace Database\Seeders;

use App\Enums\PostType;
use App\Models\Post;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Database\Seeders\DocumentationSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );

        Post::factory(20)->create();

        // Fill all seeded blog posts with converted BlockNote content from post.md
        $mdPath = __DIR__.DIRECTORY_SEPARATOR.'post.md';
        if (is_file($mdPath)) {
            $raw = File::get($mdPath);
            $converted = $this->convertMarkdownBatch([$mdPath => $raw]);
            $blocks = $converted[$mdPath] ?? $raw;
            Post::where('type', PostType::BLOG->value)->update(['content' => $blocks]);
        }

        // Seed documentation pages from MDX files
        $this->call(DocumentationSeeder::class);
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
