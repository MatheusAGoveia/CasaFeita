// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

function prepareExport(name, data) {
  if (typeof name !== "string" || !name.trim() || !(data instanceof Uint8Array) ||
      data.length === 0 || data.length > 200 * 1024 * 1024) {
    throw new Error("Projeto inválido");
  }
  const stem = path.basename(name).replace(/\.sh3d$/i, "")
    .replace(/[^\p{L}\p{N} _.-]/gu, "").replace(/^\.+/, "").trim().slice(0, 80) || "CasaFeita";
  return { defaultName: `${stem}.sh3d`, bytes: Uint8Array.from(data) };
}

async function atomicWriteFile(filePath, bytes, io = fs) {
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${randomUUID()}.tmp`);
  try {
    await io.writeFile(temporary, bytes);
    await io.rename(temporary, filePath);
  } finally {
    await io.rm(temporary, { force: true }).catch(() => {});
  }
}

module.exports = { atomicWriteFile, prepareExport };
