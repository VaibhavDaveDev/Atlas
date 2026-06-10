# Styling

Atlas ERP uses **TailwindCSS** for styling, combined with **shadcn/ui** for a robust, accessible component library.

## TailwindCSS

Tailwind allows us to rapidly build UIs using utility classes directly in our markup.

### Configuration
The configuration is located at `apps/web/tailwind.config.ts`. It extends the default Tailwind theme with our brand colors, custom spacing, and animations.

```typescript
// Example snippet
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          // ...
          900: '#312e81',
        },
      }
    }
  }
}
```

### Best Practices
- **Avoid deep nesting:** Use utility classes rather than creating complex custom CSS classes in `.css` files.
- **Responsive design:** Use Tailwind's `md:`, `lg:`, `xl:` prefixes to build mobile-first interfaces.
- **Dark mode:** Use the `dark:` prefix to define styles when the user toggles dark mode.

```tsx
<div className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
  Content
</div>
```

## shadcn/ui

Instead of using a bulky component library that is hard to customize, we use [shadcn/ui](https://ui.shadcn.com/). 
shadcn/ui provides beautifully designed components that you copy and paste into your project.

### Component Location
Base components are located in `src/components/ui/` (e.g., `button.tsx`, `dialog.tsx`, `input.tsx`).

### Customization
Because you own the code for these components, you can modify `src/components/ui/button.tsx` to match exact brand requirements without fighting library overrides.

## ClassName Merging (clsx + tailwind-merge)

When building custom components that accept a `className` prop, we use a utility function called `cn` (typically found in `src/lib/utils.ts`). This function resolves conflicts between Tailwind classes.

```tsx
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className // This will safely override the defaults if needed
      )}
      {...props}
    />
  );
}
```