# Copilot / AI Agent Hints for front-n1

This file contains concise, actionable guidance for AI coding agents working in this repo. Reference the listed files while making changes.

1. Big picture
- Framework: Next.js (app router present under `app/`) using TypeScript.
- UI: Material UI (`@mui/material`, `@mui/icons-material`) with `@emotion/*` for styling. Tailwind (`tailwindcss`) is also installed — MUI components are used throughout.
- Data & networking: `axios` is used by thin service modules in `app/services/` to talk to a backend API.

2. Key locations
- App entry points: `app/layout.tsx`, `app/page.tsx`.
- Pages/components: shared UI lives in `app/components/`.
- Services: network and domain logic live under `app/services/` (e.g. `app/services/auth/authService.ts`).
- Hooks & context: `app/hooks/` and `app/context/` hold stateful logic and providers.

3. Important conventions & patterns (observed)
- Service functions are thin wrappers around `axios` and return `response.data`. They throw an `Error` with the server message when the request fails (see `app/services/auth/authService.ts`).
- Environment: backend base URL is read from `process.env.NEXT_PUBLIC_API_URL`. Agents must not hardcode API URLs — use that env var.
- TypeScript: code uses explicit typed interfaces for request payloads (e.g. `LoginData`, `RegisterData`). Keep type signatures consistent when editing services or components.
- MUI-first UI: prefer creating or updating components using MUI primitives (`Button`, `TextField`, `Box`, etc.) to match existing UI patterns.

4. Notable inconsistencies you may encounter
- Some files import services with paths like `../services/authService` or `../../services/authService` while the actual file is `app/services/auth/authService.ts`. Before renaming or moving files, search the repo for all usages and update imports. Use the IDE to resolve and prefer consistent paths.

5. Developer workflows & scripts
- Run dev server: `npm run dev` (Next dev server).
- Build: `npm run build`.
- Start production server: `npm run start`.
- Lint: `npm run lint` (project uses `eslint`).

6. Testing & verification (manual)
- To verify changes locally:
  - Install deps: `npm install`
  - Start dev: `npm run dev` and open `http://localhost:3000`.
  - If you change API endpoints, set `NEXT_PUBLIC_API_URL` in your environment or `.env.local`.

7. Integration points & external dependencies
- Backend: all API calls go to `${process.env.NEXT_PUBLIC_API_URL}/...` (see `app/services/*`). Confirm the API contract before changing request/response shapes.
- Styling: MUI components use Emotion; global styles and Tailwind may coexist — check `globals.css` and `postcss.config.mjs` before altering CSS architecture.

8. Safe editing guidance for AI agents
- Preserve public APIs: when modifying a service function signature, update all callers.
- Keep errors informative: existing services rethrow server messages; follow that pattern.
- Prefer small, focused commits and include `npm run dev` verification steps in the PR description.

9. Quick examples (copy-paste safe)
- Calling login service (existing pattern):
  - Service: `app/services/auth/authService.ts` exports `loginUser(data: {email:string,password:string})` returning `response.data`.
  - Usage (component): call `await loginUser({ email, password })` and handle success/failure similar to `app/pages/auth/login/page.tsx`.

10. When in doubt
- Search the repo for similar files in `app/components`, `app/services`, and `app/pages` before introducing new patterns.
- If an import path looks wrong, run a workspace search for the symbol to find all usages.

If anything here is unclear or you'd like more examples (e.g., a recommended import alias setup or a style-guide for Tailwind vs MUI), tell me which area to expand.
