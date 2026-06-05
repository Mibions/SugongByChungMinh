# AGENTS.md — RULES FOR CODING AGENTS

## Scope
Chỉ triển khai website product showcase SUGONG theo các file prompt và layout đã duyệt. Không tự ý thêm tính năng ngoài phạm vi.

## Architecture
- Astro-first.
- React only for interactive islands.
- Pages compose sections; pages do not contain large UI blocks.
- Product data must come from Content Collections.

## Styling
- Use Tailwind CSS 4 and centralized theme tokens.
- No `!important`.
- No Sass/Less.
- No hard-coded brand colors inside components.
- Do not create global CSS rules for individual components.

## Performance
- Avoid unnecessary hydration.
- Prefer static Astro components.
- Lazy-load below-the-fold media.
- Use image optimization and explicit dimensions.
- Do not autoplay multiple videos.

## Workflow
- Work on one page at a time.
- Before coding, list files to create/change.
- After coding, run type-check, lint and build.
- Do not claim completion when checks fail.
- Do not broaden scope without explicit request.
