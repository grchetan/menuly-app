/**
 * Menuly — Secure Super Admin Seed Script
 * Run with: npx tsx scripts/seed-admin.ts
 */
import { seedSuperAdmin } from "../src/server/auth/service";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || "admin@menuly.com";
  const password = process.env.SUPER_ADMIN_PASSWORD || "AdminPassword123!";

  console.log("==================================================");
  console.log("🛡️  Menuly Super Admin Provisioning");
  console.log("==================================================");
  console.log(`Target Email: ${email}`);

  const admin = await seedSuperAdmin(email, password);

  console.log("✅ Super Admin Account Ready:");
  console.log(`   ID:    ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role:  ${admin.role}`);
  console.log("==================================================");
  console.log("You can now log in at http://localhost:3000/auth");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("❌ Failed to seed Super Admin:", err);
  process.exit(1);
});
