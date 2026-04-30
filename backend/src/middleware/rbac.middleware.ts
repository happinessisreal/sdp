import type { Context, Next } from "hono";
import { ForbiddenError } from "../utils/errors.js";
import type { AuthUser } from "./auth.middleware.js";

/**
 * Factory function that returns middleware enforcing role-based access.
 * Usage: app.use("/admin/*", requireRole("ADMIN"))
 *        app.use("/classes", requireRole("ADMIN", "TEACHER"))
 */
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as AuthUser | undefined;

    if (!user) {
      throw new ForbiddenError("Authentication required before role check");
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError(
        `Access denied. Required role(s): ${allowedRoles.join(", ")}`
      );
    }

    await next();
  };
}
