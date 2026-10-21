import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const pkgPath = path.join(rootDir, "package.json");

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const version = pkg.version || "1.2.0";

console.log(`\n========================================`);
console.log(`🚀 Menuly Deployment & Release Manager (v${version})`);
console.log(`========================================\n`);

try {
  console.log("🔍 1. Running TypeScript verification...");
  execSync("npx tsc --noEmit", { stdio: "inherit", cwd: rootDir });

  console.log("\n🧪 2. Running test suites...");
  execSync("npm test", { stdio: "inherit", cwd: rootDir });

  console.log("\n📦 3. Staging and committing changes...");
  execSync("git add .", { stdio: "inherit", cwd: rootDir });

  const commitMsg = process.argv[2] || `release: version ${version} ready for deployment`;
  try {
    execSync(`git commit -m "[v${version}] ${commitMsg}"`, { stdio: "inherit", cwd: rootDir });
  } catch {
    console.log("ℹ️ Nothing new to commit.");
  }

  // Create tag if --tag flag passed
  if (process.argv.includes("--tag")) {
    const tagName = `v${version}`;
    try {
      execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, { stdio: "inherit", cwd: rootDir });
      console.log(`🏷️ Created git tag: ${tagName}`);
    } catch {
      console.log(`ℹ️ Tag ${tagName} already exists or was skipped.`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`✅ Build & Tests PASSED! Code is committed locally.`);
  console.log(`📢 DEPLOYMENT INSTRUCTION:`);
  console.log(`Run the following command to deploy to Vercel/Production:`);
  console.log(`   git push origin main`);
  if (process.argv.includes("--tag")) {
    console.log(`   git push --tags`);
  }
  console.log(`======================================================\n`);
} catch (err) {
  console.error("❌ Release checks failed:", err.message);
  process.exit(1);
}
