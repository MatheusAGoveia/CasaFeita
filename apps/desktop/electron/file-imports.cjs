// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
const fs = require("node:fs/promises");

const MAX_PROJECT_BYTES = 200 * 1024 * 1024;

async function readProjectFile(filePath, io = fs, limit = MAX_PROJECT_BYTES) {
  const stat = await io.stat(filePath);
  if (!stat.isFile()) throw new Error("Escolha um arquivo .sh3d");
  if (stat.size > limit) throw new Error("Arquivo maior que 200 MB");
  const bytes = await io.readFile(filePath);
  if (bytes.length > limit) throw new Error("Arquivo maior que 200 MB");
  if (bytes.length === 0) throw new Error("Arquivo do projeto vazio");
  return new Uint8Array(bytes);
}

module.exports = { readProjectFile, MAX_PROJECT_BYTES };
