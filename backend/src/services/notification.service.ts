import { prisma } from "../db/index.js";
import nodemailer from "nodemailer";

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class NotificationService {
  /**
   * Create an in-app notification.
   */
  async create(data: { userId: number; title: string; message: string; type: string }) {
    return prisma.notification.create({
      data: {
        user_id: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
      },
    });
  }

  /**
   * Send an email notification (best-effort, does not throw on failure).
   */
  async sendEmail(to: string, subject: string, html: string) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("[NOTIFICATION] Email not configured, skipping email send");
      return null;
    }

    try {
      const result = await transporter.sendMail({
        from: process.env.SMTP_FROM || "noreply@tuitiontrack.local",
        to,
        subject,
        html,
      });
      return result;
    } catch (err) {
      console.error("[NOTIFICATION] Failed to send email:", err);
      return null;
    }
  }

  /**
   * Send both in-app and email notification.
   */
  async notify(data: {
    userId: number; email: string;
    title: string; message: string; type: string;
  }) {
    const [notification] = await Promise.all([
      this.create(data),
      this.sendEmail(data.email, data.title, `<p>${data.message}</p>`),
    ]);
    return notification;
  }

  /**
   * Get notifications for a user.
   */
  async getByUser(userId: number, params: { unreadOnly?: boolean }) {
    const where: any = { user_id: userId };
    if (params.unreadOnly) where.is_read = false;

    return prisma.notification.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 50,
    });
  }

  /**
   * Mark a notification as read.
   */
  async markAsRead(id: number, userId: number) {
    return prisma.notification.updateMany({
      where: { id, user_id: userId },
      data: { is_read: true },
    });
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: number) {
    return prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
  }

  /**
   * Get unread count for a user.
   */
  async getUnreadCount(userId: number) {
    return prisma.notification.count({
      where: { user_id: userId, is_read: false },
    });
  }

  /**
   * Send fee reminders for pending/overdue payments.
   */
  async sendFeeReminders() {
    const pendingPayments = await prisma.payment.findMany({
      where: { status: { in: ["PENDING", "OVERDUE"] } },
      include: {
        student: { include: { user: { select: { id: true, name: true, email: true } } } },
        class: { select: { name: true } },
      },
    });

    for (const payment of pendingPayments) {
      const msg = `Payment of $${payment.amount} for class "${payment.class.name}" is ${payment.status.toLowerCase()}. Due date: ${payment.due_date.toISOString().split("T")[0]}`;
      await this.notify({
        userId: payment.student.user.id,
        email: payment.student.user.email,
        title: `Fee ${payment.status === "OVERDUE" ? "Overdue" : "Reminder"}`,
        message: msg,
        type: "FEE_REMINDER",
      });
    }

    return { sent: pendingPayments.length };
  }
}

export const notificationService = new NotificationService();
