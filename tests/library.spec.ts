// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import { expect, test } from "@playwright/test";
import path from "node:path";
import * as fileSystem from "node:fs/promises";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
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
  expect(await library.delete(first.id)).toBe(false);
  expect(await library.list()).toHaveLength(2);
  await library.save(null, "Novo espaço", bytes);
  expect(await library.list()).toHaveLength(3);
  expect(await libraryModule.createLibrary(path.resolve("test-results", "library-store")).list()).toHaveLength(3);
});

test("biblioteca explica quando o arquivo de um projeto sumiu", async () => {
  const directory = path.resolve("test-results", "library-missing-file");
  const library = libraryModule.createLibrary(directory);
  const project = await library.save(null, "Casa", [1]);
  await rm(path.join(directory, `${project.id}.sh3d`));
  await expect(library.open(project.id)).rejects.toThrow("Arquivo do projeto não encontrado");
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

test("falha ao atualizar índice remove arquivo temporário", async () => {
  const directory = path.resolve("test-results", "library-index-failure");
  const index = path.join(directory, "projects.json");
  const io = {
    ...fileSystem,
    rename: async (from: string, to: string) => {
      if (to === index) throw new Error("falha simulada no índice");
      return fileSystem.rename(from, to);
    },
  };
  await expect(libraryModule.createLibrary(directory, io).save(null, "Sala", [1])).rejects.toThrow("falha simulada");
  expect((await readdir(directory)).some((name) => name.endsWith(".tmp"))).toBe(false);
  expect((await readdir(directory)).some((name) => name.endsWith(".sh3d"))).toBe(false);
});

test("falha ao substituir restaura os bytes antigos", async () => {
  const directory = path.resolve("test-results", "library-rollback");
  const project = await libraryModule.createLibrary(directory).save(null, "Sala", [1, 2, 3]);
  const index = path.join(directory, "projects.json");
  const io = {
    ...fileSystem,
    rename: async (from: string, to: string) => {
      if (to === index) throw new Error("falha simulada no índice");
      return fileSystem.rename(from, to);
    },
  };
  await expect(libraryModule.createLibrary(directory, io).save(project.id, "Sala nova", [4, 5])).rejects.toThrow("falha simulada");
  const restored = await libraryModule.createLibrary(directory).open(project.id);
  expect(restored.name).toBe("Sala");
  expect(restored.bytes).toEqual(Uint8Array.from([1, 2, 3]));
  expect((await readdir(directory)).some((name) => name.endsWith(".bak") || name.endsWith(".tmp"))).toBe(false);
});

test("leitura espera substituição terminar", async () => {
  const directory = path.resolve("test-results", "library-serialized-read");
  const project = await libraryModule.createLibrary(directory).save(null, "Original", [1]);
  const index = path.join(directory, "projects.json");
  let release!: () => void;
  let entered!: () => void;
  const pause = new Promise<void>((resolve) => { release = resolve; });
  const reachedIndex = new Promise<void>((resolve) => { entered = resolve; });
  const io = {
    ...fileSystem,
    rename: async (from: string, to: string) => {
      if (to === index) { entered(); await pause; }
      return fileSystem.rename(from, to);
    },
  };
  const library = libraryModule.createLibrary(directory, io);
  const saving = library.save(project.id, "Atualizado", [2]);
  await reachedIndex;
  const reading = library.open(project.id);
  release();
  await saving;
  const opened = await reading;
  expect(opened.name).toBe("Atualizado");
  expect(opened.bytes).toEqual(Uint8Array.from([2]));
});

test("falha ao excluir não perde o projeto", async () => {
  const directory = path.resolve("test-results", "library-delete-rollback");
  const project = await libraryModule.createLibrary(directory).save(null, "Casa", [3, 4]);
  const index = path.join(directory, "projects.json");
  const io = {
    ...fileSystem,
    rename: async (from: string, to: string) => {
      if (to === index) throw new Error("falha simulada no índice");
      return fileSystem.rename(from, to);
    },
  };
  await expect(libraryModule.createLibrary(directory, io).delete(project.id)).rejects.toThrow("falha simulada");
  expect((await libraryModule.createLibrary(directory).open(project.id)).bytes).toEqual(Uint8Array.from([3, 4]));
});
