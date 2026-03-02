import { execSync } from "node:child_process";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

try {
  const staged = run("git diff --name-only --cached");
  const unstaged = run("git diff --name-only");
  const untracked = run("git ls-files --others --exclude-standard");

  const files = [...new Set([staged, unstaged, untracked].filter(Boolean).join("\n").split("\n").filter(Boolean))];

  if (files.length === 0) {
    console.log("No changed files.");
    process.exit(0);
  }

  console.log("Changed files:");
  for (const file of files) {
    console.log(`- ${file}`);
  }
} catch (error) {
  console.error("Failed to read changed files from git. Confirm git is installed and this is a git repository.");
  if (error && typeof error.stderr === "string" && error.stderr.trim()) {
    console.error(error.stderr.trim());
  }
  process.exit(1);
}
