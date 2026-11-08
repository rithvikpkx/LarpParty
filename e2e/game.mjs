// End-to-end: one host screen + N phones play a full BoilerMafia game.
// Usage: BASE=http://localhost:3000 SUPABASE_URL=... ANON_KEY=... node game.mjs
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.ANON_KEY;
const N = Number(process.env.N ?? 6);
const T = 20_000;

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT: " + msg);
  log("  ok -", msg);
}

const browser = await chromium.launch();
const errors = [];
async function device(name, mobile) {
  const ctx = await browser.newContext(
    mobile
      ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
      : { viewport: { width: 1440, height: 900 } },
  );
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`${name} console: ${m.text()}`));
  return { name, ctx, page };
}

async function accessToken(ctx) {
  const cookies = await ctx.cookies();
  const parts = cookies
    .filter((c) => /^sb-.*-auth-token(\.\d+)?$/.test(c.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  let raw = parts.map((c) => decodeURIComponent(c.value)).join("");
  if (raw.startsWith("base64-")) raw = Buffer.from(raw.slice(7), "base64").toString("utf8");
  return JSON.parse(raw).access_token;
}

async function rest(token, path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  });
  return res.json();
}

try {
  // ---- Host creates the room
  const host = await device("host", false);
  await host.page.goto(`${BASE}/`);
  await host.page.getByRole("link", { name: /BoilerMafia/ }).click();
  await host.page.getByRole("button", { name: "Create game" }).click();
  await host.page.getByRole("button", { name: "Create room" }).click();
  await host.page.waitForURL(/\/boilermafia\/[A-Z]{4}$/, { timeout: T });
  const code = host.page.url().split("/").pop();
  log("room", code);
  await host.page.getByText(code, { exact: true }).waitFor({ timeout: T });
  assert((await host.page.locator("svg").count()) > 0, "host lobby shows a QR code");

  // ---- Phones join
  const phones = [];
  for (let i = 0; i < N; i++) {
    const p = await device(`P${i + 1}`, true);
    await p.page.goto(`${BASE}/boilermafia/${code}`);
    await p.page.getByLabel("Your name").fill(`P${i + 1}`);
    await p.page.getByRole("button", { name: "Join" }).click();
    await p.page.getByText(`You're in, P${i + 1}.`).waitFor({ timeout: T });
    phones.push(p);
  }
  for (const p of phones) await host.page.getByText(p.name, { exact: true }).waitFor({ timeout: T });
  assert(true, `host sees all ${N} players appear in real time`);

  // Duplicate nickname rejected
  const dup = await device("dup", true);
  await dup.page.goto(`${BASE}/boilermafia/${code}`);
  await dup.page.getByLabel("Your name").fill("p1");
  await dup.page.getByRole("button", { name: "Join" }).click();
  await dup.page.getByText("Someone already has that name.").waitFor({ timeout: T });
  assert(true, "duplicate nickname is rejected");
  await dup.ctx.close();

  // ---- Start
  await host.page.getByRole("button", { name: "Start game" }).click();
  const roles = {};
  for (const p of phones) {
    const h = p.page.locator("h2").filter({ hasText: /^(a|the) (Werewolf|Doctor|Seer|Villager)$/ });
    await h.waitFor({ timeout: T });
    roles[p.name] = (await h.textContent()).split(" ")[1].toLowerCase();
  }
  log("roles", roles);
  const count = (r) => Object.values(roles).filter((x) => x === r).length;
  assert(
    count("werewolf") === 2 && count("doctor") === 1 && count("seer") === 1,
    "roles assigned per default settings",
  );

  // ---- RLS privacy checks
  if (SUPABASE_URL && ANON_KEY) {
    const tok = await accessToken(phones[0].ctx);
    const priv = await rest(tok, "player_private?select=player_id,state");
    assert(Array.isArray(priv) && priv.length === 1, `a phone can read only its own private row (got ${priv.length})`);
    const players = await rest(tok, "players?select=id");
    assert(players.length === N + 1, "a phone can read all players in its room");
    const hostTok = await accessToken(host.ctx);
    const hostPriv = await rest(hostTok, "player_private?select=player_id");
    assert(hostPriv.length === 0, "the host screen cannot read anyone's role");
    // Outsider: fresh anon user, not in the room
    const anon = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
      body: "{}",
    }).then((r) => r.json());
    const outRooms = await rest(anon.access_token, "rooms?select=id");
    assert(Array.isArray(outRooms) && outRooms.length === 0, "an outsider cannot read the room");
    const write = await fetch(`${SUPABASE_URL}/rest/v1/rooms?code=eq.${code}`, {
      method: "PATCH",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${tok}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status: "finished" }),
    });
    assert(
      write.status >= 400 || (await write.json()).length === 0,
      `a phone cannot write the room directly (HTTP ${write.status})`,
    );
  }

  for (const p of phones) await p.page.getByRole("button", { name: "I'm ready" }).click();
  await host.page.getByText("Everyone, close your eyes.").waitFor({ timeout: T });
  assert(true, "everyone ready -> host narrates the night");

  const byRole = (r) => phones.filter((p) => roles[p.name] === r);
  const alive = new Set(phones.map((p) => p.name));
  const pick = async (p, name) =>
    p.page
      .getByRole("button")
      .filter({ has: p.page.locator("span", { hasText: new RegExp(`^${name}( \\(you\\))?$`) }) })
      .first()
      .click();

  let round = 0;
  while (true) {
    round++;
    log(`-- night ${round}`);
    const wolves = byRole("werewolf").filter((p) => alive.has(p.name));
    const victim = phones.find((p) => alive.has(p.name) && roles[p.name] !== "werewolf" && roles[p.name] !== "doctor");
    for (const w of wolves) {
      await w.page.getByText("Choose your victim").waitFor({ timeout: T });
      await pick(w, victim.name);
    }
    for (const d of byRole("doctor").filter((p) => alive.has(p.name))) {
      await d.page.getByText("Who will you protect?").waitFor({ timeout: T });
      await pick(d, d.name);
    }
    for (const s of byRole("seer").filter((p) => alive.has(p.name))) {
      await s.page.getByText("Whose soul will you see?").waitFor({ timeout: T });
      await pick(s, wolves[0].name);
    }
    await host.page.getByText(`${victim.name} was found dead at dawn.`).waitFor({ timeout: T });
    alive.delete(victim.name);
    assert(true, `night ${round}: ${victim.name} killed, host announces it`);
    await victim.page.getByText("You are dead").waitFor({ timeout: T });

    if (round === 1) {
      // Refresh a living phone mid-game: it should come back to the same state.
      const r = phones.find((p) => alive.has(p.name));
      await r.page.reload();
      await r.page.getByText("Morning has come").waitFor({ timeout: T });
      assert(true, `${r.name} refreshes and rejoins in the same state`);
    }

    if (await host.page.getByRole("button", { name: /Reveal the winner/ }).isVisible()) break;
    await host.page.getByRole("button", { name: /Start the day/ }).click();

    log(`-- day ${round}`);
    const target = byRole("werewolf").find((p) => alive.has(p.name));
    for (const p of phones.filter((p) => alive.has(p.name))) {
      await p.page.getByText("Who should be banished?").waitFor({ timeout: T });
      if (p === target) await p.page.getByRole("button", { name: /^Skip vote/ }).click();
      else await pick(p, target.name);
    }
    await host.page.getByText(`The village has banished ${target.name}.`).waitFor({ timeout: T });
    alive.delete(target.name);
    assert(true, `day ${round}: ${target.name} banished by vote`);
    if (await host.page.getByRole("button", { name: /Reveal the winner/ }).isVisible()) break;
    await host.page.getByRole("button", { name: /Next night/ }).click();
  }

  await host.page.getByRole("button", { name: /Reveal the winner/ }).click();
  await host.page
    .getByText(/The (village|werewolves) wins\./)
    .first()
    .waitFor({ timeout: T });
  const winText = await host.page
    .getByText(/The (village|werewolves) wins\./)
    .first()
    .textContent();
  assert(true, `host shows winner: "${winText}"`);
  for (const p of phones) await p.page.getByText(/^You (won|lost)$/).waitFor({ timeout: T });
  assert(true, "every phone shows its own result");

  // Timer path: play again and let the reveal timer expire on its own
  await host.page.getByRole("button", { name: "Play again" }).click();
  await host.page.getByRole("button", { name: "Start game" }).waitFor({ timeout: T });
  assert(true, "play again returns everyone to the lobby");

  await host.page.screenshot({ path: "host-final.png" });
  log("errors:", errors.length ? errors : "none");
  console.log("E2E PASS");
} catch (e) {
  console.error("E2E FAIL", e);
  for (const pg of browser.contexts().flatMap((c) => c.pages())) {
    try {
      console.error("---- page", pg.url(), "\n", (await pg.locator("body").innerText()).slice(0, 600));
    } catch {}
  }
  try {
    await browser.contexts()[0].pages()[0].screenshot({ path: "fail-host.png" });
  } catch {}
  console.error("page errors:", errors);
  process.exitCode = 1;
} finally {
  await browser.close();
}
