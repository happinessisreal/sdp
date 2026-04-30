import { Hono } from "hono";
import { dashboardService } from "../services/dashboard.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { successResponse } from "../middleware/error.middleware.js";
import type { AppVariables } from "../types/index.js";

const dashboard = new Hono<AppVariables>();

dashboard.use("*", authMiddleware);

// GET /api/dashboard — returns role-appropriate dashboard data
dashboard.get("/", async (c) => {
  const user = c.get("user");

  let data;
  switch (user.role) {
    case "ADMIN":
      data = await dashboardService.getAdminDashboard();
      break;
    case "TEACHER":
      data = await dashboardService.getTeacherDashboard(user.userId);
      break;
    case "STUDENT":
      data = await dashboardService.getStudentDashboard(user.userId);
      break;
    default:
      data = null;
  }

  return successResponse(c, data);
});

export default dashboard;
