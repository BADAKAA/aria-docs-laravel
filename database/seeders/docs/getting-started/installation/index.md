Set up the CMS locally on Laravel + Inertia.

## Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- pnpm or npm
- A local web server (Laravel `artisan serve` or XAMPP)

## Steps
1. Install PHP dependencies:
   ```bash
   composer install
   ```
2. Install JS dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```
3. Configure environment:
   - Copy `.env.example` to `.env` and update DB credentials.
   - Optionally configure mail and storage settings.
4. Generate app key:
   ```bash
   php artisan key:generate
   ```
5. Migrate and seed:
   ```bash
   php artisan migrate --seed
   # For a clean reset with docs:
   php artisan migrate:fresh --seed
   ```
6. Link storage (for media uploads):
   ```bash
   php artisan storage:link
   ```
7. Start dev servers:
   ```bash
   pnpm dev
   # and in another terminal
   php artisan serve
   ```

Login and explore the Dashboard, Media Library, and Docs Order tools. Create posts and docs using the Blocknote editor.