// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import { expect, test } from "@playwright/test";
import * as fileSystem from "node:fs/promises";
import path from "node:path";
import exportModule from "../apps/desktop/electron/file-exports.cjs";

test("exportação conserva arquivo anterior quando substituição falha", async () => {
  const directory = path.resolve("test-results", "atomic-export");
  await fileSystem.mkdir(directory, { recursive: true });
  const target = path.join(directory, "casa.sh3d");
  await fileSystem.writeFile(target, Uint8Array.from([1, 2]));
  const io = { ...fileSystem, rename: async () => { throw new Error("falha simulada"); } };
  await expect(exportModule.atomicWriteFile(target, Uint8Array.from([3, 4]), io)).rejects.toThrow("falha simulada");
  expect(await fileSystem.readFile(target)).toEqual(Buffer.from([1, 2]));
  expect((await fileSystem.readdir(directory)).filter((name) => name.endsWith(".tmp"))).toEqual([]);
  await exportModule.atomicWriteFile(target, Uint8Array.from([5, 6]));
  expect(await fileSystem.readFile(target)).toEqual(Buffer.from([5, 6]));
});
