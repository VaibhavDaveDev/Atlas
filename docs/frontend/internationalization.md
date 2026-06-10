# Internationalization (i18n)

Atlas ERP is designed to be used globally. To support multiple languages seamlessly, we use [LinguiJS](https://lingui.dev/). Lingui is highly optimized for React applications and uses minimal overhead.

## Setup & Configuration

The configuration for Lingui is found in `lingui.config.js` at the root of `apps/web`.

```javascript
module.exports = {
  locales: ["en", "es", "fr", "de"],
  sourceLocale: "en",
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["<rootDir>/src"],
    },
  ],
  format: "po",
};
```

## How to Translate Strings

### 1. Using the `<Trans>` Component

The most common way to translate text inside JSX is by wrapping it in the `<Trans>` component. Lingui will automatically extract the string as an ID during the extraction phase.

```tsx
import { Trans } from '@lingui/macro';

function WelcomeMessage({ name }) {
  return (
    <h1>
      <Trans>Welcome back, {name}!</Trans>
    </h1>
  );
}
```

### 2. Using the `t` Macro for Variables

When you need a translated string as a variable (e.g., for an input placeholder or a toast message), use the `t` macro.

```tsx
import { t } from '@lingui/macro';
import { useLingui } from '@lingui/react';

function SearchInput() {
  const { i18n } = useLingui();
  const placeholder = t`Search for projects...`;

  return <input type="text" placeholder={placeholder} />;
}
```

## Extracting and Compiling Translations

When you add new `<Trans>` or `t` strings to your code, you must run the extraction script so they appear in the `.po` message catalogs.

```bash
# Extract new strings from source code
pnpm run extract

# After translators have updated the .po files, compile them to JS
pnpm run compile
```

The compiled JavaScript files are then loaded by the Next.js application at runtime depending on the user's selected locale.

## Best Practices

1. **Avoid manual IDs:** Write natural English text inside `<Trans>`. Lingui uses the English text as the ID by default.
2. **Context:** If a word has multiple meanings in English (e.g., "Right" as a direction vs. "Right" as a permission), provide context using the `message` and `id` props or comments so translators know which to use.
3. **Plurals:** Lingui supports complex pluralization rules via ICU message format.

```tsx
import { Plural } from '@lingui/macro';

<Plural
  value={numTasks}
  _0="No tasks"
  one="# task"
  other="# tasks"
/>
```