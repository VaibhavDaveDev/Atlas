# How to Contribute

## 1. Find an Issue
Before you write any code, please find an existing issue to work on or create a new one. This ensures you don't duplicate work or spend time on a feature that might not align with the roadmap.
- Look for issues tagged with `good first issue` or `help wanted`.
- Comment on the issue stating that you'd like to work on it.

## 2. Fork and Clone
Fork the repository to your own GitHub account, then clone it to your local machine:
```bash
git clone https://github.com/your-username/Atlas.git
cd Atlas
```

## 3. Set Up Development Environment
Follow the [Installation Guide](../getting-started/installation.md) to install dependencies and configure environment variables.

## 4. Create a Branch
Create a branch with a descriptive name following our [Git Workflow](../development/git-workflow.md).
```bash
git checkout -b feat/add-dark-mode
```

## 5. Make Your Changes
Write your code, ensuring you follow the [Code Style](../development/code-style.md) guidelines. 

## 6. Test Your Changes
Make sure all existing tests pass, and write new tests for your feature or bug fix.
```bash
pnpm test
pnpm lint
```

## 7. Commit and Push
Commit your changes using Conventional Commits.
```bash
git commit -m "feat(ui): add dark mode toggle"
git push origin feat/add-dark-mode
```

## 8. Open a Pull Request
Go to the original Atlas repository on GitHub and open a Pull Request. Follow the [Pull Request Guidelines](pull-request-guidelines.md).