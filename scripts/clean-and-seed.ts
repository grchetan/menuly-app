/**
 * Menuly — Purge Demo/Test Data & Initialize Live Super Admin
 * Run with: npx tsx scripts/clean-and-seed.ts
 */
import { prisma } from "../src/server/db";
import { hashPassword } from "../src/server/auth/security";

async function main() {
  console.log("==================================================");
  console.log("🧹 MENULY — CLEANING DEMO DATA & INITIALIZING LIVE SYSTEM");
  console.log("==================================================");

  // 1. Delete all junk test users (except official accounts if any)
  const officialAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "menulyoffcial@gmail.com").toLowerCase().trim();

  console.log("1. Removing junk demo/test records from database...");
  await prisma.otpVerification.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.qrScan.deleteMany({});
  await prisma.supportTicket.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.restaurantTable.deleteMany({});
  await prisma.restaurant.deleteMany({});

  // Delete all users EXCEPT the official admin email if already matching
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: {
        not: officialAdminEmail,
      },
    },
  });
  console.log(`   Cleaned ${deletedUsers.count} test user(s).`);

  // 2. Ensure default plans exist in PostgreSQL
  console.log("2. Ensuring default platform plans exist...");
  const plans = [
    {
      name: "Free Starter",
      slug: "starter",
      priceInr: 0,
      maxDishes: 20,
      maxTables: 1,
      customBranding: false,
      analyticsEnabled: true,
      photoUploads: true,
      features: [
        "Up to 20 Dishes",
        "1 Master QR Code",
        "Instant Sold-Out Toggle",
        "WebP Image Compression",
      ],
    },
    {
      name: "Pro Growth",
      slug: "pro",
      priceInr: 499,
      maxDishes: 100,
      maxTables: 15,
      customBranding: true,
      analyticsEnabled: true,
      photoUploads: true,
      features: [
        "Up to 100 Dishes",
        "15 Table-Specific QRs",
        "Custom Logo in QR Center",
        "Weekly Scan Trends",
        "Priority Support",
      ],
    },
    {
      name: "Multi-Table Enterprise",
      slug: "enterprise",
      priceInr: 1299,
      maxDishes: 500,
      maxTables: 50,
      customBranding: true,
      analyticsEnabled: true,
      photoUploads: true,
      features: [
        "Unlimited Dishes",
        "50 Table QRs + Table Ordering",
        "Custom Domain Support",
        "Staff Kitchen Access",
        "VIP Dedicated Support",
      ],
    },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        priceInr: p.priceInr,
        maxDishes: p.maxDishes,
        maxTables: p.maxTables,
        customBranding: p.customBranding,
        analyticsEnabled: p.analyticsEnabled,
        photoUploads: p.photoUploads,
        features: p.features,
      },
      create: p,
    });
  }
  console.log("   Platform plans synchronized.");

  // 3. Provision Official Super Admin
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "AdminPassword123!";
  const passwordHash = await hashPassword(adminPassword);

  console.log(`3. Provisioning Super Admin: ${officialAdminEmail}...`);
  const adminUser = await prisma.user.upsert({
    where: { email: officialAdminEmail },
    update: {
      role: "SUPER_ADMIN",
      isVerified: true,
      passwordHash,
      fullName: "Super Admin (Owner)",
    },
    create: {
      email: officialAdminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      fullName: "Super Admin (Owner)",
      isVerified: true,
    },
  });

  console.log("==================================================");
  console.log("✅ LIVE DATABASE READY!");
  console.log(`   Super Admin Email:    ${adminUser.email}`);
  console.log(`   Super Admin Password: ${adminPassword}`);
  console.log(`   Role:                 ${adminUser.role}`);
  console.log(`   Verified:             ${adminUser.isVerified}`);
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("❌ Clean and seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
