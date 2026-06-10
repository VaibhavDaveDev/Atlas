# Release Process

Atlas ERP follows [Semantic Versioning](https://semver.org/) (SemVer).

## Automated Releases

We use automated tools to manage our release cycle:

1. **Commit Analysis:** When PRs are merged into `main`, GitHub Actions analyzes the conventional commit messages.
2. **Version Bump:** 
   - `fix:` bumps the PATCH version (e.g., 1.0.0 -> 1.0.1)
   - `feat:` bumps the MINOR version (e.g., 1.0.0 -> 1.1.0)
   - `BREAKING CHANGE:` bumps the MAJOR version (e.g., 1.0.0 -> 2.0.0)
3. **Changelog Generation:** A `CHANGELOG.md` file is automatically generated based on the commit history.
4. **GitHub Release:** A new GitHub Release is created, and tags are pushed to the repository.

## Manual Intervention

While the process is highly automated, maintainers can manually trigger releases or define pre-release tags (e.g., `1.2.0-beta.1`) for large features undergoing testing before a general availability (GA) release.