# Git Workflow

Atlas ERP follows a simplified GitHub Flow model.

## Branching

1. **`main`**: The default branch. It is protected and always deployable. Production deployments happen automatically from this branch.
2. **Feature Branches**: Create a new branch off `main` for every new feature or bug fix.
   - Format: `type/short-description`
   - Examples: `feat/add-invoice-pdf`, `fix/login-crash`, `chore/update-deps`

## Commit Messages

We strictly follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This allows us to automatically generate changelogs and determine semantic versioning bumps.

**Format:**
```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

**Example:**
```
feat(finance): add ability to export invoices to PDF

Closes #123
```

## Pull Requests

1. **Draft PRs:** Open a Draft PR early if you want feedback on the approach.
2. **CI Checks:** All PRs must pass the GitHub Actions CI pipeline (Linting, Tests, Build).
3. **Review:** At least one approving review is required before merging.
4. **Squash and Merge:** When merging, use "Squash and Merge" to keep the `main` branch history clean. Ensure the squash commit message follows the Conventional Commits format.