/**
 * Capture real product screenshots for the README.
 * Targets the public GitHub Pages app (not generated mockups).
 *
 * Usage:
 *   npm install playwright
 *   node scripts/capture-readme-screenshots.mjs
 *
 * Optional:
 *   SCREENSHOT_BASE_URL=https://mangeshraut712.github.io/ai-rubiks-cube
 *   SCREENSHOT_SOLVER_URL=http://127.0.0.1:8765/legacy-2x2-solver/index.html
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "docs", "screenshots");
const BASE_URL = process.env.SCREENSHOT_BASE_URL || "https://mangeshraut712.github.io/ai-rubiks-cube";
const SOLVER_URL =
  process.env.SCREENSHOT_SOLVER_URL || `${BASE_URL}/legacy-2x2-solver/index.html`;

const VIEWPORT = { width: 1440, height: 1100 };

async function launchBrowser() {
  const common = {
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"]
  };

  if (process.env.CHROME_PATH) {
    return chromium.launch({ ...common, executablePath: process.env.CHROME_PATH });
  }

  try {
    return await chromium.launch({ ...common, channel: "chrome" });
  } catch {
    return chromium.launch(common);
  }
}

async function waitForWebGlFrame(page, canvasSelector) {
  await page.waitForSelector(canvasSelector, { timeout: 30_000 });
  await page.waitForFunction(
    (selector) => {
      const canvas = document.querySelector(selector);
      if (!(canvas instanceof HTMLCanvasElement)) {
        return false;
      }
      const ctx = canvas.getContext("webgl") || canvas.getContext("webgl2");
      return canvas.width > 0 && canvas.height > 0 && Boolean(ctx || canvas.getContext("2d"));
    },
    canvasSelector,
    { timeout: 30_000 }
  );
  await page.waitForTimeout(1_500);
}

async function captureHome(page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.getByRole("heading", { name: /Rubik/i }).first().waitFor({ timeout: 30_000 });
  await waitForWebGlFrame(page, "canvas");
  await page.locator("canvas").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(OUT_DIR, "01-home.png"),
    type: "png"
  });
}

async function captureSolverFeature(page) {
  page.on("pageerror", (error) => {
    console.error("solver pageerror:", error.message);
  });

  await page.goto(SOLVER_URL, {
    waitUntil: "networkidle",
    timeout: 60_000
  });
  await page.locator("#scrambleBtn").waitFor({ timeout: 30_000 });
  await page.waitForFunction(() => Boolean(window.CubeEngine && window.CubeCore2x2));
  await waitForWebGlFrame(page, "#cubeCanvas");

  await page.locator("#speed").evaluate((input) => {
    input.value = "900";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await page.locator("#scrambleBtn").click();
  await page.waitForFunction(() => {
    const scramble = document.getElementById("scrambleDisplay")?.textContent?.trim();
    return Boolean(scramble && scramble !== "—");
  });
  await page.waitForFunction(() => {
    const status = document.getElementById("status")?.textContent ?? "";
    return /Scrambled/i.test(status);
  });

  await page.locator("#solveBtn").click();

  await page.waitForFunction(() => {
    const solution = document.getElementById("solutionDisplay")?.textContent?.trim();
    return Boolean(solution && solution !== "—");
  });

  const overlayVisible = await page
    .locator("#moveOverlay.visible")
    .waitFor({ timeout: 20_000 })
    .then(() => true)
    .catch(() => false);

  if (!overlayVisible) {
    await page.waitForFunction(() => {
      const status = document.getElementById("status")?.textContent ?? "";
      return /Solved in|Executing solution/i.test(status);
    });
  }

  await page.locator("#cubeCanvas").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  await page.screenshot({
    path: path.join(OUT_DIR, "02-feature.png"),
    type: "png"
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await launchBrowser();
  const page = await browser.newPage({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    colorScheme: "light"
  });

  try {
    await captureHome(page);
    await captureSolverFeature(page);
  } finally {
    await browser.close();
  }

  console.log(`Wrote ${path.join(OUT_DIR, "01-home.png")}`);
  console.log(`Wrote ${path.join(OUT_DIR, "02-feature.png")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
