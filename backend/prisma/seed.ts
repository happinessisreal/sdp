import { PrismaClient } from "@prisma/client";
import { PrismaBunSqlite } from "prisma-adapter-bun-sqlite";

const adapter = new PrismaBunSqlite({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();

  // ─── Create Admin ──────────────────────────────────────────────
  const adminPassword = await Bun.password.hash("admin123", { algorithm: "bcrypt", cost: 10 });
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@tuitiontrack.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin: ${admin.email} / admin123`);

  // ─── Create Teachers ──────────────────────────────────────────
  const teacherPassword = await Bun.password.hash("teacher123", { algorithm: "bcrypt", cost: 10 });

  const teacher1 = await prisma.user.create({
    data: {
      name: "Iyolita Islam",
      email: "iyolita@tuitiontrack.com",
      password: teacherPassword,
      role: "TEACHER",
      teacher: { create: {} },
    },
    include: { teacher: true },
  });

  const teacher2 = await prisma.user.create({
    data: {
      name: "Sharad Hasan",
      email: "sharad@tuitiontrack.com",
      password: teacherPassword,
      role: "TEACHER",
      teacher: { create: {} },
    },
    include: { teacher: true },
  });

  console.log(`✅ Teacher: ${teacher1.email} / teacher123`);
  console.log(`✅ Teacher: ${teacher2.email} / teacher123`);

  // ─── Create Students ──────────────────────────────────────────
  const studentPassword = await Bun.password.hash("student123", { algorithm: "bcrypt", cost: 10 });
  const studentNames = [
    { name: "Faiza Mustari", email: "faiza@student.com" },
    { name: "Zarin Tasnim Tuly", email: "tuly@student.com" },
    { name: "Alvee Ahnaf", email: "alvee@student.com" },
    { name: "Rahim Ahmed", email: "rahim@student.com" },
    { name: "Karim Uddin", email: "karim@student.com" },
  ];

  const students = [];
  for (const s of studentNames) {
    const user = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        password: studentPassword,
        role: "STUDENT",
        student: { create: { enrollment_date: new Date() } },
      },
      include: { student: true },
    });
    students.push(user);
    console.log(`✅ Student: ${user.email} / student123`);
  }

  // ─── Create Classes ────────────────────────────────────────────
  const class1 = await prisma.class.create({
    data: {
      teacher_id: teacher1.teacher!.id,
      name: "Mathematics 101",
      start_time: "09:00",
      number_of_days_a_week: 3,
    },
  });

  const class2 = await prisma.class.create({
    data: {
      teacher_id: teacher1.teacher!.id,
      name: "Physics Fundamentals",
      start_time: "11:00",
      number_of_days_a_week: 2,
    },
  });

  const class3 = await prisma.class.create({
    data: {
      teacher_id: teacher2.teacher!.id,
      name: "English Literature",
      start_time: "14:00",
      number_of_days_a_week: 2,
    },
  });

  console.log(`\n✅ Classes: ${class1.name}, ${class2.name}, ${class3.name}`);

  // ─── Enroll Students ──────────────────────────────────────────
  for (const student of students) {
    await prisma.enrollment.create({
      data: { student_id: student.student!.id, class_id: class1.id },
    });
  }

  // Enroll first 3 in class2
  for (let i = 0; i < 3; i++) {
    await prisma.enrollment.create({
      data: { student_id: students[i]!.student!.id, class_id: class2.id },
    });
  }

  // Enroll last 3 in class3
  for (let i = 2; i < 5; i++) {
    await prisma.enrollment.create({
      data: { student_id: students[i]!.student!.id, class_id: class3.id },
    });
  }

  console.log("✅ Enrollments created");

  // ─── Create Attendance Records ─────────────────────────────────
  const today = new Date();
  const statuses = ["PRESENT", "PRESENT", "PRESENT", "ABSENT", "LATE"];

  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);

    for (let i = 0; i < students.length; i++) {
      await prisma.attendance.create({
        data: {
          student_id: students[i]!.student!.id,
          class_id: class1.id,
          date,
          status: statuses[(i + dayOffset) % 5]!,
        },
      });
    }
  }

  console.log("✅ Attendance records created");

  // ─── Create Payments ───────────────────────────────────────────
  const paymentStatuses = ["PAID", "PENDING", "PENDING", "OVERDUE", "PAID"];

  for (let i = 0; i < students.length; i++) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (i * 7 - 14));

    await prisma.payment.create({
      data: {
        student_id: students[i]!.student!.id,
        teacher_id: teacher1.teacher!.id,
        class_id: class1.id,
        amount: 5000 + i * 500,
        status: paymentStatuses[i]!,
        due_date: dueDate,
        payment_date: paymentStatuses[i] === "PAID" ? new Date() : null,
      },
    });
  }

  console.log("✅ Payment records created");

  // ─── Create Notifications ──────────────────────────────────────
  for (const student of students.slice(0, 3)) {
    await prisma.notification.create({
      data: {
        user_id: student.id,
        title: "Welcome to Tuition Track!",
        message: "Your account has been set up. Check your class schedule.",
        type: "SYSTEM",
      },
    });
  }

  console.log("✅ Notifications created");
  console.log("\n🎉 Seed completed successfully!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
