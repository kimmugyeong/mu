## Quick instructions for AI coding agents

This repository currently contains no source files. Keep the guidance below short, specific, and focused on discoverable patterns so future agents can be productive as soon as code is added.

1. Repository scan (first actions)
   - Look for these files (in priority order) and extract commands/metadata from them:
     - `package.json` (npm/yarn): read the `scripts` section for build/test/lint commands.
     - `pyproject.toml`, `requirements.txt`, `setup.py` (Python): check `tool.poetry` or `[tool.pytest]` sections and `tests/` layout.
     - `go.mod`, `Cargo.toml`, `Makefile`: extract build/run/test targets.
     - `.github/workflows/*.yml`: CI steps often show canonical commands and environment variables.
     - `Dockerfile` / `docker-compose.yml`: container entrypoints and runtime deps.
     - `README.md`: high-level project purpose and quick-start commands.

2. What to update in this file
   - If you change workflows or add new language-specific tooling, append a one-line example showing the exact command (e.g. `npm ci && npm test` or `python -m pytest tests/`).

3. Coding & PR behavior (project-specific expectations)
   - Prefer small, focused edits and open a draft PR when making non-trivial behavior changes.
   - Preserve existing formatting and linters. If a formatter is present (e.g. Prettier, Black, clang-format), run it locally and include the updated formatting in the PR.
   - Never add secrets or credentials. Look for `.env.example`, `.secrets.example`, or `settings` files and follow the pattern there.

4. Tests & verification
   - If tests exist, run the project's test command (from `package.json`, `pyproject.toml`, `Makefile`, or CI) and include test updates with passing output.
   - If there are no tests yet, add a minimal test that demonstrates the change (one happy-path + one edge case) in the repo's preferred test framework.

5. Integration points to look for
   - External APIs: search for HTTP client libraries (axios, requests, fetch) and inspect env var usage (`process.env`, `os.environ`) to find runtime config keys.
   - Datastores: look for ORM configs (Prisma, TypeORM, SQLAlchemy, Django settings) or direct DB clients.
   - Messaging/Jobs: check for worker folders, queue libs (Bull, Sidekiq, Celery) and scheduled jobs in CI/workflows.

6. Examples of what to extract (when files are present)
   - From `package.json`:
     - Build/test/lint script names and their commands.
   - From `.github/workflows/ci.yml`:
     - Node/Python versions, matrix strategies, and steps used to install deps and run tests.

7. Edits and commit messages
   - Commit messages should be concise and start with a verb: `fix:`, `feat:`, `chore:`, etc.
   - When adding a feature, update or add to `README.md` with a short example usage and the run/build commands.

8. When unsure
   - If the repo lacks clear conventions or tests, open a draft PR describing the proposed change and include a short runbook for reviewers to verify the change locally.

---
If you'd like, I can tailor this further once the repo contains source files (for example: annotate exact npm scripts, pytest commands, or CI workflow steps). Do you want me to create a sample README or add a starter workflow next?
