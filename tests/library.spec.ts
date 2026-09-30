// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import { expect, test } from "@playwright/test";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import libraryModule from "../apps/desktop/electron/library.cjs";

test("biblioteca local mantém três projetos e permite substituir ou excluir", async () => {
  const library = libraryModule.createLibrary(path.resolve("test-results", "library-store"));
  const bytes = [1, 2, 3, 4];
  const first = await library.save(null, "Sala", bytes);
  await library.save(null, "Quarto", bytes);
  await library.save(null, "Cozinha", bytes);
  await expect(library.save(null, "Quarto extra", bytes)).rejects.toThrow(/Limite de 3 projetos/);
  expect(await library.list()).toHaveLength(3);

  await library.save(first.id, "Sala atualizada", [5, 6]);
  expect((await library.open(first.id)).bytes).toEqual(Uint8Array.from([5, 6]));
  expect((await library.open(first.id)).name).toBe("Sala atualizada");
  expect(await library.delete(first.id)).toBe(true);
  expect(await library.list()).toHaveLength(2);
  await library.save(null, "Novo espaço", bytes);
  expect(await library.list()).toHaveLength(3);
  expect(await libraryModule.createLibrary(path.resolve("test-results", "library-store")).list()).toHaveLength(3);
});

test("biblioteca informa índice corrompido ou versão desconhecida", async () => {
  const directory = path.resolve("test-results", "library-corrupt");
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, "projects.json");
  const library = libraryModule.createLibrary(directory);
  await writeFile(file, "{");
  await expect(library.list()).rejects.toThrow("Biblioteca de projetos corrompida");
  await writeFile(file, JSON.stringify({ version: 9, projects: [] }));
  await expect(library.list()).rejects.toThrow("Biblioteca de projetos corrompida");
  await writeFile(file, JSON.stringify({ version: 1, projects: [{ id: "12345678-1234-1234-1234-123456789abc", name: "Sala", updatedAt: "ontem" }] }));
  await expect(library.list()).rejects.toThrow("Biblioteca de projetos corrompida");
});
