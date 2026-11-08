/**
 * The 18 UI styles. A style is pure CSS (src/themes/themes.css, keyed on
 * <html data-style>) plus the Google Fonts it needs. Fonts are fetched only for
 * the active style, so unused styles cost nothing on the network.
 */
export interface StyleDef {
  id: string;
  name: string;
  /** Google Fonts css2 `family=` values. Empty when the style uses system fonts. */
  fonts: string[];
  /** Rough rendering cost, shown in the picker. */
  cost: "lowest" | "low" | "medium";
}

export const STYLES: StyleDef[] = [
  { id: "glass", name: "Liquid Glass", fonts: ["Geist:wght@400;500;600;700"], cost: "medium" },
  { id: "comic", name: "Comic Pop", fonts: ["Bangers", "Geist:wght@400;600;700"], cost: "low" },
  { id: "brutal", name: "Neo-Brutalist", fonts: ["Archivo+Black", "Archivo:wght@400;600;800"], cost: "lowest" },
  { id: "tide", name: "Tide Pool", fonts: ["Luckiest+Guy", "Archivo:wght@400;600;800"], cost: "low" },
  { id: "clay", name: "Claymation", fonts: ["Fredoka:wght@500;600;700"], cost: "low" },
  { id: "ascii", name: "ASCII Terminal", fonts: ["VT323", "JetBrains+Mono:wght@400;700"], cost: "low" },
  { id: "win98", name: "Desktop 98", fonts: ["VT323"], cost: "lowest" },
  { id: "neon", name: "Neon Arcade", fonts: ["Audiowide", "Chakra+Petch:wght@400;600"], cost: "low" },
  { id: "pixel", name: "Pixel Retro", fonts: ["Press+Start+2P", "Pixelify+Sans:wght@400;600"], cost: "lowest" },
  { id: "paper", name: "Paper Sketch", fonts: ["Caveat:wght@600;700", "Kalam:wght@400;700"], cost: "lowest" },
  {
    id: "sakura",
    name: "Sakura",
    fonts: ["Shippori+Mincho:wght@500;600;700", "Zen+Kaku+Gothic+New:wght@400;500"],
    cost: "low",
  },
  { id: "noir", name: "Noir", fonts: ["Limelight", "Special+Elite"], cost: "low" },
  {
    id: "story",
    name: "Storybook",
    fonts: ["Cinzel+Decorative:wght@700", "Cinzel:wght@600;700", "IM+Fell+English:ital@0;1"],
    cost: "low",
  },
  {
    id: "news",
    name: "The Daily Village",
    fonts: ["UnifrakturMaguntia", "Old+Standard+TT:ital,wght@0,400;0,700;1,400"],
    cost: "low",
  },
  { id: "show", name: "Game Show", fonts: ["Bungee", "Rubik:wght@400;500;700"], cost: "low" },
  { id: "table", name: "Tabletop", fonts: ["Cinzel:wght@600;700", "Alegreya:wght@400;700"], cost: "low" },
  { id: "blueprint", name: "Blueprint", fonts: ["Share+Tech+Mono", "Architects+Daughter"], cost: "lowest" },
  { id: "minimal", name: "Black & Gold", fonts: ["Geist:wght@400;500;600;700;800"], cost: "lowest" },
];

/** The look a brand-new device gets: Purdue black and gold, and the cheapest to render. */
export const DEFAULT_STYLE = "minimal";

export const STYLE_IDS = new Set(STYLES.map((s) => s.id));

export function isStyleId(id: unknown): id is string {
  return typeof id === "string" && STYLE_IDS.has(id);
}

export function fontHref(families: string[], text?: string): string | null {
  if (families.length === 0) return null;
  const q = families.map((f) => `family=${f}`).join("&");
  return `https://fonts.googleapis.com/css2?${q}&display=swap${text ? `&text=${encodeURIComponent(text)}` : ""}`;
}

/** localStorage keys. */
export const KEYS = {
  /** The style this device picked. */
  style: "lp-style",
  /** "own" = this phone keeps its own style inside rooms; otherwise it follows the host. */
  roomMode: "lp-style-room",
  /** "1" = reduce effects. */
  lite: "lp-lite",
} as const;

/**
 * Runs in <head> before first paint, so the page never flashes the wrong style.
 * Kept tiny and dependency-free; it is inlined as a string.
 */
export function prePaintScript(): string {
  const fonts: Record<string, string | null> = {};
  for (const s of STYLES) fonts[s.id] = fontHref(s.fonts);
  return `(function(){try{var d=document.documentElement,F=${JSON.stringify(fonts)},s=localStorage.getItem("${KEYS.style}");if(!F.hasOwnProperty(s))s="${DEFAULT_STYLE}";d.dataset.style=s;var l=localStorage.getItem("${KEYS.lite}");if(l==="1"||(l===null&&navigator.deviceMemory&&navigator.deviceMemory<=2))d.classList.add("lite");if(F[s]){var k=document.createElement("link");k.rel="stylesheet";k.href=F[s];k.dataset.lpFont=s;document.head.appendChild(k);}}catch(e){document.documentElement.dataset.style="${DEFAULT_STYLE}";}})();`;
}
