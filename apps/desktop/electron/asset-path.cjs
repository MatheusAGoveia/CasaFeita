// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
const path = require("node:path");

function resolveAssetPath(distRoot, requestUrl) {
  try {
    const url = new URL(requestUrl);
    if (url.protocol !== "casafeita:" || url.host !== "app") return null;
    const requested = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    if (requested.includes("\0")) return null;
    const filePath = path.resolve(distRoot, requested);
    const relative = path.relative(distRoot, filePath);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;
    return filePath;
  } catch {
    return null;
  }
}

module.exports = { resolveAssetPath };
