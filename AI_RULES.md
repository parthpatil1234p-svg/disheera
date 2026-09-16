# AI RULES — TOKEN-EFFICIENT OPERATING MODE

These rules apply to every coding task in this project.

## Startup Rule

Before doing anything:

1. Read `AI_BRAIN.md`.
2. Understand the requested task.
3. Determine the smallest set of project files needed.
4. Read ONLY those files.

Do NOT begin by scanning the entire repository.

## File Reading Rules

### Allowed immediately
- `AI_BRAIN.md`
- A file explicitly named by the user
- A file listed as relevant in `AI_BRAIN.md`

### Read only when necessary
- Direct dependencies of the file currently being edited
- Route/controller/model connected to the requested feature
- Configuration required for the requested change

### Avoid unless absolutely necessary
- Entire repository scans
- Entire dependency folders
- `node_modules`
- build/dist folders
- lockfiles
- generated assets
- unrelated pages/components
- large data files

## Search Before Reading

If you need to find something:

1. Search by filename, symbol, route, component name, function name, or keyword.
2. Identify the likely file.
3. Open the smallest relevant section/file.
4. Do not open ten files when one or two are sufficient.

## Memory-First Reasoning

Treat `AI_BRAIN.md` as the project's working memory.

Use it for:
- architecture
- stack
- previous decisions
- current task state
- file locations
- completed work
- known issues

Do NOT reopen a source file simply to rediscover information already accurately stored in memory.

## Verification Rule

Memory is a summary, not ground truth.

Open source files when:
- modifying code
- exact function signatures are needed
- exact schema/route/component behavior matters
- memory may be outdated
- debugging a concrete error
- user asks for verification

Never invent code based only on memory when an exact file must be changed.

## Editing Rule

Before editing:
1. Read `AI_BRAIN.md`.
2. Read target file.
3. Read only required dependencies.
4. Make minimal changes.
5. Run relevant checks/tests.
6. Update memory.

## Memory Update Rule

After meaningful changes, update `AI_BRAIN.md`.

Record:
- what changed
- relevant files
- important decisions
- newly added routes/features
- unresolved issue
- next logical step

Do not paste large code blocks into memory.

## Compression Rule

Keep memory compact.

Good:
`POST /api/auth/login — validates credentials and returns JWT.`

Bad:
Copying the entire login controller.

Good:
`RBAC middleware: backend/middleware/authorize.js`

Bad:
Copying every RBAC function.

## Conflict Rule

If memory conflicts with source code:

SOURCE CODE WINS.

Correct the memory after verifying the source.

## Token Budget Strategy

For normal tasks:

- Brain/context: ~1–4k tokens
- Target files: only what's needed
- Avoid repo-wide context

For large refactors:
- inspect architecture gradually
- create/update a temporary task summary
- do not load everything at once

## End-of-Task Protocol

Before finishing:

1. Confirm relevant code/tests.
2. Update `AI_BRAIN.md`.
3. Keep only durable information.
4. Write a concise Last Session Summary.
