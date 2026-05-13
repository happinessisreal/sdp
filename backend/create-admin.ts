import { prisma } from "./src/db/index.js";

async function main() {
  const email = "admin@tuitiontrack.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  
  if (existing) {
    console.log(`Admin ${email} already exists.`);
    return;
  }

  const adminPassword = await Bun.password.hash("admin123", { algorithm: "bcrypt", cost: 10 });
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: email,
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin created: ${admin.email} / admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
