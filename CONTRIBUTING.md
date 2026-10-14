# Contributing

## Setup

```sh
npm install
```

## Scripts

| Command              | Purpose                               |
| -------------------- | ------------------------------------- |
| `npm run build`      | Bundle with tsup (ESM + CJS + types). |
| `npm run dev`        | Rebuild on change.                    |
| `npm run typecheck`  | `tsc --noEmit`.                       |
| `npm run test`       | Run the vitest suite once.            |
| `npm run test:watch` | Run vitest in watch mode.             |
| `npm run check`      | Typecheck then test.                  |

## Guidelines

- Match the existing style: no comments unless they explain _why_, `import type` for
  type-only imports (`verbatimModuleSyntax` is on), and no `any` without justification.
- Every exported symbol needs a doc comment.
- Tests live in `tests/`, mirroring the `src/` layout. Add a test for any behaviour change.
- Keep `npm run check` green before opening a pull request.
- One logical change per commit, no scope creep.
