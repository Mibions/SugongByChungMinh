#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="sugong-showcase"

pnpm create astro@latest "$PROJECT_NAME" -- --template minimal --typescript strict --install
cd "$PROJECT_NAME"
pnpm astro add react
pnpm astro add sitemap

pnpm add tailwindcss @tailwindcss/vite
pnpm add -D @storybook/astro storybook @playwright/test prettier eslint

printf "\nProject scaffolded. Next: configure Tailwind in astro.config.mjs and create src/styles/theme.css.\n"
