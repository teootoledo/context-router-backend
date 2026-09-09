# Contributing

This repository uses a trunk-based development flow with automated, semantic-release-driven versioning and npm publishing.

## Workflow

1. Branch off `main` for any change; keep branches short-lived.
2. Open a pull request. CI runs the test suite and lints your commits.
3. Commits must follow [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <description>`, e.g. `fix: handle empty file list`, `feat: add X`, `docs: update README`. A commitlint check on the PR enforces this.
4. Once CI passes, the PR is squash-merged into `main` — one conventional-commit-formatted message per merge.
5. Merging to `main` triggers an automated release: semantic-release inspects the commit(s) since the last release, computes the next version (patch/minor/major per Conventional Commits), tags the release, publishes a GitHub Release (with generated release notes), and publishes the package to npm under the `@teootoledo` scope via OIDC trusted publishing (no stored token). Release notes live on the GitHub Releases page, not in a committed `CHANGELOG.md` — `main` is protected against direct pushes (including from automation), so the release step never writes back to the branch.

## Commit types that drive releases

- `fix:` → patch release
- `feat:` → minor release
- A commit with a `BREAKING CHANGE:` footer → minor release while the project is on `0.x` (semver's initial-development phase), major once past `1.0.0`
- `docs:`, `chore:`, `test:`, `refactor:`, `style:`, `ci:`, `build:`, `perf:` → no release on their own, but still checked by commitlint

## Local development

See [README.md](./README.md) for install/test commands.
