// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import { _electron as electron, expect, test } from "@playwright/test";
import path from "node:path";

test("cancelar seletor de importação não pede descarte das alterações", async () => {
  const app = await electron.launch({
    executablePath: path.resolve("node_modules/electron/dist/electron.exe"),
    args: [path.resolve("apps/desktop")],
  });
  try {
    const page = await app.firstWindow();
    let confirmations = 0;
    page.on("dialog", (dialog) => { confirmations++; void dialog.dismiss(); });
    await page.getByRole("button", { name: "Alternar modo" }).click();
    await page.getByRole("button", { name: "Mobiliar" }).click();
    await page.getByRole("button", { name: /Sofá/ }).click();
    await expect(page.getByText("1 móvel")).toBeVisible();
    await app.evaluate(({ dialog }) => {
      dialog.showOpenDialog = () => {
        (globalThis as typeof globalThis & { __importDialogOpened?: boolean }).__importDialogOpened = true;
        return Promise.resolve({ canceled: true, filePaths: [] });
      };
    });
    await page.getByRole("button", { name: "Meus projetos" }).click();
    await page.getByRole("button", { name: "Importar .sh3d" }).click();
    await expect.poll(() => app.evaluate(() => (globalThis as typeof globalThis & { __importDialogOpened?: boolean }).__importDialogOpened)).toBe(true);
    await expect(page.getByRole("dialog", { name: "Meus projetos" })).toBeVisible();
    expect(confirmations).toBe(0);
  } finally {
    await app.close();
  }
});
