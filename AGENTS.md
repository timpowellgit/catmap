# Global Defaults

## Working agreements

- We have DevBox. Start with `devbox shell`.
- `check` should run formatting, linting, and type checks.
- Use `AGENTS.md` and `docs/`.
- Use the PR template.
- Ask for confirmation before adding new production dependencies.
- Ask for confirmation before deleting files, dropping data, or running destructive operations.

## Code style

- Write clear, readable code. No abbreviations in variable names.
- Prefer existing patterns in the codebase over inventing new ones. Read neighboring code first.
- Keep PRs focused and small. One feature or fix per PR.
- Include tests for new functionality.
- Update docs if behavior changes.

## Testing

- Tests must be hermetic. No real external API calls.
- Stub or mock external dependencies.
- Use existing test fixtures and helpers before creating new ones.
- Read the project's testing conventions doc if one exists.

## Git

- Write concise commit messages that describe what changed and why.
- Do not force-push without explicit approval.
- Do not commit secrets, credentials, or `.env` files.
