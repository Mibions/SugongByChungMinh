# AGENTS-BACKEND-READY.md

## Data access rules
- Components and pages must never call APIs directly.
- All product access goes through `ProductRepository` or `ProductService`.
- Domain types must not depend on API generated types.
- API responses must pass through a mapper.
- Local and API repositories must implement the same interface.

## Current mode
- Default mode is local.
- The website must work without a backend.
- Do not block implementation waiting for an API.

## Future mode
- Use OpenAPI-generated types.
- Use openapi-fetch for API calls.
- Use TanStack Query only for client-side server state.
- Use MSW before the real backend exists.

## Scope
- Do not implement backend, admin dashboard, authentication, checkout, or cart.
- Do not broaden the approved layout.
