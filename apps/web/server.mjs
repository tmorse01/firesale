import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const distDir = resolve("dist");
const indexFile = join(distDir, "index.html");
const port = Number(process.env.PORT ?? 4173);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".manifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function sendFile(response, filePath) {
  const extension = extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": contentTypes[extension] ?? "application/octet-stream",
    "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=31536000, immutable"
  });
  createReadStream(filePath).pipe(response);
}

async function resolveRequestPath(urlPath) {
  const pathname = decodeURIComponent((urlPath ?? "/").split("?")[0]);
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const candidate = join(distDir, safePath);

  if (!candidate.startsWith(distDir)) {
    return indexFile;
  }

  if (existsSync(candidate)) {
    const details = await stat(candidate);
    if (details.isFile()) {
      return candidate;
    }
  }

  return indexFile;
}

createServer(async (request, response) => {
  try {
    const filePath = await resolveRequestPath(request.url);
    sendFile(response, filePath);
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Unexpected server error.");
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`FireSale web listening on http://0.0.0.0:${port}`);
});
