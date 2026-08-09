#!/usr/bin/env node
/**
 * Repairs packages/i18n/locales on Windows.
 *
 * In git that path is a symlink (mode 120000) to src/locales. Windows without symlink support
 * checks it out as an 11-byte TEXT FILE containing the string "src/locales", and every
 * translation lookup then fails — the UI renders raw keys like "sidebar.chat" instead of "Chat".
 *
 * A junction is NOT sufficient. Docker's build context does not follow one, so the image is built
 * without locales even though the app looks correct on the host. The only thing that works is a
 * real directory copy, which is what this script makes.
 *
 * It has been destroyed twice: once by a `git checkout` of the path, and once by lint-staged's
 * rollback after a pre-commit hook crashed, which deleted untracked files. Both times the symptom
 * was raw i18n keys appearing in a freshly built image. Run this whenever that happens.
 *
 *   node packages/i18n/fix-windows-locales.mjs
 *
 * After repairing, the path is marked skip-worktree so the local copy does not show up as a
 * pending change and cannot be committed over the symlink.
 */

import { cpSync, existsSync, lstatSync, rmSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const target = join(repoRoot, "packages", "i18n", "locales");
const source = join(repoRoot, "packages", "i18n", "src", "locales");

if (!existsSync(source)) {
  console.error(`[fix-locales] source is missing: ${source}`);
  process.exit(1);
}

if (existsSync(target) && lstatSync(target).isDirectory() && !lstatSync(target).isSymbolicLink()) {
  const locales = readdirSync(target);
  console.log(`[fix-locales] already a real directory with ${locales.length} locales — nothing to do`);
} else {
  // Covers both states this path is ever found in: the 11-byte text file, and a junction/symlink
  // that Docker will not follow.
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
  console.log(`[fix-locales] repaired: copied ${readdirSync(target).length} locales into packages/i18n/locales`);
}

try {
  execFileSync("git", ["update-index", "--skip-worktree", "packages/i18n/locales"], { cwd: repoRoot });
  console.log("[fix-locales] marked skip-worktree so the copy is not committed over the symlink");
} catch (error) {
  console.warn(`[fix-locales] could not set skip-worktree: ${error.message}`);
}

console.log("[fix-locales] rebuild the web image for this to reach the browser: docker compose build web");
