<?php

namespace App\Services;

use League\CommonMark\CommonMarkConverter;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\Autolink\AutolinkExtension;
use League\CommonMark\Extension\GithubFlavoredMarkdownExtension;
use League\CommonMark\Extension\Table\TableExtension;

/**
 * MarkdownCompiler converts user-authored markdown into HTML on the server.
 *
 * MDX components are supported via lightweight shortcodes, e.g.:
 * <Note title="Heads up">Content</Note>
 * <Tabs>...custom HTML...</Tabs>
 *
 * You can map supported tags to HTML wrappers here.
 */
class MarkdownCompiler
{
    public function __construct()
    {
        $config = [
            'html_input' => 'allow',
            'allow_unsafe_links' => false,
        ];
        $env = new Environment($config);
        $env->addExtension(new GithubFlavoredMarkdownExtension());
        $env->addExtension(new AutolinkExtension());
        $env->addExtension(new TableExtension());
        $this->converter = new CommonMarkConverter($config, $env);
    }

    protected CommonMarkConverter $converter;

    public function toHtml(string $markdown): string
    {
        // First, transform supported MDX-like tags into HTML wrappers that match your frontend components.
        $transformed = $this->transformCustomComponents($markdown);
        return $this->converter->convert($transformed)->getContent();
    }

    protected function transformCustomComponents(string $md): string
    {
        // Example: <Note title="...">body</Note> -> <div class="mdx-note" data-title="...">body</div>
        $md = preg_replace_callback(
            '#<Note\s+title=\"([^\"]*)\">([\s\S]*?)</Note>#m',
            function ($m) {
                $title = htmlspecialchars($m[1], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                $body = $m[2];
                return "\n<div class=\"mdx-note\"><div class=\"mdx-note__title\">{$title}</div>\n\n{$body}\n</div>\n";
            },
            $md
        );

        // Add more mappings here as needed (Tabs, Stepper, Files, etc.)

        return $md;
    }
}
