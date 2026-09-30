// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

async function atomicWriteFile(filePath, bytes, io = fs) {
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${randomUUID()}.tmp`);
  try {
    await io.writeFile(temporary, bytes);
    await io.rename(temporary, filePath);
  } finally {
    await io.rm(temporary, { force: true }).catch(() => {});
  }
}

module.exports = { atomicWriteFile };
