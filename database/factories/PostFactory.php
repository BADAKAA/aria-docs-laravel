<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Post>
 */
class PostFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'author_id' => 1,
            'parent_id' => null,
            'title' => fake()->sentence(),
            'slug' => fake()->unique()->slug(),
            'summary' => fake()->paragraph(),
            'type' => \App\Enums\PostType::BLOG->value,
            'status' => \App\Enums\PostStatus::PUBLIC->value,
            'content' => "# This is a heading\n".fake()->paragraphs(5, true),
            'cover_path' => null,
            'published_at' => now()->format('Y-m-d'),
        ];
    }
}
