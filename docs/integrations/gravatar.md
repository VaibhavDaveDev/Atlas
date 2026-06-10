# Gravatar Integration

Atlas ERP can automatically fetch user profile pictures using [Gravatar](https://gravatar.com/) (Globally Recognized Avatars), based on the user's email address.

## How It Works

Gravatar works by hashing the user's email address and requesting an image from the Gravatar servers using that hash. If the user has uploaded a profile picture to Gravatar, it will be displayed; otherwise, a default fallback image (like an identical geometric pattern or initials) is shown.

## Configuration

Gravatar integration is generally seamless and requires no server-side secrets for basic avatar fetching.

However, if you wish to use the Gravatar API for advanced features (like updating user profiles), you may need API credentials.

**Backend (`apps/api/.env`):**
```bash
# Optional: Only needed for advanced API integration
GRAVATAR_API_KEY="your-api-key"
```

## Frontend Implementation

In the frontend, we use utility functions to generate the correct Gravatar URL.

```typescript
// apps/web/src/lib/gravatar.ts
import md5 from 'md5';

export function getGravatarUrl(email: string, size: number = 200): string {
  const hash = md5(email.trim().toLowerCase());
  // d=mp sets the default image to the "mystery person" silhouette
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`;
}
```

This URL can then be passed directly into the `src/components/ui/avatar.tsx` component.

```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getGravatarUrl } from "@/lib/gravatar"

export function UserProfile({ user }) {
  return (
    <Avatar>
      <AvatarImage src={getGravatarUrl(user.email)} alt={user.name} />
      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
    </Avatar>
  )
}
```