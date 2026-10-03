// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import { expect, test } from "@playwright/test";
import imports from "../apps/desktop/electron/file-imports.cjs";

test("importação verifica tamanho também depois da leitura", async () => {
  const io = {
    stat: async () => ({ isFile: () => true, size: 2 }),
    readFile: async () => Buffer.from([1, 2, 3, 4, 5]),
  };
  await expect(imports.readProjectFile("projeto.sh3d", io, 4)).rejects.toThrow("Arquivo maior que 200 MB");
});

test("importação recusa pasta e arquivo vazio", async () => {
  const folder = { stat: async () => ({ isFile: () => false, size: 0 }) };
  await expect(imports.readProjectFile("pasta", folder)).rejects.toThrow("Escolha um arquivo");
  const empty = { stat: async () => ({ isFile: () => true, size: 0 }), readFile: async () => Buffer.alloc(0) };
  await expect(imports.readProjectFile("vazio.sh3d", empty)).rejects.toThrow("Arquivo do projeto vazio");
});
