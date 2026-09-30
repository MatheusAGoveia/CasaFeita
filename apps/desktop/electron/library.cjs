// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const MAX_PROJECTS = 3;
const MAX_BYTES = 200 * 1024 * 1024;
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createLibrary(directory) {
  const manifestPath = path.join(directory, "projects.json");
  let queue = Promise.resolve();

  const readEntries = async () => {
    let raw;
    try { raw = await fs.readFile(manifestPath, "utf8"); }
    catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
    let manifest;
    try { manifest = JSON.parse(raw); }
    catch { throw new Error("Biblioteca de projetos corrompida"); }
    if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.projects) || manifest.projects.length > MAX_PROJECTS ||
        !manifest.projects.every((project) => project && typeof project.id === "string" && ID_PATTERN.test(project.id) &&
          typeof project.name === "string" && project.name.trim().length > 0 && project.name.length <= 80 &&
          typeof project.updatedAt === "string" && Number.isFinite(Date.parse(project.updatedAt))) ||
        new Set(manifest.projects.map((project) => project.id)).size !== manifest.projects.length) {
      throw new Error("Biblioteca de projetos corrompida");
    }
    return manifest.projects;
  };

  const writeEntries = async (entries) => {
    await fs.mkdir(directory, { recursive: true });
    const temporary = path.join(directory, `${randomUUID()}.tmp`);
    await fs.writeFile(temporary, JSON.stringify({ version: 1, projects: entries }, null, 2), "utf8");
    await fs.rename(temporary, manifestPath);
  };

  const runExclusive = (operation) => {
    const result = queue.then(operation, operation);
    queue = result.then(() => {}, () => {});
    return result;
  };

  return {
    async list() {
      const entries = await readEntries();
      return entries.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async open(id) {
      if (typeof id !== "string" || !ID_PATTERN.test(id)) throw new Error("Projeto inválido");
      const entries = await readEntries();
      const entry = entries.find((project) => project.id === id);
      if (!entry) throw new Error("Projeto não encontrado");
      const file = path.join(directory, `${id}.sh3d`);
      try {
        const stat = await fs.stat(file);
        if (stat.size > MAX_BYTES) throw new Error("Projeto maior que 200 MB");
        const bytes = await fs.readFile(file);
        if (bytes.length > MAX_BYTES) throw new Error("Projeto maior que 200 MB");
        return { ...entry, bytes: new Uint8Array(bytes) };
      } catch (error) {
        if (error.code === "ENOENT") throw new Error("Arquivo do projeto não encontrado");
        throw error;
      }
    },
    save(id, name, data) {
      return runExclusive(async () => {
        if (id !== null && (typeof id !== "string" || !ID_PATTERN.test(id))) throw new Error("Projeto inválido");
        if (typeof name !== "string" || !name.trim() || name.length > 80) throw new Error("Nome do projeto inválido");
        if (!(data instanceof Uint8Array || Array.isArray(data)) || data.length === 0 || data.length > MAX_BYTES ||
            !data.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)) throw new Error("Arquivo do projeto inválido");
        const entries = await readEntries();
        const existing = id === null ? undefined : entries.find((project) => project.id === id);
        if (id !== null && !existing) throw new Error("Projeto não encontrado");
        if (!existing && entries.length >= MAX_PROJECTS) throw new Error("Limite de 3 projetos atingido. Exclua um projeto ou escolha qual substituir.");
        const projectId = existing?.id ?? randomUUID();
        const entry = { id: projectId, name: name.trim(), updatedAt: new Date().toISOString() };
        await fs.mkdir(directory, { recursive: true });
        const temporary = path.join(directory, `${randomUUID()}.tmp`);
        await fs.writeFile(temporary, Uint8Array.from(data));
        await fs.rename(temporary, path.join(directory, `${projectId}.sh3d`));
        await writeEntries([...entries.filter((project) => project.id !== projectId), entry]);
        return entry;
      });
    },
    delete(id) {
      return runExclusive(async () => {
        if (typeof id !== "string" || !ID_PATTERN.test(id)) throw new Error("Projeto inválido");
        const entries = await readEntries();
        if (!entries.some((project) => project.id === id)) return false;
        await writeEntries(entries.filter((project) => project.id !== id));
        await fs.rm(path.join(directory, `${id}.sh3d`), { force: true });
        return true;
      });
    },
  };
}

module.exports = { createLibrary, MAX_PROJECTS };
