import { Hono } from "hono";
import { notificationService } from "../services/notification.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { successResponse } from "../middleware/error.middleware.js";
import type { AppVariables } from "../types/index.js";

const notifications = new Hono<AppVariables>();

notifications.use("*", authMiddleware);

// GET /api/notifications
notifications.get("/", async (c) => {
  const user = c.get("user");
  const unreadOnly = c.req.query("unreadOnly") === "true";
  const result = await notificationService.getByUser(user.userId, { unreadOnly });
  return successResponse(c, result);
});

// GET /api/notifications/unread-count
notifications.get("/unread-count", async (c) => {
  const user = c.get("user");
  const count = await notificationService.getUnreadCount(user.userId);
  return successResponse(c, { count });
});

// PUT /api/notifications/:id/read
notifications.put("/:id/read", async (c) => {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  await notificationService.markAsRead(id, user.userId);
  return successResponse(c, null, "Notification marked as read");
});

// PUT /api/notifications/read-all
notifications.put("/read-all", async (c) => {
  const user = c.get("user");
  await notificationService.markAllAsRead(user.userId);
  return successResponse(c, null, "All notifications marked as read");
});

// POST /api/notifications/send-fee-reminders (admin only)
notifications.post("/send-fee-reminders", requireRole("ADMIN"), async (c) => {
  const result = await notificationService.sendFeeReminders();
  return successResponse(c, result, "Fee reminders sent");
});

export default notifications;
