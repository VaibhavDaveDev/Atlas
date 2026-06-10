# API Authorization

Authorization in Atlas ERP determines what an authenticated user is allowed to do. It uses a Role-Based Access Control (RBAC) system combined with granular permissions, powered by **CASL**.

## CASL Integration (`@casl/ability`)

Atlas ERP utilizes [CASL](https://casl.js.org/) to provide advanced, fine-grained access control across both the backend and frontend.

### 1. Backend (`CaslAbilityFactory`)
In the backend, the `CaslAbilityFactory` (`apps/api/src/auth/services/casl-ability.factory.ts`) dynamically generates an "Ability" object based on the current user's role and their workspace permissions.

Instead of simple string-matching, CASL allows us to define rules like:
- "A user can `update` a `Project`, but only if they are the owner."
- "A user can `read` an `Invoice`, but only if it belongs to their `workspaceId`."

### 2. Frontend (`AbilityContext.tsx`)
The frontend receives the user's permissions and hydrates a React Context (`AbilityContext.tsx`). This allows UI components to conditionally render buttons or links based on the user's actual capabilities.

```tsx
import { Can } from '@/contexts/AbilityContext';

// Only renders if the user has permission to create invoices
<Can I="create" a="Invoice">
  <Button>Create Invoice</Button>
</Can>
```

## Endpoints and Required Roles

In the backend, endpoints are protected using CASL-aware decorators and guards.

```typescript
@UseGuards(AuthGuard, WorkspaceGuard, PoliciesGuard)
@CheckPolicies((ability: AppAbility) => ability.can('create', 'Invoice'))
@Post('invoices')
createInvoice() { ... }
```

## Insufficient Permissions

If you attempt to call an endpoint without the required CASL abilities, the API will return a `403 Forbidden` response.

```json
{
  "success": false,
  "error": {
    "statusCode": 403,
    "message": "Forbidden resource"
  }
}
```