# Schema Branch

Schema Branch is a web app for branching, diffing, and merging database schemas. It treats the schema as the versioned artifact: tables, columns, column types, nullability, constraints, and indexes. Row data is intentionally out of scope.

## Deployed demo

[https://schema-branch.vercel.app/](https://schema-branch.vercel.app/)

## Why this project

I chose the database schema version-control prompt because it combines a hard product problem with a hard frontend problem. The hard part is not drawing tables on screen; it is making schema evolution understandable. A naive text diff is noisy and often wrong from the user's perspective, so this app uses semantic diff rules such as column added, column renamed, column retyped, and breaking removal.

## Senior frontend structure

- `src/domain`: pure business logic for diffing and merge conflict detection.
- `src/hooks`: custom hooks for state management and workflow orchestration.
- `src/components`: presentational UI components that receive data and callbacks.
- `src/data`: demo schemas and branches for the first-run experience.
- `src/types`: shared schema and diff contracts.

This keeps complex product behavior testable without mounting React components.

## Run locally

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

The tests focus on the risky product behavior: semantic rename detection, breaking column removal, and merge conflict detection.
