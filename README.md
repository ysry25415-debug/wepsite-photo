# OASIS Frames

Mobile-first React + Tailwind storefront for custom framed prints and Forex boards.

## Start

1. In Supabase, create the Auth user `codexa031@gmail.com` with the intended password.
2. Run [supabase/schema.sql](./supabase/schema.sql) in the Supabase SQL editor.
3. Copy `.env.example` to `.env` if you want to override the included public Supabase configuration.
4. Install packages with `pnpm install`, then run `pnpm dev`.

The admin sign-in is intentionally hidden behind `Ctrl + Shift + P`; its password is never stored in browser source code.
