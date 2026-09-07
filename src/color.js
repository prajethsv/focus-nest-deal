/**
 * Sample album art for 2–3 dominant colors used as Spotify gradient stops.
 * Works in window pages (canvas) and the service worker (OffscreenCanvas).
 */

const FALLBACK = { a: "#3d4a5c", b: "#1a222c", c: "#0d1218" };

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((n) => Math.max(0, Math.min(255, n | 0)).toString(16).padStart(2, "0")).join("")}`;
}

function scorePixel(r, g, b, a) {
  if (a < 200) return 0;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (lum < 0.08 || lum > 0.92) return sat * 0.15;
  return sat * 1.4 + (1 - Math.abs(lum - 0.45)) * 0.6;
}

function quantize(r, g, b) {
  return `${r >> 4},${g >> 4},${b >> 4}`;
}

function colorsFromImageData(data) {
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const w = scorePixel(r, g, b, a);
    if (w <= 0) continue;
    const key = quantize(r, g, b);
    const prev = buckets.get(key) || { r: 0, g: 0, b: 0, w: 0 };
    prev.r += r * w;
    prev.g += g * w;
    prev.b += b * w;
    prev.w += w;
    buckets.set(key, prev);
  }

  const ranked = [...buckets.values()]
    .filter((x) => x.w > 0)
    .map((x) => ({
      r: x.r / x.w,
      g: x.g / x.w,
      b: x.b / x.w,
      w: x.w,
    }))
    .sort((a, b) => b.w - a.w);

  if (!ranked.length) return { ...FALLBACK };

  const pick = (i) => {
    const c = ranked[Math.min(i, ranked.length - 1)];
    return rgbToHex(c.r, c.g, c.b);
  };

  return { a: pick(0), b: pick(1), c: pick(2) };
}

async function pixelsFromUrl(url, size = 32) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("art fetch failed");
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);

  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0, size, size);
    bitmap.close?.();
    return ctx.getImageData(0, 0, size, size).data;
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, size, size);
  bitmap.close?.();
  return ctx.getImageData(0, 0, size, size).data;
}

/** Extract { a, b, c } hex colors from an album art URL. */
export async function extractColors(artUrl) {
  if (!artUrl) return { ...FALLBACK };
  try {
    const data = await pixelsFromUrl(artUrl);
    return colorsFromImageData(data);
  } catch {
    return { ...FALLBACK };
  }
}

export function applyColors(el, colors) {
  if (!el) return;
  const c = colors || FALLBACK;
  el.style.setProperty("--spot-a", c.a);
  el.style.setProperty("--spot-b", c.b);
  el.style.setProperty("--spot-c", c.c);
  el.dataset.hasSpotColors = colors ? "true" : "false";
}

export function clearColors(el) {
  if (!el) return;
  el.style.removeProperty("--spot-a");
  el.style.removeProperty("--spot-b");
  el.style.removeProperty("--spot-c");
  el.dataset.hasSpotColors = "false";
}

export { FALLBACK as FALLBACK_COLORS };
