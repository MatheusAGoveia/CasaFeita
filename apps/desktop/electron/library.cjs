// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const MAX_PROJECTS = 3;
const MAX_BYTES = 200 * 1024 * 1024;
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function validTimestamp(value) {
  if (typeof value !== "string") return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

function createLibrary(directory, io = fs) {
  const manifestPath = path.join(directory, "projects.json");
  let queue = Promise.resolve();

  const backupPath = (entry) => path.join(directory, `${entry.id}.${Date.parse(entry.updatedAt)}.${randomUUID()}.bak`);

  const recoverBackups = async (entries) => {
    for (const name of await io.readdir(directory)) {
      const match = name.match(/^([0-9a-f-]{36})\.([0-9]+)\.[0-9a-f-]{36}\.bak$/i);
      if (!match || !ID_PATTERN.test(match[1])) continue;
      const backup = path.join(directory, name);
      const target = path.join(directory, `${match[1]}.sh3d`);
      const entry = entries.find((project) => project.id === match[1]);
      const targetExists = await io.stat(target).then(() => true, (error) => {
        if (error.code === "ENOENT") return false;
        throw error;
      });
      if (entry && (Date.parse(entry.updatedAt) === Number(match[2]) || !targetExists)) {
        if (targetExists) await io.rm(target);
        await io.rename(backup, target);
      } else {
        await io.rm(backup, { force: true });
      }
    }
  };

  const readEntries = async () => {
    let raw;
    try { raw = await io.readFile(manifestPath, "utf8"); }
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
          validTimestamp(project.updatedAt)) ||
        new Set(manifest.projects.map((project) => project.id)).size !== manifest.projects.length) {
      throw new Error("Biblioteca de projetos corrompida");
    }
    await recoverBackups(manifest.projects);
    return manifest.projects;
  };

  const writeEntries = async (entries) => {
    await io.mkdir(directory, { recursive: true });
    const temporary = path.join(directory, `${randomUUID()}.tmp`);
    try {
      await io.writeFile(temporary, JSON.stringify({ version: 1, projects: entries }, null, 2), "utf8");
      await io.rename(temporary, manifestPath);
    } finally {
      await io.rm(temporary, { force: true }).catch(() => {});
    }
  };

  const runExclusive = (operation) => {
    const result = queue.then(operation, operation);
    queue = result.then(() => {}, () => {});
    return result;
  };

  return {
    list() {
      return runExclusive(async () => {
        const entries = await readEntries();
        return entries.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      });
    },
    open(id) {
      return runExclusive(async () => {
        if (typeof id !== "string" || !ID_PATTERN.test(id)) throw new Error("Projeto inválido");
        const entries = await readEntries();
        const entry = entries.find((project) => project.id === id);
        if (!entry) throw new Error("Projeto não encontrado");
        const file = path.join(directory, `${id}.sh3d`);
        try {
          const stat = await io.stat(file);
          if (stat.size > MAX_BYTES) throw new Error("Projeto maior que 200 MB");
          const bytes = await io.readFile(file);
          if (bytes.length > MAX_BYTES) throw new Error("Projeto maior que 200 MB");
          return { ...entry, bytes: new Uint8Array(bytes) };
        } catch (error) {
          if (error.code === "ENOENT") throw new Error("Arquivo do projeto não encontrado");
          throw error;
        }
      });
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
        const updatedAt = new Date(Math.max(Date.now(), existing ? Date.parse(existing.updatedAt) + 1 : 0)).toISOString();
        const entry = { id: projectId, name: name.trim(), updatedAt };
        await io.mkdir(directory, { recursive: true });
        const temporary = path.join(directory, `${randomUUID()}.tmp`);
        const target = path.join(directory, `${projectId}.sh3d`);
        const backup = existing ? backupPath(existing) : null;
        let movedOld = false;
        let installed = false;
        try {
          await io.writeFile(temporary, Uint8Array.from(data));
          if (existing) {
            await io.rename(target, backup);
            movedOld = true;
          }
          await io.rename(temporary, target);
          installed = true;
          await writeEntries([...entries.filter((project) => project.id !== projectId), entry]);
        } catch (error) {
          try {
            if (installed) await io.rm(target, { force: true });
            if (movedOld) await io.rename(backup, target);
          } catch (recoveryError) {
            throw new AggregateError([error, recoveryError], "Falha ao recuperar o projeto anterior");
          }
          throw error;
        } finally {
          await io.rm(temporary, { force: true }).catch(() => {});
        }
        if (movedOld) await io.rm(backup, { force: true }).catch(() => {});
        return entry;
      });
    },
    delete(id) {
      return runExclusive(async () => {
        if (typeof id !== "string" || !ID_PATTERN.test(id)) throw new Error("Projeto inválido");
        const entries = await readEntries();
        const entry = entries.find((project) => project.id === id);
        if (!entry) return false;
        const target = path.join(directory, `${id}.sh3d`);
        const backup = backupPath(entry);
        let moved = false;
        try {
          try {
            await io.rename(target, backup);
            moved = true;
          } catch (error) {
            if (error.code !== "ENOENT") throw error;
          }
          await writeEntries(entries.filter((project) => project.id !== id));
        } catch (error) {
          if (moved) await io.rename(backup, target);
          throw error;
        }
        if (moved) await io.rm(backup, { force: true }).catch(() => {});
        return true;
      });
    },
  };
}

module.exports = { createLibrary, MAX_PROJECTS };
