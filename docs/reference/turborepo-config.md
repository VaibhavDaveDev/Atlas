# Turborepo Config

Atlas ERP uses Turborepo (`turbo.json`) to optimize the build and development process.

## Caching

Turborepo caches the output of tasks like `build` and `lint`. If the source files haven't changed, Turborepo will replay the cached output instantly instead of re-running the task.

## The Pipeline

The pipeline defines the dependencies between tasks.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      // A package's `build` script depends on its dependencies' `build` scripts completing first.
      "dependsOn": ["^build"],
      // What files to cache after a successful build
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "lint": {
      // Linting usually requires types to be built first
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "dev": {
      // Development servers shouldn't be cached as they run indefinitely
      "cache": false,
      // Prevents Turborepo from killing the process when other tasks finish
      "persistent": true
    }
  }
}
```