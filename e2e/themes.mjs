// Drives a 3-player BoilerMafia game and screenshots every style on every screen.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const STYLES = [
  "glass",
  "comic",
  "brutal",
  "tide",
  "clay",
  "ascii",
  "win98",
  "neon",
  "pixel",
  "paper",
  "sakura",
  "noir",
  "story",
  "news",
  "show",
  "table",
  "blueprint",
  "minimal",
];
const T = 20000;
const log = (...a) => console.log(...a);
const assert = (c, m) => {
  if (!c) throw new Error("ASSERT " + m);
  log("  ok -", m);
};

const browser = await chromium.launch({ args: ["--enable-gpu", "--use-angle=metal", "--ignore-gpu-blocklist"] });
const errors = [];
const dev = async (name, mobile) => {
  const ctx = await browser.newContext(
    mobile
      ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }
      : { viewport: { width: 1280, height: 720 } },
  );
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  page.on(
    "console",
    (m) =>
      m.type() === "error" && !/favicon|Failed to load resource/.test(m.text()) && errors.push(`${name}: ${m.text()}`),
  );
  return { name, page };
};
const styleOf = (p) => p.page.evaluate(() => document.documentElement.dataset.style);
const pickStyle = async (p, s) => {
  await p.page.getByRole("button", { name: "Style" }).first().click();
  await p.page.locator(`.sw-${s}`).click();
  await p.page.keyboard.press("Escape");
};

try {
  const host = await dev("host", false);
  await host.page.goto(`${BASE}/boilermafia`);
  await host.page.getByRole("button", { name: "Create game" }).click();
  for (let i = 0; i < 2; i++) await host.page.getByLabel("Decrease Minimum").click();
  await host.page.getByLabel("Decrease Werewolves").click();
  for (let i = 0; i < 9; i++) await host.page.getByLabel("Increase Role reveal").click();
  for (let i = 0; i < 20; i++) await host.page.getByLabel("Increase Night").click();
  await host.page.getByRole("button", { name: "Create room" }).click();
  await host.page.waitForURL(/[A-Z]{4}$/, { timeout: T });
  const code = host.page.url().split("/").pop();
  const phones = [];
  for (const n of ["Dash", "Ojas", "Maya"]) {
    const p = await dev(n, true);
    await p.page.goto(`${BASE}/boilermafia/${code}`);
    await p.page.getByLabel("Your name").fill(n);
    await p.page.getByRole("button", { name: "Join" }).click();
    await p.page.getByText(`You're in, ${n}.`).waitFor({ timeout: T });
    phones.push(p);
  }
  await host.page.getByText("Maya", { exact: true }).waitFor({ timeout: T });

  // --- host picks a style in the lobby; phones follow live
  await pickStyle(host, "neon");
  await phones[0].page.waitForFunction(() => document.documentElement.dataset.style === "neon", null, { timeout: T });
  assert(true, "host style change reaches phones live (neon)");
  for (const s of STYLES) {
    await pickStyle(host, s);
    await host.page.waitForTimeout(500);
    await host.page.screenshot({ path: `${OUT}/lobby-${s}.png` });
  }

  await host.page.getByRole("button", { name: "Start game" }).click();
  const roles = {};
  for (const p of phones) {
    const h = p.page.locator("h2").filter({ hasText: /^(a|the) (Werewolf|Doctor|Seer|Villager)$/i });
    await h.waitFor({ timeout: T });
    roles[p.name] = (await h.textContent()).split(" ")[1].toLowerCase();
  }
  log("roles", roles);
  const wolf = phones.find((p) => roles[p.name] === "werewolf");

  // --- phone override, then match host
  const other = phones.find((p) => p !== wolf);
  await pickStyle(other, "noir");
  await pickStyle(host, "comic");
  await wolf.page.waitForFunction(() => document.documentElement.dataset.style === "comic", null, { timeout: T });
  await other.page.waitForTimeout(1200);
  assert((await styleOf(other)) === "noir", "a phone that picked its own style keeps it when the host changes");
  await other.page.getByRole("button", { name: "Style" }).first().click();
  await other.page.getByRole("button", { name: "Match the host" }).click();
  await other.page.keyboard.press("Escape");
  await other.page.waitForFunction(() => document.documentElement.dataset.style === "comic", null, { timeout: T });
  assert(true, "Match the host returns that phone to the room style");

  const shoot = async (label, phone) => {
    for (const s of STYLES) {
      await pickStyle(host, s);
      await phone.page.waitForFunction((x) => document.documentElement.dataset.style === x, s, { timeout: T });
      await host.page.waitForTimeout(700);
      await host.page.screenshot({ path: `${OUT}/${label}-host-${s}.png` });
      await phone.page.screenshot({ path: `${OUT}/${label}-phone-${s}.png` });
    }
  };
  await shoot("reveal", wolf);

  await host.page.getByRole("button", { name: /Begin the night/ }).click();
  await wolf.page.getByText("Choose your victim").waitFor({ timeout: T });
  await host.page.waitForTimeout(5200); // let narration fill
  await shoot("night", wolf);

  await host.page.getByRole("button", { name: /End the night/ }).click();
  await host.page.getByRole("button", { name: /Start the day/ }).click();
  await wolf.page.getByText("Who should be banished?").waitFor({ timeout: T });
  const voter = phones.find((p) => p !== wolf);
  await voter.page
    .getByRole("button")
    .filter({ has: voter.page.locator("span", { hasText: new RegExp(`^${wolf.name}$`) }) })
    .click();
  await shoot("day", voter);

  for (const p of phones) {
    if (p === wolf || p === voter) continue;
    await p.page
      .getByRole("button")
      .filter({ has: p.page.locator("span", { hasText: new RegExp(`^${wolf.name}$`) }) })
      .click();
  }
  await wolf.page.getByRole("button", { name: /^Skip vote/ }).click();
  await host.page.getByRole("button", { name: /Reveal the winner/ }).click({ timeout: T });
  await host.page
    .getByText(/wins\./)
    .first()
    .waitFor({ timeout: T });
  await shoot("over", voter);

  log("errors:", errors.length ? [...new Set(errors)].slice(0, 10) : "none");
  console.log("THEMES PASS");
} catch (e) {
  console.error("THEMES FAIL", e, [...new Set(errors)].slice(0, 10));
  process.exitCode = 1;
} finally {
  await browser.close();
}
