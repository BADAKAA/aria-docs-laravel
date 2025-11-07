import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
// Removed MDX pipeline; content comes from database

export default defineConfig({
    plugins: [
        // Hard-ignore any accidental .mdx imports (content is sourced from DB)
        {
            name: 'ignore-mdx-files',
            enforce: 'pre',
            resolveId(source) {
                if (source.endsWith('.mdx')) return source;
                return null;
            },
            load(id) {
                if (id.endsWith('.mdx')) {
                    // Provide an empty module so Rollup doesn't try to parse MDX
                    return 'export default {}';
                }
                return null;
            },
        },
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    esbuild: {
        jsx: 'automatic',
    },
});
