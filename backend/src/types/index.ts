import type { AuthUser } from "../middleware/auth.middleware.js";

/**
 * Hono app-level type with custom context variables.
 * Use this type when creating Hono instances that need access to `c.get("user")`.
 */
export type AppVariables = {
  Variables: {
    user: AuthUser;
  };
};
