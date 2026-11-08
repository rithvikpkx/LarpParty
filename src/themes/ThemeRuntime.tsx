"use client";

/**
 * One-time setup for decorative styles:
 *  - a 128px film-grain tile (Noir, Storybook, Tabletop, The Daily Village)
 *  - the Liquid Glass refraction map. SVG filters on the live backdrop only work
 *    in Chromium, so Safari and Firefox keep plain frosted glass.
 */
import { useEffect } from "react";

export function ThemeRuntime() {
  useEffect(() => {
    const html = document.documentElement;
    try {
      const g = document.createElement("canvas");
      g.width = g.height = 128;
      const gx = g.getContext("2d")!;
      const img = gx.createImageData(128, 128);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 38;
      }
      gx.putImageData(img, 0, 0);
      html.style.setProperty("--grain", `url(${g.toDataURL()})`);
    } catch {}

    if (/Chrom(e|ium)\//.test(navigator.userAgent) && CSS.supports("backdrop-filter", "url(#lg-refract)")) {
      const N = 128;
      const c = document.createElement("canvas");
      c.width = c.height = N;
      const x = c.getContext("2d")!;
      const map = x.createImageData(N, N);
      for (let j = 0; j < N; j++)
        for (let i = 0; i < N; i++) {
          const u = ((i + 0.5) / N) * 2 - 1;
          const v = ((j + 0.5) / N) * 2 - 1;
          const edge = 1 - Math.max(Math.abs(u), Math.abs(v)); // 0 at the rim
          const m = Math.pow(Math.max(0, 1 - edge / 0.22), 2); // bend only near the rim
          const k = (i + j * N) * 4;
          map.data[k] = 128 - u * 127 * m;
          map.data[k + 1] = 128 - v * 127 * m;
          map.data[k + 2] = 128;
          map.data[k + 3] = 255;
        }
      x.putImageData(map, 0, 0);
      document.getElementById("lg-map")?.setAttribute("href", c.toDataURL());
      html.classList.add("refract");
    }
  }, []);

  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <filter
        id="lg-refract"
        x="0"
        y="0"
        width="1"
        height="1"
        primitiveUnits="objectBoundingBox"
        colorInterpolationFilters="sRGB"
      >
        <feImage id="lg-map" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="0.06" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <symbol id="pow" viewBox="0 0 200 160">
        <polygon
          points="100,4 118,46 160,18 146,62 196,62 156,90 190,124 140,114 136,156 106,124 78,158 72,116 22,138 46,98 4,82 50,66 26,24 76,44"
          fill="#ffd93d"
          stroke="#111"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <polygon
          points="100,26 112,56 140,40 132,70 166,72 138,90 160,112 128,106 124,132 104,112 82,134 80,108 46,120 62,94 32,82 64,72 50,44 84,58"
          fill="#ff6b6b"
        />
        <text
          x="100"
          y="94"
          textAnchor="middle"
          fontFamily="Bangers, Impact, sans-serif"
          fontSize="40"
          fill="#fff"
          stroke="#111"
          strokeWidth="5"
          paintOrder="stroke"
          letterSpacing="2"
        >
          POW!
        </text>
      </symbol>
    </svg>
  );
}
