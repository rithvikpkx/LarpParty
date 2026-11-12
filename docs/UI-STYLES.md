# 18 UI Styles: a portable design-system specification

This document describes 18 complete visual styles (Liquid Glass, Comic Pop, Neo-Brutalist, Tide Pool, Claymation, ASCII Terminal, Desktop 98, Neon Arcade, Pixel Retro, Paper Sketch, Sakura, Noir, Storybook, The Daily Village, Game Show, Tabletop, Blueprint, Black & Gold) so that a coding agent can reproduce any of them on an unrelated website: a portfolio, a dashboard, a landing page or an app. All 18 share one token contract and one set of component classes. A style is a block of CSS custom properties plus a few decoration rules, and switching styles means changing one attribute on `<html>`. Every value here was copied from the reference implementation (`src/themes/themes.css` and its helpers in this repository). Where the source does not define something, the text says "not defined in source". The reference is a party-game site, so names that only made sense there have been translated into general terms; §1.2 maps the original selectors to the generic ones used here.

## How an agent should use this document

1. **Pick a style.** Use the catalogue table in §2 and the "Good for" line at the top of each style section. If the site needs a light and a dark palette, check the style's "Dark variant" table first; four styles have no separate dark variant (ASCII Terminal, Desktop 98, Noir, The Daily Village).
2. **Copy the foundations.** Take the base CSS in §1.6, the page skeleton in §1.5 and the switching code in §1.11. If the site has only one style, you can skip the switcher, but keep `data-style` on `<html>`, because every style block is keyed on it.
3. **Copy the style.** Paste the style's "Copy-paste CSS" block (its token block, dark overrides, decoration rules and keyframes). Load its Google Fonts URL. Add any runtime helper it needs from §1.13 (film grain, glass refraction map, POW symbol, ASCII rain).
4. **Map your components onto the recipes.** Each recipe in §1.7 names its classes and lists the tokens it reads. Rename the classes to suit your codebase if you like, but keep the token names, because the style blocks only set tokens.
5. **Verify.** Work through the checklists in Appendix A and B: contact-sheet screenshots of every screen, dark-palette contrast, 60 fps at 4× CPU throttle, reduced motion and lite mode. Fix the contrast traps listed under the style's "Accessibility & pitfalls"; several of them are still present in the source.

## Contents

