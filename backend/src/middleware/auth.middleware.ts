import type { Context, Next } from "hono";
import { verifyToken } from "../utils/jwt.js";
import { UnauthorizedError } from "../utils/errors.js";

// Extend Hono's context variables to include the authenticated user
export type AuthUser = {
  userId: number;
  email: string;
  role: string;
};

/**
 * Middleware that verifies the JWT token from the Authorization header
 * and attaches the user payload to the Hono context.
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid authorization header");
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verifyToken(token);
    c.set("user", {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    } as AuthUser);
    await next();
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}
