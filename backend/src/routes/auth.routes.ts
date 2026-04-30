import { Hono } from "hono";
import { authService } from "../services/auth.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { successResponse } from "../middleware/error.middleware.js";
import type { AppVariables } from "../types/index.js";

const auth = new Hono<AppVariables>();

// POST /api/auth/register
auth.post("/register", async (c) => {
  const body = await c.req.json();
  const data = registerSchema.parse(body);
  const result = await authService.register(data);
  return successResponse(c, result, "Registration successful", 201);
});

// POST /api/auth/login
auth.post("/login", async (c) => {
  const body = await c.req.json();
  const data = loginSchema.parse(body);
  const result = await authService.login(data);
  return successResponse(c, result, "Login successful");
});

// GET /api/auth/me (protected)
auth.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  const profile = await authService.getProfile(user.userId);
  return successResponse(c, profile);
});

export default auth;
