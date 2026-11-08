// Real-app perf: host night screen + a phone, every style, CPU throttled 4x.
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3000";
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
const browser = await chromium.launch({ args: ["--enable-gpu", "--use-angle=metal", "--ignore-gpu-blocklist"] });
const mk = async (mobile) => {
  const c = await browser.newContext(
    mobile
      ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
      : { viewport: { width: 1280, height: 720 } },
  );
  return c.newPage();
};
const host = await mk(false);
await host.goto(`${BASE}/boilermafia`);
await host.getByRole("button", { name: "Create game" }).click();
for (let i = 0; i < 2; i++) await host.getByLabel("Decrease Minimum").click();
await host.getByLabel("Decrease Werewolves").click();
for (let i = 0; i < 20; i++) await host.getByLabel("Increase Night").click();
await host.getByRole("button", { name: "Create room" }).click();
await host.waitForURL(/[A-Z]{4}$/);
const code = host.url().split("/").pop();
const phones = [];
for (const n of ["A1", "B2", "C3"]) {
  const p = await mk(true);
  await p.goto(`${BASE}/boilermafia/${code}`);
  await p.getByLabel("Your name").fill(n);
  await p.getByRole("button", { name: "Join" }).click();
  await p.getByText(`You're in, ${n}.`).waitFor();
  phones.push(p);
}
await host.getByRole("button", { name: "Start game" }).click();
await phones[0].getByText("You are").waitFor();
await host.getByRole("button", { name: /Begin the night/ }).click();
await phones[0].locator(".pick").first().waitFor();
const cdpH = await host.context().newCDPSession(host);
const cdpP = await phones[0].context().newCDPSession(phones[0]);
await cdpH.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await cdpP.send("Emulation.setCPUThrottlingRate", { rate: 4 });
for (const p of [host, phones[0]])
  await p.evaluate(() => {
    window.__lt = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(Math.round(e.duration)))).observe({
      type: "longtask",
    });
  });
const fps = (p) =>
  p.evaluate(
    () =>
      new Promise((r) => {
        let n = 0,
          worst = 0,
          prev = performance.now();
        const t0 = prev;
        (function f(t) {
          n++;
          worst = Math.max(worst, t - prev);
          prev = t;
          if (t - t0 < 2000) requestAnimationFrame(f);
          else r([Math.round((n * 1000) / (t - t0)), Math.round(worst)]);
        })(t0);
      }),
  );
const row = async (s, pass) => {
  for (const p of [host, phones[0]]) await p.evaluate(() => (window.__lt = []));
  await host.getByRole("button", { name: "Style" }).first().click();
  await host.locator(`.sw-${s}`).click();
  await host.keyboard.press("Escape");
  await phones[0].waitForFunction((x) => document.documentElement.dataset.style === x, s);
  await host.waitForTimeout(900);
  const [hf, hw] = await fps(host);
  const [pf, pw] = await fps(phones[0]);
  const lt = await host.evaluate(() => window.__lt);
  const lp = await phones[0].evaluate(() => window.__lt);
  if (pass === 2)
    console.log(
      `${s.padEnd(9)} host ${hf}fps worst ${hw}ms switch-longtasks ${lt.join(",") || "none"} | phone ${pf}fps worst ${pw}ms switch-longtasks ${lp.join(",") || "none"}`,
    );
};
for (const s of STYLES) await row(s, 1); // first pass loads fonts
console.log("== warm pass, CPU 4x");
for (const s of STYLES) await row(s, 2);
await browser.close();
