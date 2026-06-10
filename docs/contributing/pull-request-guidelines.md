# Pull Request Guidelines

To ensure a smooth review process, please follow these guidelines when submitting a Pull Request (PR) to Atlas ERP.

## 1. Keep it Small and Focused
A PR should ideally address a single issue or feature. If you have multiple unrelated changes, open separate PRs. Small PRs are much faster to review and less likely to introduce regressions.

## 2. Follow Conventional Commits
Your commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This is strictly enforced because it automates our changelog generation and semantic versioning.

## 3. Fill out the PR Template
When you open a PR, a template will automatically populate the description. Please fill it out completely:
- Link the issue this PR resolves (e.g., `Closes #123`).
- Describe the changes you made.
- Note any breaking changes.
- Provide testing instructions for the reviewer.

## 4. Include Tests
If you add a new feature or fix a bug, you must include tests (unit or E2E) that prove your code works and prevents future regressions.

## 5. Pass CI
Your PR will not be reviewed until it passes the Continuous Integration (CI) pipeline, which checks:
- ESLint (`pnpm lint`)
- Tests (`pnpm test`)
- Build (`pnpm build`)

If CI fails, please review the logs and push fixes to your branch.

## 6. Respond to Feedback
Maintainers will review your code. Be open to feedback and ready to make adjustments. Once approved, a maintainer will merge your PR using "Squash and Merge".