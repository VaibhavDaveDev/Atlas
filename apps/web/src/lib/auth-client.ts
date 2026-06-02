import { createAuthClient } from "better-auth/react";

const client = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
    // Base path MUST match the backend config
    basePath: "/api/v1/auth",
});

// @ts-ignore - Supress inferred type error caused by pnpm strict typing
export const authClient: any = client;

export const { signIn, signUp, useSession, signOut } = client;
