import { existsSync, readFileSync } from "node:fs";

const configPath = "perf/budgets.json";

if (!existsSync(configPath)) {
  console.log(`[ai:bundle-check] TODO: Add ${configPath} and implement budget thresholds.`);
  process.exit(0);
}

try {
  JSON.parse(readFileSync(configPath, "utf8"));
  console.log(`[ai:bundle-check] Found ${configPath}. TODO: enforce budget checks.`);
  process.exit(0);
} catch (error) {
  console.error(`[ai:bundle-check] Invalid JSON in ${configPath}.`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