- [1. Foundations](#1-foundations)
  - [1.1 Architecture in one paragraph](#11-architecture-in-one-paragraph)
  - [1.2 Selector map: reference names to generic names](#12-selector-map-reference-names-to-generic-names)
  - [1.3 Token contract](#13-token-contract)
  - [1.4 The scaling unit `--u`](#14-the-scaling-unit---u)
  - [1.5 Page skeleton and the decoration layer](#15-page-skeleton-and-the-decoration-layer)
  - [1.6 Base CSS (copy-paste)](#16-base-css-copy-paste)
  - [1.7 Component recipes](#17-component-recipes)
  - [1.8 Type scale used in the reference](#18-type-scale-used-in-the-reference)
  - [1.9 Motion](#19-motion)
  - [1.10 Dark / alternate palette](#110-dark--alternate-palette)
  - [1.11 Switching styles](#111-switching-styles)
  - [1.12 Reduced motion, reduced transparency and lite mode](#112-reduced-motion-reduced-transparency-and-lite-mode)
  - [1.13 Runtime helpers](#113-runtime-helpers)
  - [1.14 Imagery pipeline](#114-imagery-pipeline)
  - [1.15 Accessibility baseline and measured contrast](#115-accessibility-baseline-and-measured-contrast)
  - [1.16 Performance budget and measured results](#116-performance-budget-and-measured-results)
- [2. Style catalogue overview](#2-style-catalogue-overview)
- [3. The styles](#3-the-styles)
  - [3.1 Liquid Glass](#31-liquid-glass-glass)
  - [3.2 Comic Pop](#32-comic-pop-comic)
  - [3.3 Neo-Brutalist](#33-neo-brutalist-brutal)
  - [3.4 Tide Pool](#34-tide-pool-tide)
  - [3.5 Claymation](#35-claymation-clay)
  - [3.6 ASCII Terminal](#36-ascii-terminal-ascii)
  - [3.7 Desktop 98](#37-desktop-98-win98)
  - [3.8 Neon Arcade](#38-neon-arcade-neon)
  - [3.9 Pixel Retro](#39-pixel-retro-pixel)
  - [3.10 Paper Sketch](#310-paper-sketch-paper)
  - [3.11 Sakura](#311-sakura-sakura)
  - [3.12 Noir](#312-noir-noir)
  - [3.13 Storybook](#313-storybook-story)
  - [3.14 The Daily Village](#314-the-daily-village-news)
  - [3.15 Game Show](#315-game-show-show)
  - [3.16 Tabletop](#316-tabletop-table)
  - [3.17 Blueprint](#317-blueprint-blueprint)
  - [3.18 Black & Gold](#318-black--gold-minimal)
- [Appendix A. Implementation checklist](#appendix-a-implementation-checklist)
- [Appendix B. Verification checklist](#appendix-b-verification-checklist)
- [Appendix C. IP and licensing notes](#appendix-c-ip-and-licensing-notes)
- [Appendix D. Reference implementation files](#appendix-d-reference-implementation-files)
- [Appendix E. Not defined in source, and open issues](#appendix-e-not-defined-in-source-and-open-issues)

---

## 1. Foundations

### 1.1 Architecture in one paragraph

`<html data-style="<id>">` selects the style. Each style is one rule keyed on `[data-style="<id>"]` that sets semantic tokens (`--bg`, `--fg`, `--panel`, `--accent`, ...), plus a few rules that style decorations or adjust a component (`[data-style="<id>"] .panel::before { ... }`). Components never hard-code colours, radii, fonts or shadows. They only read tokens, so one component library renders all 18 styles. Every page has the same fixed background layer, and it contains every decoration slot any style might use (blobs, sun, grid floor, petals, ticker, taskbar and so on). Slots are `display: none` by default and a style turns on only the ones it needs, so switching styles is pure CSS with no re-render. A dark (alternate) palette is a class on the page root that only redefines tokens. Sizes use `--u`, one design pixel, so a layout designed at 1280×720 or 390 wide scales exactly.

### 1.2 Selector map: reference names to generic names

The copy-paste CSS in this document uses the generic names on the right. The reference repository uses the names on the left. Values are unchanged.

| Reference selector (this repo) | Generic name used here | What it is |
| --- | --- | --- |
| `.scr` | `.screen` | Page root. Defines `--u`, paints `--bg`/`--fg`, holds the layers. |
| `.scr.tv` | `.screen.large` | Large display designed at 1280×720 and scaled to fit (TV, kiosk, projector, presentation). |
| `.scr.phone` | `.screen.mobile` | Mobile layout designed 390px wide. |
| `.scr.page` | `.screen.page` | Normal responsive page; one design pixel = 1 CSS px. |
| `.is-night` | `.is-dark` | Dark / alternate palette switch on the page root. |
| `.col` | `.content` | Content column, stacked above the decoration layer. |
| `.bg` | `.bg-layer` | Fixed background layer that holds every decoration slot. |
| `.deco` | `.deco` | A decoration slot. Hidden unless the active style enables it. |
| `.disp` | `.display` | Display heading. |
| `.room-code` | `.hero-number` | Huge display text: a code, price, score or headline stat. |
| `.code-boxes` | `.segments` | Segmented code input: one box per character over a single real input. |
| `.picks`, `.pick`, `.pick.on`, `.pick .n` | `.options`, `.option`, `.option.is-selected`, `.option .meta` | Selectable list option (vote, poll answer, plan picker) and its right-hand detail text. |
| `.narr`, `p.new`, `p.old` | `.feed`, `p.is-new`, `p.is-old` | Message feed / announcement lines (narration in the reference). |
| `.role-card`, `.role-card .you` | `.feature-card`, `.feature-card .card-kicker` | The one key card on a screen (a secret role card in the reference) and its small overline. |
| `.roles`, `.rc`, `.rc.lost` | `.result-grid`, `.result-card`, `.result-card.is-out` | Grid of result cards; `.is-out` means eliminated, closed or inactive. |
| `.game` | `.list-card` | Clickable card in a grid (game cards on the home page). |
| `.tile .av`, `.tile.pop` | `.tile .avatar`, `.tile.is-new` | Person/item row with a coloured initial avatar; `.is-new` pops in. |
| `.chip.dead`, `.chip.ok` | `.chip.is-off`, `.chip.is-ok` | Chip states. |
| `.players` | `.roster` | A panel that lists tiles. |
| `.stage .moon` | `.hero-art` | Floating illustration on a large display. |
| `.win`, `.win h1`, `.win .trophy` | `.screen.is-finale`, `.headline`, `.headline-art` | Celebration/result screen, its big heading and its illustration. |
| `.home`, `.lobby-scr`, `.join`, `.vote` | `.screen.is-hero`, `.screen.is-split`, `.screen.is-form`, `.screen.is-choice` | Page-variant hooks that Comic Pop, Neo-Brutalist, Pixel Retro and Tide Pool use for per-page backgrounds or sizes. |
| `.lobby > div:first-child`, `.join-at` | `.split-left`, `.split-left .sub` | Left column of a split layout and its subline (Neo-Brutalist only). |
| `.join-hero` | `.page-hero` | Title row with a small illustration on the right. |
| `.role` (Tabletop only) | `.card-scene` | Parent that provides `perspective` for the card flip. |
| `.panel`, `.btn`, `.btn.ghost`, `.chip`, `.field`, `.tile`, `.eyebrow`, `.art`, `.hl`, `.timer`, `.timer-sm`, `.toast`, `.msg`, `.qr-wrap`, `.card-back` | unchanged | Already generic. |

### 1.3 Token contract

Every token below is read by the base CSS. A style must set the tokens marked "none" in the fallback column; the others are optional. Tokens are declared on `<html>` by the `[data-style]` block, except where noted.

**Colour and surface**

| Token | Meaning | Fallback when unset |
| --- | --- | --- |
| `--bg` | Page background colour. Also painted on `html`/`body` so overscroll and gaps match. | none |
| `--fg` | Main text colour on the page background. | none |
| `--muted` | Secondary text on the page background (hints, eyebrows, option meta). | none |
| `--panel` | Surface (card/panel) fill. | none |
| `--panel-fg` | Text colour on panels. | `--fg` |
| `--muted-panel` | Secondary text on panels, form labels, placeholders. | `--muted` |
| `--line` | Border colour of panels, fields, options, chips, tiles, segments, QR frame. | none |
| `--accent` | Primary action fill (buttons; default selected option; default share bar tint). | none |
| `--accent-fg` | Text on `--accent`. | none |
| `--accent-text` | Accent used as a text colour: links, kickers, ✓ marks, bold words in messages, the focus ring. | `--accent` |
| `--field` | Fill of inputs, options, segments and inline messages. | none |
| `--field-fg` | Text on `--field`. | `--fg` |
| `--tile` | Tile (avatar row) fill. | `--field` |
| `--tile-fg` | Text on tiles. | `--fg` |
| `--chip-bg` | Chip fill. | none (no fallback in the CSS; every style sets it) |
| `--chip-fg` | Chip text. | `--fg` |
| `--ghost-bg` | Secondary (ghost) button fill. Usually set on `.btn.ghost` itself. | `transparent` |
| `--ghost-fg` | Ghost button text. | `--fg` |
| `--bar` | Fill of the share bar drawn behind options (a colour, gradient or pattern). | `color-mix(in srgb, var(--accent) 22%, transparent)` |
| `--role-bg` | Feature-card fill. Usually set on `.feature-card` itself. | `--panel` |
| `--qr-bg`, `--qr-fg` | QR frame fill and QR module colour. | `#fff`, `#111` |
| `--danger`, `--danger-bg` | Toast text and fill. No style sets these. | `#ff453a`, `rgba(255,69,58,.14)` |

**Line and shape**

| Token | Meaning | Fallback when unset |
| --- | --- | --- |
| `--bw` | Border width of panels, buttons, fields, options, tiles, segments, QR frame. | none |
| `--r` | Large radius (panels; buttons unless `--btn-r` is set). | none |
| `--r-sm` | Small radius (fields, options, tiles, segments, QR frame, toast, inline message). | `calc(var(--r) * .6)`; `12px` for toast and message |
| `--btn-r` | Button radius. | `--r` (stepper buttons fall back to `999px`) |
| `--btn-line` | Button border colour; also the border of a selected option. | `--line` |
| `--chip-r` | Chip radius. | `999px` |
| `--chip-bw` | Chip border width. | `0px` |
| `--av-r` | Avatar radius. | `50%` |

**Depth and interaction**

| Token | Meaning | Fallback when unset |
| --- | --- | --- |
| `--shadow` | Panel shadow. Several styles reuse it on fields, tiles and options. | none |
| `--shadow-sm` | QR frame shadow. | `none` |
| `--btn-shadow` | Button shadow at rest. | `none` |
| `--btn-shadow-press` | Button shadow while pressed (`:active`). | `--btn-shadow` |
| `--press` | Transform applied on `:active` to buttons, options and list cards. | `scale(.97)` for buttons, `scale(.98)` for options and list cards |

**Typography**

| Token | Meaning | Fallback when unset |
| --- | --- | --- |
| `--font-d` | Display face: headings, hero number, timer and feed unless overridden. | none |
| `--font-b` | Body face. | none |
| `--font-btn` | Button face. | `--font-b` |
| `--font-code` | Hero number and segmented-input face. | `--font-d` |
| `--font-timer` | Timer face. | `--font-d` |
| `--font-narr` | Message-feed face. | `--font-d` |
| `--font-eyebrow` | Eyebrow face. Read by the CSS, but no style sets it. | `--font-b` |
| `--d-weight` | Display weight. | `700` |
| `--d-track` | Display letter-spacing. | `-.02em` on `.display`; `0` on card and section headings |
| `--d-case` | Display `text-transform`. | `none` |
| `--d-lh` | Display line-height. | `1.02` |
| `--btn-weight`, `--btn-track`, `--btn-case` | Button weight, letter-spacing, case. | `600`, `0`, `none` |
| `--eyebrow-track` | Eyebrow letter-spacing. | `.22em` |
| `--code-track` | Hero-number letter-spacing. | `.08em` |
| `--timer-track` | Timer letter-spacing. | `-.02em` |
| `--narr-weight`, `--narr-track` | Feed weight and letter-spacing. | `500`, `-.01em` |

**Motion (declared on `:root`)**

| Token | Value | Use |
| --- | --- | --- |
| `--ease` | `cubic-bezier(.22,1,.36,1)` | Entrances (`rise`, `pop`), the option share bar, POW pulse, Tabletop deal, the style-switch reveal. |
| `--ease-ui` | `cubic-bezier(.2,.8,.2,1)` | Hover and press transitions. |

**Runtime and helper tokens**

| Token | Set by | Meaning | Fallback |
| --- | --- | --- | --- |
| `--u` | `.screen` (base CSS) | One design pixel. See §1.4. Exists only on `.screen` and its descendants. | `1px` on plain `.screen` |
| `--grain` | JavaScript on `<html>` (§1.13) | `url(data:image/png...)` of a 128px noise tile. | unset until the script runs, so grain layers render without grain |
| `--c` | inline style on each `.tile` | Avatar colour. | none |
| `--p` | inline style on each `.option` | Share 0..1 for the option bar. | `0` |
| `--x`, `--d`, `--dl` | inline style on each particle | Left position, duration and delay of a petal or bubble. | `10%`, `11s`, `0s` |
| `--ascii-size` | ASCII Terminal per context | Font size of ASCII art. | `calc(var(--u) * 5.2)` |
| `--bevel`, `--sunken` | Desktop 98 | Raised and sunken four-layer bevels. | n/a |
| `--tb` | Desktop 98, on `.screen` | Title-bar height, `calc(var(--u) * 26)`. | n/a |
| `--clay` | Claymation | Puffy clay shadow stack. | n/a |
| `--px` | Pixel Retro, on `.screen` | One art pixel, `calc(var(--u) * 4)`. | n/a |

**Avatar palette.** The reference colours avatars by index from a fixed list of ten: `#ff6b6b`, `#4dabf7`, `#51cf66`, `#b197fc`, `#ffa94d`, `#f783ac`, `#3bc9db`, `#ffd43b`, `#94d82d`, `#e599f7`. A few styles override it (Pixel Retro, Neo-Brutalist, ASCII Terminal, Sakura, Blueprint, Noir, Storybook).

### 1.4 The scaling unit `--u`

Every size in the base CSS is written as `calc(var(--u) * N)`, where N is a size in design pixels. Three page kinds set `--u` differently:

| Page kind | `--u` | Root font size | Use for |
| --- | --- | --- | --- |
| `.screen.large` | `min(calc(100vw / 1280), calc(100dvh / 720))` | `calc(var(--u) * 22)` | Fixed-layout large displays designed at 1280×720. The layout letterboxes and never scrolls (`height: 100dvh; overflow: hidden`). |
| `.screen.mobile` | `clamp(0.9px, calc(100vw / 390), 1.15px)` | `calc(var(--u) * 15)` | Mobile layouts designed 390 wide; scales by ±10–15% at most. |
| `.screen.page` (or plain `.screen`) | `1px` | `calc(var(--u) * 16)` | Normal responsive pages. |

**Gotcha: tokens that use `--u` must be declared on `.screen`, not on `<html>`.** Custom properties resolve `var()` on the element where they are declared and then inherit the computed result. `--u` exists only on `.screen`, so a token like `--px: calc(var(--u) * 4)` declared on `<html>` is invalid. Pixel Retro declares `--px`, `--shadow`, `--btn-shadow`, `--press` and `--bar` on `.screen` for this reason, and Desktop 98 declares `--tb` there.

The same rule applies to composite tokens and the dark palette (§1.10). If `--shadow: var(--clay)` is declared on `<html>` and the dark palette overrides `--clay` on `.screen.is-dark`, `--shadow` keeps the light value. Claymation therefore re-declares `--shadow: var(--clay)` on `.screen`.

### 1.5 Page skeleton and the decoration layer

Every page uses the same skeleton, whatever the style. All decoration slots are always in the DOM, are `aria-hidden`, and are hidden by `.deco { display: none }` until a style turns one on. Content sits in `.content` at `z-index: 1`, above the fixed `.bg-layer` at `z-index: 0`. The masthead and the POW burst are direct children of `.screen` at `z-index: 2` (POW raises itself to 3).

```html
<main class="screen mobile">            <!-- or: large | page ; add is-dark for the alternate palette -->
  <div class="bg-layer" aria-hidden="true">
    <i class="deco blob b1"></i>          <!-- Liquid Glass, Claymation -->
    <i class="deco blob b2"></i>
    <i class="deco blob b3"></i>
    <i class="deco stripes"></i>          <!-- Liquid Glass -->
    <i class="deco sun"></i>              <!-- Neon Arcade -->
    <span class="deco floor"><i></i></span> <!-- Neon Arcade -->
    <i class="deco cloud"></i>            <!-- Pixel Retro -->
    <i class="deco cloud c2"></i>
    <i class="deco ground"></i>           <!-- Pixel Retro, Tide Pool -->
    <i class="deco blinds"></i>           <!-- Noir -->
    <i class="deco grainl"></i>           <!-- Noir, Storybook -->
    <i class="deco spot s1"></i>          <!-- Game Show, Tide Pool -->
    <i class="deco spot s2"></i>
    <i class="deco dim"></i>              <!-- Blueprint -->
    <i class="deco kanji">遊</i>          <!-- Sakura: one character per page -->
    <span class="deco petals">            <!-- Sakura petals, Tide Pool bubbles -->
      <i style="--x:6%;--d:9s;--dl:0s"></i>
      <i style="--x:18%;--d:11.5s;--dl:-1.7s"></i>
      <i style="--x:30%;--d:14s;--dl:-3.4s"></i>
      <i style="--x:42%;--d:16.5s;--dl:-5.1s"></i>
      <i style="--x:54%;--d:9s;--dl:-6.8s"></i>
      <i style="--x:66%;--d:11.5s;--dl:-8.5s"></i>
      <i style="--x:78%;--d:14s;--dl:-10.2s"></i>
      <i style="--x:90%;--d:16.5s;--dl:-11.9s"></i>
    </span>
    <i class="deco taskbar"></i>          <!-- Desktop 98 -->
    <i class="deco ticker"></i>           <!-- Neo-Brutalist -->
    <canvas class="deco rain"></canvas>   <!-- ASCII Terminal; optional, see §1.13 -->
  </div>
  <div class="deco masthead" aria-hidden="true">The Daily Village</div>  <!-- The Daily Village; put your publication name here -->
  <svg class="deco pow" aria-hidden="true"><use href="#pow"/></svg>      <!-- Comic Pop; only on "big moment" pages -->
  <div class="content">
    <!-- page content -->
  </div>
</main>
```

The petal values follow a formula: for i = 0..7, `--x` is `6 + 12i` %, `--d` is `9 + (i mod 4) × 2.5` s, and `--dl` is `−1.7i` s. The negative delays start each particle partway through its fall, so the screen is already populated on first paint.

Rules for the layer:

- It is `position: fixed; inset: 0; pointer-events: none; overflow: hidden`, so decorations stay with the viewport while content scrolls, and they never intercept taps.
- It paints `background: var(--bg)` by default; styles replace that with gradients or patterns on `.bg-layer`.
- Keep decorations to `transform` and `opacity` animation, and put `will-change: transform` only on the few moving layers (blobs, petals, spotlights, grid floor).
- `.deco` elements outside the layer (masthead, POW) must also be `aria-hidden`.

### 1.6 Base CSS (copy-paste)

This is the shared layer every style builds on: the screen system, the component classes and the shared keyframes. It is generalised from the top of `src/themes/themes.css` (lines 11–235) and its lite/reduced-motion rules (lines 918–921). Layout rules specific to the reference app's screens were left out. Two rules are global in the reference app (`src/app/globals.css`) and belong with this layer:

```css
/* Page background follows the active style (each style sets --bg on <html data-style>). */
html, body { margin: 0; background: var(--bg, #fafaf7); color: var(--fg, #000); -webkit-tap-highlight-color: transparent; }
body { font-family: var(--font-b, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif); }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; }
}
::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
```

```css
/* Base layer: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged. */
:root { --ease: cubic-bezier(.22,1,.36,1); --ease-ui: cubic-bezier(.2,.8,.2,1); }

.screen {
  --u: 1px;
  position: relative; isolation: isolate; min-height: 100dvh; overflow-x: clip;
  background: var(--bg); color: var(--fg);
  font-family: var(--font-b); font-size: calc(var(--u) * 16); line-height: 1.35;
  display: flex; flex-direction: column;
  padding: calc(var(--u) * 40) max(calc(var(--u) * 20), env(safe-area-inset-right, 0px)) calc(var(--u) * 40) max(calc(var(--u) * 20), env(safe-area-inset-left, 0px));
  padding-bottom: max(calc(var(--u) * 40), calc(68px + env(safe-area-inset-bottom, 0px)));
  -webkit-font-smoothing: antialiased;
}
.screen.large {
  --u: min(calc(100vw / 1280), calc(100dvh / 720));
  height: 100dvh; overflow: hidden; font-size: calc(var(--u) * 22);
  padding: calc(var(--u) * 48) calc(var(--u) * 64);
  padding-bottom: max(calc(var(--u) * 48), 64px);
}
.screen.mobile {
  --u: clamp(0.9px, calc(100vw / 390), 1.15px);
  font-size: calc(var(--u) * 15);
  padding: max(calc(var(--u) * 28), env(safe-area-inset-top, 0px)) calc(var(--u) * 20) calc(64px + env(safe-area-inset-bottom, 0px));
}
.screen > .content { position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; width: 100%; margin: 0 auto; min-width: 0; }
.screen.large > .content { max-width: calc(var(--u) * 1152); }
.screen.mobile > .content { max-width: calc(var(--u) * 440); }
.screen.page > .content { max-width: 1080px; }
.screen > .bg-layer { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; background: var(--bg); }
.screen > .deco { z-index: 2; }

.eyebrow { font-family: var(--font-eyebrow, var(--font-b)); text-transform: uppercase; letter-spacing: var(--eyebrow-track, .22em); font-size: .62em; font-weight: 600; color: var(--muted); }
.display { font-family: var(--font-d); font-weight: var(--d-weight, 700); letter-spacing: var(--d-track, -.02em); text-transform: var(--d-case, none); line-height: var(--d-lh, 1.02); margin: 0; text-wrap: balance; }
.muted { color: var(--muted); }
.panel {
  background: var(--panel); color: var(--panel-fg, var(--fg));
  border: var(--bw) solid var(--line); border-radius: var(--r);
  box-shadow: var(--shadow);
  padding: 1em;
}
.panel .muted { color: var(--muted-panel, var(--muted)); }
.btn {
  appearance: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: .4em;
  min-height: max(44px, 2.6em); padding: 0 1.2em; text-decoration: none;
  font-family: var(--font-btn, var(--font-b)); font-weight: var(--btn-weight, 600); font-size: 1em;
  letter-spacing: var(--btn-track, 0); text-transform: var(--btn-case, none);
  color: var(--accent-fg); background: var(--accent);
  border: var(--bw) solid var(--btn-line, var(--line)); border-radius: var(--btn-r, var(--r));
  box-shadow: var(--btn-shadow, none);
  transition: transform 150ms var(--ease-ui), box-shadow 150ms var(--ease-ui), background-color 150ms var(--ease-ui), color 150ms var(--ease-ui), opacity 150ms var(--ease-ui);
}
.btn:active:not(:disabled) { transform: var(--press, scale(.97)); box-shadow: var(--btn-shadow-press, var(--btn-shadow, none)); transition-duration: 90ms; }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn.ghost { background: var(--ghost-bg, transparent); color: var(--ghost-fg, var(--fg)); }
.btn.wide { width: 100%; }
.btn.sm { min-height: 36px; padding: 0 .8em; font-size: .82em; }
.btn:focus-visible, .option:focus-visible, .field:focus-visible { outline: 2px solid var(--accent-text, var(--accent)); outline-offset: 2px; }
.chip { display: inline-flex; align-items: center; gap: .4em; padding: .3em .8em; border-radius: var(--chip-r, 999px); background: var(--chip-bg); color: var(--chip-fg, var(--fg)); border: var(--chip-bw, 0px) solid var(--line); font-weight: 500; white-space: nowrap; }
.chip.is-off { opacity: .45; text-decoration: line-through; }
.chip.is-ok::after { content: "✓"; color: var(--accent-text, var(--accent)); }
.art { display: grid; place-items: center; }
.art img { width: 100%; height: auto; display: block; }
.art .pix, .art pre { display: none; }
pre.ascii { margin: 0; font-family: "JetBrains Mono", ui-monospace, monospace; line-height: 1; white-space: pre; color: var(--accent); }
.deco { display: none; }
.toast { margin-top: calc(var(--u) * 14); padding: .7em 1em; border-radius: var(--r-sm, 12px); background: var(--danger-bg, rgba(255,69,58,.14)); color: var(--danger, #ff453a); text-align: center; font-size: .9em; animation: rise 300ms var(--ease) both; }
.center-msg { flex: 1; display: grid; place-items: center; text-align: center; gap: calc(var(--u) * 12); }
.spinner { width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid currentColor; border-top-color: transparent; opacity: .6; animation: spin 800ms linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }


/* List card: a clickable card in a grid (reference: home-page cards) */
.list-card { display: grid; grid-template-columns: calc(var(--u) * 64) 1fr; gap: calc(var(--u) * 12); align-items: center; padding: calc(var(--u) * 14); color: inherit; text-decoration: none; transition: transform 150ms var(--ease-ui); }
.screen.page .list-card { grid-template-columns: 76px 1fr; padding: 18px; }
@media (hover: hover) and (pointer: fine) { a.list-card:hover { transform: translateY(-2px); } }
a.list-card:active { transform: var(--press, scale(.98)); }
.list-card h2 { margin: 0; font-size: 1.12em; font-family: var(--font-d); font-weight: var(--d-weight, 700); letter-spacing: var(--d-track, 0); text-transform: var(--d-case, none); }
.list-card p { margin: .2em 0 0; font-size: .86em; color: var(--muted-panel, var(--muted)); }
.list-card .meta { margin-top: .4em; font-size: .76em; color: var(--accent-text, var(--accent)); font-weight: 600; }
.list-card.soon { opacity: .6; }

/* Segmented code input, text field, select, label, stepper */
.segments { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); gap: calc(var(--u) * 8); }
.segments span {
  aspect-ratio: 1 / 1.1; display: grid; place-items: center;
  font-family: var(--font-code, var(--font-d)); font-size: calc(var(--u) * 30); font-weight: 700;
  background: var(--field); color: var(--field-fg, var(--fg)); border: var(--bw) solid var(--line); border-radius: var(--r-sm, calc(var(--r) * .6));
}
.segments span.cur { box-shadow: 0 0 0 2px var(--accent); }
.segments input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; font-size: 16px; cursor: text; }
.segments:focus-within span.cur { box-shadow: 0 0 0 3px var(--accent-text, var(--accent)); }
.field { min-height: 44px; width: 100%; display: flex; align-items: center; padding: 0 .9em; font: inherit; font-size: max(16px, 1em); background: var(--field); color: var(--field-fg, var(--fg)); border: var(--bw) solid var(--line); border-radius: var(--r-sm, calc(var(--r) * .6)); outline: none; }
.field::placeholder { color: var(--muted-panel, var(--muted)); opacity: .7; }
.field:focus { box-shadow: 0 0 0 2px var(--accent); }
textarea.field { min-height: 88px; padding: .7em .9em; resize: vertical; }
select.field { appearance: none; background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%); background-position: calc(100% - 18px) 50%, calc(100% - 13px) 50%; background-size: 5px 5px; background-repeat: no-repeat; }
.label { display: grid; gap: 6px; font-size: .86em; color: var(--muted-panel, var(--muted)); }
.stepper { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: .45em 0; }
.stepper .ctl { display: flex; align-items: center; gap: 10px; }
.stepper .ctl .btn { width: 40px; min-height: 40px; padding: 0; border-radius: var(--btn-r, 999px); }
.stepper .val { min-width: 3.4em; text-align: center; font-weight: 700; font-variant-numeric: tabular-nums; }

/* Hero number and QR frame */
.hero-number { font-family: var(--font-code, var(--font-d)); font-size: calc(var(--u) * 168); letter-spacing: var(--code-track, .08em); line-height: 1; margin: calc(var(--u) * 10) 0 calc(var(--u) * 24); font-weight: 800; }
.qr-wrap { display: inline-grid; padding: calc(var(--u) * 14); background: var(--qr-bg, #fff); border-radius: var(--r-sm, calc(var(--r) * .6)); border: var(--bw) solid var(--line); box-shadow: var(--shadow-sm, none); }
.qr { width: calc(var(--u) * 150); aspect-ratio: 1; color: var(--qr-fg, #111); }
.qr svg { width: 100%; height: 100%; display: block; }

/* Tiles (avatar rows) */
.tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: calc(var(--u) * 10); min-height: calc(var(--u) * 220); align-content: start; }
.tile {
  display: flex; align-items: center; gap: calc(var(--u) * 10); min-width: 0;
  padding: calc(var(--u) * 12) calc(var(--u) * 14); font-size: calc(var(--u) * 24); font-weight: 600;
  background: var(--tile, var(--field)); color: var(--tile-fg, var(--fg)); border: var(--bw) solid var(--line); border-radius: var(--r-sm, calc(var(--r) * .6));
}
.tile > span:nth-child(2) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.tile .avatar { width: calc(var(--u) * 30); height: calc(var(--u) * 30); border-radius: var(--av-r, 50%); background: var(--c); flex: none; display: grid; place-items: center; font-size: .6em; color: #fff; font-weight: 700; }
.tile .x { background: none; border: 0; color: inherit; opacity: .45; cursor: pointer; font-size: .8em; padding: 0 .2em; }
.tile.is-new { animation: pop 520ms var(--ease) both; }
.screen.mobile .tiles { grid-template-columns: 1fr; min-height: 0; }
.screen.mobile .tile { font-size: 1.05em; }

/* Big number / timer and message feed */
.timer { font-family: var(--font-timer, var(--font-d)); font-size: calc(var(--u) * 84); font-variant-numeric: tabular-nums; line-height: 1; letter-spacing: var(--timer-track, -.02em); }
.feed { display: grid; gap: calc(var(--u) * 10); min-height: calc(var(--u) * 190); align-content: start; max-width: calc(var(--u) * 900); }
.feed p { margin: 0; font-family: var(--font-narr, var(--font-d)); font-size: calc(var(--u) * 38); font-weight: var(--narr-weight, 500); line-height: 1.18; letter-spacing: var(--narr-track, -.01em); color: var(--fg); }
.feed p.is-old { opacity: .45; }
.feed p.is-new { animation: rise 600ms var(--ease) both; }

/* Feature card (the one key card on a screen) */
.feature-card { position: relative; text-align: center; padding: calc(var(--u) * 22) calc(var(--u) * 18); display: grid; gap: calc(var(--u) * 6); justify-items: center; background: var(--role-bg, var(--panel)); }
.feature-card .art { width: calc(var(--u) * 130); }
.feature-card .card-kicker { font-size: .72em; letter-spacing: .25em; text-transform: uppercase; color: var(--muted-panel, var(--muted)); margin-top: calc(var(--u) * 6); }
.feature-card h2 { font-size: calc(var(--u) * 40); }
.feature-card p { margin: 0; color: var(--muted-panel, var(--muted)); font-size: .92em; text-wrap: pretty; }

/* Selectable list options with live share bar */
.options { display: grid; gap: calc(var(--u) * 8); }
.option {
  position: relative; overflow: hidden; display: flex; justify-content: space-between; align-items: center; gap: 10px; width: 100%; text-align: left;
  min-height: calc(var(--u) * 54); padding: 0 calc(var(--u) * 16); font: inherit; font-size: 1.05em; font-weight: 600; cursor: pointer;
  background: var(--field); color: var(--field-fg, var(--fg)); border: var(--bw) solid var(--line); border-radius: var(--r-sm, calc(var(--r) * .6));
  transition: transform 150ms var(--ease-ui);
}
.option:active:not(:disabled) { transform: var(--press, scale(.98)); }
.option:disabled { cursor: default; }
.option .bar { position: absolute; inset: 0; transform-origin: left; transform: scaleX(var(--p, 0)); background: var(--bar, color-mix(in srgb, var(--accent) 22%, transparent)); transition: transform 500ms var(--ease); z-index: 0; }
.option > span { position: relative; z-index: 1; min-width: 0; }
.option .meta { font-size: .8em; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.option.is-selected { background: var(--accent); color: var(--accent-fg); border-color: var(--btn-line, var(--line)); }
.option.is-selected .meta { color: inherit; opacity: .8; }
.option.is-selected .bar { display: none; }

/* Inline message */
.msg { padding: .6em .8em; border-radius: var(--r-sm, 12px); background: var(--field); color: var(--field-fg, var(--fg)); border: var(--bw) solid var(--line); }
.msg b { color: var(--accent-text, var(--accent)); }

/* Result cards in a grid, with staggered entrance */
.result-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(calc(var(--u) * 150), 1fr)); gap: calc(var(--u) * 14); width: 100%; }
.result-card { position: relative; padding: calc(var(--u) * 16) calc(var(--u) * 10); display: grid; gap: calc(var(--u) * 6); justify-items: center; animation: rise 600ms var(--ease) both; }
.result-card .art { width: calc(var(--u) * 78); }
.result-card b { font-size: calc(var(--u) * 24); }
.result-card span { font-size: calc(var(--u) * 17); color: var(--muted-panel, var(--muted)); }
.result-card.is-out { opacity: .5; }
.result-card.is-out b { text-decoration: line-through; }
.result-card:nth-child(2) { animation-delay: 70ms; } .result-card:nth-child(3) { animation-delay: 140ms; } .result-card:nth-child(4) { animation-delay: 210ms; }
.result-card:nth-child(5) { animation-delay: 280ms; } .result-card:nth-child(6) { animation-delay: 350ms; } .result-card:nth-child(n+7) { animation-delay: 420ms; }

/* Shared keyframes: transform + opacity only */
.animate-rise { animation: rise 600ms var(--ease) both; }

@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes pop { 0% { opacity: 0; transform: scale(.6); } 60% { opacity: 1; transform: scale(1.06); } 100% { transform: none; } }
@keyframes blink { 50% { opacity: 0; } }
@keyframes float { 50% { transform: translateY(-6%); } }
@keyframes drift1 { 50% { transform: translate(18%, 10%) scale(1.15); } }
@keyframes drift2 { 50% { transform: translate(-16%, -12%) scale(.9); } }
@keyframes drift3 { 50% { transform: translate(10%, -16%) scale(1.1); } }

/* Lite mode, reduced motion, reduced transparency */
html.lite *, html.lite *::before, html.lite *::after { animation: none !important; transition: none !important; }
html.lite .blob, html.lite .rain, html.lite .floor, html.lite .petals, html.lite .spot, html.lite .ticker, html.lite .ground::before, html.lite .ground::after { display: none !important; }
@media (prefers-reduced-motion: reduce) { .screen *, .screen *::before, .screen *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; } }
```

### 1.7 Component recipes

Each recipe gives the markup, the tokens it reads and the states it supports. Per-style looks are described in each style's "Components" subsection.

#### Surface / panel

```html
<div class="panel" data-label="PLAYERS" data-title="Players">…</div>
```

- Reads `--panel`, `--panel-fg`, `--bw`, `--line`, `--r`, `--shadow`; `.panel .muted` uses `--muted-panel`. Padding is `1em`.
- `data-label` is shown by ASCII Terminal as `┤ LABEL ├` and by Blueprint as `FIG. n · LABEL` (with `data-fig="n"`). `data-title` is shown by Desktop 98 as the window title bar. Set both on every labelled panel, even if your style ignores them.
- Several styles add a pseudo-element: washi tape (Paper Sketch `::before`), fleuron (Storybook `::after`), title bar and close box (Desktop 98 `::before`/`::after`), corner ticks (Blueprint `::after`). Keep `::before`/`::after` free on panels.

#### Buttons: primary and ghost

```html
<button class="btn">Start</button>
<button class="btn ghost">Back</button>
<button class="btn wide">Full width</button>
<button class="btn sm">Small</button>
```

| State | Rule |
| --- | --- |
| Rest | `background: var(--accent); color: var(--accent-fg); border: var(--bw) solid var(--btn-line); border-radius: var(--btn-r); box-shadow: var(--btn-shadow)`. Font `--font-btn`, `--btn-weight`, `--btn-track`, `--btn-case`. |
| Ghost | `background: var(--ghost-bg, transparent); color: var(--ghost-fg, var(--fg))`. Styles set these two tokens on `.btn.ghost`. |
| Hover | None in the base. Styles that add one wrap it in `@media (hover: hover)` (ASCII Terminal, Blueprint) so touch devices never see a stuck hover. |
| Press (`:active:not(:disabled)`) | `transform: var(--press)`, `box-shadow: var(--btn-shadow-press)`, `transition-duration: 90ms`. Hard-shadow styles set `--press: translate(Xpx, Ypx)` equal to the shadow offset and `--btn-shadow-press: 0 0 0 <ink>`, so the button "slams" into its shadow. |
| Disabled | `opacity: .5; cursor: not-allowed`. |
| Focus | `:focus-visible { outline: 2px solid var(--accent-text, var(--accent)); outline-offset: 2px; }` |
| Sizes | Height `max(44px, 2.6em)`, padding `0 1.2em`. `.sm`: `min-height: 36px; padding: 0 .8em; font-size: .82em`. `.wide`: `width: 100%`. |

The transition is `transform 150ms, box-shadow 150ms, background-color 150ms, color 150ms, opacity 150ms`, all on `--ease-ui`.

#### Chip / badge

```html
<span class="chip">3 online</span>
<span class="chip is-off">Away</span>   <!-- .45 opacity + strike-through (ASCII: "x " prefix instead) -->
<span class="chip is-ok">Ready</span>   <!-- appends ✓ in --accent-text -->
```

Reads `--chip-bg`, `--chip-fg`, `--chip-r`, `--chip-bw` (border colour is `--line`). Padding `.3em .8em`, weight 500, no wrapping.

#### Selectable list option with live share bar

```html
<div class="options">
  <button type="button" class="option is-selected" aria-pressed="true" style="--p:0.400">
    <i class="bar"></i>
    <span>Option label</span>
    <span class="meta">2 votes</span>
  </button>
  <button type="button" class="option" aria-pressed="false" style="--p:0.200">…</button>
</div>
```

- Rest: `background: var(--field); color: var(--field-fg); border: var(--bw) solid var(--line); border-radius: var(--r-sm)`; min height 54 design px; weight 600; `font-size: 1.05em`.
- Share bar: `.bar` covers the option and is drawn with `transform: scaleX(var(--p))` from the left, `background: var(--bar)`, `transition: transform 500ms var(--ease)`. Updating `--p` animates the bar without layout.
- Selected: `background: var(--accent); color: var(--accent-fg); border-color: var(--btn-line)`. The bar is hidden and `.meta` inherits the text colour at `.8` opacity. Most styles override the selected colours (see each style).
- Press: `transform: var(--press, scale(.98))`. Use `aria-pressed` for the selected state; disable the button when picking is closed.

#### Text input and segmented input

```html
<label class="label">Your name <input class="field" autocomplete="off"></label>
<textarea class="field"></textarea>
<select class="field">…</select>

<label class="segments">                 <!-- 4 visible boxes over one transparent real input -->
  <span>A</span><span>B</span><span class="cur"></span><span></span>
  <input aria-label="Code" autocapitalize="characters" autocomplete="off" spellcheck="false">
</label>
```

- `.field`: `min-height: 44px; font-size: max(16px, 1em)` (16px stops iOS zooming on focus), `--field`/`--field-fg`, `--r-sm`. Focus draws `box-shadow: 0 0 0 2px var(--accent)`. Placeholder uses `--muted-panel` at `.7` opacity. `select.field` draws its arrow with two gradients.
- `.segments`: the real input covers the boxes at `opacity: 0`, so mobile keyboards, paste and autofill work normally. Script fills the spans and puts `.cur` on the next empty box (`box-shadow: 0 0 0 2px var(--accent)`, 3px `--accent-text` while focused). Boxes use `--font-code`, 30 design px, weight 700, aspect ratio 1/1.1.

#### Display heading, eyebrow and hero number

```html
<div class="eyebrow">Section kicker</div>
<h1 class="display"><span class="hl">Key words</span> in a headline</h1>
<div class="hero-number display" aria-label="Code MOON"><span>M</span><span>O</span><span>O</span><span>N</span></div>
```

- `.display`: `--font-d`, `--d-weight`, `--d-track`, `--d-case`, `--d-lh`, `margin: 0`, `text-wrap: balance`.
- `.eyebrow`: uppercase, `.62em`, weight 600, `letter-spacing: var(--eyebrow-track, .22em)`, colour `--muted`. Several styles restyle it as a tag or recolour it.
- `.hero-number`: `--font-code`, 168 design px, weight 800, `letter-spacing: var(--code-track)`, `line-height: 1`. Wrap each character in a `<span>` (Paper Sketch rotates alternate letters) and put the readable value in `aria-label`.
- `.hl`: highlighted words. Paper Sketch draws a marker stroke behind them, Black & Gold draws a gold underline bar under `.headline .hl`, and Game Show puts a light-bulb marquee around `.headline .hl`.

#### Big number / timer

```html
<span class="timer">1:05</span>     <span class="timer-sm">0:42</span>
```

`--font-timer`, 84 design px on large displays, `font-variant-numeric: tabular-nums` (digits do not jiggle), `letter-spacing: var(--timer-track)`, `line-height: 1`. In the reference, timers show `m:ss` and update every 250ms from a server-corrected clock. `.timer-sm` is `1.4em` with tabular numerals.

#### Message feed (newest and older lines)

```html
<div class="feed" aria-live="polite">
  <p class="is-old">Older line</p>
  <p class="is-old">Older line</p>
  <p class="is-new">Newest line</p>
</div>
```

- Lines use `--font-narr`, 38 design px on large displays, `--narr-weight`, `--narr-track`, `line-height: 1.18`. Older lines are `.45` opacity; the newest runs `rise 600ms var(--ease) both`.
- The reference reveals one new line every 2400ms and keeps the last three. The newest line is always the last child, which Comic Pop relies on for its speech-bubble tail (`p:last-child::after`).
- Per-style treatments: speech bubbles (Comic Pop, Tide Pool), boxed headline (Neo-Brutalist, newest only), `> ` prompt plus typewriter (ASCII Terminal), tooltip boxes (Desktop 98), italic-then-headline (The Daily Village), italic plus drop cap (Storybook).

#### Toast

```html
<p role="alert" class="toast">Something went wrong.</p>
```

`background: var(--danger-bg, rgba(255,69,58,.14)); color: var(--danger, #ff453a)`, radius `--r-sm` (fallback 12px), centred, `.9em`, `rise 300ms`. No style sets the danger tokens, so the toast is the same in all 18 styles.

#### Image "art" slot

```html
<div class="art" aria-hidden="true">
  <img src="/art/wolf.webp" width="192" height="192" alt="" loading="lazy" decoding="async">
  <img class="pix" src="/art/pixel/wolf.png" width="24" height="24" alt="" loading="lazy" decoding="async">
  <pre class="ascii">…</pre>  <!-- render only while the ASCII style is active -->
</div>
```

One art set in three renderings. The base shows the HD image and hides `.pix` and `pre`. Pixel Retro and Desktop 98 show `.pix` with `image-rendering: pixelated`; ASCII Terminal shows `pre`. Lazy images inside a `display: none` subtree are not fetched, so only the visible variant downloads. The reference renders the `<pre>` only when the ASCII style is active, which keeps the ASCII strings (about 5.5 KB for the whole set) out of the DOM in the other 17 styles. See §1.14.

#### Tiles (avatar rows)

```html
<div class="tiles">
  <div class="tile is-new" style="--c:#ff6b6b">
    <span class="avatar">D</span><span>Dana</span>
    <button class="x" aria-label="Remove Dana">✕</button>
  </div>
</div>
```

Two columns on large displays, one on mobile. `--tile`/`--tile-fg`, `--r-sm`, 24 design px, weight 600. The avatar is a 30 design-px disc in `var(--c)` with a white initial. `.is-new` plays `pop 520ms var(--ease)`; animate only tiles added since the last render.

#### List card, feature card, result card

```html
<a class="panel list-card" href="/x" data-title="Name.exe" data-label="NAME">
  <div class="art">…</div>
  <div><h2>Title</h2><p>Description</p><div class="meta">2–8 people →</div></div>
</a>

<div class="card-scene">                      <!-- Tabletop needs this parent for perspective -->
  <div class="panel feature-card">
    <div class="art">…</div>
    <div class="card-kicker">You are</div>
    <h2 class="display">The key fact</h2>
    <p>Supporting sentence.</p>
    <i class="deco card-back"></i>            <!-- Tabletop card back; hidden elsewhere -->
  </div>
</div>

<div class="result-grid">
  <div class="panel result-card"><div class="art">…</div><b>Name</b><span>Detail</span></div>
  <div class="panel result-card is-out"><div class="art">…</div><b>Name</b><span>Detail</span></div>
</div>
```

- List card: a 64 design-px art column (76px on `.page`) plus text; on pointer devices, hover lifts it `translateY(-2px)`, and press uses `--press`.
- Feature card: centred, `background: var(--role-bg, var(--panel))`, 130 design-px art, 40 design-px heading. Styles stamp it (Sakura hanko, Noir "CLASSIFIED", Tabletop corner index) or flip it (Tabletop deal).
- Result card: staggered `rise` (70ms steps up to 420ms). `.is-out` is `.5` opacity with a struck-through name; Noir and Sakura add a rubber stamp.

#### Stepper

```html
<div class="stepper"><span>Rounds</span>
  <div class="ctl"><button class="btn ghost" aria-label="Decrease Rounds">−</button><span class="val">5</span><button class="btn ghost" aria-label="Increase Rounds">+</button></div>
</div>
```

The −/+ buttons are 40×40 ghost buttons; the value uses tabular numerals.

### 1.8 Type scale used in the reference

Sizes are design pixels (multiply by `--u`) unless given in `em`. These are the reference app's layout sizes, listed so a new site can keep the same proportions. Per-style overrides are in each style section.

| Element | Size | Notes |
| --- | --- | --- |
| Screen root text | 22 (large), 15 (mobile), 16 (page) | `line-height: 1.35` |
| Hero number | 168 | ASCII 200, Paper 190, Pixel 110 |
| Headline (finale screen) | 92 | Pixel 54 |
| Timer | 84 | Pixel 60 |
| Feed line | 38 | ASCII 30, Desktop 98 30, Pixel 34, Blueprint 34, Storybook 40, Paper 46; Daily Village older 26 / newest 46 |
| Home page title | 46; on `.page`: `clamp(44px, 7vw, 76px)` | Pixel 26 |
| Page-hero title | 40 | Pixel 20 |
| Feature-card heading | 40 | Pixel 20 |
| Notice heading | 34 | |
| Choice-screen heading | 32 | Pixel 17 |
| Roster heading | 32 | Pixel 22 |
| Segment box | 30 | |
| Tile text | 24 (large), `1.05em` (mobile) | |
| Eyebrow | `.62em` | 18 on the large-display split screen |
| List card | title `1.12em`, text `.86em`, meta `.76em` | Pixel title `.7em` |
| Button | `1em`; `.sm` `.82em` | Pixel `.78em` |

### 1.9 Motion

**Rules**

- Animate only `transform` and `opacity`. Every ambient decoration in all 18 styles follows this. The reference has three deliberate exceptions, all short and triggered by an interaction: button transitions also cover `box-shadow`, `background-color` and `color` (150ms); ASCII Terminal's typewriter animates `clip-path` (one run of 900ms); the style-switch reveal animates `clip-path` on the view-transition pseudo-element (520ms).
- Use `--ease` (`cubic-bezier(.22,1,.36,1)`) for entrances and `--ease-ui` (`cubic-bezier(.2,.8,.2,1)`) for hover and press.
- Hover effects only under `@media (hover: hover)` (or `(hover: hover) and (pointer: fine)`), so touch screens never show a stuck hover.
- Never animate a blurred or filtered element's size or position (see Liquid Glass). Move what is behind it instead.
- Respect `prefers-reduced-motion` and lite mode (§1.12).

**Durations in the source**

| Interaction | Duration and easing |
| --- | --- |
| Hover / UI transitions (buttons, options, list cards, picker swatches) | 150ms `--ease-ui` |
| Press (`:active`) | 90ms (set with `transition-duration`) |
| Claymation release spring | `transform 420ms cubic-bezier(.34,1.56,.64,1)` |
| Toast entrance | `rise 300ms --ease` |
| Option share-bar fill | `transform 500ms --ease` |
| Tile pop-in | `pop 520ms --ease` |
| Feed line / result card / generic entrance | `rise 600ms --ease`, result cards staggered by 70ms up to 420ms |
| Style-switch circle reveal | 520ms `cubic-bezier(.22,1,.36,1)` |
| Picker sheet in / backdrop fade | `sheetin 260ms --ease` / `fadein 160ms ease` |

The designer's guidance also names a 200ms panel transition and exits at about 65% of the matching entrance (a 600ms entrance gets about a 390ms exit). Neither is defined in the source: the reference has no 200ms transition and no exit animations. Use those numbers if you add panel open/close or exit motion.

**Keyframe inventory**

| Keyframes | What it does | Timing | Used by |
| --- | --- | --- | --- |
| `rise` | `opacity 0, translateY(14px)` → `opacity 1, none` | 600ms / 300ms `--ease` `both` | Base (feed, result cards, toast) |
| `pop` | `scale(.6)` → `1.06` at 60% → `none`, fading in | 520ms `--ease` | Base (new tiles) |
| `spin` | `rotate(360deg)` | 800ms linear infinite | Base spinner |
| `blink` | `opacity: 0` at 50% | 1s `steps(1)` infinite | ASCII cursor, ASCII picker swatch |
| `float` | `translateY(-6%)` at 50% | 6s / 5s / 3.4s ease-in-out | Liquid Glass hero art, Paper Sketch hero art, Tide Pool art |
| `drift1` / `drift2` / `drift3` | `translate(18%, 10%) scale(1.15)` / `translate(-16%, -12%) scale(.9)` / `translate(10%, -16%) scale(1.1)` at 50% | 15–22s ease-in-out | Liquid Glass and Claymation blobs |
| `powpulse` | `rotate(-8deg) scale(1)` ↔ `rotate(-4deg) scale(1.08)` | 1.6s `--ease` | Comic Pop POW |
| `type` | `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` | 900ms `steps(28)` | ASCII typewriter |
| `grid` | `rotateX(62deg)` → `rotateX(62deg) translateY(64px)` | 1.6s linear | Neon grid floor |
| `flicker` | opacity 1, dips to .35 at 93% and .5 at 96% | 5s / 9s `steps(1)` | Neon eyebrow, Noir blinds |
| `bob` | `translateY(-6%)` at 50% | 1s `steps(2)` | Pixel sprites |
| `cloud` | `translateX(calc(var(--u) * 300))` | 40s / 55s `steps(80)` | Pixel clouds |
| `tick` | `translateX(-50%)` | 14s linear | Neo-Brutalist ticker |
| `squish` | `scale(1.05, .95)` at 50% | 2.6s ease-in-out | Claymation art |
| `fall` | translate down 960 design px with sideways drift, 420° spin | 9–16.5s linear | Sakura petals |
| `bubble` | rise 960 design px with ±14 px wobble | 9–16.5s linear | Tide Pool bubbles |
| `kelp` | `rotate(-7deg)` ↔ `rotate(7deg)` | 4s / 5.2s ease-in-out | Tide Pool kelp |
| `sway1` / `sway2` | `rotate(-14deg)`↔`rotate(6deg)` / `rotate(14deg)`↔`rotate(-6deg)` | 7–11s ease-in-out | Game Show spotlights, Tide Pool light rays |
| `chase` | `opacity: 0` at 50% | .5s `steps(1)` | Game Show marquee bulbs |
| `deal` | `rotateY(180deg) translateY(-6%)` → `rotateY(0)` at 14%, then hold | 7s `--ease` infinite | Tabletop feature card |

### 1.10 Dark / alternate palette

**Mechanism.** Add `.is-dark` to the page root (`.screen`). The style then redefines tokens on `[data-style="x"] .screen.is-dark` and restyles decorations under `[data-style="x"] .screen.is-dark .something`. Components do not change. In the reference, dark screens were used for "night" phases; on another site, use it for a dark mode, a focus mode or a contrasting section.

```css
[data-style="paper"] .screen.is-dark { --fg: #f4f1e6; --panel: #23304f; /* ... */ }
[data-style="paper"] .screen.is-dark .bg-layer { background-color: #1c2640; /* ... */ }
```

To follow the operating system, toggle the class from `matchMedia("(prefers-color-scheme: dark)")`. The reference does not do this: dark screens are chosen per page.

**What each style changes**

| Style | Dark variant |
| --- | --- |
| Liquid Glass | Background gradient only. |
| Comic Pop | `--fg`, `--muted`; navy halftone; yellow display text and timer. |
| Neo-Brutalist | `--bg`, `--fg`, `--muted`; lime eyebrow tag; lime timer. |
| Tide Pool | `--fg`, `--muted`; deep-sea gradient; rays hidden; glowing bubbles; dark sand. |
| Claymation | Most surface tokens plus `--clay`; lilac/indigo background. |
| ASCII Terminal | Not defined in source (already dark). |
| Desktop 98 | Not defined in source. |
| Neon Arcade | Sun becomes a blue moon; tokens unchanged. |
| Pixel Retro | `--fg`, `--muted`; navy sky with stars; dark ground; clouds hidden. |
| Paper Sketch | All text and surface tokens; dark-blue paper; ghost buttons fixed. |
| Sakura | All main tokens; indigo; pink accent; fainter kanji and petals. |
| Noir | Not defined in source (already dark). |
| Storybook | `--fg`, `--muted`, `--accent-text`; candlelit purple vignette. Panels stay parchment. |
| The Daily Village | Not defined in source. |
| Game Show | Background only. |
| Tabletop | Felt colour only. |
| Blueprint | `--bg` only. |
| Black & Gold | All main tokens; pure black with gold. |

**Rules learned the hard way**

1. **Declare dark tokens on the screen element**, the same element that defines `--u` (§1.4).
2. **Re-declare composite tokens.** A token that references another token (`--shadow: var(--clay)`) is resolved where it is declared. If you override the referenced token on `.screen.is-dark`, re-declare the composite on `.screen` too (Claymation does this).
3. **When `--fg` flips light, every surface that keeps a light fill needs its own explicit text token.** Set `--panel-fg`, `--field-fg`, `--tile-fg`, `--chip-fg`, `--ghost-fg` and the selected-option colours explicitly, so they do not inherit the new light `--fg`. Comic Pop, Neo-Brutalist, Tide Pool, Pixel Retro and Storybook set them all, which is why their panels stay readable at night.
4. **The Paper Sketch white-on-white bug.** Paper Sketch once left `--field-fg` and the ghost colours unset. In the dark palette fields and ghost buttons then rendered light text on light paper. The fix, now in the source, sets the dark `--panel-fg`, `--field-fg` and `--tile-fg` and adds `.screen.is-dark .btn.ghost { --ghost-bg: transparent; --ghost-fg: #f4f1e6; }`.
5. **Traps still in the source** (found while writing this spec; each style section repeats them with a suggested fix):
   - Paper Sketch dark: the selected option uses `color: var(--fg)`, which becomes cream on the yellow fill (1.2:1).
   - Sakura dark: ghost buttons keep `--ghost-fg: #1d1d1f` on the `#14172b` page (1.1:1).
   - Claymation dark: tiles keep their light pastel fills, but `--tile-fg` is unset, so their text follows the dark-palette `--fg` (`#fff4f8`). Tiles only appear on light screens in the reference.
   - Storybook dark and Tabletop: `--accent-text` is a gold meant for dark backgrounds, but it is also used inside light parchment or cream panels (list-card meta, bold words in messages, ✓ marks, focus ring), at about 1.3–1.4:1.
   - Black & Gold dark: black ghost buttons sit on a pure-black page, so the button shape disappears (the gold label is still readable).

### 1.11 Switching styles

#### Pre-paint script (no flash of the wrong style)

Inline this in `<head>` before any stylesheet that depends on `data-style`. It reads the saved style, falls back to the default, sets the lite class for low-memory devices, and starts the style's font request at the same time. The reference generates it from the style registry (`prePaintScript()` in `src/themes/registry.ts`); this is the same logic, formatted for reading:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<script>
(function () {
  try {
    var d = document.documentElement;
    var F = { /* style id -> Google Fonts css2 URL (null for system-font styles); see the table below */ };
    var s = localStorage.getItem("lp-style");
    if (!F.hasOwnProperty(s)) s = "minimal";               // default style
    d.dataset.style = s;
    var l = localStorage.getItem("lp-lite");
    if (l === "1" || (l === null && navigator.deviceMemory && navigator.deviceMemory <= 2)) d.classList.add("lite");
    if (F[s]) {
      var k = document.createElement("link");
      k.rel = "stylesheet"; k.href = F[s]; k.dataset.lpFont = s;
      document.head.appendChild(k);
    }
  } catch (e) {
    document.documentElement.dataset.style = "minimal";
  }
})();
</script>
```

In React or Next.js, add `suppressHydrationWarning` to `<html>`, because the script changes `data-style` before hydration. The reference's localStorage keys are `lp-style` (chosen style id), `lp-style-room` (`"own"` when a device opts out of a shared style) and `lp-lite` (`"1"` on, `"0"` off, absent means automatic). Use your own prefix.

#### Fonts: one request per style, fetched only for the active style

Each style needs one Google Fonts `css2` URL, built as `https://fonts.googleapis.com/css2?family=A&family=B&display=swap`. Request it only when the style becomes active. Fonts of styles used earlier in the session stay loaded.

| Style id | Google Fonts URL |
| --- | --- |
| `glass` | `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap` |
| `comic` | `https://fonts.googleapis.com/css2?family=Bangers&family=Geist:wght@400;600;700&display=swap` |
| `brutal` | `https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;600;800&display=swap` |
| `tide` | `https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Archivo:wght@400;600;800&display=swap` |
| `clay` | `https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=swap` |
| `ascii` | `https://fonts.googleapis.com/css2?family=VT323&family=JetBrains+Mono:wght@400;700&display=swap` |
| `win98` | `https://fonts.googleapis.com/css2?family=VT323&display=swap` |
| `neon` | `https://fonts.googleapis.com/css2?family=Audiowide&family=Chakra+Petch:wght@400;600&display=swap` |
| `pixel` | `https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Pixelify+Sans:wght@400;600&display=swap` |
| `paper` | `https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Kalam:wght@400;700&display=swap` |
| `sakura` | `https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600;700&family=Zen+Kaku+Gothic+New:wght@400;500&display=swap` |
| `noir` | `https://fonts.googleapis.com/css2?family=Limelight&family=Special+Elite&display=swap` |
| `story` | `https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Cinzel:wght@600;700&family=IM+Fell+English:ital@0;1&display=swap` |
| `news` | `https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&display=swap` |
| `show` | `https://fonts.googleapis.com/css2?family=Bungee&family=Rubik:wght@400;500;700&display=swap` |
| `table` | `https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Alegreya:wght@400;700&display=swap` |
| `blueprint` | `https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Architects+Daughter&display=swap` |
| `minimal` | `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap` |

Liquid Glass lists the Apple system font first and loads Geist as the fallback for other platforms. Desktop 98 uses system Tahoma/Verdana and loads only VT323 for its LCD numbers.

#### Runtime switch with a circle reveal

```js
function ensureFonts(id) {
  const href = FONTS[id];                                   // same map as the pre-paint script
  if (!href || document.head.querySelector(`link[data-lp-font="${id}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet"; link.href = href; link.dataset.lpFont = id;
  document.head.appendChild(link);
}

function applyStyle(id) {
  ensureFonts(id);
  document.documentElement.dataset.style = id;
}

/** Run a style change inside a View Transition: a circle grows from the tap point. */
function withTransition(change, from) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("lite");
  if (!document.startViewTransition || reduce) return change();
  const x = from?.x ?? innerWidth / 2;
  const y = from?.y ?? innerHeight / 2;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const t = document.startViewTransition(change);
  t.ready.then(() =>
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 520, easing: "cubic-bezier(.22,1,.36,1)", pseudoElement: "::view-transition-new(root)" },
    ),
  ).catch(() => {});
}

// In a click handler:
button.addEventListener("click", (e) => {
  localStorage.setItem("lp-style", id);
  withTransition(() => applyStyle(id), { x: e.clientX, y: e.clientY });
});
```

Pair it with the CSS from §1.6 that turns off the default cross-fade (`::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }`). Browsers without View Transitions, users who prefer reduced motion and lite mode all get an instant switch.

#### Personal style versus an imposed (shared) style

The reference has two sources of truth. One is the device's **personal** style. The other is a **shared** style chosen by an owner, which in the reference is the host of a room. The effective style is:

```js
effective = shared && isValid(shared.style) && (shared.isOwner || mode === "follow")
  ? shared.style
  : personal;
```

The owner's display always shows the shared style. Followers show it unless they pick their own, which sets `mode = "own"`; a "Match the host" button sets `mode` back to `"follow"`. The same pattern suits a presenter driving viewers' screens, a shared dashboard, or a team workspace theme. The store is a tiny external store, not a framework context, because a style change only touches `<html data-style>` and nothing needs to re-render.

#### The style picker

The picker is deliberately neutral (a dark sheet with system fonts), so it reads the same on all 18 styles. Each swatch is a dot plus the style's name, and the name is drawn in that style's own display font. To avoid downloading 15 full fonts just to show the picker, it requests a single subset with the Google Fonts `text=` parameter, which contains only the characters used in the style names:

```text
https://fonts.googleapis.com/css2?family=Bangers&family=Archivo+Black&family=Luckiest+Guy&family=Fredoka:wght@600&family=VT323&family=Audiowide&family=Press+Start+2P&family=Caveat:wght@700&family=Shippori+Mincho:wght@600&family=Limelight&family=Cinzel+Decorative:wght@700&family=UnifrakturMaguntia&family=Bungee&family=Cinzel:wght@700&family=Share+Tech+Mono&display=swap&text=Liqud%20GlasComcPpNe-BrtTynASIDk98xRhbVgw%26
```

The `text` value is the de-duplicated set of characters from all 18 names. The link is added the first time the picker opens. Picker and swatch CSS, verbatim from the reference:

```css
.style-fab {
  position: fixed; z-index: 40; right: max(14px, env(safe-area-inset-right, 0px)); bottom: max(14px, env(safe-area-inset-bottom, 0px));
  height: 40px; padding: 0 14px 0 10px; border-radius: 999px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
  font: 600 13px/1 -apple-system, "Geist", system-ui, sans-serif; color: #eceae4; background: rgba(16,17,22,.82);
  border: 1px solid rgba(255,255,255,.12); box-shadow: 0 10px 30px -10px rgba(0,0,0,.6);
  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  transition: transform 150ms var(--ease-ui);
}
.style-fab:active { transform: scale(.96); }
.style-fab i { width: 18px; height: 18px; border-radius: 50%; background: conic-gradient(#ff6b6b, #ffd93d, #2ee59d, #4dabf7, #b197fc, #ff6b6b); }
.sheet-backdrop { position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,.45); animation: fadein 160ms ease both; }
.sheet {
  position: fixed; z-index: 51; left: 50%; bottom: 0; width: min(100%, 640px); transform: translateX(-50%);
  max-height: min(78dvh, 640px); overflow: auto; overscroll-behavior: contain;
  padding: 18px max(18px, env(safe-area-inset-right, 0px)) max(22px, env(safe-area-inset-bottom, 0px)) max(18px, env(safe-area-inset-left, 0px));
  background: #121318; color: #eceae4; border: 1px solid #262832; border-bottom: 0; border-radius: 22px 22px 0 0;
  font: 14px/1.4 -apple-system, "Geist", system-ui, sans-serif; animation: sheetin 260ms var(--ease) both;
  box-shadow: 0 -20px 60px -20px rgba(0,0,0,.7);
}
@media (min-width: 700px) { .sheet { bottom: auto; top: 50%; transform: translate(-50%, -50%); border-radius: 22px; border-bottom: 1px solid #262832; animation-name: fadein; } }
@keyframes sheetin { from { transform: translate(-50%, 24px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
@keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
.sheet h2 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -.01em; }
.sheet p { margin: 4px 0 0; color: #8d8f99; }
.sheet-head { display: flex; justify-content: space-between; align-items: start; gap: 12px; margin-bottom: 14px; }
.sheet-x { background: #1d1e25; border: 1px solid #2a2c35; color: #eceae4; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; flex: none; }
.sw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.sw {
  height: 44px; padding: 0 12px; border-radius: 12px; cursor: pointer; text-align: left;
  border: 1px solid #262832; background: #16171d; color: #eceae4;
  display: flex; align-items: center; gap: 9px; white-space: nowrap; overflow: hidden;
  font: 600 13px/1 -apple-system, "Geist", system-ui, sans-serif;
  transition: transform 150ms var(--ease-ui), border-color 150ms var(--ease-ui);
}
.sw:active { transform: scale(.97); }
.sw[aria-pressed="true"] { border-color: #ffd23f; background: #1d1c16; }
.sw i { width: 14px; height: 14px; border-radius: 50%; flex: none; }
.sheet-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; margin-top: 16px; padding-top: 14px; border-top: 1px solid #262832; }
.sheet-row .note { color: #8d8f99; font-size: 13px; }
.tog { height: 38px; padding: 0 14px; border-radius: 10px; border: 1px solid #2a2c35; background: #16171d; color: #c9cad1; cursor: pointer; font: 600 13px/1 -apple-system, "Geist", system-ui, sans-serif; }
.tog[aria-pressed="true"] { color: #121318; background: #ffd23f; border-color: #ffd23f; }
.sw-brutal i { background: #ff5c00; border: 2px solid #000; border-radius: 0; box-shadow: 2px 2px 0 #c6ff00; }
.sw-brutal b { font-family: "Archivo Black", sans-serif; font-weight: 400; text-transform: uppercase; font-size: 12px; }
.sw-win98 i { background: linear-gradient(90deg, #000080, #1084d0); border-radius: 0; box-shadow: inset -1px -1px #0a0a0a, inset 1px 1px #fff; }
.sw-win98 b { font-family: Tahoma, Verdana, sans-serif; font-weight: 700; font-size: 12px; }
.sw-news i { background: #f3eee1; border-radius: 0; border-top: 3px double #111; }
.sw-news b { font-family: "UnifrakturMaguntia", serif; font-weight: 400; font-size: 17px; }
.sw-blueprint i { background: #174a8b; border: 1px solid #eaf2ff; border-radius: 0; }
.sw-blueprint b { font-family: "Share Tech Mono", monospace; font-weight: 400; text-transform: uppercase; letter-spacing: .06em; color: #a9c4ea; }
.sw-clay i { background: #ff8fab; box-shadow: inset -2px -2px 3px rgba(0,0,0,.2), inset 2px 2px 3px rgba(255,255,255,.6); }
.sw-clay b { font-family: "Fredoka", sans-serif; font-weight: 600; }
.sw-sakura i { background: #f4a7b9; border-radius: 150% 0 150% 0; }
.sw-sakura b { font-family: "Shippori Mincho", serif; font-weight: 600; letter-spacing: .04em; }
.sw-noir i { background: #c1121f; border-radius: 0; width: 6px; }
.sw-noir b { font-family: "Limelight", serif; font-weight: 400; }
.sw-story i { background: #7a1f1f; border-radius: 2px; box-shadow: 0 0 0 2px #efe0bd; }
.sw-story b { font-family: "Cinzel Decorative", serif; font-weight: 700; font-size: 12.5px; color: #f1e3c2; }
.sw-show i { background: radial-gradient(circle, #fff7d6 30%, #ffd166 60%); box-shadow: 0 0 8px #ffd166; }
.sw-show b { font-family: "Bungee", sans-serif; font-weight: 400; font-size: 12px; color: #ffd166; }
.sw-table i { background: #0f5132; box-shadow: 0 0 0 2px #6b3f1d; }
.sw-table b { font-family: "Cinzel", serif; font-weight: 700; letter-spacing: .04em; }
.sw-tide i { background: radial-gradient(circle at 35% 30%, #fff 0 18%, #1fb6ff 22%); border: 2px solid #062a4d; }
.sw-tide b { font-family: "Luckiest Guy", sans-serif; font-weight: 400; letter-spacing: .04em; color: #ffd23f; }
.sw-minimal i { background: #cfb991; box-shadow: 0 0 0 2px #000, 0 0 0 3px #cfb991; }
.sw-glass i { background: conic-gradient(from 200deg, #7ad7ff, #b69cff, #ff9ad5, #7ad7ff); }
.sw-glass b { font-family: -apple-system, "SF Pro Display", "Geist", sans-serif; font-weight: 600; }
.sw-comic i { background: #ffd93d; border: 2px solid #000; border-radius: 3px; box-shadow: 2px 2px 0 #ff6b6b; }
.sw-comic b { font-family: "Bangers", Impact, sans-serif; font-weight: 400; letter-spacing: .06em; font-size: 16px; }
.sw-ascii i { background: #33ff00; border-radius: 0; width: 8px; animation: blink 1s steps(1) infinite; }
.sw-ascii b { font-family: "VT323", monospace; font-weight: 400; font-size: 19px; color: #33ff00; }
.sw-neon i { background: #ff3cac; box-shadow: 0 0 8px #ff3cac, 0 0 2px #fff inset; }
.sw-neon b { font-family: "Audiowide", sans-serif; font-weight: 400; font-size: 13px; color: #9ff3ff; }
.sw-pixel i { background: #ff004d; border-radius: 0; box-shadow: 3px 0 0 #ffec27, 0 3px 0 #29adff; width: 10px; height: 10px; }
.sw-pixel b { font-family: "Press Start 2P", monospace; font-weight: 400; font-size: 9px; }
.sw-paper i { background: #ffe066; border-radius: 40% 60% 55% 45% / 50% 40% 60% 50%; border: 1.5px solid #fff; }
.sw-paper b { font-family: "Caveat", cursive; font-weight: 700; font-size: 20px; }
.sw-minimal b { font-weight: 600; }
```

### 1.12 Reduced motion, reduced transparency and lite mode

| Mode | Trigger | Effect |
| --- | --- | --- |
| `prefers-reduced-motion: reduce` | OS setting | Every animation and transition inside `.screen` (and, globally, on `*`) is shortened to 1ms with one iteration. The style switch skips the View Transition. ASCII rain never starts. |
| `prefers-reduced-transparency: reduce` | OS setting | Liquid Glass panels drop `backdrop-filter` and become `rgba(30,38,80,.92)`. Only `.panel` is covered in the source; fields, tiles, options, chips and ghost buttons stay frosted. Extend the selector if you need full coverage (recommendation, not in source). |
| `html.lite` ("Reduce effects") | User toggle (saved as `lp-lite`), or automatically when `navigator.deviceMemory <= 2` and the user has not chosen | `animation: none !important; transition: none !important` on everything. Hides `.blob`, `.rain`, `.floor`, `.petals`, `.spot`, `.ticker` and the kelp (`.ground::before/::after`). Liquid Glass surfaces drop the blur and become `rgba(30,38,80,.72)`. The style switch skips the View Transition. |

Lite mode does not hide `.cloud`, `.blinds`, `.sun`, `.stripes`, `.grainl`, `.kanji`, `.taskbar`, `.dim` or `.masthead`. They are static once their animations stop. Note that `animation: none` also removes `animation-fill-mode` end states, so elements whose entrance would end at `transform: none` keep their resting transform in lite mode (see the tilt pitfall in Comic Pop).

### 1.13 Runtime helpers

These run once per page load, independent of the active style.

#### Film-grain tile (Noir, Storybook, Tabletop, The Daily Village)

A 128×128 canvas of grey noise at alpha 38/255, exposed as `--grain` on `<html>` and tiled at `background-size: 128px`. This is cheaper than shipping a grain image and costs nothing until a style uses it.

```js
try {
  const g = document.createElement("canvas");
  g.width = g.height = 128;
  const gx = g.getContext("2d");
  const img = gx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 38;
  }
  gx.putImageData(img, 0, 0);
  document.documentElement.style.setProperty("--grain", `url(${g.toDataURL()})`);
} catch {}
```

#### Liquid Glass refraction map (Chromium only)

An SVG `feDisplacementMap` filter, applied through `backdrop-filter: url(#lg-refract)`. Only Chromium supports SVG filters on the live backdrop, so the map is generated, and `html.refract` added, only when the browser is Chromium and `CSS.supports("backdrop-filter", "url(#lg-refract)")` is true. The map displaces pixels only near the rim (the outer 22% of each half-axis, with a squared falloff), which is what makes edges look like thick glass.

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="lg-refract" x="0" y="0" width="1" height="1" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">
    <feImage id="lg-map" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map"/>
    <feDisplacementMap in="SourceGraphic" in2="map" scale="0.06" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
```

```js
if (/Chrom(e|ium)\//.test(navigator.userAgent) && CSS.supports("backdrop-filter", "url(#lg-refract)")) {
  const N = 128;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const x = c.getContext("2d");
  const map = x.createImageData(N, N);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const u = ((i + 0.5) / N) * 2 - 1;
      const v = ((j + 0.5) / N) * 2 - 1;
      const edge = 1 - Math.max(Math.abs(u), Math.abs(v));   // 0 at the rim
      const m = Math.pow(Math.max(0, 1 - edge / 0.22), 2);   // bend only near the rim
      const k = (i + j * N) * 4;
      map.data[k] = 128 - u * 127 * m;
      map.data[k + 1] = 128 - v * 127 * m;
      map.data[k + 2] = 128;
      map.data[k + 3] = 255;
    }
  x.putImageData(map, 0, 0);
  document.getElementById("lg-map")?.setAttribute("href", c.toDataURL());
  document.documentElement.classList.add("refract");
}
```

#### POW starburst symbol (Comic Pop)

Define it once anywhere in the page; use it with `<svg class="deco pow"><use href="#pow"/></svg>`.

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="pow" viewBox="0 0 200 160">
    <polygon points="100,4 118,46 160,18 146,62 196,62 156,90 190,124 140,114 136,156 106,124 78,158 72,116 22,138 46,98 4,82 50,66 26,24 76,44"
             fill="#ffd93d" stroke="#111" stroke-width="6" stroke-linejoin="round"/>
    <polygon points="100,26 112,56 140,40 132,70 166,72 138,90 160,112 128,106 124,132 104,112 82,134 80,108 46,120 62,94 32,82 64,72 50,44 84,58"
             fill="#ff6b6b"/>
    <text x="100" y="94" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="40"
          fill="#fff" stroke="#111" stroke-width="5" paint-order="stroke" letter-spacing="2">POW!</text>
  </symbol>
</svg>
```

#### ASCII character rain (ASCII Terminal, large displays)

A `<canvas class="deco rain">` in the background layer, shown only by the ASCII style at `opacity: .32`. In the reference it is mounted only on large-display dark screens. It runs at 15 fps, caps the device pixel ratio at 1.5, pauses when the canvas is off-screen (IntersectionObserver) or the tab is hidden, and never starts under reduced motion or lite mode.

```js
const GLYPHS = "アイウエオカキクケコ01ZXV<>/\\|#$%*+=".split("");
function startRain(cv) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const ctx = cv.getContext("2d");
  let cols = [], w = 0, h = 0, fs = 14, timer = null, visible = true;
  const size = () => {
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = cv.width = Math.max(1, r.width * dpr);
    h = cv.height = Math.max(1, r.height * dpr);
    fs = Math.max(10, Math.round(w / 64));                 // about 64 columns
    cols = Array.from({ length: Math.ceil(w / fs) }, () => Math.random() * -40);
    ctx.font = `${fs}px "JetBrains Mono", monospace`;
  };
  const frame = () => {
    ctx.fillStyle = "rgba(5,5,5,.22)";                     // fade previous frames: the trail
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#33ff00";
    for (let i = 0; i < cols.length; i++) {
      const y = cols[i] * fs;
      if (y > 0) ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], i * fs, y);
      cols[i] = y > h && Math.random() > 0.96 ? 0 : cols[i] + 1;
    }
  };
  const sync = () => {
    const on = visible && !document.hidden;
    if (on && !timer) timer = setInterval(frame, 1000 / 15);
    if (!on && timer) { clearInterval(timer); timer = null; }
  };
  size(); sync();
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); });
  io.observe(cv);
  document.addEventListener("visibilitychange", sync);
  addEventListener("resize", size);
  return () => { if (timer) clearInterval(timer); io.disconnect(); document.removeEventListener("visibilitychange", sync); removeEventListener("resize", size); };
}
```

### 1.14 Imagery pipeline

One illustration set, three renderings, chosen by CSS:

| Rendering | File | How it is shown |
| --- | --- | --- |
| HD image | `art/<name>.webp`, 192×192 | Default `<img>`. Source art in the reference: Microsoft Fluent Emoji 3D (MIT licence). |
| Pixel sprite | `art/pixel/<name>.png`, 24×24 | `<img class="pix">`, shown by Pixel Retro and Desktop 98 with `width: 100%; image-rendering: pixelated`. |
| ASCII art | A string per image | `<pre class="ascii">`, shown by ASCII Terminal. |

The ASCII strings were produced by converting each 256px image to characters by luminance, mapping dark to bright through a character ramp (the designer's ramp is `" .:-=+*#%@"`). The generator script is not in the repository; only its output is (`src/themes/ascii.ts`). To make new ASCII art: downscale the image to roughly 40–60 columns (characters are about twice as tall as wide, so halve the vertical resolution), compute luminance per cell and index into the ramp.

Per-style image treatment:

| Style | Treatment |
| --- | --- |
| Liquid Glass | `drop-shadow(0 10px 18px rgba(0,0,30,.35))` (also on avatars) |
| Comic Pop | `drop-shadow(3px 3px 0 #111)` |
| Neo-Brutalist | none |
| Tide Pool | `drop-shadow(3px 3px 0 #062a4d)` plus `float 3.4s` |
| Claymation | `drop-shadow(0 10px 8px rgba(120,80,60,.25))` plus `squish 2.6s` from the bottom edge |
| ASCII Terminal | HD hidden; ASCII shown in `--accent` (amber `--accent-text` for hero and headline art) |
| Desktop 98 | HD hidden; pixel sprite, static |
| Neon Arcade | `drop-shadow(0 0 14px rgba(255,60,172,.55))` |
| Pixel Retro | HD hidden; pixel sprite with `bob 1s steps(2)` |
| Paper Sketch | Die-cut sticker: five white `drop-shadow`s plus a soft ink shadow, `rotate(-4deg)` |
| Sakura | none |
| Noir | `grayscale(1) contrast(1.25) brightness(.95)` |
| Storybook | `sepia(.45) saturate(.9)` |
| The Daily Village | `grayscale(1) contrast(1.35)` with `mix-blend-mode: multiply` |
| Game Show | none |
| Tabletop | none |
| Blueprint | `brightness(0) invert(1)` at `opacity: .88` (white silhouette) |
| Black & Gold | none |

### 1.15 Accessibility baseline and measured contrast

Baseline in every style:

- Touch targets: buttons `min-height: max(44px, 2.6em)`, fields 44px, options 54 design px (49–62px on mobile). Exceptions: `.btn.sm` is 36px and stepper buttons are 40×40; use them only where a larger target sits nearby, or raise them to 44px.
- Focus: `:focus-visible` draws a 2px `--accent-text` outline with a 2px offset on buttons, options and fields. Desktop 98 replaces it with a 1px dotted black outline inset by 5px.
- Semantics: options use `aria-pressed`; the feed is `aria-live="polite"`; toasts are `role="alert"`; every decoration, illustration and the masthead is `aria-hidden`; the hero number carries `aria-label` because its letters are split into spans.
- Inputs use at least 16px text so iOS does not zoom.
- Generated text (`[ ` `]` brackets, `> ` prompts, `☐`/`☒`, stamps, `FIG.` labels) is added with CSS `content`, which some screen readers announce. Where that matters, use the alternative-text form, for example `content: "[ " / ""` (not done in the source).

Measured contrast (WCAG 2.x ratio, computed from the token values; translucent fills are composited over the painted background; "Text on page" and "Accent text on page" use the worst stop of a gradient background). **Bold** = below 3:1 (fails even for large text and UI). *Italic* = below 4.5:1 (passes only for large text: 24px, or 18.66px bold). Rows are omitted for palettes whose dark variant changes no tokens (Liquid Glass, Neon Arcade, Game Show, Tabletop).

| Style | Palette | Text on page | Muted on page | Text on panel | Muted on panel | Primary button | Accent text on page | Accent text on panel | Field text | Ghost button | Selected option |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Liquid Glass | default | 16.4 | 7.2 | 12.1 | 5.9 | 15.4 | 13.0 | 9.6 | 12.9 | 11.3 | 14.8 |
| Comic Pop | default | 18.5 | 8.7 | 18.9 | 11.4 | 13.7 | *4.1* | *4.2* | 18.9 | 18.9 | 6.8 |
| Comic Pop | dark | 13.2 | 8.9 | 18.9 | 11.4 | 13.7 | *3.2* | *4.2* | 18.9 | 18.9 | 6.8 |
| Neo-Brutalist | default | 17.6 | 9.9 | 19.8 | 11.2 | 6.4 | 4.7 | 5.3 | 19.8 | 19.8 | 5.3 |
| Neo-Brutalist | dark | 17.6 | 10.5 | 19.8 | 11.2 | 6.4 | *3.7* | 5.3 | 19.8 | 19.8 | 5.3 |
| Tide Pool | default | *3.4* | **2.0** | 13.7 | 6.6 | 10.1 | **1.3** | **2.9** | 14.5 | 13.7 | **2.9** |
| Tide Pool | dark | 10.3 | 7.0 | 13.7 | 6.6 | 10.1 | *3.6* | **2.9** | 14.5 | 13.7 | **2.9** |
| Claymation | default | 7.3 | *3.5* | 9.2 | *4.4* | **2.1** | **2.7** | *3.4* | 8.8 | 9.2 | **2.1** |
| Claymation | dark | 8.3 | 5.1 | 9.6 | 6.0 | **2.1** | **2.5** | **2.9** | 8.0 | 9.2 | **2.1** |
| ASCII Terminal | default | 15.0 | 5.6 | 15.0 | 5.6 | 15.0 | 11.1 | 11.1 | 15.0 | 15.0 | 15.0 |
| Desktop 98 | default | 4.8 | *4.1* | 11.5 | 5.7 | 11.5 | *3.4* | 8.8 | 21.0 | 11.5 | 16.0 |
| Neon Arcade | default | 13.5 | 5.4 | 17.4 | 7.0 | 6.2 | 11.0 | 14.2 | 18.0 | 14.7 | 6.2 |
| Pixel Retro | default | 5.6 | 5.6 | 12.5 | 6.4 | *3.5* | **1.6** | *3.5* | 12.5 | 12.5 | *3.5* |
| Pixel Retro | dark | 12.5 | 7.8 | 12.5 | 6.4 | *3.5* | *3.5* | *3.5* | 12.5 | 12.5 | *3.5* |
| Paper Sketch | default | 13.4 | 5.7 | 14.0 | 6.0 | 10.9 | *4.1* | *4.3* | 14.0 | 14.0 | 10.9 |
| Paper Sketch | dark | 13.3 | 8.3 | 11.6 | 7.3 | 10.9 | *3.4* | **3.0** | 10.4 | 13.3 | **1.2** |
| Sakura | default | 15.0 | *4.2* | 16.3 | 4.6 | 15.0 | 5.2 | 5.7 | 16.6 | 15.0 | 15.0 |
| Sakura | dark | 15.2 | 7.2 | 13.7 | 6.5 | 9.3 | 9.3 | 8.4 | 13.8 | **1.1** | 15.0 |
| Noir | default | 7.4 | *3.1* | 15.1 | 6.2 | 16.2 | **1.4** | **2.9** | 15.4 | 16.2 | 6.2 |
| Storybook | default | 7.1 | *3.2* | 11.7 | 5.2 | 8.8 | 5.3 | 8.8 | 12.4 | 11.7 | 8.8 |
| Storybook | dark | 9.3 | 5.9 | 11.7 | 5.2 | 8.8 | 7.1 | **1.4** | 12.4 | 11.7 | 8.8 |
| The Daily Village | default | 15.9 | 6.7 | 15.9 | 6.7 | 15.9 | 8.0 | 8.0 | 17.3 | 15.9 | 15.9 |
| Game Show | default | 12.2 | 7.8 | 14.6 | 9.3 | *3.6* | 8.5 | 10.1 | 18.0 | 10.1 | 11.9 |
| Tabletop | default | 8.3 | 5.8 | 14.6 | 6.1 | 5.0 | 6.6 | **1.3** | 14.6 | 14.6 | 5.0 |
| Blueprint | default | 7.8 | 4.9 | 7.0 | *4.4* | 7.8 | 6.1 | 5.5 | 7.8 | 7.8 | 7.8 |
| Blueprint | dark | 12.0 | 7.6 | 10.7 | 6.8 | 7.8 | 9.4 | 8.4 | 12.0 | 12.0 | 7.8 |
| Black & Gold | default | 20.1 | 6.7 | 21.0 | 7.0 | 11.0 | *4.5* | 4.7 | 18.3 | 11.0 | 11.0 |
| Black & Gold | dark | 21.0 | 7.3 | 18.7 | 6.5 | 11.0 | 11.0 | 9.8 | 17.4 | 11.0 | 11.0 |

How to read it: most failures are accent colours used as text on busy backgrounds (Tide Pool coral on water, Pixel red on sky, Noir red on black) and white labels on mid-tone accents (Claymation pink, Pixel red, Game Show pink). Use those colours as fills or for large, bold text, never for small body text. Each style section lists its specific traps.

### 1.16 Performance budget and measured results

Measured on the reference implementation with `e2e/perf.mjs` (Playwright, Chromium, CPU throttled 4×, a 1280×720 display and a 390×844 phone, switching through every style twice and measuring on the warm pass):

- **CSS weight:** all 18 styles plus the base layer and the picker are one stylesheet of 93 KB, about 20 KB gzipped (19,535 bytes at `gzip -9`).
- **Frame rate:** 60 fps on both the large display and the phone for every style.
- **Style switch:** no long tasks (over 50ms), except one 54ms task on the phone when switching to Sakura. The cause was not recorded.
- **Fonts:** one Google Fonts request for the active style only; unused styles cost nothing on the network.

Cost tiers (from the style registry, shown to users in the picker):

| Tier | Styles |
| --- | --- |
| lowest | Neo-Brutalist, Desktop 98, Pixel Retro, Paper Sketch, Blueprint, Black & Gold |
| low | Comic Pop, Tide Pool, Claymation, ASCII Terminal, Neon Arcade, Sakura, Noir, Storybook, The Daily Village, Game Show, Tabletop |
| medium | Liquid Glass |

Performance rules the 18 styles follow:

1. Animate `transform` and `opacity` only, and put `will-change: transform` only on moving decoration layers.
2. Keep per-screen decorations as static CSS (gradients, box-shadow pixel art, masks). No Lottie or video on phones.
3. Canvas effects (ASCII rain) run at 15 fps with the DPR capped at 1.5, and pause off-screen and in background tabs.
4. Expensive filters are scoped: the glass refraction runs only on large displays in Chromium; `backdrop-filter` is used only by Liquid Glass; chained `drop-shadow` filters apply only to illustrations.
5. Generate textures at runtime (128px grain tile) instead of shipping large images.
6. Ship one art set as three lazy renderings, so hidden variants never download.
7. Offer lite mode and enable it automatically on devices with 2 GB of memory or less.

---

## 2. Style catalogue overview

"Ambient motion" means decoration that moves without user input. Every style also has press feedback and entrance animations.

| # | id | Name | One-line vibe | Display / body fonts | Base bg | Accent | Cost | Ambient motion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `glass` | Liquid Glass | Frosted translucent panels over drifting colour blobs | SF Pro (system) → Geist / same | `#0d1630` (blue–violet gradient) | white pill `rgba(255,255,255,.92)`, text accent `#bfe3ff` | medium | Yes: blobs drift, hero art floats |
| 2 | `comic` | Comic Pop | Halftone dots, ink outlines, tilted panels, POW! | Bangers / Geist | `#fffdf5` | `#ffd93d` yellow, `#e63946` red | low | Yes: POW pulse |
| 3 | `brutal` | Neo-Brutalist | Loud flat blocks, thick borders, slab shadows | Archivo Black / Archivo | `#f4f1ea` | `#ff5c00` orange, `#2b59ff` blue, `#c6ff00` lime | lowest | Yes: ticker (large displays) |
| 4 | `tide` | Tide Pool | Cartoon undersea neo-brutalism | Luckiest Guy / Archivo | `#1fb6ff` (water gradient) | `#ffd23f` yellow, `#ff5a4f` coral | low | Yes: bubbles, light rays, kelp, art float |
| 5 | `clay` | Claymation | Puffy pastel clay, squash-and-spring | Fredoka / Fredoka | `#ffe5d9` | `#ff8fab` pink | low | Yes: blobs drift, art squish |
| 6 | `ascii` | ASCII Terminal | Green phosphor CRT, brackets and prompts | VT323 / JetBrains Mono | `#050505` | `#33ff00` green, `#ffb000` amber | low | Yes: cursor blink, typewriter, optional rain |
| 7 | `win98` | Desktop 98 | Late-90s bevelled desktop windows | Tahoma (system) / Tahoma; VT323 for LCD | `#008080` | `#c0c0c0` grey buttons, `#000080` navy | lowest | No |
| 8 | `neon` | Neon Arcade | Synthwave sunset, grid floor, glowing type | Audiowide / Chakra Petch | `#0a0418` (sunset gradient) | `#ff3cac` magenta, `#3cf2ff` cyan | low | Yes: grid floor, label flicker |
| 9 | `pixel` | Pixel Retro | 8-bit console, stepped pixel borders | Press Start 2P / Pixelify Sans | `#29adff` | `#ff004d` red | lowest | Yes: sprite bob, stepping clouds |
| 10 | `paper` | Paper Sketch | Notebook paper, wobbly ink, washi tape | Caveat / Kalam | `#fbf8ef` | `#ffe066` marker, `#d1495b` red pen | lowest | Minimal: hero art float |
| 11 | `sakura` | Sakura | Japanese minimalism, kanji watermark, petals | Shippori Mincho / Zen Kaku Gothic New | `#f6f1e7` | `#1d1d1f` ink, `#c8102e` vermilion | low | Yes: falling petals |
| 12 | `noir` | Noir | Black-and-white film, one blood-red accent | Limelight / Special Elite | `#0e0e0e` (spotlight) | `#ecebe6` off-white, `#c1121f` red | low | Yes: blinds flicker |
| 13 | `story` | Storybook | Fairy-tale parchment, fleurons, drop caps | Cinzel Decorative, Cinzel / IM Fell English | `#efe0bd` (vignette) | `#7a1f1f` oxblood | low | No |
| 14 | `news` | The Daily Village | Broadsheet newspaper, blackletter masthead | UnifrakturMaguntia (masthead), Old Standard TT / Old Standard TT | `#f3eee1` | `#141414` black, `#8b1a1a` red | low | No |
| 15 | `show` | Game Show | TV studio, spotlights, light-bulb marquee | Bungee / Rubik | `#2a0845` | `#ff2e63` pink, `#ffd166` gold | low | Yes: spotlights, marquee chase |
| 16 | `table` | Tabletop | Green felt, playing cards, wooden tokens | Cinzel / Alegreya | `#0f5132` | `#c0392b` red, `#f4d58d` gold | low | Yes: card deal loop |
| 17 | `blueprint` | Blueprint | Engineering drawing, grid, figure labels | Share Tech Mono / Architects Daughter | `#174a8b` | `#eaf2ff` white, `#ffd166` yellow | lowest | No |
| 18 | `minimal` | Black & Gold | Refined minimal, black ink and old gold | Geist / Geist | `#fafaf7` | `#cfb991` old gold, `#8e6f3e` aged gold | lowest | No (default style) |

---

## 3. The styles

Every section uses the same order: concept, palette, typography, shape, depth, backgrounds and decorations, components, motion, imagery, accessibility, performance, do/don't and copy-paste CSS. Selectors use the generic names from §1.2. Sizes written as `Nu` mean `calc(var(--u) * N)`.

### 3.1 Liquid Glass (`glass`)

#### Concept & mood

Apple-style liquid glass. Frosted, translucent panels float over slowly drifting, saturated colour blobs (blue, violet/pink, orange) on a deep navy-to-violet gradient, with a faint diagonal stripe texture that gives the blur something to bend. Rims are lit with inset highlight shadows, and primary actions are white pills. On Chromium large displays the panels also refract the backdrop near their edges.

**Good for:** product and marketing landing pages, OS-like dashboards, media players, photo and music portfolios, premium consumer apps. It needs a colourful backdrop to show through; on a flat background, glass reads as grey boxes.

#### Palette

Default:

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#0d1630` | Page base (the background layer paints a gradient over it) |
| `--fg` | `#f6f8ff` | Text |
| `--muted` | `rgba(235,240,255,.66)` | Secondary text |
| `--panel` | `rgba(255,255,255,.12)` | Frosted surface |
| `--panel-fg` | (`--fg`) | Text on glass |
| `--line` | `rgba(255,255,255,.32)` | Hairline rim |
| `--accent` | `rgba(255,255,255,.92)` | Primary pill fill |
| `--accent-fg` | `#0b1430` | Text on the pill |
| `--accent-text` | `#bfe3ff` | Links, kickers, focus ring |
| `--field` | `rgba(255,255,255,.10)` | Inputs, options, segments |
| `--tile` | `rgba(255,255,255,.14)` | Tiles |
| `--chip-bg` | `rgba(255,255,255,.16)` | Chips |
| `--btn-line` | `rgba(255,255,255,.6)` | Button rim |
| `--qr-bg` | `rgba(255,255,255,.92)` | QR frame |
| `--bar` | (fallback: 22% `--accent`) | Option share bar |
| `--role-bg` | `linear-gradient(180deg, rgba(255,90,120,.28), rgba(255,255,255,.08))` | Feature card: pink-tinted glass |

Other colours: background `radial-gradient(120% 90% at 10% 0%, #2a4bd7 0%, transparent 55%), radial-gradient(90% 80% at 100% 100%, #c2389b 0%, transparent 60%), linear-gradient(160deg, #0e1838, #1a0f3a)`. Blobs: b1 `#5ee7ff` → `#2b6cff`, b2 `#ffb3e6` → `#b04dff`, b3 `#ffe39a` → `#ff7a59`. Stripes `rgba(255,255,255,.05)`. Selected option `rgba(255,255,255,.9)`. Opaque fallbacks: lite `rgba(30,38,80,.72)`, reduced transparency `rgba(30,38,80,.92)`.

Dark variant: only the background changes, to `radial-gradient(100% 80% at 80% 0%, #3046c7 0%, transparent 60%), radial-gradient(90% 80% at 0% 100%, #6b2fb8 0%, transparent 60%), #070b1d`. No tokens change.

#### Typography

- Families: display `-apple-system, "SF Pro Display", "Geist", system-ui, sans-serif`; body `-apple-system, "SF Pro Text", "Geist", system-ui, sans-serif`. Apple devices use San Francisco; others get Geist.
- Google Fonts: `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap`
- Display weight 650, tracking `-.02em` (default), sentence case, line-height 1.02. Display text gets `text-shadow: 0 1px 12px rgba(0,0,30,.25)` so it stays crisp over the blobs.
- Buttons: weight 600 (default), no tracking, sentence case.
- Hero number: weight 700, tracking `.04em`, filled with a vertical gradient clipped to the text (`linear-gradient(180deg, #fff 30%, rgba(255,255,255,.55))`, `background-clip: text`, `color: transparent`).

#### Shape & lines

`--bw: 1px`, `--r: 28px`, `--r-sm: 18px`. Buttons are pills (`--btn-r: 999px`); chips are pills with no border. All borders are translucent white hairlines.

#### Depth & surfaces

- `--shadow`: `inset 0 1px 0 rgba(255,255,255,.55)` (lit top rim), `inset 0 -1px 0 rgba(255,255,255,.12)` (faint bottom rim), `0 18px 40px -18px rgba(0,0,20,.55)` (soft drop).
- Button: `inset 0 1px 0 #fff, 0 10px 24px -10px rgba(0,0,30,.5)`.
- Frost: `backdrop-filter: blur(18px) saturate(180%)` (with `-webkit-` prefix) on panels, fields, tiles, options, segments, chips and ghost buttons.
- Refraction: on `html.refract` (Chromium), large-display panels and ghost buttons use `backdrop-filter: url(#lg-refract) blur(14px) saturate(190%)`. The filter and its map are in §1.13. Safari and Firefox keep frost plus rim, which still reads as glass.

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Base gradient | Two radial colour pools (blue top-left, magenta bottom-right) over a 160° navy→violet linear gradient. |
| Blobs `.blob.b1/.b2/.b3` | Circles (`border-radius: 50%`, `aspect-ratio: 1`) of 55%, 48% and 38% of the viewport width, each a radial gradient that fades to transparent at 70%. Positions: b1 left −10%, top 30%; b2 right −8%, top −12%; b3 left 38%, bottom −16%, opacity .85. They drift with `drift1 16s`, `drift2 19s`, `drift3 22s` ease-in-out infinite, and have `will-change: transform`. |
| Stripes `.stripes` | `inset: -20%; background: repeating-linear-gradient(115deg, transparent 0 46px, rgba(255,255,255,.05) 46px 48px)`. Static; gives the blur and refraction texture to bend. |

#### Components

- **Primary button:** white pill (`rgba(255,255,255,.92)`), navy text, 1px `rgba(255,255,255,.6)` rim, inset white top highlight plus soft drop. Press: `scale(.97)`.
- **Ghost button:** frosted `rgba(255,255,255,.14)`, border `rgba(255,255,255,.45)`, `box-shadow: inset 0 1px 0 rgba(255,255,255,.6)`, text `--fg`.
- **Panel:** frosted glass, 28px radius, lit rim, soft drop.
- **Inputs, options, segments:** frosted `rgba(255,255,255,.10)` at 18px radius. Selected option: near-opaque white `rgba(255,255,255,.9)` with navy text (the same look as the primary button).
- **Chips:** frosted `rgba(255,255,255,.16)` pills.
- **Tiles and avatars:** frosted tiles; avatars get the art drop shadow.
- **Headings:** system display face at 650 with a soft shadow.
- **Hero number:** gradient-clipped white text.
- **Feature card:** pink-tinted glass gradient.
- **Message feed and timer:** base look (display face, older lines at .45).

#### Motion & interaction

Blobs drift (16/19/22s) and hero art floats (`float 6s ease-in-out infinite`). Glass surfaces never move or resize; only the layers behind them animate. Press feedback is the base 90ms scale.

#### Imagery

Full-colour 3D art with `filter: drop-shadow(0 10px 18px rgba(0,0,30,.35))`, applied to `.art img`, result-card art and tile avatars.

#### Accessibility & pitfalls

- Text contrast depends on what is behind the glass. Measured over the gradient base it is high (text 16.4:1, muted 7.2:1), but bright blob centres (`#ffe39a`, `#5ee7ff`) can sit behind a panel. Keep long text on panels and keep the display text-shadow.
- `prefers-reduced-transparency` makes only `.panel` opaque; fields, tiles, options, chips and ghost buttons stay frosted. Extend the selector for full coverage (recommendation).
- In lite mode every frosted element becomes `rgba(30,38,80,.72)` with no blur, and the blobs disappear.
- The selected option and the primary button look the same (white pill). That is intentional, but rely on `aria-pressed` for state.
- Refraction is Chromium-only and large-display-only by design. Do not apply it on mobile layouts.

#### Performance notes / cost

Cost tier: **medium**, the only medium style. `backdrop-filter` is the cost: every frosted surface re-samples and blurs what is behind it whenever that content changes. Rules: never animate a glass element's size, position or blur radius; animate only `transform`/`opacity` of things behind it; keep the number of overlapping glass layers small. For higher fidelity, see Glisse (npm `glisse`, MIT, github.com/0kzh/glisse) and kube.io/blog/liquid-glass-css-svg.

#### Do / Don't

Do:
- Keep a saturated, slowly moving backdrop behind every glass surface.
- Give every glass surface the lit rim (inset top highlight).
- Use white pills for primary actions and frosted pills for secondary ones.
- Ship the lite and reduced-transparency fallbacks.

Don't:
- Put glass on a flat or white background.
- Animate a glass element's width, height, top/left or blur.
- Nest blurred layers inside blurred layers.
- Rely on refraction outside Chromium, or enable it on phones.
- Use saturated coloured text on glass; stay with white and pale blue.

#### Copy-paste CSS

Also add the refraction SVG filter and map generator from §1.13 if you want refraction.

```css
/* Liquid Glass: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged. */
[data-style="glass"] {
  --bg: #0d1630; --fg: #f6f8ff; --muted: rgba(235,240,255,.66);
  --panel: rgba(255,255,255,.12); --line: rgba(255,255,255,.32); --bw: 1px; --r: 28px; --r-sm: 18px;
  --shadow: inset 0 1px 0 rgba(255,255,255,.55), inset 0 -1px 0 rgba(255,255,255,.12), 0 18px 40px -18px rgba(0,0,20,.55);
  --accent: rgba(255,255,255,.92); --accent-fg: #0b1430; --accent-text: #bfe3ff;
  --field: rgba(255,255,255,.10); --tile: rgba(255,255,255,.14); --chip-bg: rgba(255,255,255,.16);
  --font-d: -apple-system, "SF Pro Display", "Geist", system-ui, sans-serif; --font-b: -apple-system, "SF Pro Text", "Geist", system-ui, sans-serif;
  --d-weight: 650; --btn-r: 999px; --btn-line: rgba(255,255,255,.6);
  --btn-shadow: inset 0 1px 0 #fff, 0 10px 24px -10px rgba(0,0,30,.5);
  --qr-bg: rgba(255,255,255,.92); --code-track: .04em;
}
[data-style="glass"] .panel,
[data-style="glass"] .field,
[data-style="glass"] .tile,
[data-style="glass"] .option,
[data-style="glass"] .segments span,
[data-style="glass"] .chip,
[data-style="glass"] .btn.ghost {
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  backdrop-filter: blur(18px) saturate(180%);
}
[data-style="glass"].refract .screen.large .panel,
[data-style="glass"].refract .screen.large .btn.ghost { backdrop-filter: url(#lg-refract) blur(14px) saturate(190%); }
[data-style="glass"] .btn.ghost { --ghost-bg: rgba(255,255,255,.14); border-color: rgba(255,255,255,.45); box-shadow: inset 0 1px 0 rgba(255,255,255,.6); }
[data-style="glass"] .option.is-selected { background: rgba(255,255,255,.9); }
[data-style="glass"] .bg-layer { background: radial-gradient(120% 90% at 10% 0%, #2a4bd7 0%, transparent 55%), radial-gradient(90% 80% at 100% 100%, #c2389b 0%, transparent 60%), linear-gradient(160deg, #0e1838, #1a0f3a); }
[data-style="glass"] .screen.is-dark .bg-layer { background: radial-gradient(100% 80% at 80% 0%, #3046c7 0%, transparent 60%), radial-gradient(90% 80% at 0% 100%, #6b2fb8 0%, transparent 60%), #070b1d; }
[data-style="glass"] .blob { display: block; position: absolute; border-radius: 50%; will-change: transform; }
[data-style="glass"] .blob.b1 { width: 55%; aspect-ratio: 1; left: -10%; top: 30%; background: radial-gradient(circle at 35% 35%, #5ee7ff, #2b6cff 60%, transparent 70%); animation: drift1 16s ease-in-out infinite; }
[data-style="glass"] .blob.b2 { width: 48%; aspect-ratio: 1; right: -8%; top: -12%; background: radial-gradient(circle at 40% 40%, #ffb3e6, #b04dff 60%, transparent 70%); animation: drift2 19s ease-in-out infinite; }
[data-style="glass"] .blob.b3 { width: 38%; aspect-ratio: 1; left: 38%; bottom: -16%; background: radial-gradient(circle at 50% 50%, #ffe39a, #ff7a59 60%, transparent 70%); animation: drift3 22s ease-in-out infinite; opacity: .85; }
[data-style="glass"] .stripes { display: block; position: absolute; inset: -20%; background: repeating-linear-gradient(115deg, transparent 0 46px, rgba(255,255,255,.05) 46px 48px); }
[data-style="glass"] .display { text-shadow: 0 1px 12px rgba(0,0,30,.25); }
[data-style="glass"] .hero-number { font-weight: 700; background: linear-gradient(180deg, #fff 30%, rgba(255,255,255,.55)); -webkit-background-clip: text; background-clip: text; color: transparent; }
[data-style="glass"] .tile .avatar, [data-style="glass"] .result-card .art img, [data-style="glass"] .art img { filter: drop-shadow(0 10px 18px rgba(0,0,30,.35)); }
[data-style="glass"] .hero-art img { animation: float 6s ease-in-out infinite; }
[data-style="glass"] .feature-card { --role-bg: linear-gradient(180deg, rgba(255,90,120,.28), rgba(255,255,255,.08)); }

/* Shared keyframes this style uses (defined once in the base layer in the reference) */
@keyframes drift1 { 50% { transform: translate(18%, 10%) scale(1.15); } }
@keyframes drift2 { 50% { transform: translate(-16%, -12%) scale(.9); } }
@keyframes drift3 { 50% { transform: translate(10%, -16%) scale(1.1); } }
@keyframes float { 50% { transform: translateY(-6%); } }

/* Lite mode and reduced-transparency fallbacks for this style */
html.lite[data-style="glass"] .panel, html.lite[data-style="glass"] .field, html.lite[data-style="glass"] .tile, html.lite[data-style="glass"] .option, html.lite[data-style="glass"] .segments span, html.lite[data-style="glass"] .chip, html.lite[data-style="glass"] .btn.ghost { backdrop-filter: none; -webkit-backdrop-filter: none; background-color: rgba(30,38,80,.72); }
@media (prefers-reduced-transparency: reduce) { [data-style="glass"] .panel { backdrop-filter: none; background: rgba(30,38,80,.92); } }
```

---

### 3.2 Comic Pop (`comic`)

#### Concept & mood

A printed comic book. Halftone Ben-Day dot backgrounds, 3px black ink outlines, hard offset shadows, cards tilted by 1–2°, Bangers display type with a red offset shadow, yellow primary buttons that "punch" into their shadow on press, and speech-bubble message text with a tail. A POW starburst marks big moments, and list tiles cycle red, blue and violet. The dark variant is a navy halftone with yellow display text.

**Good for:** kids' and education products, games, event promos, playful marketing pages, creator portfolios, onboarding flows that want personality.

#### Palette

Default:

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#fffdf5` | Paper |
| `--fg` | `#111` | Ink |
| `--muted` | `#4a4a4a` | Secondary text |
| `--panel` | `#fff` | Panel |
| `--panel-fg` | `#111` | Text on panels (explicit, so dark mode cannot flip it) |
| `--muted-panel` | `#3a3a3a` | Secondary text on panels |
| `--line` | `#111` | Ink outline |
| `--accent` | `#ffd93d` | Yellow primary |
| `--accent-fg` | `#111` | Text on yellow |
| `--accent-text` | `#e63946` | Red text accent |
| `--field` / `--field-fg` | `#fff` / `#111` | Inputs, options |
| `--tile` / `--tile-fg` | `#fff` / `#111` | Tiles (then recoloured per position) |
| `--chip-bg` / `--chip-fg` | `#fff` / `#111` | Chips |
| `--bar` | `repeating-linear-gradient(45deg, #ff6b6b 0 6px, #ff8f8f 6px 12px)` | Candy-striped share bar |

Other colours: display shadow and selected option `#ff6b6b`; tile cycle `#ff6b6b` / `#8fd3ff` / `#c4b5fd`; feature card `#ff6b6b`; halftone dots `rgba(17,17,17,.13)`. Page variants: hero and split pages `#ffd93d` with dots `rgba(17,17,17,.16)`, form pages `#8fd3ff` with dots `rgba(17,17,17,.14)`, choice pages `#c4b5fd`. POW: `#ffd93d`, `#ff6b6b`, `#fff`, `#111`.

Dark variant:

| Token / element | Value |
| --- | --- |
| `--fg` | `#fff` |
| `--muted` | `#c9d3ff` |
| Background | `#1d2a6b` with dots `rgba(255,255,255,.12)` 1.5px |
| Display text and timer | `#ffd93d` with `text-shadow: 4px 4px 0 #111` |

Panels, fields, tiles and chips keep their white fills and explicit `#111` text.

#### Typography

- Families: Bangers (display and buttons); Geist (body and message feed).
- Google Fonts: `https://fonts.googleapis.com/css2?family=Bangers&family=Geist:wght@400;600;700&display=swap`
- Display: weight 400 (Bangers has one weight), tracking `.04em`, line-height `.95`, `text-shadow: 3px 3px 0 #ff6b6b`, no stroke.
- Buttons: Bangers 400, tracking `.08em`.
- Hero number: tracking `.1em`, white fill, black stroke `-webkit-text-stroke: 5u #111` with `paint-order: stroke fill`, hard shadow `9u 9u 0 #111`.
- Feed: Geist 600, tracking 0.
- Feature-card heading: white with `3px 3px 0 #111` shadow.

#### Shape & lines

`--bw: 3px` ink outlines everywhere. `--r: 6px`, `--r-sm: 4px`, chips 4px radius with a 2.5px border, avatars 4px radius. Buttons use `--r` (6px).

#### Depth & surfaces

Hard offset shadows only: panels `6px 6px 0 #111`, QR frame `4px 4px 0 #111` (`--shadow-sm`), buttons `4px 4px 0 #111`. Press: `--press: translate(4px, 4px)` with `--btn-shadow-press: 0 0 0 #111`, so the button lands exactly on its shadow. No blur, no gradients except the dots.

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Halftone | `background-image: radial-gradient(circle, rgba(17,17,17,.13) 1.4px, transparent 1.6px); background-size: 9px 9px` over the page colour. |
| Per-page colour | `.screen.is-hero` / `.screen.is-split` yellow, `.screen.is-form` blue, `.screen.is-choice` violet (see palette). |
| POW starburst | The `#pow` SVG symbol (§1.13) in `<svg class="deco pow">`, 210u wide, 26u from the right and 20u from the top, pulsing with `powpulse 1.6s var(--ease) infinite`. A smaller `.deco.pow-sm` (120u) is defined but not used in the reference. |

#### Components

- **Primary button:** yellow, 3px ink outline, 4px hard shadow, Bangers. Press slams 4px into the shadow.
- **Ghost button:** white with ink text, same outline and shadow.
- **Panels:** white, 3px ink, 6px shadow. Odd panels (`:nth-of-type(odd)`) tilt −1.2°; list cards alternate −1.2° / +1.4°; result cards alternate −1° / +1.4°.
- **Options:** white with ink outline; selected is `#ff6b6b` with ink text; the share bar is red candy stripes.
- **Chips:** white, 2.5px outline, 4px radius.
- **Tiles:** cycle `#ff6b6b`, `#8fd3ff`, `#c4b5fd` by position (`3n+1`, `3n+2`, `3n`).
- **Feature card:** red fill, white heading with black shadow, ink body text.
- **Message feed:** every line is a speech bubble: white, 3px ink border, 22px radius, `5px 5px 0 #111` shadow, centred. Older lines are `.6` opacity and `scale(.94)`. The last line gets a tail: a 22×18px white square with right and bottom ink borders, `skewX(35deg) rotate(15deg)`, 16px below the bubble at 18% from the left.

#### Motion & interaction

Press punch (90ms); POW pulse (`rotate(-8deg) scale(1)` ↔ `rotate(-4deg) scale(1.08)`, 1.6s); feed lines rise in (600ms). Nothing else moves.

#### Imagery

Full-colour art with a hard ink edge: `filter: drop-shadow(3px 3px 0 #111)`.

#### Accessibility & pitfalls

- Red `--accent-text` (`#e63946`) on paper is 4.1:1 (3.2:1 on the dark navy page). Use it for bold or large text only.
- In the dark palette only `--fg`/`--muted` flip. Panels, fields, tiles and chips stay readable because their `*-fg` tokens are explicit. Copy all of them.
- Tilts: `.panel:nth-of-type(odd)` counts elements of the same tag, not panels, so which panels tilt depends on sibling markup. Result cards also run the `rise` entrance with `animation-fill-mode: both`. Its final keyframe (`transform: none`) overrides the rotation, so in the reference the result-card tilt only shows in lite mode. If you want the tilt to persist, use the individual `rotate:` property, which composes with `transform`, or put the tilt on a wrapper.
- Bangers is condensed and all-caps. Keep it to headings and buttons.

#### Performance notes / cost

Cost tier: **low**. Halftone is one static gradient. The POW pulse is a transform on one SVG.

#### Do / Don't

Do:
- Use 3px ink outlines and hard shadows on every surface.
- Match `--press` to the shadow offset, so the button punches into it.
- Use the speech-bubble feed for announcements.
- Save the POW burst for one big moment per page.

Don't:
- Use soft or blurred shadows.
- Use Bangers for body text.
- Tilt everything: alternate, and keep inputs straight.
- Mix in gradients other than the dot pattern.

#### Copy-paste CSS

Add the POW symbol from §1.13 if you use the burst.

```css
/* Comic Pop: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged. */
[data-style="comic"] {
  --bg: #fffdf5; --fg: #111; --muted: #4a4a4a;
  --panel: #fff; --line: #111; --bw: 3px; --r: 6px; --r-sm: 4px;
  --shadow: 6px 6px 0 #111; --shadow-sm: 4px 4px 0 #111;
  --accent: #ffd93d; --accent-fg: #111; --accent-text: #e63946;
  --field: #fff; --tile: #fff; --chip-bg: #fff; --chip-bw: 2.5px; --chip-r: 4px;
  --font-d: "Bangers", "Impact", "Arial Black", sans-serif; --font-b: "Geist", system-ui, sans-serif; --font-btn: "Bangers", Impact, sans-serif;
  --d-weight: 400; --d-track: .04em; --d-lh: .95; --btn-track: .08em; --btn-weight: 400; --code-track: .1em;
  --btn-shadow: 4px 4px 0 #111; --btn-shadow-press: 0 0 0 #111; --press: translate(4px, 4px);
  --narr-weight: 600; --font-narr: "Geist", system-ui, sans-serif; --narr-track: 0; --av-r: 4px;
  --chip-fg: #111; --panel-fg: #111; --muted-panel: #3a3a3a; --field-fg: #111; --tile-fg: #111;
  --bar: repeating-linear-gradient(45deg, #ff6b6b 0 6px, #ff8f8f 6px 12px);
}
[data-style="comic"] .bg-layer { background-color: var(--bg); background-image: radial-gradient(circle, rgba(17,17,17,.13) 1.4px, transparent 1.6px); background-size: 9px 9px; }
[data-style="comic"] .screen.is-split .bg-layer, [data-style="comic"] .screen.is-hero .bg-layer { background-color: #ffd93d; background-image: radial-gradient(circle, rgba(17,17,17,.16) 1.6px, transparent 1.8px); }
[data-style="comic"] .screen.is-form .bg-layer { background-color: #8fd3ff; background-image: radial-gradient(circle, rgba(17,17,17,.14) 1.5px, transparent 1.7px); }
[data-style="comic"] .screen.is-choice .bg-layer { background-color: #c4b5fd; }
[data-style="comic"] .screen.is-dark { --fg: #fff; --muted: #c9d3ff; }
[data-style="comic"] .screen.is-dark .bg-layer { background-color: #1d2a6b; background-image: radial-gradient(circle, rgba(255,255,255,.12) 1.5px, transparent 1.7px); }
[data-style="comic"] .panel:nth-of-type(odd), [data-style="comic"] .list-card:nth-child(odd) { transform: rotate(-1.2deg); }
[data-style="comic"] .list-card:nth-child(even), [data-style="comic"] .result-card:nth-child(even) { transform: rotate(1.4deg); }
[data-style="comic"] .result-card:nth-child(odd) { transform: rotate(-1deg); }
[data-style="comic"] .display { -webkit-text-stroke: 0; text-shadow: 3px 3px 0 #ff6b6b; }
[data-style="comic"] .screen.is-dark .display, [data-style="comic"] .screen.is-dark .timer { color: #ffd93d; text-shadow: 4px 4px 0 #111; }
[data-style="comic"] .hero-number { color: #fff; -webkit-text-stroke: calc(var(--u) * 5) #111; paint-order: stroke fill; text-shadow: calc(var(--u) * 9) calc(var(--u) * 9) 0 #111; }
[data-style="comic"] .tile:nth-child(3n+1) { background: #ff6b6b; } [data-style="comic"] .tile:nth-child(3n+2) { background: #8fd3ff; } [data-style="comic"] .tile:nth-child(3n) { background: #c4b5fd; }
[data-style="comic"] .btn.ghost { --ghost-bg: #fff; --ghost-fg: #111; }
[data-style="comic"] .option.is-selected { background: #ff6b6b; color: #111; }
[data-style="comic"] .feature-card { --role-bg: #ff6b6b; }
[data-style="comic"] .feature-card h2 { color: #fff; text-shadow: 3px 3px 0 #111; -webkit-text-stroke: 0; }
[data-style="comic"] .feature-card p, [data-style="comic"] .feature-card .card-kicker { color: #111; }
[data-style="comic"] .feed p { background: #fff; color: #111; border: 3px solid #111; border-radius: 22px; padding: .35em .8em; box-shadow: 5px 5px 0 #111; justify-self: center; position: relative; }
[data-style="comic"] .feed p.is-old { opacity: .6; transform: scale(.94); }
[data-style="comic"] .feed p:last-child::after { content: ""; position: absolute; left: 18%; bottom: -16px; width: 22px; height: 18px; background: #fff; border-right: 3px solid #111; border-bottom: 3px solid #111; transform: skewX(35deg) rotate(15deg); }
[data-style="comic"] .deco.pow { display: block; position: absolute; z-index: 3; width: calc(var(--u) * 210); right: calc(var(--u) * 26); top: calc(var(--u) * 20); animation: powpulse 1.6s var(--ease) infinite; transform-origin: center; }
[data-style="comic"] .deco.pow-sm { display: block; position: absolute; z-index: 3; width: calc(var(--u) * 120); right: calc(var(--u) * 8); top: calc(var(--u) * 40); animation: powpulse 1.6s var(--ease) infinite; }
@keyframes powpulse { 0%, 100% { transform: rotate(-8deg) scale(1); } 50% { transform: rotate(-4deg) scale(1.08); } }
[data-style="comic"] .art img { filter: drop-shadow(3px 3px 0 #111); }
```

---

### 3.3 Neo-Brutalist (`brutal`)

#### Concept & mood

Flat, loud colour blocks (lime, orange, electric blue, hot pink) on off-white, with split-colour backgrounds, thick black borders, big hard shadows and zero radius. Archivo Black sets uppercase headings, labels sit in black tags, a news ticker scrolls along the bottom of large displays, and buttons slam into their shadow. It is deliberately distinct from Comic Pop: no halftone, no tilt, no comic font.

**Good for:** startup and developer-tool landing pages, agency and design portfolios, zines, event and campaign sites, opinionated dashboards.

#### Palette

Default:

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#f4f1ea` | Off-white page |
| `--fg` | `#0a0a0a` | Ink |
| `--muted` / `--muted-panel` | `#3b3b3b` | Secondary text |
| `--panel` / `--panel-fg` | `#fff` / `#0a0a0a` | Panels |
| `--line` | `#0a0a0a` | Borders |
| `--accent` / `--accent-fg` | `#ff5c00` / `#0a0a0a` | Orange primary |
| `--accent-text` | `#2b59ff` | Electric-blue text accent |
| `--field`, `--tile`, `--chip-bg` | `#fff` | Inputs, options, tiles, chips |
| `--field-fg`, `--tile-fg`, `--chip-fg` | `#0a0a0a` | Their text |
| `--bar` | `#c6ff00` | Solid lime share bar |

Other colours: tiles cycle `#ff5c00` / `#c6ff00` / `#ff3d8b` / `#8ab4ff` (`4n+1`…`4n`); avatars `#0a0a0a`; selected option `#2b59ff` with `#fff` text; feature card `#c6ff00`; hero number `#0a0a0a` block with `#c6ff00` text and an `#ff5c00` shadow. Page variants: split pages `linear-gradient(90deg, #2b59ff 0 42%, var(--bg) 42%)` with white text on the blue side (`.split-left`, subline `#e6ebff`); hero pages a lime band `linear-gradient(180deg, #c6ff00 0 30%, var(--bg) 30%)`; choice pages a pink band `linear-gradient(180deg, #ff3d8b 0 26%, var(--bg) 26%)`. Ticker `#0a0a0a` with `#c6ff00` text.

Dark variant:

| Token / element | Value |
| --- | --- |
| `--bg` | `#0a0a0a` |
| `--fg` | `#f4f1ea` |
| `--muted` | `#bdbdbd` |
| Eyebrow tag | `#c6ff00` background, `#0a0a0a` text |
| Timer | `#c6ff00` |

#### Typography

- Families: Archivo Black (display, ticker); Archivo 400/600/800 (body, buttons).
- Google Fonts: `https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;600;800&display=swap`
- Display: uppercase, weight 400 (the face is already black), tracking `-.02em`, line-height `.92`.
- Buttons: Archivo 800, uppercase, tracking `.02em`.
- Eyebrow: a black tag with white text, padding `.25em .55em`, tracking `.14em`, `display: table` so it hugs the text.
- Ticker: Archivo Black, 16u, tracking `.08em`.

#### Shape & lines

`--bw: 3px`, `--r: 0`, `--r-sm: 0`, buttons 0, chips 0 with a 3px border, avatars square.

#### Depth & surfaces

Panels `8px 8px 0 #0a0a0a`; QR frame `5px 5px 0`; buttons `5px 5px 0`. Press: `translate(5px, 5px)` onto a `0 0 0` shadow. The hero number casts `10u 10u 0 #ff5c00`. Nothing is blurred or translucent.

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Split and band backgrounds | Hard colour stops in a linear gradient on `.bg-layer` (see palette). |
| Ticker `.ticker` | A 34u black bar fixed to the bottom of the viewport with a 3px top border. Its `::before` holds the message written out twice, centred vertically with the individual `translate: 0 -50%` property, and scrolls with `tick 14s linear infinite` (`translateX(-50%)`). Because the text is doubled, −50% lands exactly on the start of the second copy, so the loop is seamless. Hidden on mobile. |

#### Components

- **Primary button:** orange slab, ink border, uppercase Archivo 800, 5px slab shadow; slams in on press.
- **Ghost button:** white slab with ink text.
- **Panels:** white with 3px ink and an 8px slab shadow.
- **Options:** white; selected is electric blue with white text; the share bar is solid lime.
- **Tiles:** colour blocks in a 4-colour cycle with square black avatars.
- **Eyebrow:** a black label tag (lime in dark).
- **Message feed:** the newest line is boxed: white, 3px ink border, `6px 6px 0 #ff5c00`, padding `.15em .4em`, centred.
- **Hero number:** a black block with lime text and an orange offset shadow.
- **Feature card:** lime.

#### Motion & interaction

Press slam (90ms) and the ticker (14s loop, large displays only). Nothing else moves.

#### Imagery

No filter; full-colour art as-is.

#### Accessibility & pitfalls

- Blue `--accent-text` is 4.7:1 on off-white but 3.7:1 on the black dark page. Use it for large text in dark.
- On split backgrounds, any text over the blue half needs the `.split-left` white colours.
- The ticker is decorative and `aria-hidden`; never put the only copy of important information in it.

#### Performance notes / cost

Cost tier: **lowest**. Hard shadows and flat fills; one transformed ticker.

#### Do / Don't

Do:
- Use flat, saturated blocks with hard colour stops.
- Use black tags for labels and kickers.
- Keep radius at zero and borders at 3px.
- Make press feedback a full slam into the shadow.

Don't:
- Add halftone, tilt or comic fonts (that is Comic Pop).
- Use gradients that blend: stops must be hard.
- Soften shadows or round corners.
- Run the ticker on phones.

#### Copy-paste CSS

```css
/* Neo-Brutalist: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged.
   The ticker text is a placeholder: the reference text was app-specific. */
[data-style="brutal"] {
  --bg: #f4f1ea; --fg: #0a0a0a; --muted: #3b3b3b;
  --panel: #fff; --line: #0a0a0a; --bw: 3px; --r: 0px; --r-sm: 0px;
  --shadow: 8px 8px 0 #0a0a0a; --shadow-sm: 5px 5px 0 #0a0a0a;
  --accent: #ff5c00; --accent-fg: #0a0a0a; --accent-text: #2b59ff;
  --field: #fff; --tile: #fff; --chip-bg: #fff; --chip-fg: #0a0a0a; --chip-bw: 3px; --chip-r: 0;
  --panel-fg: #0a0a0a; --field-fg: #0a0a0a; --tile-fg: #0a0a0a; --muted-panel: #3b3b3b;
  --font-d: "Archivo Black", "Arial Black", sans-serif; --font-b: "Archivo", system-ui, sans-serif;
  --d-weight: 400; --d-track: -.02em; --d-case: uppercase; --d-lh: .92;
  --btn-case: uppercase; --btn-weight: 800; --btn-track: .02em; --btn-r: 0; --av-r: 0;
  --btn-shadow: 5px 5px 0 #0a0a0a; --btn-shadow-press: 0 0 0 #0a0a0a; --press: translate(5px, 5px);
  --bar: #c6ff00;
}
[data-style="brutal"] .bg-layer { background: var(--bg); }
[data-style="brutal"] .screen.is-split .bg-layer { background: linear-gradient(90deg, #2b59ff 0 42%, var(--bg) 42%); }
[data-style="brutal"] .screen.is-split .split-left { color: #fff; }
[data-style="brutal"] .screen.is-split .split-left .sub { color: #e6ebff; } [data-style="brutal"] .screen.is-split .split-left .sub b { color: #fff; }
[data-style="brutal"] .screen.is-hero .bg-layer { background: linear-gradient(180deg, #c6ff00 0 30%, var(--bg) 30%); }
[data-style="brutal"] .screen.is-choice .bg-layer { background: linear-gradient(180deg, #ff3d8b 0 26%, var(--bg) 26%); }
[data-style="brutal"] .eyebrow { display: table; margin-bottom: .3em; background: #0a0a0a; color: #fff; padding: .25em .55em; letter-spacing: .14em; justify-self: start; }
[data-style="brutal"] .hero-number { background: #0a0a0a; color: #c6ff00; display: inline-block; padding: 0 .12em; box-shadow: calc(var(--u)*10) calc(var(--u)*10) 0 #ff5c00; }
[data-style="brutal"] .tile:nth-child(4n+1) { background: #ff5c00; } [data-style="brutal"] .tile:nth-child(4n+2) { background: #c6ff00; }
[data-style="brutal"] .tile:nth-child(4n+3) { background: #ff3d8b; } [data-style="brutal"] .tile:nth-child(4n) { background: #8ab4ff; }
[data-style="brutal"] .tile .avatar { background: #0a0a0a; border-radius: 0; }
[data-style="brutal"] .option.is-selected { background: #2b59ff; color: #fff; }
[data-style="brutal"] .btn.ghost { --ghost-bg: #fff; --ghost-fg: #0a0a0a; }
[data-style="brutal"] .feature-card { --role-bg: #c6ff00; }
[data-style="brutal"] .screen.is-dark { --bg: #0a0a0a; --fg: #f4f1ea; --muted: #bdbdbd; }
[data-style="brutal"] .screen.is-dark .eyebrow { background: #c6ff00; color: #0a0a0a; }
[data-style="brutal"] .screen.is-dark .timer { color: #c6ff00; }
[data-style="brutal"] .feed p.is-new { background: #fff; color: #0a0a0a; border: 3px solid #0a0a0a; box-shadow: 6px 6px 0 #ff5c00; padding: .15em .4em; justify-self: center; }
[data-style="brutal"] .ticker { display: block; position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--u) * 34); background: #0a0a0a; overflow: hidden; border-top: 3px solid #0a0a0a; }
[data-style="brutal"] .ticker::before { content: "NEW RELEASE  ●  READ MORE  ●  OPEN NOW  ●  YOUR BRAND  ●  NEW RELEASE  ●  READ MORE  ●  OPEN NOW  ●  YOUR BRAND  ●  "; /* reference text was app-specific; keep the message written out twice so translateX(-50%) loops seamlessly */ position: absolute; white-space: nowrap; top: 50%; translate: 0 -50%; color: #c6ff00; font-family: "Archivo Black", sans-serif; font-size: calc(var(--u) * 16); letter-spacing: .08em; animation: tick 14s linear infinite; }
@keyframes tick { to { transform: translateX(-50%); } }
[data-style="brutal"] .screen.mobile .ticker { display: none; }
```

---

### 3.4 Tide Pool (`tide`)

#### Concept & mood

An original cartoon-undersea take on neo-brutalism. A water gradient carries sunny yellow, coral, mint and lilac blocks with navy ink outlines and rounded or pill shapes. Luckiest Guy headings have a navy stroke and a hard shadow. Bubbles rise with a wobble, light rays sway down from the surface, and a sandy floor holds swaying kelp. The dark variant is the deep sea with glowing cyan bubbles. The style is original and must not reference any franchise: no named characters, no pineapple houses, no "flower sky" pattern.

**Good for:** kids' and family products, aquariums, travel and summer campaigns, casual games, playful SaaS onboarding.

#### Palette

Default:

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#1fb6ff` | Water (painted as a gradient) |
| `--fg` | `#062a4d` | Navy ink |
| `--muted` | `#0b4f86` | Secondary text on water |
| `--panel` / `--panel-fg` | `#fff8e1` / `#062a4d` | Cream panels |
| `--muted-panel` | `#2b5d86` | Secondary text on panels |
| `--line` | `#062a4d` | Ink outlines |
| `--accent` / `--accent-fg` | `#ffd23f` / `#062a4d` | Sunny yellow primary |
| `--accent-text` | `#ff5a4f` | Coral text accent |
| `--field`, `--tile` | `#fff` | Inputs, tiles |
| `--field-fg`, `--tile-fg` | `#062a4d` | Their text |
| `--chip-bg` / `--chip-fg` | `#fff8e1` / `#062a4d` | Chips |
| `--bar` | `repeating-linear-gradient(90deg, #2ee59d 0 8px, #7cf5c2 8px 16px)` | Mint striped share bar |

Other colours: water `linear-gradient(180deg, #4fd2ff 0%, #1fb6ff 38%, #0a7fd1 100%)`; light rays `rgba(255,255,255,.38)` fading to 0; bubbles with `rgba(255,255,255,.85)` rims and a `rgba(255,255,255,.9)` highlight; sand `#ffe08a` with dots `rgba(6,42,77,.18)`; kelp `#2ee59d` and `#13c47f`; tiles cycle `#ffd23f` / `#ff8a7a` / `#7cf5c2` / `#c9b6ff`; selected option `#ff5a4f` with `#fff8e1` text; feature card `#ff8a7a`; hero-number shadow `#ff5a4f`.

Dark variant:

| Token / element | Value |
| --- | --- |
| `--fg` | `#e9fbff` |
| `--muted` | `#8fd8ff` |
| Water | `linear-gradient(180deg, #0a3b7a 0%, #06225a 45%, #020c2b 100%)` |
| Light rays | hidden |
| Bubbles | rim `rgba(120,240,255,.7)`, glow `0 0 10px rgba(80,230,255,.6)` |
| Sand | `#2a3550` |

#### Typography

- Families: Luckiest Guy (display, buttons); Archivo (body, message feed at weight 800).
- Google Fonts: `https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Archivo:wght@400;600;800&display=swap`
- Display: weight 400, tracking `.03em`, line-height 1. Colour `#ffd23f` with `-webkit-text-stroke: 2.5u #062a4d`, `paint-order: stroke fill` and `text-shadow: 4u 4u 0 #062a4d`.
- Headings inside panels, list cards, rosters and forms revert to plain navy with no stroke or shadow.
- Hero number: yellow, 5u navy stroke, `10u 10u 0 #ff5a4f` coral shadow, tracking `.08em`.
- Timer: yellow with a 2u navy stroke.
- Buttons: Luckiest Guy, tracking `.06em`.
- Eyebrow: a navy pill with yellow text, padding `.3em .7em`, tracking `.14em`.
- Feature-card heading: cream with a 2u navy stroke and `3px 3px 0` navy shadow.

#### Shape & lines

`--bw: 3px`, `--r: 14px`, `--r-sm: 10px`. Buttons and chips are pills; chips have a 3px border. Avatars have a 2px navy border.

#### Depth & surfaces

Panels `6px 6px 0 #062a4d`; buttons `4px 4px 0 #062a4d`, pressing `translate(4px, 4px)` onto a zero shadow. Art casts `drop-shadow(3px 3px 0 #062a4d)`. No blur.

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Water | 180° gradient, light at the surface and deep at the bottom. |
| Light rays `.spot.s1/.s2` | 22% wide, 95% tall, starting 12% above the top. Cone shape via `clip-path: polygon(40% 0, 60% 0, 100% 100%, 0 100%)`, fading white gradient, `transform-origin: 50% 0`. They sway with `sway1 9s` (left 14%) and `sway2 11s` (right 18%). Hidden in dark. |
| Bubbles (the `.petals` slots) | Eight circles rising from 8% below the bottom: 18u by default, every 3rd 10u, every 4th 26u. 2px white rim and a radial highlight at 32% 30%. The `bubble` keyframes rise 960u with a ±10–14u sideways wobble at the quarter points. Per-bubble `--x`, `--d`, `--dl` come from the skeleton (§1.5). |
| Sand `.ground` | 9% tall at the bottom, `#ffe08a`, 3px navy top border, dot texture on a 14u grid. |
| Kelp `.ground::before/::after` | Fronds 22u wide and 120u / 160u tall with a 3px navy outline, `border-radius: 60% 60% 10% 10% / 90% 90% 10% 10%`, fills `#2ee59d` / `#13c47f`, at left 6% and right 9%. They sway ±7° from the base (`kelp 4s` and `5.2s`). |

The screen gets `padding-bottom: 80u` so content clears the sand.

#### Components

- **Primary button:** yellow pill, navy outline, 4px hard shadow, Luckiest Guy.
- **Ghost button:** cream pill, navy text.
- **Panels:** cream, 3px navy, 14px radius, 6px shadow.
- **Options:** white; selected is coral with cream text; the share bar is mint stripes.
- **Tiles:** 4-colour cycle with navy-ringed avatars.
- **Message feed:** each line is a cream pill bubble with a 3px navy border, `5px 5px 0` shadow and Archivo 800 text. Older lines are `.55` opacity and `scale(.94)`.
- **Result cards:** tilted −1.5° / +1.5°. The tilt is overridden by the entrance fill; see the Comic Pop pitfall.
- **Feature card:** coral.

#### Motion & interaction

Bubbles (9–16.5s linear), rays (9s and 11s), kelp (4s and 5.2s), art float (3.4s), press (90ms). All transform-only; bubbles and rays have `will-change: transform`.

#### Imagery

Hard navy edge `drop-shadow(3px 3px 0 #062a4d)` plus `float 3.4s ease-in-out infinite`.

#### Accessibility & pitfalls

- Navy text on the deep end of the water gradient (`#0a7fd1`) is only 3.4:1, and `--muted` (`#0b4f86`) drops to 2.0:1. Put body and secondary text on cream panels (6.6–13.7:1) and keep text placed directly on water large and bold.
- Coral `--accent-text` on water is 1.3:1. Never use it for text on the background; on cream panels it is 2.9:1, enough only for large bold labels.
- Selected option (cream on coral) is 2.9:1. Consider navy text on coral if the labels are small.
- The dark palette fixes the page text (10.3:1).
- IP: keep the scene generic. No franchise names, characters, pineapple houses or flower-sky patterns.

#### Performance notes / cost

Cost tier: **low**. 8 bubbles, 2 rays and 2 kelp fronds, all `transform`. Lite mode hides bubbles, rays and kelp.

#### Do / Don't

Do:
- Use navy ink outlines and hard shadows on pill shapes.
- Stroke and shadow display text on the water; use plain navy inside panels.
- Keep long text on cream panels.
- Keep the scene original.

Don't:
- Put muted or coral text directly on the water.
- Add franchise references.
- Use square corners (that is Neo-Brutalist).
- Animate more than a handful of particles on phones.

#### Copy-paste CSS

```css
/* Tide Pool: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged.
   Bubbles reuse the eight `.petals > i` slots from the page skeleton (§1.5). */
[data-style="tide"] {
  --bg: #1fb6ff; --fg: #062a4d; --muted: #0b4f86;
  --panel: #fff8e1; --line: #062a4d; --bw: 3px; --r: 14px; --r-sm: 10px;
  --shadow: 6px 6px 0 #062a4d;
  --accent: #ffd23f; --accent-fg: #062a4d; --accent-text: #ff5a4f;
  --field: #fff; --tile: #fff; --chip-bg: #fff8e1; --chip-fg: #062a4d; --chip-bw: 3px; --chip-r: 999px;
  --panel-fg: #062a4d; --field-fg: #062a4d; --tile-fg: #062a4d; --muted-panel: #2b5d86;
  --font-d: "Luckiest Guy", "Archivo Black", Impact, sans-serif; --font-b: "Archivo", system-ui, sans-serif; --font-btn: "Luckiest Guy", Impact, sans-serif;
  --d-weight: 400; --d-track: .03em; --d-lh: 1; --btn-weight: 400; --btn-track: .06em; --btn-r: 999px; --code-track: .08em;
  --btn-shadow: 4px 4px 0 #062a4d; --btn-shadow-press: 0 0 0 #062a4d; --press: translate(4px, 4px);
  --bar: repeating-linear-gradient(90deg, #2ee59d 0 8px, #7cf5c2 8px 16px);
}
[data-style="tide"] .bg-layer { background: linear-gradient(180deg, #4fd2ff 0%, #1fb6ff 38%, #0a7fd1 100%); }
[data-style="tide"] .screen.is-dark { --fg: #e9fbff; --muted: #8fd8ff; }
[data-style="tide"] .screen.is-dark .bg-layer { background: linear-gradient(180deg, #0a3b7a 0%, #06225a 45%, #020c2b 100%); }
[data-style="tide"] .spot { display: block; position: absolute; top: -12%; width: 22%; height: 95%; background: linear-gradient(180deg, rgba(255,255,255,.38), rgba(255,255,255,0) 85%); clip-path: polygon(40% 0, 60% 0, 100% 100%, 0 100%); transform-origin: 50% 0; will-change: transform; }
[data-style="tide"] .spot.s1 { left: 14%; animation: sway1 9s ease-in-out infinite; } [data-style="tide"] .spot.s2 { right: 18%; animation: sway2 11s ease-in-out infinite; }
[data-style="tide"] .screen.is-dark .spot { display: none; }
[data-style="tide"] .petals { display: block; position: absolute; inset: 0; }
[data-style="tide"] .petals i { position: absolute; bottom: -8%; left: var(--x, 10%); width: calc(var(--u) * 18); height: calc(var(--u) * 18); border-radius: 50%;
  border: 2px solid rgba(255,255,255,.85); background: radial-gradient(circle at 32% 30%, rgba(255,255,255,.9) 0 18%, rgba(255,255,255,.08) 22%); will-change: transform;
  animation: bubble var(--d, 11s) linear infinite; animation-delay: var(--dl, 0s); }
[data-style="tide"] .petals i:nth-child(3n) { width: calc(var(--u) * 10); height: calc(var(--u) * 10); }
[data-style="tide"] .petals i:nth-child(4n) { width: calc(var(--u) * 26); height: calc(var(--u) * 26); }
@keyframes bubble { 0% { transform: translate3d(0, 0, 0); } 25% { transform: translate3d(calc(var(--u) * 14), calc(var(--u) * -230), 0); } 50% { transform: translate3d(calc(var(--u) * -10), calc(var(--u) * -470), 0); } 75% { transform: translate3d(calc(var(--u) * 12), calc(var(--u) * -700), 0); } 100% { transform: translate3d(0, calc(var(--u) * -960), 0); } }
[data-style="tide"] .screen.is-dark .petals i { border-color: rgba(120,240,255,.7); box-shadow: 0 0 10px rgba(80,230,255,.6); }
[data-style="tide"] .ground { display: block; position: absolute; left: 0; right: 0; bottom: 0; height: 9%; background: #ffe08a; border-top: 3px solid #062a4d;
  background-image: radial-gradient(circle, rgba(6,42,77,.18) 1.5px, transparent 2px); background-size: calc(var(--u) * 14) calc(var(--u) * 14); }
[data-style="tide"] .ground::before, [data-style="tide"] .ground::after { content: ""; position: absolute; bottom: 70%; width: calc(var(--u) * 22); height: calc(var(--u) * 120); border: 3px solid #062a4d; border-radius: 60% 60% 10% 10% / 90% 90% 10% 10%; background: #2ee59d; transform-origin: 50% 100%; animation: kelp 4s ease-in-out infinite; }
[data-style="tide"] .ground::before { left: 6%; } [data-style="tide"] .ground::after { right: 9%; height: calc(var(--u) * 160); animation-duration: 5.2s; background: #13c47f; }
@keyframes kelp { 0%, 100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
[data-style="tide"] .screen.is-dark .ground { background-color: #2a3550; }
[data-style="tide"] .screen { padding-bottom: calc(var(--u) * 80); }
[data-style="tide"] .display { color: #ffd23f; -webkit-text-stroke: calc(var(--u) * 2.5) #062a4d; paint-order: stroke fill; text-shadow: calc(var(--u)*4) calc(var(--u)*4) 0 #062a4d; }
[data-style="tide"] .panel .display, [data-style="tide"] .list-card h2, [data-style="tide"] .roster h2, [data-style="tide"] .screen.is-form h3 { color: #062a4d; -webkit-text-stroke: 0; text-shadow: none; }
[data-style="tide"] .hero-number { color: #ffd23f; -webkit-text-stroke: calc(var(--u) * 5) #062a4d; paint-order: stroke fill; text-shadow: calc(var(--u) * 10) calc(var(--u) * 10) 0 #ff5a4f; }
[data-style="tide"] .eyebrow { display: table; background: #062a4d; color: #ffd23f; padding: .3em .7em; border-radius: 999px; letter-spacing: .14em; margin-bottom: .3em; }
[data-style="tide"] .tile:nth-child(4n+1) { background: #ffd23f; } [data-style="tide"] .tile:nth-child(4n+2) { background: #ff8a7a; }
[data-style="tide"] .tile:nth-child(4n+3) { background: #7cf5c2; } [data-style="tide"] .tile:nth-child(4n) { background: #c9b6ff; }
[data-style="tide"] .tile .avatar { border: 2px solid #062a4d; }
[data-style="tide"] .option.is-selected { background: #ff5a4f; color: #fff8e1; }
[data-style="tide"] .btn.ghost { --ghost-bg: #fff8e1; --ghost-fg: #062a4d; }
[data-style="tide"] .feature-card { --role-bg: #ff8a7a; }
[data-style="tide"] .feature-card .display { color: #fff8e1; -webkit-text-stroke: calc(var(--u) * 2) #062a4d; paint-order: stroke fill; text-shadow: 3px 3px 0 #062a4d; }
[data-style="tide"] .feed p { background: #fff8e1; color: #062a4d; border: 3px solid #062a4d; border-radius: 999px; padding: .2em .9em; box-shadow: 5px 5px 0 #062a4d; justify-self: center; font-family: "Archivo", sans-serif; font-weight: 800; }
[data-style="tide"] .feed p.is-old { opacity: .55; transform: scale(.94); }
[data-style="tide"] .art img { filter: drop-shadow(3px 3px 0 #062a4d); animation: float 3.4s ease-in-out infinite; }
[data-style="tide"] .timer, [data-style="tide"] .timer-sm { color: #ffd23f; -webkit-text-stroke: calc(var(--u) * 2) #062a4d; paint-order: stroke fill; }
[data-style="tide"] .result-card:nth-child(odd) { transform: rotate(-1.5deg); } [data-style="tide"] .result-card:nth-child(even) { transform: rotate(1.5deg); }

/* Shared keyframes this style uses (defined once in the base layer in the reference) */
@keyframes sway1 { 0%, 100% { transform: rotate(-14deg); } 50% { transform: rotate(6deg); } }
@keyframes sway2 { 0%, 100% { transform: rotate(14deg); } 50% { transform: rotate(-6deg); } }
@keyframes float { 50% { transform: translateY(-6%); } }
```

---

### 3.5 Claymation (`clay`)

#### Concept & mood

A pastel peach world made of puffy clay. Every surface is built only from layered inset light and dark shadows plus a soft drop shadow, with no borders. Radii are big and the type is Fredoka. Buttons squash on press (`scale(.94, .88)`) and spring back with an overshoot curve; illustrations "breathe" with a squash-and-stretch loop; small clay blobs drift at the edges. The dark variant is lilac and indigo clay.

**Good for:** wellness and habit apps, kids' products, friendly consumer apps, toy, candy and snack brands, gentle dashboards.

#### Palette

Default:

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#ffe5d9` | Peach page (plus a warm radial `#ffd6c4` at the top-left) |
| `--fg` | `#4a3f55` | Plum text |
| `--muted` | `#7d6f8a` | Secondary text |
| `--panel` | `#fff6ef` | Clay panel |
| `--line` | `transparent` | No borders |
| `--accent` / `--accent-fg` | `#ff8fab` / `#fff` | Pink primary |
| `--accent-text` | `#e2557f` | Pink text accent |
| `--field` | `#ffeef3` | Inputs, options |
| `--tile` | `#e3f6ec` | Tiles (then recoloured per position) |
| `--chip-bg` | `#fff6ef` | Chips |
| `--bar` | `linear-gradient(90deg, #ffd6e0, #ffeef3)` | Share bar |

Other colours: tiles cycle `#ffd6e0` / `#d6ecff` / `#fff1b8`; blobs `#c8f0dc`, `#e3d5ff`, `#fff1b8`; selected option `#ff8fab` with `#fff`; feature card `#ffb4c6` with text `#4a3f55` and muted `#6f5a72`; hero number `#ff8fab` with an `#e2557f` extrusion.

Dark variant:

| Token | Value |
| --- | --- |
| `--bg` | `#2e2b4f` (plus radial `#4b3f86` at 80% 0%) |
| `--fg` | `#fff4f8` |
| `--muted` | `#c9bfe6` |
| `--panel` | `#3f3a6b` |
| `--field`, `--tile`, `--chip-bg` | `#4a4580` |
| `--clay` | `inset -5px -6px 10px rgba(0,0,0,.28), inset 5px 6px 10px rgba(255,255,255,.12), 0 14px 26px -12px rgba(0,0,0,.6)` |

#### Typography

- Family: Fredoka 500/600/700 for everything.
- Google Fonts: `https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=swap`
- Display: weight 700, tracking `-.01em`, sentence case.
- Buttons: weight 600.
- Hero number: tracking `.06em`, `#ff8fab` with `text-shadow: 0 6u 0 #e2557f, 0 14u 18u rgba(160,40,80,.3)`, a solid extrusion plus a soft cast shadow.

#### Shape & lines

`--bw: 0` (no borders at all), `--r: 34px`, `--r-sm: 22px`. Buttons and chips are pills.

#### Depth & surfaces

The whole style is the `--clay` shadow stack:

```css
--clay: inset -5px -6px 10px rgba(120,80,60,.16),   /* shade on the lower right */
        inset 5px 6px 10px rgba(255,255,255,.85),   /* highlight on the upper left */
        0 14px 26px -12px rgba(120,80,60,.35);      /* soft drop onto the table */
```

It is applied to panels, fields, tiles, options, segments, chips, the QR frame, ghost buttons and blobs. Buttons use a pinker version: `inset -4px -5px 8px rgba(160,40,80,.25), inset 4px 5px 8px rgba(255,255,255,.55), 0 10px 18px -8px rgba(200,60,100,.5)`. The selected option keeps only the inset layers, so it looks pressed into the surface. `--shadow: var(--clay)` is re-declared on `.screen` so the dark palette's `--clay` reaches panels (§1.10, rule 2).

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Warm glow | `radial-gradient(120% 80% at 0% 0%, #ffd6c4, transparent 60%)` over `--bg`. |
| Clay blobs `.blob.b1/.b2/.b3` | Circles of 15%, 9% and 7% width with the clay shadow: b1 mint at the bottom-right (`drift2 18s`), b2 lilac at the top-left (`drift1 15s`), b3 butter at the bottom (`drift3 20s`). Each has `will-change: transform`. |

#### Components

- **Primary button:** pink clay pill with white text. Press squashes to `scale(.94, .88)` in 90ms with `--ease-ui`; release springs back with `transform 420ms cubic-bezier(.34,1.56,.64,1)` (the 1.56 control point overshoots).
- **Ghost button:** cream clay pill, plum text.
- **Panels:** cream clay at 34px radius.
- **Options:** clay pills of `#ffeef3`; the same squash and spring. Selected is pink with white text and pressed-in shading.
- **Tiles:** 3-colour pastel cycle in clay.
- **Feature card:** a darker pink (`#ffb4c6`) clay card with plum text.
- **Hero number:** extruded pink.

#### Motion & interaction

Squash and spring on buttons and options; art squish (`scale(1.05, .95)` at 50%, 2.6s ease-in-out, `transform-origin: 50% 100%` so it squashes onto its base); blobs drift (15–20s).

#### Imagery

Full colour with `drop-shadow(0 10px 8px rgba(120,80,60,.25))` and the squish loop.

#### Accessibility & pitfalls

- White on `#ff8fab` is 2.1:1, so primary-button and selected-option labels fail WCAG AA in both palettes. Fix by using `--fg` (`#4a3f55`) as `--accent-fg`, or by darkening the accent.
- `--accent-text` (`#e2557f`) on peach is 2.7–3.0:1, and `--muted` on the page is 3.5:1. Use them for large text only.
- Dark trap: tiles keep their light pastel fills, but `--tile-fg` is unset, so tile text follows the dark-palette `--fg` (`#fff4f8`). Set `--tile-fg: #4a3f55` if tiles appear on dark screens.
- With no borders, surfaces exist only as shadows. In forced-colours (high contrast) mode, shadows are removed and surfaces can vanish. Add `@media (forced-colors: active) { .panel, .field, .option, .btn { border: 1px solid CanvasText; } }` (recommendation, not in source).

#### Performance notes / cost

Cost tier: **low**. Many layered shadows, but they are static. Only blobs and art animate (transform). The button `box-shadow` transition is 150ms and one-off.

#### Do / Don't

Do:
- Build surfaces from light/dark inset pairs and a soft drop, with no borders.
- Use big radii (22–34px) and pills.
- Use the squash-and-spring press on everything tappable.
- Keep the palette pastel.

Don't:
- Add hard outlines or flat shadows.
- Use white text on pale pastels for small labels.
- Spring layout properties; spring only `transform`.
- Forget to re-declare `--shadow` on the screen when the dark palette changes `--clay`.

#### Copy-paste CSS

```css
/* Claymation: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged. */
[data-style="clay"] {
  --clay: inset -5px -6px 10px rgba(120,80,60,.16), inset 5px 6px 10px rgba(255,255,255,.85), 0 14px 26px -12px rgba(120,80,60,.35);
  --bg: #ffe5d9; --fg: #4a3f55; --muted: #7d6f8a;
  --panel: #fff6ef; --line: transparent; --bw: 0px; --r: 34px; --r-sm: 22px; --shadow: var(--clay);
  --accent: #ff8fab; --accent-fg: #fff; --accent-text: #e2557f;
  --field: #ffeef3; --tile: #e3f6ec; --chip-bg: #fff6ef;
  --font-d: "Fredoka", "Baloo 2", system-ui, sans-serif; --font-b: "Fredoka", system-ui, sans-serif;
  --d-weight: 700; --d-track: -.01em; --btn-weight: 600; --btn-r: 999px; --code-track: .06em;
  --btn-shadow: inset -4px -5px 8px rgba(160,40,80,.25), inset 4px 5px 8px rgba(255,255,255,.55), 0 10px 18px -8px rgba(200,60,100,.5);
  --press: scale(.94, .88);
  --bar: linear-gradient(90deg, #ffd6e0, #ffeef3);
}
[data-style="clay"] .screen { --shadow: var(--clay); }
[data-style="clay"] .bg-layer { background: radial-gradient(120% 80% at 0% 0%, #ffd6c4, transparent 60%), var(--bg); }
[data-style="clay"] .btn, [data-style="clay"] .option { transition: transform 420ms cubic-bezier(.34,1.56,.64,1), box-shadow 150ms var(--ease-ui); }
[data-style="clay"] .btn:active, [data-style="clay"] .option:active { transition-duration: 90ms; transition-timing-function: var(--ease-ui); }
[data-style="clay"] .field, [data-style="clay"] .tile, [data-style="clay"] .option, [data-style="clay"] .segments span, [data-style="clay"] .chip, [data-style="clay"] .qr-wrap { box-shadow: var(--clay); }
[data-style="clay"] .tile:nth-child(3n+1) { background: #ffd6e0; } [data-style="clay"] .tile:nth-child(3n+2) { background: #d6ecff; } [data-style="clay"] .tile:nth-child(3n) { background: #fff1b8; }
[data-style="clay"] .btn.ghost { --ghost-bg: #fff6ef; --ghost-fg: #4a3f55; box-shadow: var(--clay); }
[data-style="clay"] .option.is-selected { background: #ff8fab; color: #fff; box-shadow: inset -4px -5px 8px rgba(160,40,80,.25), inset 4px 5px 8px rgba(255,255,255,.5); }
[data-style="clay"] .art img { animation: squish 2.6s ease-in-out infinite; transform-origin: 50% 100%; filter: drop-shadow(0 10px 8px rgba(120,80,60,.25)); }
@keyframes squish { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.05, .95); } }
[data-style="clay"] .blob { display: block; position: absolute; border-radius: 50%; box-shadow: var(--clay); will-change: transform; }
[data-style="clay"] .blob.b1 { width: 15%; aspect-ratio: 1; right: -4%; bottom: -5%; background: #c8f0dc; animation: drift2 18s ease-in-out infinite; }
[data-style="clay"] .blob.b2 { width: 9%; aspect-ratio: 1; left: -2%; top: -3%; background: #e3d5ff; animation: drift1 15s ease-in-out infinite; }
[data-style="clay"] .blob.b3 { width: 7%; aspect-ratio: 1; left: 30%; bottom: -3%; background: #fff1b8; animation: drift3 20s ease-in-out infinite; }
[data-style="clay"] .screen.is-dark { --bg: #2e2b4f; --fg: #fff4f8; --muted: #c9bfe6; --panel: #3f3a6b; --field: #4a4580; --tile: #4a4580; --chip-bg: #4a4580;
  --clay: inset -5px -6px 10px rgba(0,0,0,.28), inset 5px 6px 10px rgba(255,255,255,.12), 0 14px 26px -12px rgba(0,0,0,.6); }
[data-style="clay"] .screen.is-dark .bg-layer { background: radial-gradient(100% 70% at 80% 0%, #4b3f86, transparent 60%), var(--bg); }
[data-style="clay"] .feature-card { --role-bg: #ffb4c6; --panel-fg: #4a3f55; --muted-panel: #6f5a72; color: #4a3f55; }
[data-style="clay"] .hero-number { color: #ff8fab; text-shadow: 0 calc(var(--u)*6) 0 #e2557f, 0 calc(var(--u)*14) calc(var(--u)*18) rgba(160,40,80,.3); }

/* Shared keyframes this style uses (defined once in the base layer in the reference) */
@keyframes drift1 { 50% { transform: translate(18%, 10%) scale(1.15); } }
@keyframes drift2 { 50% { transform: translate(-16%, -12%) scale(.9); } }
@keyframes drift3 { 50% { transform: translate(10%, -16%) scale(1.1); } }
```

---

### 3.6 ASCII Terminal (`ascii`)

#### Concept & mood

A green-phosphor CRT: `#33ff00` on near-black with amber `#ffb000` as the second colour, zero radius and 1px lines. VT323 is the display face and JetBrains Mono the body face, with a subtle text glow and a scanline overlay. Panels are labelled `┤ LABEL ├`, buttons render as `[ LABEL ]` and invert on hover or press, lines start with `>` prompts, new lines type themselves out behind a blinking block cursor, images become ASCII art, and large displays can run a character rain.

**Good for:** developer tools, CLI and API product sites, hacker and CTF events, status pages, retro or technical portfolios, docs for terminal products.

#### Palette

Default (there is no dark variant):

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#050505` | Screen |
| `--fg` | `#33ff00` | Phosphor green text and lines |
| `--muted` | `#1f9c00` | Dim green |
| `--panel`, `--field`, `--tile` | `#050505` | Surfaces are the background |
| `--line` | `#33ff00` | 1px lines |
| `--accent` / `--accent-fg` | `#33ff00` / `#050505` | Inverted (selected) state |
| `--accent-text` | `#ffb000` | Amber: prompts, labels, avatars |
| `--chip-bg` | `transparent` | Chips |
| `--qr-bg` / `--qr-fg` | `#050505` / `#33ff00` | Green QR on black |
| `--bar` | `repeating-linear-gradient(90deg, rgba(51,255,0,.28) 0 6px, transparent 6px 9px)` | Segmented meter |

Other: glow `text-shadow: 0 0 6px rgba(51,255,0,.35)` on the whole screen; scanlines `repeating-linear-gradient(0deg, rgba(0,0,0,.28) 0 1px, transparent 1px 3px)`; rain glyphs `#33ff00` over a `rgba(5,5,5,.22)` fade.

Dark variant: not defined in source (the style is already dark).

#### Typography

- Families: VT323 (display, hero number); JetBrains Mono 400/700 (body, buttons, feed, ASCII art).
- Google Fonts: `https://fonts.googleapis.com/css2?family=VT323&family=JetBrains+Mono:wght@400;700&display=swap`
- Display: uppercase, weight 400, line-height `.9`, tracking `.02em`.
- Buttons: JetBrains Mono 700, uppercase.
- Hero number: 200u, line-height `.8`.
- Feed: JetBrains Mono 400, 30u, left-aligned.
- Timer tracking 0.

#### Shape & lines

`--bw: 1px`; every radius is 0 (panels, buttons, chips, avatars). Chips have a 1px border. Avatars are transparent squares with a 1px amber border and amber initials.

#### Depth & surfaces

No shadows (`--shadow: none`). Depth comes from the glow and the scanline overlay: `.screen::after` covers the whole screen at `z-index: 20` with `pointer-events: none`.

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Scanlines | `.screen::after` repeating gradient: 1px dark line every 3px. |
| Glow | `text-shadow` on `.screen`, inherited by all text; removed on inverted elements. |
| Panel label | `.panel[data-label]::before { content: "┤ " attr(data-label) " ├"; }` sits on the top border (`top: -.75em; left: 1em`), with `background: var(--bg)` to cut the line, in amber at `.78em`. |
| Character rain | `<canvas class="deco rain">` at `opacity: .32`, drawn by the script in §1.13. Large-display dark screens only in the reference. |

#### Components

- **Buttons:** transparent with a green border and green text. `::before` adds `"[ "` and `::after` adds `" ]"`. On hover (pointer devices) and on press they invert to a green fill with black text and no glow. `--press: none`: no movement.
- **Ghost buttons:** look the same as primary (both are outlined).
- **Options:** outlined; they invert on hover and press. Selected stays inverted and gets a `"> "` prefix.
- **Chips:** outlined; `.is-off` shows an `"x "` prefix instead of a strike-through.
- **Message feed:** each line starts with an amber `"> "`. The newest types itself out with `type 900ms steps(28)` (a `clip-path` wipe in 28 steps) and ends with a blinking `█` cursor (`blink 1s steps(1) infinite`).
- **Panels:** black with a 1px green border and an amber label.
- **Hero number:** VT323 at 200u.

#### Motion & interaction

Typewriter (900ms), cursor blink (1s), rain (15 fps). The inverted hover/press is instant colour, not motion.

#### Imagery

HD images are hidden and the `<pre class="ascii">` is shown in `--accent` green. Hero and headline art use amber. Sizes come from `--ascii-size`:

| Context | `--ascii-size` |
| --- | --- |
| Default | `5.2u` |
| List-card art, page-hero art | `2.4u` |
| Feature-card art | `5.4u` |
| Result-card art | `3u` |
| Hero art (amber) | `4.2u` |
| Headline art (amber) | `3.4u` |

The ASCII is generated offline from each image by luminance (§1.14).

#### Accessibility & pitfalls

- Contrast is high (15:1 text, 5.6:1 muted, 11.1:1 amber).
- The scanline overlay darkens everything slightly. Do not lower the text colours further.
- The bracket, prompt and `x ` glyphs are CSS `content` that screen readers may read out. Use `content: "[ " / ""` if that matters (not in source).
- The typewriter animates `clip-path`, an exception to the transform/opacity rule. It runs once per new line. The rain respects reduced motion and lite mode.

#### Performance notes / cost

Cost tier: **low**. The rain is the only ongoing cost: canvas at 15 fps, DPR capped at 1.5, about 64 columns, paused when off-screen or when the tab is hidden.

#### Do / Don't

Do:
- Keep to two colours (green and amber) on near-black.
- Use generated brackets and prompts for UI chrome.
- Invert for hover, press and selection instead of moving things.
- Convert images to ASCII rather than tinting them.

Don't:
- Round any corner or add soft shadows.
- Use more than one glow strength.
- Run the rain on phones or under reduced motion.
- Set long passages in VT323; use JetBrains Mono for body text.

#### Copy-paste CSS

Add the rain script from §1.13 if you want the rain.

```css
/* ASCII Terminal: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged. */
[data-style="ascii"] {
  --bg: #050505; --fg: #33ff00; --muted: #1f9c00;
  --panel: #050505; --line: #33ff00; --bw: 1px; --r: 0px; --r-sm: 0px;
  --shadow: none; --accent: #33ff00; --accent-fg: #050505; --accent-text: #ffb000;
  --field: #050505; --tile: #050505; --chip-bg: transparent; --chip-bw: 1px; --chip-r: 0;
  --font-d: "VT323", ui-monospace, monospace; --font-b: "JetBrains Mono", ui-monospace, monospace; --font-code: "VT323", monospace;
  --d-weight: 400; --d-track: 0; --d-case: uppercase; --d-lh: .9; --btn-case: uppercase; --btn-weight: 700; --btn-r: 0;
  --press: none; --av-r: 0; --font-narr: "JetBrains Mono", monospace; --narr-weight: 400; --narr-track: 0; --timer-track: 0;
  --qr-bg: #050505; --qr-fg: #33ff00; --bar: repeating-linear-gradient(90deg, rgba(51,255,0,.28) 0 6px, transparent 6px 9px);
}
[data-style="ascii"] .screen { text-shadow: 0 0 6px rgba(51,255,0,.35); }
[data-style="ascii"] .screen::after { content: ""; position: absolute; inset: 0; z-index: 20; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(0,0,0,.28) 0 1px, transparent 1px 3px); }
[data-style="ascii"] .art img { display: none; }
[data-style="ascii"] .art pre { display: block; font-size: var(--ascii-size, calc(var(--u) * 5.2)); }
[data-style="ascii"] .panel { position: relative; }
[data-style="ascii"] .panel[data-label]::before { content: "┤ " attr(data-label) " ├"; position: absolute; top: -.75em; left: 1em; background: var(--bg); padding: 0 .3em; font-size: .78em; color: var(--accent-text); }
[data-style="ascii"] .btn::before { content: "[ "; } [data-style="ascii"] .btn::after { content: " ]"; }
[data-style="ascii"] .btn { background: transparent; color: var(--fg); border-color: var(--fg); }
@media (hover: hover) { [data-style="ascii"] .btn:hover, [data-style="ascii"] .option:hover { background: var(--fg); color: var(--bg); text-shadow: none; } }
[data-style="ascii"] .btn:active, [data-style="ascii"] .option:active { background: var(--fg); color: var(--bg); }
[data-style="ascii"] .option.is-selected { background: var(--fg); color: var(--bg); text-shadow: none; }
[data-style="ascii"] .option.is-selected::before { content: "> "; }
[data-style="ascii"] .hero-number { font-size: calc(var(--u) * 200); line-height: .8; }
[data-style="ascii"] .tile .avatar { background: transparent; color: var(--accent-text); border: 1px solid var(--accent-text); }
[data-style="ascii"] .feed p { font-size: calc(var(--u) * 30); text-align: left; }
[data-style="ascii"] .feed p::before { content: "> "; color: var(--accent-text); }
[data-style="ascii"] .feed p.is-new::after { content: "█"; animation: blink 1s steps(1) infinite; margin-left: .15em; }
[data-style="ascii"] .feed p.is-new { animation: type 900ms steps(28) both; clip-path: inset(0 0 0 0); }
@keyframes type { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
[data-style="ascii"] .display { letter-spacing: .02em; }
[data-style="ascii"] .rain { display: block; position: absolute; inset: 0; width: 100%; height: 100%; opacity: .32; }
[data-style="ascii"] .chip.is-off { text-decoration: none; }
[data-style="ascii"] .chip.is-off::before { content: "x "; }
[data-style="ascii"] .list-card .art pre, [data-style="ascii"] .page-hero .art pre { --ascii-size: calc(var(--u) * 2.4); }
[data-style="ascii"] .feature-card .art pre { --ascii-size: calc(var(--u) * 5.4); }
[data-style="ascii"] .result-card .art pre { --ascii-size: calc(var(--u) * 3); }
[data-style="ascii"] .hero-art pre { --ascii-size: calc(var(--u) * 4.2); color: var(--accent-text); }
[data-style="ascii"] .headline-art pre { --ascii-size: calc(var(--u) * 3.4); color: var(--accent-text); }

/* Shared keyframes this style uses (defined once in the base layer in the reference) */
@keyframes blink { 50% { opacity: 0; } }
```

---

### 3.7 Desktop 98 (`win98`)

#### Concept & mood

A late-1990s desktop operating system, without any vendor branding. The desktop is teal, windows are grey with a four-layer bevel, fields are sunken white, and title bars are a navy-to-blue gradient with a close box. Text is Tahoma with font smoothing turned off. Numbers are LCD-style green on black, messages are pale-yellow tooltips, a taskbar with a clock runs along the bottom, and pixel icons replace HD images.

**Good for:** retro and nostalgia portfolios, playful internal tools, indie game sites, "OS in a browser" experiences, April-fool redesigns.

#### Palette

Default (there is no dark variant):

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#008080` | Teal desktop |
| `--fg` | `#fff` | Text on the desktop |
| `--muted` | `#d6f3f3` | Secondary text on the desktop |
| `--panel` / `--panel-fg` | `#c0c0c0` / `#000` | Window face and text |
| `--muted-panel` | `#404040` | Secondary text in windows |
| `--line` | `transparent` | Bevels replace borders |
| `--accent` / `--accent-fg` | `#c0c0c0` / `#000` | Buttons are grey |
| `--accent-text` | `#000080` | Navy text accent |
| `--field`, `--tile` | `#fff` | Sunken white fields |
| `--field-fg`, `--tile-fg` | `#000` | Their text |
| `--chip-bg` / `--chip-fg` | `#c0c0c0` / `#000` | Chips |
| `--bar` | `rgba(0,0,128,.22)` | Share bar (declared on `.screen`) |

Other colours: bevel greys `#0a0a0a`, `#fff`, `#808080`, `#dfdfdf`; title bar `linear-gradient(90deg, #000080, #1084d0)` with white text; selected option `#000080` / `#fff`; tooltip `#ffffe1` with a 1px `#000` border; LCD `#000` with `#00ff40` digits; current-segment ring `#000080`.

Dark variant: not defined in source.

#### Typography

- Family: `Tahoma, Verdana, "Segoe UI", sans-serif` for everything (a system font, not downloaded). VT323 is loaded only for LCD numbers.
- Google Fonts: `https://fonts.googleapis.com/css2?family=VT323&display=swap`
- `-webkit-font-smoothing: none` on the screen gives the jagged, unsmoothed look (it has an effect only in browsers that honour it).
- Display weight 700, tracking 0; buttons weight 400.
- Display text and the hero number get `text-shadow: 2px 2px 0 rgba(0,0,0,.35)`.
- Title bars: 700 at `.78em`, left-aligned, ellipsised.

#### Shape & lines

Every radius is 0 and `--bw` is 0. Bevel shadows draw all edges.

#### Depth & surfaces

```css
--bevel:  inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf;  /* raised */
--sunken: inset -1px -1px #fff, inset 1px 1px #0a0a0a, inset -2px -2px #dfdfdf, inset 2px 2px #808080;  /* pressed in */
```

Panels, buttons, chips and the close box are raised. Fields, tiles, options, segments and the QR frame are sunken. Pressing a button swaps its shadow to `--sunken` and nudges the label down with `padding-top: 2px` (`--press: none`, no transform). The last segment of a segmented input gets an extra `0 0 0 2px #000080` ring.

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Desktop | Flat `#008080`. |
| Window chrome | `.panel::before` is the title bar: `content: attr(data-title)`, 3px inset from the top, left and right, height `--tb` (26u), navy→blue gradient. `.panel::after` is the close box: a raised grey `✕` (`width: --tb × .9`, `height: --tb × .72`). The panel's top padding is `calc(var(--tb) + .8em)`. Result cards have no title bar. |
| Taskbar `.taskbar` | A 46u grey bar at the bottom with a raised top edge (`inset 0 1px #dfdfdf, inset 0 2px #fff`). `::before` is a bevelled app button (`"▣ YourApp"`, bold 18u Tahoma); `::after` is a sunken clock tray (`"9:41 PM"`, 17u). The clock text is static. The screen gets `padding-bottom: 70u`. |

#### Components

- **Buttons:** grey, raised; pressed sunken with the label shifted 2px. Focus: `outline: 1px dotted #000; outline-offset: -5px` (the classic inside focus rectangle).
- **Ghost buttons:** identical grey.
- **Panels:** grey windows with title bar and close box. Always set `data-title`.
- **Inputs, options, tiles:** sunken white. Selected option: navy with white text.
- **Chips:** raised grey.
- **Timer:** an LCD readout, black with `#00ff40` VT323 digits in a sunken frame, padding `.05em .3em`.
- **Message feed:** tooltip boxes, `#ffffe1` with a 1px black border, padding `.2em .5em`, 30u, centred.

#### Motion & interaction

None beyond press feedback. The style is static.

#### Imagery

HD images hidden; 24px pixel sprites shown at full width with `image-rendering: pixelated`. They do not animate (unlike Pixel Retro).

#### Accessibility & pitfalls

- White text on teal is 4.8:1 and muted is 4.1:1, both fine for large text. Navy `--accent-text` on teal is 3.4:1, but 8.8:1 inside grey windows, so keep accent text in windows.
- The dotted inset focus ring is authentic but faint. Consider adding an outer 2px ring for keyboard users (recommendation).
- Panels without `data-title` still draw an empty title bar.
- With font smoothing off, thin text looks jagged on high-DPI screens. That is intended.
- IP: no vendor logos, flags, "Start" wordmark or product names. The taskbar label should be your own app name.

#### Performance notes / cost

Cost tier: **lowest**. Only inset box-shadows; no animation.

#### Do / Don't

Do:
- Use the raised/sunken bevel pair for every edge.
- Give every window a title via `data-title`.
- Use LCD readouts for numbers and tooltip boxes for messages.
- Use pixel icons.

Don't:
- Round corners or add soft shadows.
- Use vendor branding (logos, the four-colour flag, product names).
- Animate windows.
- Use HD or 3D illustrations.

#### Copy-paste CSS

```css
/* Desktop 98: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged.
   The taskbar label is a placeholder for your app name. */
[data-style="win98"] {
  --bevel: inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf;
  --sunken: inset -1px -1px #fff, inset 1px 1px #0a0a0a, inset -2px -2px #dfdfdf, inset 2px 2px #808080;
  --bg: #008080;
  --fg: #fff;
  --muted: #d6f3f3;
  --panel: #c0c0c0;
  --line: transparent;
  --bw: 0px;
  --r: 0px;
  --r-sm: 0px;
  --shadow: var(--bevel);
  --accent: #c0c0c0;
  --accent-fg: #000;
  --accent-text: #000080;
  --field: #fff;
  --tile: #fff;
  --chip-bg: #c0c0c0;
  --chip-fg: #000;
  --chip-r: 0;
  --panel-fg: #000;
  --field-fg: #000;
  --tile-fg: #000;
  --muted-panel: #404040;
  --font-d: Tahoma, Verdana, "Segoe UI", sans-serif;
  --font-b: Tahoma, Verdana, "Segoe UI", sans-serif;
  --d-weight: 700;
  --d-track: 0;
  --btn-r: 0;
  --btn-weight: 400;
  --press: none;
  --btn-shadow: var(--bevel);
  --btn-shadow-press: var(--sunken);
  --av-r: 0;
  --narr-weight: 400;
  --narr-track: 0;
}
[data-style="win98"] .screen { --tb: calc(var(--u) * 26); --bar: rgba(0,0,128,.22); }
[data-style="win98"] .screen { -webkit-font-smoothing: none; padding-bottom: calc(var(--u) * 70); }
[data-style="win98"] .bg-layer { background: #008080; }
[data-style="win98"] .panel { position: relative; padding-top: calc(var(--tb) + .8em); }
[data-style="win98"] .panel::before { content: attr(data-title); position: absolute; top: 3px; left: 3px; right: 3px; height: var(--tb); display: flex; align-items: center; padding: 0 .5em; background: linear-gradient(90deg, #000080, #1084d0); color: #fff; font-weight: 700; font-size: .78em; letter-spacing: 0; text-align: left; white-space: nowrap; overflow: hidden; }
[data-style="win98"] .panel::after { content: "✕"; position: absolute; top: calc(3px + var(--tb) * .14); right: 6px; width: calc(var(--tb) * .9); height: calc(var(--tb) * .72); display: grid; place-items: center; background: #c0c0c0; box-shadow: var(--bevel); color: #000; font-size: .6em; font-weight: 700; }
[data-style="win98"] .result-card { padding-top: 1em; }
[data-style="win98"] .result-card::before, [data-style="win98"] .result-card::after { display: none; }
[data-style="win98"] .field, [data-style="win98"] .tile, [data-style="win98"] .option, [data-style="win98"] .segments span, [data-style="win98"] .qr-wrap { box-shadow: var(--sunken); border: 0; }
[data-style="win98"] .segments span:last-child { box-shadow: var(--sunken), 0 0 0 2px #000080; }
[data-style="win98"] .btn:active { padding-top: 2px; }
[data-style="win98"] .btn.ghost { --ghost-bg: #c0c0c0; --ghost-fg: #000; }
[data-style="win98"] .btn:focus-visible { outline: 1px dotted #000; outline-offset: -5px; }
[data-style="win98"] .option.is-selected { background: #000080; color: #fff; }
[data-style="win98"] .chip { box-shadow: var(--bevel); }
[data-style="win98"] .art img { display: none; }
[data-style="win98"] .art .pix { display: block; width: 100%; image-rendering: pixelated; }
[data-style="win98"] .display, [data-style="win98"] .hero-number { text-shadow: 2px 2px 0 rgba(0,0,0,.35); }
[data-style="win98"] .timer, [data-style="win98"] .timer-sm { background: #000; color: #00ff40; box-shadow: var(--sunken); padding: .05em .3em; font-family: "VT323", monospace; }
[data-style="win98"] .feed p { background: #ffffe1; color: #000; border: 1px solid #000; padding: .2em .5em; justify-self: center; font-size: calc(var(--u) * 30); }
[data-style="win98"] .taskbar { display: block; position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--u) * 46); background: #c0c0c0; box-shadow: inset 0 1px #dfdfdf, inset 0 2px #fff; }
[data-style="win98"] .taskbar::before { content: "▣ YourApp"; /* reference: "▣ LarpParty" */ position: absolute; left: calc(var(--u) * 6); top: calc(var(--u) * 7); bottom: calc(var(--u) * 6); display: flex; align-items: center; padding: 0 calc(var(--u) * 10); box-shadow: var(--bevel); font: 700 calc(var(--u) * 18) Tahoma, Verdana, sans-serif; color: #000; }
[data-style="win98"] .taskbar::after { content: "9:41 PM"; /* static text in the reference, not a live clock */ position: absolute; right: calc(var(--u) * 6); top: calc(var(--u) * 7); bottom: calc(var(--u) * 6); display: flex; align-items: center; padding: 0 calc(var(--u) * 12); box-shadow: var(--sunken); font: calc(var(--u) * 17) Tahoma, Verdana, sans-serif; color: #000; }
```

---

### 3.8 Neon Arcade (`neon`)

#### Concept & mood

A synthwave night. A striped sunset sun (made with a CSS mask) sits on the horizon, and a perspective grid floor scrolls toward the viewer. Colours are magenta and cyan neon with glowing text shadows. Audiowide sets uppercase headings, Chakra Petch the body, and small labels flicker now and then.

**Good for:** gaming and esports, music, nightlife and event sites, retro-futurist portfolios, launch countdowns.

#### Palette

Default:

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#0a0418` | Night |
| `--fg` | `#f4f0ff` | Text |
| `--muted` | `#a58fd8` | Secondary text |
| `--panel` | `rgba(18,8,40,.78)` | Translucent violet panel |
| `--line` | `#ff3cac` | Magenta tube |
| `--accent` / `--accent-fg` | `#ff3cac` / `#12001f` | Magenta primary |
| `--accent-text` | `#3cf2ff` | Cyan text accent |
| `--field`, `--tile` | `rgba(10,4,24,.8)` | Inputs, options, tiles |
| `--chip-bg` | `rgba(60,242,255,.08)` | Faint cyan chips |
| `--btn-line` | `#ffd0ef` | Pale pink button rim |
| `--bar` | `linear-gradient(90deg, rgba(60,242,255,.35), rgba(255,60,172,.35))` | Cyan→magenta share bar |
| `--role-bg` | `linear-gradient(180deg, rgba(255,60,172,.22), rgba(18,8,40,.85))` | Feature card |

Other colours: sky `linear-gradient(180deg, #12002c 0%, #3a0b5e 52%, #0a0418 52.2%)` (the hard stop at 52% is the horizon); sun `linear-gradient(180deg, #ffe66d 0%, #ff8f3c 45%, #ff3cac 80%)`; grid lines `rgba(60,242,255,.75)`.

Dark variant: tokens unchanged; the sun becomes a cold moon, `linear-gradient(180deg, #e6f0ff, #8fb4ff 60%, #3c5bff)`, at top 14% and width 26%.

#### Typography

- Families: Audiowide (display, buttons); Chakra Petch 400/600 (body).
- Google Fonts: `https://fonts.googleapis.com/css2?family=Audiowide&family=Chakra+Petch:wght@400;600&display=swap`
- Display: uppercase, weight 400, tracking `.02em`.
- Buttons: Audiowide, uppercase, tracking `.1em`.
- Hero number tracking `.12em`.
- Glow on display text, hero number and timer: `text-shadow: 0 0 4px #fff, 0 0 14px #ff3cac, 0 0 34px #ff3cac` (a white core with magenta halos).
- Eyebrow: cyan with `0 0 10px rgba(60,242,255,.8)` and the flicker animation.
- Feed: `text-shadow: 0 0 12px rgba(255,60,172,.5)`.

#### Shape & lines

`--bw: 2px`, `--r: 10px`, `--r-sm: 8px`. Buttons use 10px; chips are pills with a 1px border.

#### Depth & surfaces

- Panels: `0 0 0 1px rgba(255,60,172,.35), 0 0 22px -4px rgba(255,60,172,.55), inset 0 0 18px -6px rgba(255,60,172,.5)`, a tube that glows inside and out.
- Buttons: `0 0 18px -2px #ff3cac`. Ghost buttons: `0 0 14px -4px #3cf2ff`. Selected option: `0 0 20px -2px #ff3cac`.
- Avatars glow in their own colour: `box-shadow: 0 0 10px var(--c)`.

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Sky | The two-tone gradient with a hard horizon at 52%. |
| Sun `.sun` | 34% wide circle, centred, top 18%, opacity .9. The stripes come from a mask: `mask: repeating-linear-gradient(180deg, #000 0 56%, transparent 56% 60%, #000 60% 66%, transparent 66% 72%, #000 72% 77%, transparent 77% 84%, #000 84% 88%, transparent 88% 100%)`. The gaps widen toward the bottom. The `-webkit-mask` value differs and is only a fallback for older WebKit; modern browsers use the unprefixed `mask`, declared last. On mobile the sun moves to the bottom (`bottom: -6%; width: 70%; opacity: .55`); on finale screens it fades to `.5`. |
| Grid floor `.floor > i` | The container is 48% tall at the bottom, 200% wide (`left/right: -50%`), with `perspective: 260px`. The child is a 64px cyan grid (two 2px line gradients) rotated `rotateX(62deg)` from the bottom edge. It scrolls one cell toward the viewer with `grid 1.6s linear infinite` (`translateY(64px)`), so the loop is seamless. |

#### Components

- **Primary button:** magenta with near-black text, pale pink rim, magenta glow, Audiowide uppercase.
- **Ghost button:** transparent with cyan border, cyan text and a cyan glow.
- **Panels:** translucent violet with a 2px magenta line and the tube glow.
- **Options:** dark translucent; selected is magenta with glow; the share bar fades cyan→magenta.
- **Chips:** faint cyan pills.
- **Display, hero number, timer:** neon glow.

#### Motion & interaction

Grid floor (1.6s linear); eyebrow flicker (`flicker 5s steps(1)`: opacity dips to .35 at 93% and .5 at 96% of the cycle). Nothing else moves.

#### Imagery

Full colour with a magenta glow: `drop-shadow(0 0 14px rgba(255,60,172,.55))`.

#### Accessibility & pitfalls

- Contrast is good: text 13.5:1, primary 6.2:1, cyan accent 11:1.
- The flicker dips twice per 5s cycle on small labels, well under 3 flashes per second; reduced motion and lite stop it.
- Multi-layer glows blur small text. Keep glow to display sizes and the feed.

#### Performance notes / cost

Cost tier: **low**. One transformed element (the grid) and a static masked sun. Glows are static shadows.

#### Do / Don't

Do:
- Keep a hard horizon line between sky and floor.
- Use a white core plus coloured halos for neon text.
- Use magenta for primary and cyan for secondary.
- Animate the floor by exactly one grid cell per loop.

Don't:
- Glow body text.
- Flicker anything large or important.
- Animate the sun's mask or size.
- Put more than two neon hues on one screen.

#### Copy-paste CSS

```css
/* Neon Arcade: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged. */
[data-style="neon"] {
  --bg: #0a0418; --fg: #f4f0ff; --muted: #a58fd8;
  --panel: rgba(18,8,40,.78); --line: #ff3cac; --bw: 2px; --r: 10px; --r-sm: 8px;
  --shadow: 0 0 0 1px rgba(255,60,172,.35), 0 0 22px -4px rgba(255,60,172,.55), inset 0 0 18px -6px rgba(255,60,172,.5);
  --accent: #ff3cac; --accent-fg: #12001f; --accent-text: #3cf2ff;
  --field: rgba(10,4,24,.8); --tile: rgba(10,4,24,.8); --chip-bg: rgba(60,242,255,.08); --chip-bw: 1px;
  --font-d: "Audiowide", "Chakra Petch", sans-serif; --font-b: "Chakra Petch", system-ui, sans-serif; --font-btn: "Audiowide", sans-serif;
  --d-weight: 400; --d-track: .02em; --d-case: uppercase; --btn-case: uppercase; --btn-track: .1em; --btn-weight: 400;
  --btn-shadow: 0 0 18px -2px #ff3cac; --btn-line: #ffd0ef; --code-track: .12em;
  --bar: linear-gradient(90deg, rgba(60,242,255,.35), rgba(255,60,172,.35));
}
[data-style="neon"] .bg-layer { background: linear-gradient(180deg, #12002c 0%, #3a0b5e 52%, #0a0418 52.2%); }
[data-style="neon"] .sun { display: block; position: absolute; left: 50%; top: 18%; width: 34%; aspect-ratio: 1; transform: translateX(-50%); border-radius: 50%;
  background: linear-gradient(180deg, #ffe66d 0%, #ff8f3c 45%, #ff3cac 80%);
  -webkit-mask: linear-gradient(180deg, #000 50%, transparent 50%) top / 100% 100%, repeating-linear-gradient(180deg, #000 0 9%, transparent 9% 12%);
  mask: repeating-linear-gradient(180deg, #000 0 56%, transparent 56% 60%, #000 60% 66%, transparent 66% 72%, #000 72% 77%, transparent 77% 84%, #000 84% 88%, transparent 88% 100%);
  opacity: .9; }
[data-style="neon"] .floor { display: block; position: absolute; left: -50%; right: -50%; bottom: 0; height: 48%; perspective: 260px; overflow: hidden; }
[data-style="neon"] .floor i { position: absolute; inset: -100% 0 0 0; transform: rotateX(62deg); transform-origin: bottom;
  background-image: linear-gradient(rgba(60,242,255,.75) 2px, transparent 2px), linear-gradient(90deg, rgba(60,242,255,.75) 2px, transparent 2px);
  background-size: 64px 64px; animation: grid 1.6s linear infinite; will-change: transform; }
@keyframes grid { to { transform: rotateX(62deg) translateY(64px); } }
[data-style="neon"] .display, [data-style="neon"] .hero-number, [data-style="neon"] .timer { text-shadow: 0 0 4px #fff, 0 0 14px #ff3cac, 0 0 34px #ff3cac; }
[data-style="neon"] .eyebrow { color: var(--accent-text); text-shadow: 0 0 10px rgba(60,242,255,.8); animation: flicker 5s steps(1) infinite; }
@keyframes flicker { 0%, 100% { opacity: 1; } 92% { opacity: 1; } 93% { opacity: .35; } 94% { opacity: 1; } 96% { opacity: .5; } 97% { opacity: 1; } }
[data-style="neon"] .tile .avatar { box-shadow: 0 0 10px var(--c); }
[data-style="neon"] .option.is-selected { box-shadow: 0 0 20px -2px #ff3cac; }
[data-style="neon"] .btn.ghost { --ghost-bg: transparent; --ghost-fg: #3cf2ff; border-color: #3cf2ff; box-shadow: 0 0 14px -4px #3cf2ff; }
[data-style="neon"] .art img { filter: drop-shadow(0 0 14px rgba(255,60,172,.55)); }
[data-style="neon"] .screen.mobile .sun { top: auto; bottom: -6%; width: 70%; opacity: .55; }
[data-style="neon"] .screen.is-finale .sun { opacity: .5; }
[data-style="neon"] .screen.is-dark .sun { background: linear-gradient(180deg, #e6f0ff, #8fb4ff 60%, #3c5bff); top: 14%; width: 26%; }
[data-style="neon"] .feed p { text-shadow: 0 0 12px rgba(255,60,172,.5); }
[data-style="neon"] .feature-card { --role-bg: linear-gradient(180deg, rgba(255,60,172,.22), rgba(18,8,40,.85)); }
```

---

### 3.9 Pixel Retro (`pixel`)

#### Concept & mood

An 8-bit console. A PICO-8-like palette, stepped pixel borders built from four box-shadows (there is no real border), Press Start 2P headings and Pixelify Sans body text. Sprites are 24px images scaled up with `image-rendering: pixelated` and bob on a two-frame loop. Clouds move one step at a time over grass and a brick ground. The dark variant is a navy night with star dots.

**Good for:** indie games and game jams, retro portfolios, kids' coding sites, playful event pages, achievement and leaderboard pages.

#### Palette

Default:

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#29adff` | Sky |
| `--fg` / `--muted` | `#1d2b53` | Navy text (muted is the same navy) |
| `--panel` / `--panel-fg` | `#fff1e8` / `#1d2b53` | Cream panels |
| `--muted-panel` | `#5f574f` | Secondary text on panels |
| `--line` | `#000` | Pixel outline colour (drawn by shadows) |
| `--accent` / `--accent-fg` | `#ff004d` / `#fff1e8` | Red primary |
| `--accent-text` | `#ff004d` | Red text accent |
| `--field` | `#fff1e8` | Inputs, options |
| `--tile` | `#ffccaa` | Peach tiles |
| `--chip-bg` / `--chip-fg` | `#fff1e8` / `#1d2b53` | Chips |
| `--field-fg`, `--tile-fg` | `#1d2b53` | Their text |
| `--bar` | `repeating-linear-gradient(90deg, #ffec27 0 8u, #ffa300 8u 16u)` | Yellow/orange segments (declared on `.screen`) |

Other colours: grass `#00e436` with a `#008751` top edge; bricks `#ab5236` / `#8a3f2a`; clouds `#fff1e8`; avatars cycle `#ff004d` / `#29adff` / `#00e436`; selected option `#ff004d` with `#fff1e8`.

Dark variant:

| Token / element | Value |
| --- | --- |
| `--fg` | `#fff1e8` |
| `--muted` | `#c2c3c7` |
| Sky | `#1d2b53` with `#fff1e8` star dots (`radial-gradient` of 2u on a 96u×72u grid) |
| Ground | `#1d2b53` with a `#7e2553` top edge |
| Clouds | hidden |

#### Typography

- Families: Press Start 2P (display, buttons, hero number, timer); Pixelify Sans 400/600 (body, feed).
- Google Fonts: `https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Pixelify+Sans:wght@400;600&display=swap`
- Display: weight 400, tracking 0, line-height 1.25, `text-shadow: 3u 3u 0 rgba(0,0,0,.25)`.
- Press Start 2P is very wide, so headings run at roughly half the size other styles use:

| Element | Base size | Pixel Retro |
| --- | --- | --- |
| Hero-page title | 46u | 26u, line-height 1.35 |
| Page-hero title | 40u | 20u |
| Feature-card heading | 40u | 20u |
| Choice heading | 32u | 17u, line-height 1.4 |
| List-card title | 1.12em | .7em, line-height 1.5 |
| Headline | 92u | 54u |
| Hero number | 168u | 110u, tracking `.06em` |
| Timer | 84u | 60u |
| Roster heading | 32u | 22u |
| Button text | 1em | .78em |
| Feed line | 38u | 34u |

#### Shape & lines

`--bw: 0`, every radius 0, square avatars.

#### Depth & surfaces

The stepped pixel border, with `--px: calc(var(--u) * 4)` (one art pixel):

```css
--shadow: 0 calc(var(--px) * -1) 0 0 #000,   /* top */
          0 var(--px) 0 0 #000,              /* bottom */
          calc(var(--px) * -1) 0 0 0 #000,   /* left */
          var(--px) 0 0 0 #000,              /* right */
          0 calc(var(--px) * 2) 0 0 rgba(0,0,0,.35);  /* drop */
```

Four unblurred shadows offset one art pixel in each direction draw an outline with notched (missing) corners, the classic 8-bit box. It applies to panels, buttons, tiles, options, fields, segments, chips and the QR frame. Press: `translateY(var(--px))`. These tokens are declared on `.screen` because they use `--u`.

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Sky | Flat `#29adff`. |
| Ground `.ground` | 12% tall, `#00e436` grass with `box-shadow: 0 -6u 0 #008751` as the top edge. `::after` fills from 40% down with bricks: `repeating-linear-gradient(90deg, #ab5236 0 24u, #8a3f2a 24u 48u)`. |
| Clouds `.cloud`, `.cloud.c2` | One 12u cream square plus 11 `box-shadow` copies on a 12u grid make the cloud. They move `translateX(300u)` with `steps(80)` over 40s (cloud 1, top 14%, left 10%) and 55s (cloud 2, top 30%, left 64%), so they hop a few pixels at a time. On mobile both sit at top 80%, left 8%. |

#### Components

- **Primary button:** red with cream text, pixel outline, Press Start 2P at .78em; press drops one art pixel.
- **Ghost button:** cream with navy text.
- **Panels, options, fields:** cream with the pixel outline. Selected option is red; the share bar is yellow/orange segments.
- **Tiles:** peach with square avatars in a red/blue/green cycle.
- **Chips:** cream, square.

#### Motion & interaction

Sprite bob (`translateY(-6%)`, `1s steps(2)`: two frames, no tweening), stepping clouds, press drop. Everything uses `steps()` so motion looks frame-based.

#### Imagery

HD images hidden; 24px sprites shown at 100% width with `image-rendering: pixelated` and the bob.

#### Accessibility & pitfalls

- Red `--accent-text` on the sky is 1.6:1. Never use it for text on the background.
- Cream on red (primary and selected) is 3.5:1, and button text is small. It passes only for large text, so consider navy labels or a darker red.
- Navy on sky is 5.6:1 and fine.
- Press Start 2P is hard to read at length. Keep it to short headings and buttons, and use Pixelify Sans for anything longer.

#### Performance notes / cost

Cost tier: **lowest**. `steps()` animations on two clouds and the sprites; no blur or filters.

#### Do / Don't

Do:
- Draw borders with the four-shadow pixel outline.
- Use `steps()` for all motion.
- Size everything in whole art pixels (`--px`).
- Scale sprites with `image-rendering: pixelated`.

Don't:
- Use smooth easing or blur.
- Use Press Start 2P for paragraphs.
- Scale sprites by non-integer factors if you can avoid it.
- Use HD illustrations.

#### Copy-paste CSS

```css
/* Pixel Retro: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged. */
[data-style="pixel"] {
  --bg: #29adff;
  --fg: #1d2b53;
  --muted: #1d2b53;
  --panel: #fff1e8;
  --line: #000;
  --bw: 0px;
  --r: 0px;
  --r-sm: 0px;
  --accent: #ff004d;
  --accent-fg: #fff1e8;
  --accent-text: #ff004d;
  --field: #fff1e8;
  --tile: #ffccaa;
  --chip-bg: #fff1e8;
  --chip-r: 0;
  --chip-fg: #1d2b53;
  --panel-fg: #1d2b53;
  --muted-panel: #5f574f;
  --field-fg: #1d2b53;
  --tile-fg: #1d2b53;
  --font-d: "Press Start 2P", monospace;
  --font-b: "Pixelify Sans", "Press Start 2P", monospace;
  --font-btn: "Press Start 2P", monospace;
  --font-code: "Press Start 2P", monospace;
  --font-timer: "Press Start 2P", monospace;
  --d-weight: 400;
  --d-track: 0;
  --d-lh: 1.25;
  --btn-weight: 400;
  --btn-r: 0;
  --av-r: 0;
  --narr-weight: 400;
  --narr-track: 0;
  --font-narr: "Pixelify Sans", monospace;
  --code-track: .06em;
  --timer-track: 0;
}
[data-style="pixel"] .screen { --px: calc(var(--u) * 4); --shadow: 0 calc(var(--px) * -1) 0 0 #000, 0 var(--px) 0 0 #000, calc(var(--px) * -1) 0 0 0 #000, var(--px) 0 0 0 #000, 0 calc(var(--px) * 2) 0 0 rgba(0,0,0,.35); --btn-shadow: var(--shadow); --press: translateY(var(--px)); --bar: repeating-linear-gradient(90deg, #ffec27 0 calc(var(--u) * 8), #ffa300 calc(var(--u) * 8) calc(var(--u) * 16)); }
[data-style="pixel"] .panel, [data-style="pixel"] .btn, [data-style="pixel"] .tile, [data-style="pixel"] .option, [data-style="pixel"] .field, [data-style="pixel"] .segments span, [data-style="pixel"] .chip, [data-style="pixel"] .qr-wrap { box-shadow: var(--shadow); }
[data-style="pixel"] .art img { display: none; }
[data-style="pixel"] .art .pix { display: block; width: 100%; image-rendering: pixelated; animation: bob 1s steps(2) infinite; }
@keyframes bob { 50% { transform: translateY(-6%); } }
[data-style="pixel"] .bg-layer { background-color: #29adff; }
[data-style="pixel"] .ground { display: block; position: absolute; left: 0; right: 0; bottom: 0; height: 12%; background: #00e436; box-shadow: 0 calc(var(--u) * -6) 0 #008751; }
[data-style="pixel"] .ground::after { content: ""; position: absolute; inset: 40% 0 0; background: repeating-linear-gradient(90deg, #ab5236 0 calc(var(--u) * 24), #8a3f2a calc(var(--u) * 24) calc(var(--u) * 48)); }
[data-style="pixel"] .cloud { display: block; position: absolute; width: calc(var(--u) * 12); height: calc(var(--u) * 12); background: #fff1e8; top: 14%; left: 10%;
  box-shadow: calc(var(--u)*12) 0 #fff1e8, calc(var(--u)*24) 0 #fff1e8, calc(var(--u)*36) 0 #fff1e8, calc(var(--u)*12) calc(var(--u)*-12) #fff1e8, calc(var(--u)*24) calc(var(--u)*-12) #fff1e8, calc(var(--u)*-12) calc(var(--u)*12) #fff1e8, 0 calc(var(--u)*12) #fff1e8, calc(var(--u)*12) calc(var(--u)*12) #fff1e8, calc(var(--u)*24) calc(var(--u)*12) #fff1e8, calc(var(--u)*36) calc(var(--u)*12) #fff1e8, calc(var(--u)*48) calc(var(--u)*12) #fff1e8;
  animation: cloud 40s steps(80) infinite; }
[data-style="pixel"] .cloud.c2 { top: 30%; left: 64%; animation-duration: 55s; }
[data-style="pixel"] .screen.mobile .cloud, [data-style="pixel"] .screen.mobile .cloud.c2 { top: 80%; left: 8%; }
@keyframes cloud { to { transform: translateX(calc(var(--u) * 300)); } }
[data-style="pixel"] .screen.is-dark { --fg: #fff1e8; --muted: #c2c3c7; }
[data-style="pixel"] .screen.is-dark .bg-layer { background-color: #1d2b53; background-image: radial-gradient(#fff1e8 calc(var(--u)*2), transparent calc(var(--u)*2.5)); background-size: calc(var(--u)*96) calc(var(--u)*72); background-position: 0 0; }
[data-style="pixel"] .screen.is-dark .ground { background: #1d2b53; box-shadow: 0 calc(var(--u) * -6) 0 #7e2553; }
[data-style="pixel"] .screen.is-dark .cloud { display: none; }
[data-style="pixel"] .display { text-shadow: calc(var(--u)*3) calc(var(--u)*3) 0 rgba(0,0,0,.25); }
[data-style="pixel"] .screen.is-hero h1 { font-size: calc(var(--u) * 26); line-height: 1.35; }
[data-style="pixel"] .page-hero h1 { font-size: calc(var(--u) * 20); }
[data-style="pixel"] .feature-card h2 { font-size: calc(var(--u) * 20); }
[data-style="pixel"] .screen.is-choice h2 { font-size: calc(var(--u) * 17); line-height: 1.4; }
[data-style="pixel"] .list-card h2 { font-size: .7em; line-height: 1.5; }
[data-style="pixel"] .headline { font-size: calc(var(--u) * 54); }
[data-style="pixel"] .hero-number { font-size: calc(var(--u) * 110); }
[data-style="pixel"] .timer { font-size: calc(var(--u) * 60); }
[data-style="pixel"] .btn { font-size: .78em; }
[data-style="pixel"] .roster h2 { font-size: calc(var(--u) * 22); }
[data-style="pixel"] .tile:nth-child(3n+1) .avatar { background: #ff004d; } [data-style="pixel"] .tile:nth-child(3n+2) .avatar { background: #29adff; } [data-style="pixel"] .tile:nth-child(3n) .avatar { background: #00e436; }
[data-style="pixel"] .option.is-selected { background: #ff004d; color: #fff1e8; }
[data-style="pixel"] .btn.ghost { --ghost-bg: #fff1e8; --ghost-fg: #1d2b53; }
[data-style="pixel"] .feed p { font-size: calc(var(--u) * 34); }
```

---

### 3.10 Paper Sketch (`paper`)

#### Concept & mood

Notebook paper with blue rules and a red margin line, written in navy ink. Borders wobble as if hand-drawn, using asymmetric `border-radius` (no SVG filters). Cards carry washi-tape strips, key words get a yellow marker highlight, headings are Caveat and body text is Kalam. Images become die-cut stickers with a white outline and a slight rotation, and selection is marked with a hand-drawn ✓. The dark variant is dark-blue paper.

**Good for:** education and note-taking apps, personal blogs and journals, creative studios, wireframe-style prototypes, friendly documentation, workshop pages.

#### Palette

Default:

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#fbf8ef` | Paper |
| `--fg` | `#1f2a44` | Navy ink |
| `--muted` | `#5a6276` | Pencil grey |
| `--panel` | `#fffdf7` | Card paper |
| `--line` | `#1f2a44` | Ink outline |
| `--accent` / `--accent-fg` | `#ffe066` / `#1f2a44` | Marker-yellow primary |
| `--accent-text` | `#d1495b` | Red pen |
| `--field`, `--tile`, `--chip-bg` | `#fffdf7` | Inputs, tiles, chips |
| `--chip-fg` | `#1f2a44` | Chip text |
| `--bar` | `linear-gradient(90deg, rgba(255,224,102,.75), rgba(255,224,102,.35))` | Marker share bar |

Other colours: rules `rgba(70,120,190,.22)`; margin line `rgba(209,73,91,.45)`; washi tape `rgba(255,224,102,.55)` with dashed edges `rgba(31,42,68,.2)`; highlight `rgba(255,224,102,.95)` → `.8`; check mark `#d1495b`; sticker outline `#fff`.

Dark variant:

| Token | Value |
| --- | --- |
| `--fg` | `#f4f1e6` |
| `--muted` | `#b9c1d6` |
| `--line` | `#f4f1e6` |
| `--panel` / `--panel-fg` | `#23304f` / `#f4f1e6` |
| `--muted-panel` | `#b9c1d6` |
| `--field` / `--field-fg` | `#2a3758` / `#f4f1e6` |
| `--tile` / `--tile-fg` | `#2a3758` / `#f4f1e6` |
| Ghost button | `--ghost-bg: transparent; --ghost-fg: #f4f1e6` |
| Paper | `#1c2640` with rules `rgba(255,255,255,.06)`; no margin line |

#### Typography

- Families: Caveat 600/700 (display, feed, hero number); Kalam 400/700 (body, buttons).
- Google Fonts: `https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Kalam:wght@400;700&display=swap`
- Display: weight 700, tracking 0, line-height .95.
- Feed: Caveat 700 at 46u.
- Hero number: Caveat at 190u. Alternate letters rotate −4° and +3° (the even ones also drop 4%), so the code looks hand-lettered.
- Buttons: Kalam 700.
- Highlight `.hl`: `background: linear-gradient(100deg, transparent 2%, rgba(255,224,102,.95) 4%, rgba(255,224,102,.8) 92%, transparent 96%); padding: 0 .12em; border-radius: 4px`. The angled gradient gives ragged marker ends.

#### Shape & lines

- `--bw: 2px` ink.
- `--r: 255px 18px 225px 18px / 18px 225px 18px 255px`. The elliptical radii differ on each corner, so straight edges read as slightly curved hand-drawn lines.
- `--r-sm: 14px 120px 14px 110px / 110px 14px 120px 14px` for fields, options and tiles.
- Chips are pills (default) with a 1.5px border; avatars have a 1.5px ink ring.

#### Depth & surfaces

Panels `2px 3px 0 rgba(31,42,68,.85)`; buttons `2px 3px 0 #1f2a44`, pressing `translate(2px, 3px)` onto a zero shadow, like pressing a paper cut-out flat.

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Ruled paper | Two layers on `.bg-layer`: a vertical red margin line (2u wide at 46u from the left) and horizontal blue rules (1u every 32u). |
| Washi tape | `.panel::before`: an 80×22px strip centred 10px above the top edge, `rotate(-3deg)`, translucent yellow with dashed left and right edges. Not on list cards, result cards or the roster panel. |
| Tilt | List cards alternate −.8° and +.7°. |

#### Components

- **Primary button:** marker yellow with navy Kalam text, wobbly ink outline, offset ink shadow.
- **Ghost button:** card paper (`#fffdf7`); transparent with cream text in dark.
- **Panels:** wobbly ink outline, tape strip, offset shadow.
- **Options:** paper; selected is marker yellow with a red `✓` drawn after the label (absolute, `right: 3.2em`, `1.3em`).
- **Message feed:** large Caveat handwriting.
- **Hero number:** rotated hand-lettered characters.

#### Motion & interaction

Hero art floats (`float 5s`); press flattens. Nothing else moves.

#### Imagery

Die-cut stickers:

```css
filter: drop-shadow(0 0 0 #fff) drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff)
        drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(2px 3px 0 rgba(31,42,68,.35));
transform: rotate(-4deg);
```

The four offset white shadows build a 2px white outline around the image's alpha shape, and the last adds a soft ink shadow under the sticker.

#### Accessibility & pitfalls

- **Fixed bug (keep the fix):** dark fields and ghost buttons used to inherit the light `--fg` on light surfaces (white on white). The dark block now sets every `*-fg` token and gives ghost buttons a transparent fill with cream text.
- **Still in source:** in the dark palette the selected option uses `color: var(--fg)`, which becomes cream (`#f4f1e6`) on the yellow fill: 1.2:1. Fix: `[data-style="paper"] .option.is-selected { color: var(--accent-fg); }` (recommended, not in source).
- Red-pen `--accent-text` on paper is 4.1:1; use it bold or large.
- The six-filter sticker effect is the costliest rule in the style. Apply it only to illustrations.
- `.display { font-size-adjust: none; }` is present but has no effect unless something else sets `font-size-adjust`.

#### Performance notes / cost

Cost tier: **lowest**. Static gradients and radii; the only filters are on images.

#### Do / Don't

Do:
- Use asymmetric elliptical radii for hand-drawn edges.
- Put washi tape on a few hero cards, not on every surface.
- Use the marker highlight for one or two key words.
- Give every dark surface an explicit text colour.

Don't:
- Use SVG turbulence filters for wobble; the radii are enough and far cheaper.
- Highlight whole paragraphs.
- Use Caveat for small body text (use Kalam).
- Leave `color: var(--fg)` on light fills in the dark palette.

#### Copy-paste CSS

```css
/* Paper Sketch: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged. */
[data-style="paper"] {
  --bg: #fbf8ef; --fg: #1f2a44; --muted: #5a6276;
  --panel: #fffdf7; --line: #1f2a44; --bw: 2px; --r: 255px 18px 225px 18px / 18px 225px 18px 255px; --r-sm: 14px 120px 14px 110px / 110px 14px 120px 14px;
  --shadow: 2px 3px 0 rgba(31,42,68,.85);
  --accent: #ffe066; --accent-fg: #1f2a44; --accent-text: #d1495b;
  --field: #fffdf7; --tile: #fffdf7; --chip-bg: #fffdf7; --chip-bw: 1.5px;
  --font-d: "Caveat", "Kalam", cursive; --font-b: "Kalam", "Comic Neue", cursive; --font-btn: "Kalam", cursive;
  --chip-fg: #1f2a44;
  --d-weight: 700; --d-track: 0; --d-lh: .95; --btn-weight: 700; --code-track: .08em;
  --btn-shadow: 2px 3px 0 #1f2a44; --press: translate(2px, 3px); --btn-shadow-press: 0 0 0 #1f2a44;
  --narr-weight: 700; --font-narr: "Caveat", cursive; --narr-track: 0;
  --bar: linear-gradient(90deg, rgba(255,224,102,.75), rgba(255,224,102,.35));
}
[data-style="paper"] .bg-layer { background-color: #fbf8ef; background-image: linear-gradient(90deg, transparent calc(var(--u) * 46), rgba(209,73,91,.45) calc(var(--u) * 46), rgba(209,73,91,.45) calc(var(--u) * 48), transparent calc(var(--u) * 48)), repeating-linear-gradient(180deg, transparent 0 calc(var(--u) * 31), rgba(70,120,190,.22) calc(var(--u) * 31) calc(var(--u) * 32)); }
[data-style="paper"] .screen.is-dark { --fg: #f4f1e6; --muted: #b9c1d6; --line: #f4f1e6; --panel: #23304f; --panel-fg: #f4f1e6; --muted-panel: #b9c1d6; --field: #2a3758; --field-fg: #f4f1e6; --tile: #2a3758; --tile-fg: #f4f1e6; }
[data-style="paper"] .screen.is-dark .btn.ghost { --ghost-bg: transparent; --ghost-fg: #f4f1e6; }
[data-style="paper"] .screen.is-dark .bg-layer { background-color: #1c2640; background-image: repeating-linear-gradient(180deg, transparent 0 calc(var(--u) * 31), rgba(255,255,255,.06) calc(var(--u) * 31) calc(var(--u) * 32)); }
[data-style="paper"] .display { font-size-adjust: none; }
[data-style="paper"] .hl { background: linear-gradient(100deg, transparent 2%, rgba(255,224,102,.95) 4%, rgba(255,224,102,.8) 92%, transparent 96%); padding: 0 .12em; border-radius: 4px; }
[data-style="paper"] .panel { position: relative; }
[data-style="paper"] .panel::before { content: ""; position: absolute; top: -10px; left: 50%; width: 80px; height: 22px; transform: translateX(-50%) rotate(-3deg); background: rgba(255,224,102,.55); border-left: 1px dashed rgba(31,42,68,.2); border-right: 1px dashed rgba(31,42,68,.2); }
[data-style="paper"] .list-card::before, [data-style="paper"] .result-card::before, [data-style="paper"] .roster::before { display: none; }
[data-style="paper"] .list-card:nth-child(odd) { transform: rotate(-.8deg); } [data-style="paper"] .list-card:nth-child(even) { transform: rotate(.7deg); }
[data-style="paper"] .art img { filter: drop-shadow(0 0 0 #fff) drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(2px 3px 0 rgba(31,42,68,.35)); transform: rotate(-4deg); }
[data-style="paper"] .hero-art img { animation: float 5s ease-in-out infinite; }
[data-style="paper"] .hero-number { font-family: "Caveat", cursive; font-size: calc(var(--u) * 190); }
[data-style="paper"] .hero-number span { display: inline-block; }
[data-style="paper"] .hero-number span:nth-child(odd) { transform: rotate(-4deg); } [data-style="paper"] .hero-number span:nth-child(even) { transform: rotate(3deg) translateY(4%); }
[data-style="paper"] .option.is-selected { background: var(--accent); color: var(--fg); }
[data-style="paper"] .option.is-selected::after { content: "✓"; position: absolute; right: 3.2em; font-size: 1.3em; z-index: 1; color: #d1495b; }
[data-style="paper"] .feed p { font-size: calc(var(--u) * 46); }
[data-style="paper"] .tile .avatar { border: 1.5px solid var(--line); }
[data-style="paper"] .btn.ghost { --ghost-bg: #fffdf7; }

/* Shared keyframes this style uses (defined once in the base layer in the reference) */
@keyframes float { 50% { transform: translateY(-6%); } }
```

---

### 3.11 Sakura (`sakura`)

#### Concept & mood

Japanese minimalism. A washi-paper background carries ink-black Mincho serif headings (Shippori Mincho) and Zen Kaku Gothic New body text, with very wide letter-spacing on small labels. Each page has one huge, faint vertical kanji as a watermark. Eight cherry petals drift down, a vermilion hanko seal stamps the key card, and the layout relies on generous whitespace and hairline borders. The dark variant is an indigo night with a pink accent.

**Good for:** editorial and magazine sites, restaurants, tea and hospitality, architecture and design studios, cosmetics, literary sites, calm productivity apps.

#### Palette

Default:

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#f6f1e7` | Washi (plus a pink glow `rgba(244,167,185,.22)` at 85% 10%) |
| `--fg` | `#1d1d1f` | Ink |
| `--muted` | `#7a7268` | Warm grey |
| `--panel` | `rgba(255,253,248,.86)` | Translucent paper |
| `--line` | `rgba(29,29,31,.14)` | Hairline |
| `--accent` / `--accent-fg` | `#1d1d1f` / `#f6f1e7` | Ink primary |
| `--accent-text` | `#c8102e` | Vermilion |
| `--field`, `--tile` | `#fffdf8` | Inputs, tiles |
| `--chip-bg` | `transparent` | Outline chips |
| `--bar` | `linear-gradient(90deg, rgba(244,167,185,.55), rgba(244,167,185,.12))` | Blossom share bar |

Other colours: kanji watermark `rgba(29,29,31,.055)`; petals `linear-gradient(135deg, #ffd3de, #f4a7b9)` at opacity .9; seal `#c8102e`; selected option `#1d1d1f` with `#f6f1e7`; ghost border `rgba(29,29,31,.4)`.

Dark variant:

| Token / element | Value |
| --- | --- |
| `--bg` | `#14172b` (plus `rgba(244,167,185,.16)` glow at 80% 12%) |
| `--fg` | `#f4ede4` |
| `--muted` | `#a7a2b8` |
| `--panel` | `rgba(30,34,60,.82)` |
| `--line` | `rgba(255,255,255,.12)` |
| `--field` | `rgba(255,255,255,.04)` |
| `--accent` / `--accent-fg` | `#f4a7b9` / `#14172b` |
| `--accent-text` | `#f4a7b9` |
| Kanji | `rgba(244,237,228,.06)` |
| Petals | opacity .55 |

#### Typography

- Families: Shippori Mincho 500/600/700 (display, feed, hero number, kanji, seal); Zen Kaku Gothic New 400/500 (body, buttons).
- Google Fonts: `https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600;700&family=Zen+Kaku+Gothic+New:wght@400;500&display=swap`
- Display: weight 600, tracking `.02em`, line-height 1.1.
- Feed: Shippori Mincho 500, tracking `.02em`.
- Hero number: Shippori Mincho 700, tracking `.2em`.
- Buttons: weight 500, tracking `.2em`.
- Eyebrow: tracking `.38em`, vermilion.
- Kanji watermark: 700, 260u (200u on mobile), `writing-mode: vertical-rl`.

#### Shape & lines

`--bw: 1px` hairlines, `--r: 2px`, `--r-sm: 2px`, buttons 2px. Chips are pills with a 1px border. Avatars are circles outlined in vermilion with vermilion initials.

#### Depth & surfaces

Almost flat: `--shadow: 0 1px 0 rgba(29,29,31,.04)`. Panels are slightly translucent paper.

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Glow | Faint pink radial in the top-right corner over the washi colour. |
| Kanji watermark `.kanji` | One character per page (the reference uses 遊 "play" on the home page, 宴 "banquet", 勝 "victory", 信 "trust", 恋 "love"), right 4%, top 6% (10% on mobile), vertical writing, ink at 5.5% opacity. |
| Petals `.petals > i` | Eight petals, 14u×10u (11u×8u on mobile), leaf-shaped with `border-radius: 150% 0 150% 0`. They start 6% above the top at `left: var(--x)` and fall with `fall var(--d) linear infinite` and `animation-delay: var(--dl)`: drifting 60u right by the midpoint, ending 20u left of the start, 960u down, rotating 420°. |

#### Components

- **Primary button:** ink-black rectangle (2px radius) with washi text tracked at `.2em`. In dark it becomes pink with indigo text.
- **Ghost button:** transparent, ink text, `rgba(29,29,31,.4)` border.
- **Panels:** translucent paper with a hairline.
- **Options:** paper; selected is ink black.
- **Hanko seal:** `.feature-card::after`, a 44u square at the top-right (14u inset), 2px vermilion border, 6px radius, `rotate(-8deg)`, opacity .85, one 26u kanji (the reference uses 狼, "wolf").
- **Result card "done" stamp:** `.result-card.is-out::after` shows 済 ("settled") in a 1.5px vermilion box, `rotate(-10deg)`, opacity .8.
- **Eyebrow:** vermilion with very wide tracking.

#### Motion & interaction

Petals only (9–16.5s linear, transform-only, `will-change: transform`). Base press feedback.

#### Imagery

No filter; full-colour art.

#### Accessibility & pitfalls

- `--muted` (`#7a7268`) on washi is 4.2:1. Use it at 18px or larger.
- Wide tracking (`.2em`–`.38em`) hurts readability on long strings. Keep it to labels and buttons.
- **Dark trap still in source:** ghost buttons keep `--ghost-fg: #1d1d1f` on the `#14172b` page (1.1:1). Fix: `[data-style="sakura"] .screen.is-dark .btn.ghost { --ghost-fg: #f4ede4; border-color: rgba(255,255,255,.3); }` (recommended, not in source).
- In dark, the selected option stays ink black on near-black fields. The text is readable, but the selection is hard to see. Consider `background: var(--accent); color: var(--accent-fg)` in dark.
- The watermark and seals are decorative and `aria-hidden`.

#### Performance notes / cost

Cost tier: **low**. The eight petals are transform-only. The only long task measured during a style switch (54ms, on the phone) was the switch to Sakura; the cause was not recorded.

#### Do / Don't

Do:
- Leave generous whitespace and use hairlines rather than boxes.
- Use one watermark character per page that relates to the page's meaning.
- Keep vermilion for seals, kickers and one accent per screen.
- Track small labels wide.

Don't:
- Add heavy shadows or thick borders.
- Show more than eight petals or speed them up.
- Use more than one seal per screen.
- Use kanji as decoration without checking its meaning.

#### Copy-paste CSS

```css
/* Sakura: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged. */
[data-style="sakura"] {
  --bg: #f6f1e7; --fg: #1d1d1f; --muted: #7a7268;
  --panel: rgba(255,253,248,.86); --line: rgba(29,29,31,.14); --bw: 1px; --r: 2px; --r-sm: 2px; --shadow: 0 1px 0 rgba(29,29,31,.04);
  --accent: #1d1d1f; --accent-fg: #f6f1e7; --accent-text: #c8102e;
  --field: #fffdf8; --tile: #fffdf8; --chip-bg: transparent; --chip-bw: 1px;
  --font-d: "Shippori Mincho", "Hiragino Mincho ProN", "Yu Mincho", serif; --font-b: "Zen Kaku Gothic New", "Hiragino Sans", system-ui, sans-serif;
  --d-weight: 600; --d-track: .02em; --d-lh: 1.1; --btn-r: 2px; --btn-track: .2em; --btn-weight: 500; --eyebrow-track: .38em;
  --narr-weight: 500; --font-narr: "Shippori Mincho", serif; --narr-track: .02em;
  --bar: linear-gradient(90deg, rgba(244,167,185,.55), rgba(244,167,185,.12));
}
[data-style="sakura"] .bg-layer { background: radial-gradient(60% 50% at 85% 10%, rgba(244,167,185,.22), transparent 70%), var(--bg); }
[data-style="sakura"] .kanji { display: block; position: absolute; right: 4%; top: 6%; writing-mode: vertical-rl; font-family: "Shippori Mincho", serif; font-weight: 700; font-size: calc(var(--u) * 260); line-height: 1; color: rgba(29,29,31,.055); }
[data-style="sakura"] .screen.mobile .kanji { font-size: calc(var(--u) * 200); top: 10%; }
[data-style="sakura"] .petals { display: block; position: absolute; inset: 0; }
[data-style="sakura"] .petals i { position: absolute; top: -6%; width: calc(var(--u) * 14); height: calc(var(--u) * 10); border-radius: 150% 0 150% 0; background: linear-gradient(135deg, #ffd3de, #f4a7b9); opacity: .9; will-change: transform; animation: fall var(--d, 11s) linear infinite; animation-delay: var(--dl, 0s); left: var(--x, 10%); }
[data-style="sakura"] .screen.mobile .petals i { width: calc(var(--u) * 11); height: calc(var(--u) * 8); }
@keyframes fall { 0% { transform: translate3d(0, 0, 0) rotate(0deg); } 50% { transform: translate3d(calc(var(--u) * 60), calc(var(--u) * 470), 0) rotate(200deg); } 100% { transform: translate3d(calc(var(--u) * -20), calc(var(--u) * 960), 0) rotate(420deg); } }
[data-style="sakura"] .eyebrow { color: var(--accent-text); }
[data-style="sakura"] .display { font-weight: 600; }
[data-style="sakura"] .feature-card { position: relative; }
[data-style="sakura"] .feature-card::after { content: "狼"; /* reference uses 狼 ("wolf"); any single kanji works */ position: absolute; top: calc(var(--u) * 14); right: calc(var(--u) * 14); width: calc(var(--u) * 44); height: calc(var(--u) * 44); display: grid; place-items: center; font: 700 calc(var(--u) * 26) "Shippori Mincho", serif; color: #c8102e; border: 2px solid #c8102e; border-radius: 6px; transform: rotate(-8deg); opacity: .85; }
[data-style="sakura"] .option.is-selected { background: #1d1d1f; color: #f6f1e7; }
[data-style="sakura"] .btn.ghost { --ghost-bg: transparent; --ghost-fg: #1d1d1f; border-color: rgba(29,29,31,.4); }
[data-style="sakura"] .hero-number { font-family: "Shippori Mincho", serif; font-weight: 700; letter-spacing: .2em; }
[data-style="sakura"] .tile .avatar { background: transparent; border: 1px solid var(--accent-text); color: var(--accent-text); }
[data-style="sakura"] .screen.is-dark { --bg: #14172b; --fg: #f4ede4; --muted: #a7a2b8; --panel: rgba(30,34,60,.82); --line: rgba(255,255,255,.12); --field: rgba(255,255,255,.04); --accent: #f4a7b9; --accent-fg: #14172b; --accent-text: #f4a7b9; }
[data-style="sakura"] .screen.is-dark .bg-layer { background: radial-gradient(50% 45% at 80% 12%, rgba(244,167,185,.16), transparent 70%), var(--bg); }
[data-style="sakura"] .screen.is-dark .kanji { color: rgba(244,237,228,.06); }
[data-style="sakura"] .screen.is-dark .petals i { opacity: .55; }
[data-style="sakura"] .result-card.is-out::after { content: "済"; /* "done / settled" */ position: absolute; top: 8%; right: 8%; font: 700 calc(var(--u) * 22) "Shippori Mincho", serif; color: #c8102e; border: 1.5px solid #c8102e; border-radius: 4px; padding: 0 .15em; transform: rotate(-10deg); opacity: .8; }
[data-style="sakura"] .result-card { position: relative; }
```

---

### 3.12 Noir (`noir`)

#### Concept & mood

Black-and-white film. A spotlight radial gradient falls on a black set, a venetian-blind shadow cuts diagonally across it, and film grain covers everything. Limelight sets the display type and Special Elite the typewriter body. Buttons are uppercase and widely tracked. There is one colour only, blood red, used for selection, danger and red rubber stamps ("CLASSIFIED", "CASE CLOSED"). Images are grayscale.

**Good for:** mystery and thriller marketing, true-crime podcasts, film festivals, cocktail bars, detective and puzzle games, dramatic portfolios.

#### Palette

Default (there is no dark variant):

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#0e0e0e` | Black set (painted as a spotlight) |
| `--fg` | `#ecebe6` | Off-white |
| `--muted` | `#9a9890` | Grey |
| `--panel` | `rgba(23,23,23,.92)` | Near-black panel |
| `--line` | `#3a3a3a` | Dark grey rule |
| `--accent` / `--accent-fg` | `#ecebe6` / `#0e0e0e` | Off-white primary |
| `--accent-text` | `#c1121f` | Blood red |
| `--field`, `--tile` | `#141414` | Inputs, tiles |
| `--chip-bg` | `transparent` | Outline chips |
| `--bar` | `linear-gradient(90deg, rgba(193,18,31,.55), rgba(193,18,31,.12))` | Red share bar |

Other colours: spotlight `radial-gradient(55% 75% at 28% 18%, #4a4a4a, #0e0e0e 72%)`; blinds `rgba(0,0,0,.6)`; eyebrow `#c9c7bf`; selected option `#c1121f` with `#fff` (border `#c1121f`); avatars `#ecebe6` with `#0e0e0e` initials; newest feed line `#fff`; stamp backing `rgba(14,14,14,.4)`.

Dark variant: not defined in source (the style is dark by default).

#### Typography

- Families: Limelight (display, hero number); Special Elite (body, buttons, feed, stamps).
- Google Fonts: `https://fonts.googleapis.com/css2?family=Limelight&family=Special+Elite&display=swap`
- Display: weight 400, tracking `.03em`.
- Hero number: Limelight 400, tracking `.1em`.
- Buttons: Special Elite, uppercase, tracking `.22em`.
- Feed: Special Elite 400, tracking 0; the newest line is pure white.
- Stamps: Special Elite 15u.

#### Shape & lines

`--bw: 1px`, every radius 0, chips square with a 1px border, avatars square.

#### Depth & surfaces

Panels cast a deep shadow `0 30px 60px -30px #000`. Grain covers the page at opacity .35 with `mix-blend-mode: overlay`.

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Spotlight | Off-centre radial gradient (light at 28% 18%). |
| Venetian blinds `.blinds` | `inset: -10%; background: repeating-linear-gradient(-18deg, rgba(0,0,0,.6) 0 26u, transparent 26u 50u)`, flickering with `flicker 9s steps(1) infinite`. |
| Film grain `.grainl` | `background-image: var(--grain); background-size: 128px; opacity: .35; mix-blend-mode: overlay` (tile from §1.13). |

#### Components

- **Primary button:** off-white slab with black, uppercase, widely tracked typewriter text.
- **Ghost button:** transparent with an off-white border and text.
- **Panels:** near-black with a dark grey hairline and a deep shadow.
- **Options:** dark; selected is blood red with white text.
- **Stamps:** `.feature-card::after` reads "CLASSIFIED" (top 9%, right 4%, `rotate(12deg)`, 2px red border, padding `.2em .5em`, tracking `.2em`, opacity .85). `.result-card.is-out::after` reads "CASE CLOSED" (centred at 38% height, `rotate(-14deg)`, translucent dark backing). Out cards fade to .8 instead of the base .5.
- **Eyebrow:** light grey.

#### Motion & interaction

Only the blinds flicker (opacity, `steps(1)`, two short dips per 9s). Base press feedback.

#### Imagery

`filter: grayscale(1) contrast(1.25) brightness(.95)`.

#### Accessibility & pitfalls

- Red on black is at most 3.1:1 (1.4:1 under the spotlight), so never use `--accent-text` for body text. Use it for large bordered stamps and as a fill under white text (6.2:1).
- `--muted` drops to 3.1:1 at the spotlight centre. Keep secondary text on panels (6.2:1).
- The blinds flicker affects a full-screen layer. It is low frequency (two dips per 9s), but reduced motion and lite mode stop it, so keep those working.
- Stamp text is decorative CSS `content`; do not put information only in a stamp.

#### Performance notes / cost

Cost tier: **low**. A static spotlight, one opacity-stepped overlay and a 128px grain tile.

#### Do / Don't

Do:
- Stay strictly grayscale apart from one red.
- Use red only for selection, danger and stamps.
- Keep the spotlight off-centre and the blinds diagonal.
- Track buttons wide and uppercase.

Don't:
- Add a second accent colour.
- Use colour photography.
- Set long paragraphs in Limelight.
- Flicker anything quickly.

#### Copy-paste CSS

Requires the grain tile from §1.13.

```css
/* Noir: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged. */
[data-style="noir"] {
  --bg: #0e0e0e; --fg: #ecebe6; --muted: #9a9890;
  --panel: rgba(23,23,23,.92); --line: #3a3a3a; --bw: 1px; --r: 0px; --r-sm: 0px; --shadow: 0 30px 60px -30px #000;
  --accent: #ecebe6; --accent-fg: #0e0e0e; --accent-text: #c1121f;
  --field: #141414; --tile: #141414; --chip-bg: transparent; --chip-bw: 1px; --chip-r: 0;
  --font-d: "Limelight", "Didot", "Bodoni 72", serif; --font-b: "Special Elite", "Courier New", monospace; --font-btn: "Special Elite", monospace;
  --d-weight: 400; --d-track: .03em; --btn-case: uppercase; --btn-track: .22em; --btn-r: 0; --btn-weight: 400;
  --narr-weight: 400; --font-narr: "Special Elite", monospace; --narr-track: 0; --av-r: 0;
  --bar: linear-gradient(90deg, rgba(193,18,31,.55), rgba(193,18,31,.12));
}
[data-style="noir"] .bg-layer { background: radial-gradient(55% 75% at 28% 18%, #4a4a4a, #0e0e0e 72%); }
[data-style="noir"] .blinds { display: block; position: absolute; inset: -10%; background: repeating-linear-gradient(-18deg, rgba(0,0,0,.6) 0 calc(var(--u) * 26), transparent calc(var(--u) * 26) calc(var(--u) * 50)); animation: flicker 9s steps(1) infinite; }
[data-style="noir"] .grainl { display: block; position: absolute; inset: 0; background-image: var(--grain); background-size: 128px; opacity: .35; mix-blend-mode: overlay; }
[data-style="noir"] .art img { filter: grayscale(1) contrast(1.25) brightness(.95); }
[data-style="noir"] .eyebrow { color: #c9c7bf; }
[data-style="noir"] .option.is-selected { background: #c1121f; color: #fff; border-color: #c1121f; }
[data-style="noir"] .btn.ghost { --ghost-bg: transparent; --ghost-fg: #ecebe6; border-color: #ecebe6; }
[data-style="noir"] .hero-number { font-family: "Limelight", serif; font-weight: 400; letter-spacing: .1em; }
[data-style="noir"] .feed p.is-new { color: #fff; }
[data-style="noir"] .feature-card, [data-style="noir"] .result-card { position: relative; }
[data-style="noir"] .feature-card::after { content: "CLASSIFIED"; position: absolute; top: 9%; right: 4%; font: calc(var(--u) * 15) "Special Elite", monospace; letter-spacing: .2em; color: #c1121f; border: 2px solid #c1121f; padding: .2em .5em; transform: rotate(12deg); opacity: .85; }
[data-style="noir"] .result-card.is-out::after { content: "CASE CLOSED"; position: absolute; top: 38%; left: 50%; transform: translate(-50%, -50%) rotate(-14deg); font: calc(var(--u) * 15) "Special Elite", monospace; letter-spacing: .12em; color: #c1121f; border: 2px solid #c1121f; padding: .15em .4em; white-space: nowrap; background: rgba(14,14,14,.4); }
[data-style="noir"] .result-card.is-out { opacity: .8; }
[data-style="noir"] .tile .avatar { background: #ecebe6; color: #0e0e0e; }

/* Shared keyframes this style uses (defined once in the base layer in the reference) */
@keyframes flicker { 0%, 100% { opacity: 1; } 92% { opacity: 1; } 93% { opacity: .35; } 94% { opacity: 1; } 96% { opacity: .5; } 97% { opacity: 1; } }
```

---

### 3.13 Storybook (`story`)

#### Concept & mood

An old fairy-tale book. Parchment with darkened vignette edges and grain, brown ink and an oxblood accent. Panels have a double inset frame and a ❦ fleuron on the top edge. Headings are Cinzel Decorative and Cinzel; body text is IM Fell English, with older lines set in italic and the newest line opening with a gold drop cap. Images are sepia. The dark variant is candlelit pages: a deep purple vignette with gold.

**Good for:** children's books and authors, fantasy games and tabletop RPG tools, wedding and event invitations, museums and heritage brands, story-led marketing.

#### Palette

Default:

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#efe0bd` | Parchment (painted as a vignette) |
| `--fg` | `#3b2a1a` | Brown ink |
| `--muted` / `--muted-panel` | `#7a5c3a` | Faded ink |
| `--panel` / `--panel-fg` | `#f7ecd2` / `#3b2a1a` | Page panels |
| `--line` | `#7a5c3a` | Frame line |
| `--accent` / `--accent-fg` | `#7a1f1f` / `#f7ecd2` | Oxblood primary |
| `--accent-text` | `#7a1f1f` | Oxblood text accent |
| `--field`, `--tile` | `#fbf3df` | Inputs, tiles |
| `--field-fg`, `--tile-fg`, `--chip-fg` | `#3b2a1a` | Their text |
| `--chip-bg` | `#f7ecd2` | Chips |
| `--bar` | `linear-gradient(90deg, rgba(122,31,31,.3), rgba(122,31,31,.08))` | Share bar |

Other colours: vignette `radial-gradient(ellipse at center, #f5e8c9 45%, #d4b781 100%)`; fleuron backing `#f1e3c2`; drop cap `#e9c46a`; avatars `#7a1f1f`; selected option `#7a1f1f` with `#f7ecd2`; hero number `#7a1f1f`.

Dark variant:

| Token / element | Value |
| --- | --- |
| `--fg` | `#f0e2bf` |
| `--muted` | `#c9b48a` |
| `--accent-text` | `#e9c46a` (gold) |
| Background | `radial-gradient(circle at 50% 38%, #3d3152, #120f1d 72%)` |
| First eyebrow on the page | `#e9c46a` |

Panels, fields and chips stay parchment with explicit brown text.

#### Typography

- Families: Cinzel Decorative 700 (display, hero number, drop cap); Cinzel 600/700 (buttons, segmented input); IM Fell English regular and italic (body, feed).
- Google Fonts: `https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Cinzel:wght@600;700&family=IM+Fell+English:ital@0;1&display=swap`
- Display: weight 700, tracking `.01em`, line-height 1.05.
- Buttons: Cinzel 700, tracking `.06em`.
- Hero number: Cinzel Decorative, tracking `.06em`, oxblood.
- Feed: IM Fell English 400 at 40u. Older lines are italic; the newest is upright, and its `::first-letter` is Cinzel Decorative at 1.55em in `#e9c46a` with line-height .9.

#### Shape & lines

`--bw: 1.5px`, `--r: 4px`, `--r-sm: 4px`, buttons 4px. Chips are pills with a 1px border.

#### Depth & surfaces

The double frame comes from the panel shadow:

```css
--shadow: inset 0 0 0 4px #f7ecd2,             /* 4px gap in the page colour */
          inset 0 0 0 5px rgba(122,92,58,.55), /* inner hairline frame */
          0 10px 24px -14px rgba(59,42,26,.6); /* soft lift off the table */
```

Together with the 1.5px border, this draws an outer rule, a gap and an inner rule. Grain is multiplied over the page at opacity .3.

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Vignette | Light centre fading to darker parchment at the edges. |
| Grain `.grainl` | `background-image: var(--grain); background-size: 128px; opacity: .3; mix-blend-mode: multiply`. |
| Fleuron | `.panel::after { content: "❦"; }` centred on the top edge (`top: -.72em`), with a `#f1e3c2` circular backing that hides the border behind it, in the line colour at 1.1em. Not on list cards or result cards. |

#### Components

- **Primary button:** oxblood with parchment Cinzel text, 4px radius.
- **Ghost button:** parchment with brown text.
- **Panels:** parchment with the double frame and a fleuron.
- **Options:** light parchment; selected is oxblood.
- **Avatars:** oxblood.
- **Message feed:** italic history, upright newest line with a gold drop cap.

#### Motion & interaction

None beyond the base entrances and press. The style is meant to feel still.

#### Imagery

`filter: sepia(.45) saturate(.9)`.

#### Accessibility & pitfalls

- `--muted` at the darker vignette edge is 3.2:1. Keep secondary text on panels (5.2:1).
- The gold drop cap (`#e9c46a`) is used in both palettes. On light parchment it is about 1.4:1, and it is the first letter of a real word. Use a darker gold or oxblood for the drop cap on light pages.
- **Dark trap:** `--accent-text` becomes gold, but it is also used inside parchment panels (list-card meta, bold words in messages, ✓ marks, the focus ring), where it is about 1.4:1. Scope the gold to text on the dark page, or set `--accent-text` back to oxblood inside panels.
- Cinzel Decorative is all small capitals with swashes. Keep it to short headings.

#### Performance notes / cost

Cost tier: **low**. Static gradients, a grain tile and one sepia filter per image.

#### Do / Don't

Do:
- Frame panels with the double rule and crown them with a fleuron.
- Use italic for older or quoted lines and an ornamental capital for the newest.
- Keep images warm (sepia).
- Keep the parchment panels in the dark palette.

Don't:
- Use pure white or pure black.
- Put fleurons on every small card.
- Set body text in Cinzel Decorative.
- Use the gold accent on parchment.

#### Copy-paste CSS

Requires the grain tile from §1.13.

```css
/* Storybook: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged. */
[data-style="story"] {
  --bg: #efe0bd; --fg: #3b2a1a; --muted: #7a5c3a;
  --panel: #f7ecd2; --line: #7a5c3a; --bw: 1.5px; --r: 4px; --r-sm: 4px;
  --shadow: inset 0 0 0 4px #f7ecd2, inset 0 0 0 5px rgba(122,92,58,.55), 0 10px 24px -14px rgba(59,42,26,.6);
  --accent: #7a1f1f; --accent-fg: #f7ecd2; --accent-text: #7a1f1f;
  --field: #fbf3df; --tile: #fbf3df; --chip-bg: #f7ecd2; --chip-bw: 1px;
  --chip-fg: #3b2a1a; --panel-fg: #3b2a1a; --muted-panel: #7a5c3a; --field-fg: #3b2a1a; --tile-fg: #3b2a1a;
  --font-d: "Cinzel Decorative", "Cinzel", Georgia, serif; --font-b: "IM Fell English", Georgia, serif; --font-btn: "Cinzel", Georgia, serif;
  --d-weight: 700; --d-track: .01em; --d-lh: 1.05; --btn-r: 4px; --btn-weight: 700; --btn-track: .06em;
  --font-narr: "IM Fell English", Georgia, serif; --narr-weight: 400; --narr-track: 0; --font-code: "Cinzel", serif;
  --bar: linear-gradient(90deg, rgba(122,31,31,.3), rgba(122,31,31,.08));
}
[data-style="story"] .bg-layer { background: radial-gradient(ellipse at center, #f5e8c9 45%, #d4b781 100%); }
[data-style="story"] .grainl { display: block; position: absolute; inset: 0; background-image: var(--grain); background-size: 128px; opacity: .3; mix-blend-mode: multiply; }
[data-style="story"] .screen.is-dark { --fg: #f0e2bf; --muted: #c9b48a; --accent-text: #e9c46a; }
[data-style="story"] .screen.is-dark .bg-layer { background: radial-gradient(circle at 50% 38%, #3d3152, #120f1d 72%); }
[data-style="story"] .panel { position: relative; }
[data-style="story"] .panel::after { content: "❦"; position: absolute; top: -.72em; left: 50%; transform: translateX(-50%); padding: 0 .35em; color: var(--line); background: #f1e3c2; font-size: 1.1em; line-height: 1.2; border-radius: 50%; }
[data-style="story"] .list-card::after, [data-style="story"] .result-card::after { display: none; }
[data-style="story"] .art img { filter: sepia(.45) saturate(.9); }
[data-style="story"] .feed p { font-size: calc(var(--u) * 40); font-style: italic; }
[data-style="story"] .feed p.is-new { font-style: normal; }
[data-style="story"] .feed p.is-new::first-letter { font-family: "Cinzel Decorative", serif; font-size: 1.55em; color: #e9c46a; line-height: .9; }
[data-style="story"] .screen.is-dark .eyebrow:first-child { color: #e9c46a; }
[data-style="story"] .option.is-selected { background: #7a1f1f; color: #f7ecd2; }
[data-style="story"] .btn.ghost { --ghost-bg: #f7ecd2; --ghost-fg: #3b2a1a; }
[data-style="story"] .hero-number { font-family: "Cinzel Decorative", serif; letter-spacing: .06em; color: #7a1f1f; }
[data-style="story"] .tile .avatar { background: #7a1f1f; }
```

---

### 3.14 The Daily Village (`news`)

#### Concept & mood

The whole page is a newspaper. Newsprint with grain, a blackletter masthead (UnifrakturMaguntia) with a dateline under double rules, and Old Standard TT for everything else. Panels are columns with double top rules. The newest message is set as an uppercase bold headline and older ones as italic copy. Options are ballot boxes (☐/☒), images are grayscale and multiplied into the paper, and kickers are dark red.

**Good for:** editorial and news sites, newsletters and changelogs, community bulletins, history and archive projects, press pages, election-style polls.

#### Palette

Default (there is no dark variant):

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#f3eee1` | Newsprint |
| `--fg` | `#141414` | Ink |
| `--muted` | `#55524a` | Grey ink |
| `--panel` | `transparent` | Columns are not filled |
| `--line` | `#141414` | Rules |
| `--accent` / `--accent-fg` | `#141414` / `#f3eee1` | Black primary |
| `--accent-text` | `#8b1a1a` | Dark-red kickers |
| `--field` | `#fbf8ef` | Inputs, options |
| `--tile`, `--chip-bg`, `--qr-bg` | `transparent` | |
| `--bar` | `repeating-linear-gradient(90deg, rgba(20,20,20,.18) 0 1px, transparent 1px 4px)` | Hatched share bar |

Other colours: older feed lines `#3a3833`; selected option `#141414` with `#f3eee1`; strike-through on closed result cards `#8b1a1a`.

Dark variant: not defined in source.

#### Typography

- Families: UnifrakturMaguntia (masthead only); Old Standard TT 400, 700 and italic 400 (everything else).
- Google Fonts: `https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&display=swap`
- Masthead: 50u (30u on mobile), line-height 1.05, centred.
- Dateline (masthead `::after`): Old Standard TT 700, 13u (8.5u on mobile), uppercase, tracking `.22em` (`.14em` on mobile).
- Display: weight 700, tracking `-.01em`, line-height 1.
- Buttons: 700, uppercase, tracking `.14em`.
- Eyebrow (kicker): dark red, tracking `.18em`.
- Feed: older lines italic 26u in `#3a3833`; the newest line upright, 700, 46u, uppercase, tracking `-.01em`, line-height 1.02, `#141414`.

#### Shape & lines

`--bw: 1px`, every radius 0. Panels use `border-width: 3px 0 1px; border-top-style: double`: a double rule on top, nothing on the sides and a hairline at the bottom, like a newspaper column. The hero number sits between 4px double rules (top and bottom).

#### Depth & surfaces

None (`--shadow: none`). Newsprint grain is on the background layer.

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Newsprint | `background-color: var(--bg); background-image: var(--grain); background-size: 128px`. |
| Masthead `.masthead` | A real DOM element, a direct child of `.screen`, holding the publication name. It is absolutely positioned 64u from the left and right and 18u from the top (20u and 50u on mobile), with a `4px double` bottom rule. `::after` holds the dateline above a 1px rule. The screen gets `padding-top: 132u` to clear it. |

#### Components

- **Primary button:** solid black with newsprint text, uppercase and tracked.
- **Ghost button:** transparent with a black border and black text.
- **Panels:** columns with a double top rule.
- **Options:** start with a `☐` glyph (1.2em, `margin-right: .5em`), left-aligned, with the meta pushed right. Selected is solid black with `☒`.
- **Hero number:** boxed between double rules.
- **Message feed:** italic body copy, with the newest line as the headline.
- **Result cards:** closed ones are struck through in dark red.

#### Motion & interaction

None beyond base entrances and press.

#### Imagery

`filter: grayscale(1) contrast(1.35); mix-blend-mode: multiply`. The art prints into the paper like a halftone photo.

#### Accessibility & pitfalls

- Contrast is high (ink 15.9:1, red 8.0:1).
- Use blackletter only for the masthead; it is hard to read at length.
- The masthead is `aria-hidden` in the reference. Give the page a real `<h1>` elsewhere.
- The ballot glyphs are CSS content; selection is carried by `aria-pressed`.
- The dateline text is hard-coded in CSS; replace it with your own.

#### Performance notes / cost

Cost tier: **low**. A grain tile and a multiply blend on images.

#### Do / Don't

Do:
- Use double rules for structure and hairlines for separation.
- Write the newest item as a headline and the history as italic copy.
- Keep everything in one serif family apart from the masthead.
- Print images in grayscale with `multiply`.

Don't:
- Round corners or add shadows.
- Use colour except the dark-red kicker.
- Set the masthead face below about 30px.
- Fill panels; let columns sit on the paper.

#### Copy-paste CSS

Requires the grain tile from §1.13. Add `<div class="deco masthead" aria-hidden="true">Your Publication</div>` as a direct child of `.screen`.

```css
/* The Daily Village: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged. */
[data-style="news"] {
  --bg: #f3eee1; --fg: #141414; --muted: #55524a;
  --panel: transparent; --line: #141414; --bw: 1px; --r: 0px; --r-sm: 0px; --shadow: none;
  --accent: #141414; --accent-fg: #f3eee1; --accent-text: #8b1a1a;
  --field: #fbf8ef; --tile: transparent; --chip-bg: transparent; --chip-bw: 1px; --chip-r: 0;
  --font-d: "Old Standard TT", "Times New Roman", serif; --font-b: "Old Standard TT", "Times New Roman", serif;
  --d-weight: 700; --d-track: -.01em; --d-lh: 1; --btn-case: uppercase; --btn-track: .14em; --btn-r: 0; --btn-weight: 700;
  --font-narr: "Old Standard TT", serif; --narr-weight: 400; --narr-track: 0; --qr-bg: transparent;
  --bar: repeating-linear-gradient(90deg, rgba(20,20,20,.18) 0 1px, transparent 1px 4px);
}
[data-style="news"] .bg-layer { background-color: var(--bg); background-image: var(--grain); background-size: 128px; }
[data-style="news"] .screen { padding-top: calc(var(--u) * 132); }
[data-style="news"] .screen.mobile { padding-top: calc(var(--u) * 132); }
[data-style="news"] .screen > .masthead { display: block; position: absolute; left: calc(var(--u) * 64); right: calc(var(--u) * 64); top: calc(var(--u) * 18); text-align: center; color: #141414; font-family: "UnifrakturMaguntia", "Old English Text MT", serif; font-size: calc(var(--u) * 50); line-height: 1.05; border-bottom: 4px double #141414; padding-bottom: calc(var(--u) * 4); }
[data-style="news"] .screen > .masthead::after { content: "Vol. II · Round 2 · Price: one vote"; /* reference dateline; replace with your own */ display: block; font: 700 calc(var(--u) * 13) "Old Standard TT", serif; letter-spacing: .22em; text-transform: uppercase; border-top: 1px solid #141414; padding-top: calc(var(--u) * 5); margin-top: calc(var(--u) * 6); }
[data-style="news"] .screen.mobile > .masthead { left: calc(var(--u) * 20); right: calc(var(--u) * 20); top: calc(var(--u) * 50); font-size: calc(var(--u) * 30); }
[data-style="news"] .screen.mobile > .masthead::after { font-size: calc(var(--u) * 8.5); letter-spacing: .14em; }
[data-style="news"] .panel { border-width: 3px 0 1px; border-top-style: double; }
[data-style="news"] .eyebrow { color: var(--accent-text); letter-spacing: .18em; }
[data-style="news"] .art img { filter: grayscale(1) contrast(1.35); mix-blend-mode: multiply; }
[data-style="news"] .feed p { font-style: italic; font-size: calc(var(--u) * 26); color: #3a3833; }
[data-style="news"] .feed p.is-new { font-style: normal; font-weight: 700; font-size: calc(var(--u) * 46); text-transform: uppercase; letter-spacing: -.01em; color: #141414; line-height: 1.02; }
[data-style="news"] .option::before { content: "☐"; margin-right: .5em; font-size: 1.2em; }
[data-style="news"] .option { justify-content: flex-start; } [data-style="news"] .option .meta { margin-left: auto; }
[data-style="news"] .option.is-selected::before { content: "☒"; }
[data-style="news"] .option.is-selected { background: #141414; color: #f3eee1; }
[data-style="news"] .hero-number { border-top: 4px double #141414; border-bottom: 4px double #141414; display: inline-block; padding: 0 .1em; }
[data-style="news"] .btn.ghost { --ghost-bg: transparent; --ghost-fg: #141414; border-color: #141414; }
[data-style="news"] .result-card.is-out b { text-decoration-color: #8b1a1a; }
```

---

### 3.15 Game Show (`show`)

#### Concept & mood

A TV studio. A deep purple stage, two swinging spotlight cones, and a marquee of chasing light bulbs around the hero text. Bungee sets display type and buttons, and Rubik the body. Colours are gold and hot pink. Panels have a double ring, buttons are chunky 3D "buzzers" with a bottom edge, and options are pills.

**Good for:** quizzes and trivia, live events and award shows, raffles and giveaways, sales and promo pages, streaming overlays.

#### Palette

Default:

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#2a0845` | Stage purple |
| `--fg` | `#fff` | Text |
| `--muted` | `#e0c3ff` | Lilac secondary |
| `--panel` | `#3c0d66` | Panel purple |
| `--line` | `#ffd166` | Gold border |
| `--accent` / `--accent-fg` | `#ff2e63` / `#fff` | Hot-pink buzzer |
| `--accent-text` | `#ffd166` | Gold text accent |
| `--field`, `--tile` | `#24063d` | Inputs, options, tiles |
| `--chip-bg` | `#3c0d66` | Chips |
| `--bar` | `linear-gradient(90deg, rgba(255,209,102,.45), rgba(255,209,102,.1))` | Gold share bar |

Other colours: stage `radial-gradient(70% 45% at 50% 108%, rgba(255,46,99,.55), transparent 70%), radial-gradient(60% 60% at 50% 0%, #4b1580, #2a0845 70%)`; spotlight beams `rgba(255,240,200,.32)` fading to 0; buzzer edge `#a3002f`; ghost edge `#1a0330`; marquee bulbs `#ffd166` and `#fff7d6`; selected option `#ffd166` with `#2a0845`; eyebrow `#ffd166`.

Dark variant: tokens unchanged; the background becomes `radial-gradient(60% 40% at 50% 108%, rgba(80,40,200,.5), transparent 70%), #12021f`.

#### Typography

- Families: Bungee (display, buttons, timer); Rubik 400/500/700 (body).
- Google Fonts: `https://fonts.googleapis.com/css2?family=Bungee&family=Rubik:wght@400;500;700&display=swap`
- Display: weight 400, tracking `.02em`, with an extruded pink shadow `text-shadow: 0 4u 0 #ff2e63`.
- Buttons: Bungee 400, tracking `.04em`.
- Hero number: gold `#ffd166`, glow `0 0 18px rgba(255,209,102,.6)`, tracking `.08em`.
- Eyebrow: gold.

#### Shape & lines

`--bw: 3px`, `--r: 18px`, `--r-sm: 14px`. Buttons and options are pills; chips are pills with a 2px border.

#### Depth & surfaces

- Panels: `0 0 0 4px #2a0845, 0 0 0 7px #ff2e63, 0 18px 30px -12px #000`. With the 3px gold border, this reads as gold, then a purple gap, then a pink ring, then a drop shadow.
- Buttons: `0 6px 0 #a3002f, 0 12px 20px -6px rgba(0,0,0,.6)`, a solid bottom edge like a physical buzzer. Press: `translateY(5px)` with `0 1px 0 #a3002f`, so the button sinks almost all the way into its edge.
- Ghost buttons: purple with a `0 6px 0 #1a0330` edge.
- Avatars glow in their own colour (`0 0 10px var(--c)`).

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Stage | Pink floor glow at the bottom, purple wash from the top. |
| Spotlights `.spot.s1/.s2` | 34% wide, 130% tall, from 10% above the top, at left 6% and right 6%. Cone via `clip-path: polygon(45% 0, 55% 0, 100% 100%, 0 100%)`, warm white fading out by 80%, `transform-origin: 50% 0`, `will-change: transform`. They swing with `sway1 7s` (−14° ↔ 6°) and `sway2 8s` (14° ↔ −6°). |
| Bulb marquee | On `.hero-number` and `.headline .hl`: `::before` is a 7u dotted gold border with an 18u radius; `::after` is the same border in pale `#fff7d6`, shifted 7u to the right (one border width), blinking with `chase .5s steps(1) infinite`. The alternating rows read as chasing lights. |

#### Components

- **Primary button:** hot-pink buzzer, white Bungee label, red bottom edge, pill.
- **Ghost button:** purple buzzer with a gold border and label.
- **Panels:** purple with the gold–purple–pink double ring.
- **Options:** dark purple pills; selected is gold with purple text.
- **Hero number and headline highlight:** gold with glow inside the bulb marquee.

#### Motion & interaction

Spotlights (7s and 8s), marquee chase (.5s), buzzer press (90ms, 5px down).

#### Imagery

No filter; full-colour art.

#### Accessibility & pitfalls

- White on hot pink is 3.6:1. Button labels pass only as large text; Bungee's heavy caps help, but keep labels at least 18.66px bold or darken the pink.
- The marquee blinks at 2Hz continuously. That is under 3 flashes per second, but keep it to one element per screen and rely on reduced motion and lite mode to stop it.
- Spotlights are full-height translucent cones. Keep content readable underneath by not lowering text contrast.

#### Performance notes / cost

Cost tier: **low**. Two clip-path cones rotating (transform), and the marquee toggles opacity on one pseudo-element.

#### Do / Don't

Do:
- Give every button a solid bottom edge and a short, deep press.
- Frame the hero number or headline with the bulb marquee.
- Keep gold for highlights and pink for actions.
- Keep spotlights slow and behind content.

Don't:
- Put marquees on more than one element at a time.
- Use flat buttons.
- Speed up the spotlights.
- Set body text in Bungee.

#### Copy-paste CSS

```css
/* Game Show: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged. */
[data-style="show"] {
  --bg: #2a0845; --fg: #fff; --muted: #e0c3ff;
  --panel: #3c0d66; --line: #ffd166; --bw: 3px; --r: 18px; --r-sm: 14px;
  --shadow: 0 0 0 4px #2a0845, 0 0 0 7px #ff2e63, 0 18px 30px -12px #000;
  --accent: #ff2e63; --accent-fg: #fff; --accent-text: #ffd166;
  --field: #24063d; --tile: #24063d; --chip-bg: #3c0d66; --chip-bw: 2px;
  --font-d: "Bungee", Impact, sans-serif; --font-b: "Rubik", system-ui, sans-serif; --font-btn: "Bungee", Impact, sans-serif; --font-timer: "Bungee", sans-serif;
  --d-weight: 400; --d-track: .02em; --btn-weight: 400; --btn-track: .04em; --btn-r: 999px; --code-track: .08em;
  --btn-shadow: 0 6px 0 #a3002f, 0 12px 20px -6px rgba(0,0,0,.6); --press: translateY(5px); --btn-shadow-press: 0 1px 0 #a3002f;
  --bar: linear-gradient(90deg, rgba(255,209,102,.45), rgba(255,209,102,.1));
}
[data-style="show"] .bg-layer { background: radial-gradient(70% 45% at 50% 108%, rgba(255,46,99,.55), transparent 70%), radial-gradient(60% 60% at 50% 0%, #4b1580, #2a0845 70%); }
[data-style="show"] .screen.is-dark .bg-layer { background: radial-gradient(60% 40% at 50% 108%, rgba(80,40,200,.5), transparent 70%), #12021f; }
[data-style="show"] .spot { display: block; position: absolute; top: -10%; width: 34%; height: 130%; background: linear-gradient(180deg, rgba(255,240,200,.32), rgba(255,240,200,0) 80%); clip-path: polygon(45% 0, 55% 0, 100% 100%, 0 100%); transform-origin: 50% 0; will-change: transform; }
[data-style="show"] .spot.s1 { left: 6%; animation: sway1 7s ease-in-out infinite; }
[data-style="show"] .spot.s2 { right: 6%; animation: sway2 8s ease-in-out infinite; }
@keyframes sway1 { 0%, 100% { transform: rotate(-14deg); } 50% { transform: rotate(6deg); } }
@keyframes sway2 { 0%, 100% { transform: rotate(14deg); } 50% { transform: rotate(-6deg); } }
[data-style="show"] .hero-number, [data-style="show"] .headline .hl { position: relative; display: inline-block; padding: .06em .22em; color: #ffd166; text-shadow: 0 0 18px rgba(255,209,102,.6); }
[data-style="show"] .hero-number::before, [data-style="show"] .hero-number::after, [data-style="show"] .headline .hl::before, [data-style="show"] .headline .hl::after { content: ""; position: absolute; inset: 0; border: calc(var(--u) * 7) dotted #ffd166; border-radius: calc(var(--u) * 18); pointer-events: none; }
[data-style="show"] .hero-number::after, [data-style="show"] .headline .hl::after { border-color: #fff7d6; inset: 0; transform: translateX(calc(var(--u) * 7)); clip-path: inset(0); animation: chase .5s steps(1) infinite; }
@keyframes chase { 50% { opacity: 0; } }
[data-style="show"] .option { border-radius: 999px; }
[data-style="show"] .option.is-selected { background: #ffd166; color: #2a0845; }
[data-style="show"] .btn.ghost { --ghost-bg: #3c0d66; --ghost-fg: #ffd166; border-color: #ffd166; --btn-shadow: 0 6px 0 #1a0330; }
[data-style="show"] .tile .avatar { box-shadow: 0 0 10px var(--c); }
[data-style="show"] .display { text-shadow: 0 calc(var(--u) * 4) 0 #ff2e63; }
[data-style="show"] .eyebrow { color: #ffd166; }
```

---

### 3.16 Tabletop (`table`)

#### Concept & mood

A card table. Green felt with grain and a wooden rim made of inset shadows, cream playing-card panels, and Cinzel with Alegreya. Primary buttons are red with a 3D bottom edge, people tiles are wooden tokens (radial-gradient discs), and the key card is "dealt" with a 3D flip that shows a patterned card back. Result cards lie at slight angles.

**Good for:** board-game and card-game sites, game cafés, D&D and RPG tools, poker-night invites, social casino or tabletop apps.

#### Palette

Default:

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#0f5132` | Felt |
| `--fg` | `#f6f1e1` | Text on felt |
| `--muted` | `#b7d3c1` | Secondary text on felt |
| `--panel` / `--panel-fg` | `#fbf6ea` / `#2b2118` | Cream cards |
| `--muted-panel` | `#6b5a48` | Secondary text on cards |
| `--line` | `rgba(43,33,24,.22)` | Card edge |
| `--accent` / `--accent-fg` | `#c0392b` / `#fbf6ea` | Red primary |
| `--accent-text` | `#f4d58d` | Gold text accent (for the felt) |
| `--field` / `--field-fg` | `#fbf6ea` / `#2b2118` | Inputs, options |
| `--tile` / `--tile-fg` | `#d9a066` / `#2b2118` | Tiles (overridden by the wood gradient) |
| `--chip-bg` / `--chip-fg` | `#fbf6ea` / `#2b2118` | Chips |
| `--bar` | `linear-gradient(90deg, rgba(192,57,43,.3), rgba(192,57,43,.08))` | Share bar |

Other colours: felt highlight `rgba(255,255,255,.1)`; rim `#6b3f1d` and `#4a2a12`; vignette `rgba(0,0,0,.55)`; wooden token `radial-gradient(circle at 30% 28%, #f0c48f, #b07a45 70%)`; card back `#7f1d14` / `#a3241a` stripes with a `#fbf6ea` inner frame and a `#7f1d14` edge; button edge `#7f1d14`; ghost edge and segment edge `#b9ab8c`; hero number `#f4d58d` with a `#4a2a12` shadow; selected option `#c0392b` with `#fbf6ea`; corner index `#c0392b`.

Dark variant: only the felt changes, to `#0a3322`.

#### Typography

- Families: Cinzel 600/700 (display, buttons, corner index); Alegreya 400/700 (body).
- Google Fonts: `https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Alegreya:wght@400;700&display=swap`
- Display: weight 700, tracking `.04em`.
- Buttons: Cinzel 700, tracking `.06em`.
- Hero number: gold with `text-shadow: 0 4u 0 #4a2a12`.
- Corner index: Cinzel 700, 22u, red, at the top-left of the feature card.

#### Shape & lines

`--bw: 1px`, `--r: 14px`, `--r-sm: 10px`, buttons 10px, options 10px. Tiles are pills (999px) styled as wooden discs.

#### Depth & surfaces

- Cards: `inset 0 1px 0 rgba(255,255,255,.7), 0 14px 24px -10px rgba(0,0,0,.6)`, a lit top edge and a shadow on the felt.
- Wooden rim on the background layer: `box-shadow: inset 0 0 0 12u #6b3f1d, inset 0 0 0 15u #4a2a12, inset 0 0 80u rgba(0,0,0,.55)`.
- Buttons: `0 4px 0 #7f1d14, 0 10px 16px -6px rgba(0,0,0,.5)`; press `translateY(3px)` with `0 1px 0 #7f1d14`.
- Ghost buttons: cream with a `0 4px 0 #b9ab8c` edge.
- Tokens: `inset 0 -3px 0 rgba(0,0,0,.25), 0 6px 10px -4px rgba(0,0,0,.6)`; their avatars get a `inset 0 0 0 2px rgba(255,255,255,.6)` ring.
- Segmented input boxes: `0 3px 0 #b9ab8c`.

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Felt | `#0f5132`, a soft light pool `radial-gradient(ellipse at 50% 40%, rgba(255,255,255,.1), transparent 62%)` and grain (`var(--grain)` at 128px). |
| Wooden rim | The inset box-shadows above, drawn on the fixed background layer so they frame the viewport. |
| Card deal | See Motion. Needs a `.card-scene` parent and a `.card-back` child. |

#### Components

- **Primary button:** red with cream Cinzel text and a dark-red bottom edge.
- **Ghost button:** cream card with a tan edge.
- **Panels:** cream playing cards.
- **Tiles:** wooden tokens (round discs with a highlight at 30% 28%).
- **Options:** cream at 10px radius; selected is red.
- **Feature card:** a dealt playing card with a red corner index (`::before`, hard-coded "W" in the reference) and a patterned back.
- **Result cards:** rotated −2° and +2° (the even ones also drop 4%). The tilt is overridden by the entrance fill; see the Comic Pop pitfall.

#### Motion & interaction

The deal: `.card-scene { perspective: 900px }`; the feature card has `transform-style: preserve-3d` and runs `deal 7s var(--ease) infinite`. From 0% to 14% (about 1s) it turns from `rotateY(180deg) translateY(-6%)` (back up, lifted) to face up, then holds for the rest of the 7s cycle and deals again. The card's children have `backface-visibility: hidden`. `.card-back` is an absolutely positioned child rotated 180°, so it shows only while the card faces away. Buttons press 3px.

#### Imagery

No filter; full-colour art.

#### Accessibility & pitfalls

- **Trap still in source:** `--accent-text` is a gold meant for the felt (6.6:1), but the base CSS also uses it inside cream cards (list-card meta, bold words in messages, ✓ marks, the focus ring), where it is 1.3:1. Override it inside panels, for example `[data-style="table"] .panel { --accent-text: #7f1d14; }` (recommended, not in source).
- The deal repeats every 7s. Consider `animation-iteration-count: 1` if the card sits on screen for a long time (recommendation). Reduced motion and lite mode stop it.
- Keep `.card-back` in the markup, inside the feature card; it is hidden by `.deco` in every other style.

#### Performance notes / cost

Cost tier: **low**. One 3D transform on one card; everything else is static shadows and a grain tile.

#### Do / Don't

Do:
- Put cream cards on felt, never felt on cards.
- Use the wooden rim to frame the viewport.
- Give buttons a bottom edge and a short press.
- Use the deal for one reveal per screen.

Don't:
- Use the gold accent on cream.
- Flip more than one card at a time.
- Use flat green without grain or rim.
- Tilt interactive cards; tilt only results.

#### Copy-paste CSS

Requires the grain tile from §1.13.

```css
/* Tabletop: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged. */
[data-style="table"] {
  --bg: #0f5132; --fg: #f6f1e1; --muted: #b7d3c1;
  --panel: #fbf6ea; --panel-fg: #2b2118; --muted-panel: #6b5a48; --line: rgba(43,33,24,.22); --bw: 1px; --r: 14px; --r-sm: 10px;
  --shadow: inset 0 1px 0 rgba(255,255,255,.7), 0 14px 24px -10px rgba(0,0,0,.6);
  --accent: #c0392b; --accent-fg: #fbf6ea; --accent-text: #f4d58d;
  --field: #fbf6ea; --field-fg: #2b2118; --tile: #d9a066; --tile-fg: #2b2118; --chip-bg: #fbf6ea; --chip-fg: #2b2118;
  --font-d: "Cinzel", Georgia, serif; --font-b: "Alegreya", Georgia, serif; --font-btn: "Cinzel", Georgia, serif;
  --d-weight: 700; --d-track: .04em; --btn-weight: 700; --btn-r: 10px; --btn-track: .06em;
  --btn-shadow: 0 4px 0 #7f1d14, 0 10px 16px -6px rgba(0,0,0,.5); --press: translateY(3px); --btn-shadow-press: 0 1px 0 #7f1d14;
  --bar: linear-gradient(90deg, rgba(192,57,43,.3), rgba(192,57,43,.08));
}
[data-style="table"] .bg-layer { background-color: #0f5132; background-image: radial-gradient(ellipse at 50% 40%, rgba(255,255,255,.1), transparent 62%), var(--grain); background-size: auto, 128px; box-shadow: inset 0 0 0 calc(var(--u) * 12) #6b3f1d, inset 0 0 0 calc(var(--u) * 15) #4a2a12, inset 0 0 calc(var(--u) * 80) rgba(0,0,0,.55); }
[data-style="table"] .screen.is-dark .bg-layer { background-color: #0a3322; }
[data-style="table"] .tile { border-radius: 999px; background: radial-gradient(circle at 30% 28%, #f0c48f, #b07a45 70%); border: 0; box-shadow: inset 0 -3px 0 rgba(0,0,0,.25), 0 6px 10px -4px rgba(0,0,0,.6); }
[data-style="table"] .tile .avatar { box-shadow: inset 0 0 0 2px rgba(255,255,255,.6); }
[data-style="table"] .card-scene { perspective: 900px; }
[data-style="table"] .feature-card { transform-style: preserve-3d; animation: deal 7s var(--ease) infinite; }
[data-style="table"] .feature-card > * { backface-visibility: hidden; }
[data-style="table"] .feature-card > .card-back { display: block; position: absolute; inset: 0; border-radius: inherit; transform: rotateY(180deg); backface-visibility: hidden; background: repeating-linear-gradient(45deg, #7f1d14 0 calc(var(--u)*6), #a3241a calc(var(--u)*6) calc(var(--u)*12)); box-shadow: inset 0 0 0 calc(var(--u) * 8) #fbf6ea, inset 0 0 0 calc(var(--u) * 10) #7f1d14; }
@keyframes deal { 0% { transform: rotateY(180deg) translateY(-6%); } 14% { transform: rotateY(0) translateY(0); } 100% { transform: rotateY(0); } }
[data-style="table"] .feature-card::before { content: "W"; /* playing-card corner index; hardcoded "W" in the reference, set your own letter */ position: absolute; top: calc(var(--u) * 10); left: calc(var(--u) * 14); font: 700 calc(var(--u) * 22) "Cinzel", serif; color: #c0392b; backface-visibility: hidden; }
[data-style="table"] .result-card:nth-child(odd) { transform: rotate(-2deg); } [data-style="table"] .result-card:nth-child(even) { transform: rotate(2deg) translateY(4%); }
[data-style="table"] .option { border-radius: 10px; }
[data-style="table"] .option.is-selected { background: #c0392b; color: #fbf6ea; }
[data-style="table"] .btn.ghost { --ghost-bg: #fbf6ea; --ghost-fg: #2b2118; --btn-shadow: 0 4px 0 #b9ab8c; }
[data-style="table"] .hero-number { color: #f4d58d; text-shadow: 0 calc(var(--u) * 4) 0 #4a2a12; }
[data-style="table"] .segments span { box-shadow: 0 3px 0 #b9ab8c; }
```

---

### 3.17 Blueprint (`blueprint`)

#### Concept & mood

An engineering drawing. A blue sheet with a two-level grid carries white line art: images are turned into white silhouettes. Share Tech Mono sets uppercase headings, Architects Daughter the handwritten notes. Every panel is labelled "FIG. n · LABEL" and has corner tick marks, a dimension line with an arrow and a measurement runs across the top, ghost buttons are dashed, and annotations are yellow. There is essentially no motion.

**Good for:** engineering and hardware products, architecture firms, maker and robotics projects, API and developer documentation, technical portfolios, spec and changelog pages.

#### Palette

Default:

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#174a8b` | Blueprint sheet |
| `--fg` | `#eaf2ff` | White line work and text |
| `--muted` | `#a9c4ea` | Pale blue secondary |
| `--panel` | `rgba(255,255,255,.04)` | Barely-there panel |
| `--line` | `rgba(234,242,255,.85)` | Drawn lines |
| `--accent` / `--accent-fg` | `#eaf2ff` / `#174a8b` | White-filled primary |
| `--accent-text` | `#ffd166` | Yellow annotations |
| `--field`, `--tile`, `--chip-bg`, `--qr-bg` | `transparent` | Outlined only |
| `--qr-fg` | `#eaf2ff` | White QR |
| `--bar` | `repeating-linear-gradient(45deg, rgba(234,242,255,.35) 0 2px, transparent 2px 7px)` | Hatched share bar |

Other colours: major grid `rgba(234,242,255,.2)` every 80u; minor grid `rgba(234,242,255,.07)` every 16u; dimension line `rgba(234,242,255,.55)`, arrow `.7`, label `.75`; newest feed line `#ffd166`; selected option `#eaf2ff` with `#174a8b`; hover fill `rgba(234,242,255,.15)`.

Dark variant: only `--bg` changes, to `#0e2e5a` (the grid and every surface follow, because they read `--bg`).

#### Typography

- Families: Share Tech Mono (display, buttons, hero number, timer, labels); Architects Daughter (body).
- Google Fonts: `https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Architects+Daughter&display=swap`
- Display: uppercase, weight 400, tracking `.04em`.
- Buttons: uppercase, tracking `.12em`.
- Timer tracking `.02em`.
- Panel labels and dimension text: Share Tech Mono at .72em / 13u, tracking `.1em` / `.14em`.
- Feed: 34u; the newest line is yellow.

#### Shape & lines

`--bw: 1.5px`, every radius 0. Chips are square with a 1px border; avatars are transparent squares outlined in the line colour.

#### Depth & surfaces

None: `--shadow: none`. Everything is drawn with lines.

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Grid | Four gradients on `.bg-layer`: 1px major lines every 80u in both directions, and 1px minor lines every 16u. |
| Figure label | `.panel[data-label]::before { content: "FIG. " attr(data-fig) " · " attr(data-label); }` placed 1.6em above the panel's top-left, in yellow. |
| Corner ticks | `.panel::after` at `inset: -7px` draws four 12px lines (two at the top-left corner, two at the bottom-right) with `linear-gradient(var(--line), var(--line))` sized `12px 1px` and `1px 12px`. |
| Dimension line `.dim` | A 1px line 22u from the top, from 5% to 95%, with a `◂` arrowhead at the left and a centred label on a `--bg` backing so the line breaks around it (reference text: `"1280 × 720 · SCALE 1:1 · HOST DISPLAY"`). Hidden on mobile. |

#### Components

- **Primary button:** white fill, blue uppercase mono text, 1.5px line.
- **Ghost button:** transparent with a dashed white border and white text.
- **Hover** (pointer devices only): any button gets a `rgba(234,242,255,.15)` fill.
- **Panels:** almost transparent, outlined, labelled, with corner ticks.
- **Options:** outlined; selected is white with blue text; the share bar is hatched.
- **Feed:** handwritten notes, with the newest in yellow.

#### Motion & interaction

None beyond base entrances and press feedback.

#### Imagery

`filter: brightness(0) invert(1); opacity: .88` turns every illustration into a white silhouette, like a drawing on the sheet.

#### Accessibility & pitfalls

- Contrast is solid (text 7.8:1, muted 4.9:1, yellow 6.1:1).
- **Hover trap still in source:** the hover rule changes the background of every `.btn`, including primary buttons, whose text stays `--accent-fg` (`#174a8b`). On hover that is dark blue text on a translucent white tint over the blue sheet, about 1.4:1. Limit the hover to `.btn.ghost`, or also set `color: var(--fg)` (recommended).
- **`data-fig` is never set in the reference**, so labels render as "FIG.  · LABEL" with an empty number. Set `data-fig="1"`, `"2"` and so on on each labelled panel.
- The mobile dimension text (`"390 × 844 · PHONE"`) is defined, but the line is hidden on mobile, so it never shows.

#### Performance notes / cost

Cost tier: **lowest**. Static gradients and lines; no animation.

#### Do / Don't

Do:
- Label every panel with a figure number.
- Draw everything with 1–1.5px white lines on blue.
- Use yellow only for annotations and the newest note.
- Turn illustrations into white silhouettes.

Don't:
- Add shadows, fills or rounded corners.
- Animate decorations.
- Use colour photography.
- Apply the hover tint to filled primary buttons without changing the text colour.

#### Copy-paste CSS

```css
/* Blueprint: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged.
   Set data-label and data-fig on panels. The dimension label is reference text; replace it. */
[data-style="blueprint"] {
  --bg: #174a8b; --fg: #eaf2ff; --muted: #a9c4ea;
  --panel: rgba(255,255,255,.04); --line: rgba(234,242,255,.85); --bw: 1.5px; --r: 0px; --r-sm: 0px; --shadow: none;
  --accent: #eaf2ff; --accent-fg: #174a8b; --accent-text: #ffd166;
  --field: transparent; --tile: transparent; --chip-bg: transparent; --chip-bw: 1px; --chip-r: 0;
  --font-d: "Share Tech Mono", ui-monospace, monospace; --font-b: "Architects Daughter", "Comic Neue", cursive; --font-btn: "Share Tech Mono", monospace; --font-code: "Share Tech Mono", monospace;
  --d-case: uppercase; --d-weight: 400; --d-track: .04em; --btn-case: uppercase; --btn-track: .12em; --btn-weight: 400; --btn-r: 0; --av-r: 0;
  --qr-bg: transparent; --qr-fg: #eaf2ff; --font-timer: "Share Tech Mono", monospace; --timer-track: .02em;
  --bar: repeating-linear-gradient(45deg, rgba(234,242,255,.35) 0 2px, transparent 2px 7px);
}
[data-style="blueprint"] .bg-layer { background-color: var(--bg);
  background-image: linear-gradient(rgba(234,242,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(234,242,255,.2) 1px, transparent 1px), linear-gradient(rgba(234,242,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(234,242,255,.07) 1px, transparent 1px);
  background-size: calc(var(--u)*80) calc(var(--u)*80), calc(var(--u)*80) calc(var(--u)*80), calc(var(--u)*16) calc(var(--u)*16), calc(var(--u)*16) calc(var(--u)*16); }
[data-style="blueprint"] .screen.is-dark { --bg: #0e2e5a; }
[data-style="blueprint"] .panel { position: relative; }
[data-style="blueprint"] .panel[data-label]::before { content: "FIG. " attr(data-fig) " · " attr(data-label); position: absolute; top: -1.6em; left: 0; font: .72em "Share Tech Mono", monospace; letter-spacing: .1em; color: var(--accent-text); }
[data-style="blueprint"] .panel::after { content: ""; position: absolute; inset: -7px; pointer-events: none;
  background: linear-gradient(var(--line), var(--line)) top left / 12px 1px, linear-gradient(var(--line), var(--line)) top left / 1px 12px, linear-gradient(var(--line), var(--line)) bottom right / 12px 1px, linear-gradient(var(--line), var(--line)) bottom right / 1px 12px; background-repeat: no-repeat; }
[data-style="blueprint"] .art img { filter: brightness(0) invert(1); opacity: .88; }
@media (hover: hover) { [data-style="blueprint"] .btn:hover { background: rgba(234,242,255,.15); } }
[data-style="blueprint"] .btn.ghost { --ghost-bg: transparent; --ghost-fg: #eaf2ff; border-style: dashed; border-color: #eaf2ff; }
[data-style="blueprint"] .option.is-selected { background: #eaf2ff; color: #174a8b; }
[data-style="blueprint"] .tile .avatar { background: transparent; border: 1px solid var(--line); color: var(--fg); }
[data-style="blueprint"] .dim { display: block; position: absolute; left: 5%; right: 5%; top: calc(var(--u) * 22); height: 0; border-top: 1px solid rgba(234,242,255,.55); }
[data-style="blueprint"] .dim::before { content: "◂"; position: absolute; left: -.3em; top: -.66em; color: rgba(234,242,255,.7); font-size: calc(var(--u) * 14); }
[data-style="blueprint"] .dim::after { content: "1280 × 720 · SCALE 1:1 · HOST DISPLAY"; /* reference text; replace with your own measurement label */ position: absolute; left: 50%; transform: translate(-50%, -55%); background: var(--bg); padding: 0 .6em; color: rgba(234,242,255,.75); font: calc(var(--u) * 13) "Share Tech Mono", monospace; letter-spacing: .14em; white-space: nowrap; }
[data-style="blueprint"] .screen.mobile .dim::after { content: "390 × 844 · PHONE"; }
[data-style="blueprint"] .screen.mobile .dim { display: none; }
[data-style="blueprint"] .feed p { font-size: calc(var(--u) * 34); }
[data-style="blueprint"] .feed p.is-new { color: #ffd166; }
```

---

### 3.18 Black & Gold (`minimal`)

#### Concept & mood

Refined minimalism in Purdue University's colours (the palette only; no Purdue marks). Black ink, Old Gold `#CFB991`, an aged gold `#8E6F3E` for text accents, and a warm off-white. Geist bold with tight tracking sets the type. Hero numbers and headlines sit on a gold underline bar. Primary buttons are gold with black text, and secondary buttons are black with gold text. The dark variant is pure black with gold. It is the fastest style and the site default.

**Good for:** almost anything: SaaS products, dashboards, portfolios, university club or department sites, finance, documentation. It is a safe default when no style is specified.

#### Palette

Default:

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#fafaf7` | Warm off-white |
| `--fg` | `#000` | Black ink |
| `--muted` | `#555960` | Grey |
| `--panel` | `#ffffff` | White cards |
| `--line` | `rgba(0,0,0,.08)` | Hairline |
| `--accent` / `--accent-fg` | `#cfb991` / `#000` | Old Gold primary |
| `--accent-text` | `#8e6f3e` | Aged gold for text |
| `--field`, `--tile` | `#f2efe6` | Warm grey inputs and tiles |
| `--chip-bg` | `rgba(0,0,0,.05)` | Chips |
| `--bar` | `linear-gradient(90deg, rgba(207,185,145,.55), rgba(207,185,145,.2))` | Gold share bar |

Other colours: ghost button `#000` with `#cfb991` text and a `#000` border; selected option `#000` with `#cfb991`; feature card `#000` with `#fff` text, `#9d9795` muted text, a `#cfb991` border and a `#cfb991` heading; underline bar `#cfb991`.

Dark variant:

| Token | Value |
| --- | --- |
| `--bg` | `#000` |
| `--fg` | `#fff` |
| `--muted` | `#9d9795` |
| `--panel` | `#121212` |
| `--line` | `rgba(207,185,145,.18)` |
| `--chip-bg` | `rgba(255,255,255,.07)` |
| `--accent-text` | `#cfb991` |
| `--field` | `#1a1a1a` |

#### Typography

- Family: Geist 400–800 for everything.
- Google Fonts: `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap`
- Display: weight 700, tracking `-.04em` (tight).
- Buttons: weight 700.
- Hero number: weight 800, tracking `.01em`, line-height .9.
- Eyebrow: aged gold (Old Gold in dark).

#### Shape & lines

`--bw: 1px`, `--r: 18px`, `--r-sm: 12px`, `--btn-r: 12px`. Chips are pills with no border.

#### Depth & surfaces

`--shadow: 0 1px 2px rgba(0,0,0,.05), 0 10px 26px -14px rgba(0,0,0,.18)`: a contact shadow plus a soft lift. No textures.

#### Backgrounds & decorations

| Decoration | Recipe |
| --- | --- |
| Background | Flat `var(--bg)`. |
| Gold underline bar | Hero number: `display: inline-block; line-height: .9; box-shadow: inset 0 -14u 0 #cfb991`. The inset shadow paints a gold band behind the lower part of the glyphs. Headline highlight: `.headline .hl { box-shadow: inset 0 -.18em 0 #cfb991; }`. |

#### Components

- **Primary button:** Old Gold with black Geist 700, 12px radius.
- **Ghost (secondary) button:** black with gold text and a black border.
- **Panels:** white cards with a hairline and a soft shadow.
- **Options:** warm grey; selected is black with gold text; the share bar is a gold fade.
- **Feature card:** black, with a gold border and a gold heading.
- **Hero number:** heavy black numerals on a gold bar.

#### Motion & interaction

Base only: 90ms press, 150ms transitions, entrances.

#### Imagery

No filter; full-colour art.

#### Accessibility & pitfalls

- Contrast is excellent (text 20:1). Aged gold `#8e6f3e` is 4.47:1 on the off-white page, just under the AA line of 4.5, and 4.67:1 on white panels. On the page, use it for large or bold text (eyebrows, kickers).
- **Dark traps (observed):** ghost buttons are black on a pure-black page, so the button shape disappears, though the gold label stays readable (11:1). The selected option is black on a `#1a1a1a` field, which is weakly distinguished. Add a gold border to both in dark, for example `.screen.is-dark .btn.ghost, .screen.is-dark .option.is-selected { border-color: #cfb991; }` (recommendation, not in source).
- IP: use only the colour values (Old Gold `#CFB991`, black). No logos, wordmarks, the Motion P, seals or "Boilermakers" marks.

#### Performance notes / cost

Cost tier: **lowest**. The fastest style: no decorations, no filters, no ambient motion. It is the default for new devices (`DEFAULT_STYLE = "minimal"`).

#### Do / Don't

Do:
- Use gold for the primary action and black for secondary actions.
- Put a gold bar under the one number or headline that matters.
- Track display type tight (`-.04em`) and keep the weight high.
- Use it as the fallback when a style fails to load.

Don't:
- Use gold for small body text on white (use aged gold, at size).
- Add textures or decorations.
- Use university marks.
- Put more than one gold bar on a screen.

#### Copy-paste CSS

```css
/* Black & Gold: generalised from src/themes/themes.css. Selectors renamed per §1.2; values unchanged. */
[data-style="minimal"] {
  --bg: #fafaf7; --fg: #000; --muted: #555960;
  --panel: #ffffff; --line: rgba(0,0,0,.08); --bw: 1px; --r: 18px; --r-sm: 12px;
  --shadow: 0 1px 2px rgba(0,0,0,.05), 0 10px 26px -14px rgba(0,0,0,.18);
  --accent: #cfb991; --accent-fg: #000; --accent-text: #8e6f3e;
  --field: #f2efe6; --tile: #f2efe6; --chip-bg: rgba(0,0,0,.05);
  --font-d: "Geist", -apple-system, system-ui, sans-serif; --font-b: "Geist", -apple-system, system-ui, sans-serif;
  --d-weight: 700; --d-track: -.04em; --btn-r: 12px; --btn-weight: 700; --code-track: .04em;
  --bar: linear-gradient(90deg, rgba(207,185,145,.55), rgba(207,185,145,.2));
}
[data-style="minimal"] .bg-layer { background: var(--bg); }
[data-style="minimal"] .eyebrow { color: var(--accent-text); }
[data-style="minimal"] .screen.is-dark { --bg: #000; --fg: #fff; --muted: #9d9795; --panel: #121212; --line: rgba(207,185,145,.18); --chip-bg: rgba(255,255,255,.07); --accent-text: #cfb991; --field: #1a1a1a; }
[data-style="minimal"] .hero-number { font-weight: 800; letter-spacing: .01em; box-shadow: inset 0 calc(var(--u) * -14) 0 #cfb991; display: inline-block; line-height: .9; }
[data-style="minimal"] .btn.ghost { --ghost-bg: #000; --ghost-fg: #cfb991; border-color: #000; }
[data-style="minimal"] .option.is-selected { background: #000; color: #cfb991; }
[data-style="minimal"] .feature-card { --role-bg: #000; --panel-fg: #fff; --muted-panel: #9d9795; color: #fff; border-color: #cfb991; }
[data-style="minimal"] .feature-card h2 { color: #cfb991; }
[data-style="minimal"] .headline .hl { box-shadow: inset 0 -.18em 0 #cfb991; }
```

---

## Appendix A. Implementation checklist

1. **Skeleton.** Wrap every page in `<main class="screen [large|mobile|page]">` with the `.bg-layer` and all decoration slots from §1.5, and the content in `.content`. Mark every decoration `aria-hidden`.
2. **Base layer.** Paste the base CSS (§1.6) and the global `html, body` and view-transition rules.
3. **Styles.** Paste each style block you ship (section 3). If you ship several, the shared keyframes repeated at the end of some blocks can be kept once.
4. **Pre-paint script.** Inline it in `<head>` with the font-URL map for the styles you ship, and choose a default (the reference uses `minimal`). Add the two `preconnect` links.
5. **Runtime helpers.** Add the grain generator if you ship Noir, Storybook, Tabletop or The Daily Village; the refraction filter and map if you ship Liquid Glass; the POW symbol for Comic Pop; the rain script for ASCII Terminal.
6. **Components.** Build components only from the recipe classes in §1.7, or rename them while keeping the token names. Never hard-code a colour, radius, font or shadow in a component.
7. **Data attributes.** Set `data-label` (and `data-fig`) and `data-title` on labelled panels. Wrap hero-number characters in `<span>`s and give the element an `aria-label`. Put `--c` on tiles, `--p` on options, and the per-particle `--x/--d/--dl` on petals.
8. **Art.** Provide each illustration as a 192px WebP, a 24px PNG sprite and (if you ship ASCII Terminal) an ASCII string. Use `loading="lazy"` on both `<img>`s.
9. **Dark palette.** Decide which pages use `.is-dark`. For every style you ship, check that each light surface in the dark palette has an explicit text token, and apply the fixes listed under the style's pitfalls.
10. **Switcher (optional).** Add the picker (§1.11), the runtime `applyStyle`/`withTransition` functions, and the lite toggle.
11. **Fallbacks.** Keep lite mode, `prefers-reduced-motion` and `prefers-reduced-transparency` working.

## Appendix B. Verification checklist

- **Contact sheets.** Screenshot every style on every key screen at both 1280×720 and 390×844, and lay them out as one image per screen with 18 thumbnails, so outliers stand out. The reference does this with `e2e/themes.mjs`, which drives a real session, switches styles live and saves `<screen>-<device>-<style>.png`. Look for overflowing text (Press Start 2P and Bangers run wide), clipped decorations, invisible buttons and unreadable selected states.
- **Dark palette.** For every style with a dark variant, screenshot the dark screens with a primary button, a ghost button, a selected and an unselected option, a field with a value and a tile. Check contrast against §1.15; any new pair below 4.5:1 for body text, or below 3:1 for large text and UI shapes, needs a token override.
- **Live switching.** Switch styles while a page is open: there should be no flash, fonts should arrive once, and nothing should re-render or lose state. If you use an owner/follower model, check that followers switch when the owner switches, that an opted-out device keeps its own style, and that "Match the host" (or your equivalent) returns it to the shared style.
- **Performance.** With Chrome DevTools or Playwright, throttle the CPU 4× and measure frames for 2 seconds on each style on both a large display and a phone (the reference uses `e2e/perf.mjs`). The target is 60 fps on every style, with no long task over 50ms during a style switch.
- **Reduced motion.** Turn on `prefers-reduced-motion` and confirm that ambient motion stops, the rain never starts and the style switch is instant.
- **Lite mode.** Turn on lite and confirm that blobs, rain, floor, petals, spotlights, ticker and kelp are gone, Liquid Glass is opaque, and nothing animates.
- **Reduced transparency.** On Liquid Glass, confirm the panels become opaque.
- **Keyboard.** Tab through every interactive element in every style. The focus ring must be visible (Desktop 98's dotted ring is the weakest).
- **Network.** Confirm that only the active style's font CSS is requested, and that hidden art variants are not downloaded.

## Appendix C. IP and licensing notes

- **Desktop 98** evokes a generic late-90s desktop. It contains no Microsoft or Windows logos, flags, product names or "Start" wordmark. Its taskbar label is your own app name. Keep it that way.
- **Tide Pool** is an original undersea scene. It deliberately avoids any franchise: no named characters, no pineapple houses, no flower-sky pattern.
- **Black & Gold** uses Purdue University's colour values only (Old Gold `#CFB991` and black). It uses no Purdue logos, wordmarks, seals or the Motion P.
- **Fonts** are loaded from Google Fonts, whose families are distributed under the SIL Open Font License or the Apache License 2.0. The system fonts referenced by name (Apple's SF Pro via `-apple-system`, Tahoma, Verdana, Segoe UI, Hiragino, Yu Mincho, Didot, Bodoni 72, Courier New, Times New Roman, Georgia, Impact, Arial Black) are never shipped; they are used only if the visitor's device already has them.
- **Illustrations** in the reference are Microsoft Fluent Emoji 3D, under the MIT licence. The pixel sprites and ASCII art are derived from them. Keep the MIT notice if you reuse them.
- **Liquid Glass** is a visual technique in the style of Apple's design language; it uses no Apple assets. Glisse, the suggested reference for higher fidelity, is MIT-licensed.
- **Kanji** used as decoration (Sakura) are ordinary characters; check meanings before choosing new ones.

## Appendix D. Reference implementation files

All paths are relative to the root of this repository.

| File | What it contains |
| --- | --- |
| `src/themes/themes.css` | The whole system: base screen and component classes (lines 11–235), one block per style keyed on `[data-style]` (from line 237), lite and reduced-motion rules (lines 917–922) and the style-picker CSS (from line 926). |
| `src/themes/registry.ts` | Style ids, display names, Google Fonts families, cost tiers, `DEFAULT_STYLE`, localStorage keys and the pre-paint script generator. |
| `src/themes/store.ts` | The active-style store: personal style, shared room style, follow/own mode, lite mode, font loading and the View Transition circle reveal. |
| `src/themes/ThemeRuntime.tsx` | Film-grain tile generator, Liquid Glass refraction filter and map, POW SVG symbol. |
| `src/themes/ascii.ts` | ASCII renderings of the illustrations. |
| `src/components/ui/index.tsx` | `Screen` with every decoration slot and the petal values, `Art` with its three renderings, `Button`, `Panel`, `PickList`, `Narration`, `Timer`, `CodeInput`, `Stepper`, `PlayerTile` and the avatar palette. |
| `src/components/ui/Rain.tsx` | The ASCII character-rain canvas. |
| `src/components/ui/StylePicker.tsx` | The style picker, including the `text=` font-subset preview. |
| `src/app/layout.tsx`, `src/app/globals.css` | Where the pre-paint script, picker and runtime are mounted; global background and reduced-motion rules. |
| `e2e/themes.mjs`, `e2e/perf.mjs` | Contact-sheet screenshots of every style, and the 4× CPU-throttle frame-rate and long-task measurement. |
| `public/art/*.webp`, `public/art/pixel/*.png` | The 192px illustrations and 24px sprites. |

## Appendix E. Not defined in source, and open issues

**Not defined in source**

- A 200ms panel transition and exit animations (the "exits at about 65% of entrance" guideline). The reference has neither.
- Dark variants for ASCII Terminal, Desktop 98, Noir and The Daily Village. Neon Arcade, Liquid Glass, Game Show, Tabletop and Blueprint change only background or decoration in dark, not tokens.
- `--font-eyebrow`, `--danger` and `--danger-bg`. They are read by the CSS but no style sets them.
- The ASCII art generator. Only its output is in the repository; the ramp `" .:-=+*#%@"` comes from the designer's notes, not from code.
- A value for `data-fig` (Blueprint figure numbers): nothing sets it, so labels show an empty number.
- A live taskbar clock (Desktop 98): the time is static CSS text.
- Any use of `.deco.pow-sm` (Comic Pop): it is defined but not used.
- An OS-driven dark mode (`prefers-color-scheme`): the reference picks the dark palette per screen.
- Integration with Glisse: it is suggested as a higher-fidelity reference, not used.
- The cause of the single 54ms long task when switching to Sakura on mobile.

**Contrast and behaviour issues present in the source** (each is detailed in its style's pitfalls, with a suggested fix)

- Paper Sketch dark: the selected option's text is cream on yellow (1.2:1).
- Sakura dark: ghost buttons are near-black on indigo (1.1:1).
- Claymation: white on pink buttons and selected options (2.1:1); dark-palette tiles inherit light text on pastel fills.
- Tabletop, and Storybook dark: gold `--accent-text` used inside cream or parchment panels (1.3–1.4:1).
- Storybook: the gold drop cap on light parchment (about 1.4:1).
- Blueprint: primary-button hover gives dark-blue text on a translucent tint (about 1.4:1).
- Black & Gold dark: black ghost buttons on a black page, and a weakly distinguished selected option.
- Tide Pool, Pixel Retro and Noir: their accent text colours are below 3:1 on their page backgrounds; use them as fills or for large text only.
- Comic Pop, Tide Pool and Tabletop: result-card tilts are overridden by the `rise` entrance's fill mode, so they show only in lite mode.
