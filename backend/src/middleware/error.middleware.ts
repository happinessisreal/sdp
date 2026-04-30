import type { Context } from "hono";
import { AppError, ValidationError } from "../utils/errors.js";

/**
 * Consistent JSON response format for all API responses.
 */
export function successResponse(c: Context, data: unknown, message = "Success", status = 200) {
  return c.json({ success: true, data, message }, status as any);
}

export function paginatedResponse(
  c: Context,
  data: unknown[],
  meta: { page: number; limit: number; total: number }
) {
  return c.json({
    success: true,
    data,
    meta: {
      ...meta,
      totalPages: Math.ceil(meta.total / meta.limit),
    },
  });
}

/**
 * Global error handler middleware for Hono.
 * Catches all errors and returns a consistent JSON error response.
 */
export function errorHandler(err: Error, c: Context) {
  console.error(`[ERROR] ${err.message}`, err.stack);

  if (err instanceof ValidationError) {
    return c.json(
      {
        success: false,
        message: err.message,
        errors: err.errors,
      },
      err.statusCode as any
    );
  }

  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        message: err.message,
      },
      err.statusCode as any
    );
  }

  // Unknown errors — don't leak internal details in production
  const message =
    process.env.NODE_ENV === "development"
      ? err.message
      : "Internal server error";

  return c.json(
    {
      success: false,
      message,
    },
    500
  );
}
