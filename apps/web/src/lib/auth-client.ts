import { createAuthClient } from "better-auth/react";
import { API_BASE } from "./config";

/**
 * Better Auth browser client for parent accounts. It talks to the API's
 * `/api/auth/*` endpoints and manages the session cookie. Children are profiles,
 * not accounts, so there is deliberately no child sign-in here.
 */
export const authClient = createAuthClient({
  baseURL: API_BASE || undefined,
});

export const { signUp, signIn, signOut, useSession } = authClient;
