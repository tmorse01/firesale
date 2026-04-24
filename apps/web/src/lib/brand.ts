export const brandIconName = "whatshot";
const faviconSize = 96;
const faviconBackgroundStart = "#ff7a18";
const faviconBackgroundEnd = "#ff3d00";
const faviconGlyphColor = "#fff7ed";
const faviconFontSize = 64;
const faviconFontFamily = '"Material Symbols Rounded"';

function ensureFaviconLink() {
  let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }

  favicon.type = "image/png";
  return favicon;
}

function drawRoundedRect(context: CanvasRenderingContext2D, size: number, radius: number) {
  context.beginPath();
  context.moveTo(radius, 0);
  context.lineTo(size - radius, 0);
  context.quadraticCurveTo(size, 0, size, radius);
  context.lineTo(size, size - radius);
  context.quadraticCurveTo(size, size, size - radius, size);
  context.lineTo(radius, size);
  context.quadraticCurveTo(0, size, 0, size - radius);
  context.lineTo(0, radius);
  context.quadraticCurveTo(0, 0, radius, 0);
  context.closePath();
}

function buildBrandFaviconHref() {
  const canvas = document.createElement("canvas");
  canvas.width = faviconSize;
  canvas.height = faviconSize;

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  const gradient = context.createLinearGradient(0, 0, faviconSize, faviconSize);
  gradient.addColorStop(0, faviconBackgroundStart);
  gradient.addColorStop(1, faviconBackgroundEnd);

  drawRoundedRect(context, faviconSize, 24);
  context.fillStyle = gradient;
  context.fill();

  context.fillStyle = faviconGlyphColor;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `650 ${faviconFontSize}px ${faviconFontFamily}`;
  context.fontKerning = "normal";
  context.direction = "ltr";
  context.save();
  context.translate(faviconSize / 2, faviconSize / 2 + 1);
  context.fillText(brandIconName, 0, 0);
  context.restore();

  return canvas.toDataURL("image/png");
}

async function loadBrandIconFont() {
  if (!("fonts" in document)) {
    return;
  }

  await document.fonts.load(`${faviconFontSize}px ${faviconFontFamily}`, brandIconName);
  await document.fonts.ready;
}

export async function syncBrandFavicon() {
  if (typeof document === "undefined") {
    return;
  }

  try {
    await loadBrandIconFont();
  } catch {
    return;
  }

  const href = buildBrandFaviconHref();
  if (!href) {
    return;
  }

  const favicon = ensureFaviconLink();
  favicon.href = href;
}
