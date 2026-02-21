# website_2025

## Conventions

- Return tuples from app functions: `[result, err]`.
- Keep deterministic logic in `*.pure.js` only.
- Keep side effects in `*.impure.js` only.
- Do not use app-level `try/catch`; boundary wrappers in impure files normalize throws.
- Add JSDoc to exported functions.
- Add short comments only on critical paths.

## Scripts

- `npm run install:all`: install workspace dependencies.
- `npm run dev`: run web + api in foreground.
- `npm run dev:bg:start`: run dev stack in background.
- `npm run dev:bg:stop`: stop background dev stack.
- `npm run dev:bg:logs`: view background logs.

## Ports

- Web dev server: `http://localhost:4000` (strict port).
- API server: `http://localhost:8787`.

## Logs

- Structured API logs are written to `/logs/api.log` as JSON lines.
- Rolling files rotate automatically to `/logs/api.log.1` through `/logs/api.log.5`.
- Background dev process logs are stored in `/logs/devserver.out.log` and `/logs/devserver.err.log`.

