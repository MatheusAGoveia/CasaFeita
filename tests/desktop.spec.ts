// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import { _electron as electron, expect, test } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { HomeFileRecorder } from "@sweethomejs/core";

test("abre o editor instalado e conserva uma planta ao salvar e reabrir", async () => {
  const app = await electron.launch({
    executablePath: path.resolve("node_modules/electron/dist/electron.exe"),
    args: [path.resolve("apps/desktop")],
    env: { ...process.env, CASAFEITA_TEST_USER_DATA: path.resolve("test-results", "desktop-profile") },
    timeout: 60000,
  });
  try {
    const page = await app.firstWindow();
    const errors: string[] = [];
    const confirmations: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("dialog", (dialog) => { confirmations.push(dialog.message()); void dialog.accept(); });
    await expect(page.getByText("CasaFeita", { exact: true })).toBeVisible();
    await expect(page.getByTestId("plan-surface").locator("canvas")).toBeVisible();
    await expect(page.getByText("6 paredes")).toBeVisible();
    await expect(page.getByText("2 cômodos")).toBeVisible();
    await page.screenshot({ path: "test-results/editor.png" });
    await page.getByRole("button", { name: "Alternar modo" }).click();
    await page.getByRole("button", { name: "Mobiliar" }).click();
    await expect(page.getByRole("button", { name: /Sofá/ })).toBeVisible();
    await page.screenshot({ path: "test-results/catalog.png" });
    await page.getByRole("button", { name: /Sofá/ }).click();
    await expect(page.getByText("1 móvel")).toBeVisible();
    await expect(page.getByText("Sofá", { exact: true }).first()).toBeVisible();
    const hasSofaModel = () => page.evaluate(() => {
      let found = false;
      (globalThis as unknown as { __homeScene?: { getRoot(): { traverse(visit: (object: { isMesh?: boolean; name?: string }) => void): void } } }).__homeScene?.getRoot().traverse((object) => {
        if (object.isMesh && object.name === "loungeSofa") found = true;
      });
      return found;
    });
    await expect.poll(hasSofaModel).toBe(true);
    await page.screenshot({ path: "test-results/furniture.png" });
    await page.getByRole("spinbutton", { name: "Largura" }).fill("220");
    await expect(page.getByRole("spinbutton", { name: "Largura" })).toHaveValue("220");
    await page.getByRole("button", { name: "Grafite" }).click();
    await expect(page.getByRole("button", { name: "Grafite" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Duplicar" }).click();
    expect(errors).toEqual([]);
    await expect(page.getByText("2 móveis")).toBeVisible();
    await expect(page.getByRole("status")).toBeHidden();
    await page.screenshot({ path: "test-results/finish.png" });
    const exportPath = path.resolve("test-results", "casa-de-exemplo.sh3d");
    mkdirSync(path.dirname(exportPath), { recursive: true });
    await app.evaluate(({ dialog }, savePath) => {
      dialog.showSaveDialog = () => Promise.resolve({ canceled: false, filePath: savePath });
    }, exportPath);
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    const library = page.getByRole("dialog", { name: "Salvar projeto" });
    await expect(library).toBeVisible();
    const canvasBeforeRename = await page.getByTestId("plan-surface").locator("canvas").elementHandle();
    await library.getByRole("textbox", { name: "Nome do projeto" }).fill("Casa renomeada");
    await library.getByRole("button", { name: "Salvar novo" }).click();
    await expect(page.getByText("Projeto salvo na biblioteca local")).toBeVisible();
    expect(await canvasBeforeRename?.evaluate((element) => element.isConnected)).toBe(true);
    await page.getByRole("button", { name: "Meus projetos" }).click();
    await expect(page.getByRole("dialog", { name: "Meus projetos" }).getByText("1/3")).toBeVisible();
    await expect(page.getByRole("status")).toBeHidden();
    await page.screenshot({ path: "test-results/library.png" });
    await page.getByRole("button", { name: "Exportar .sh3d" }).click();
    await expect(page.getByText("Cópia .sh3d exportada")).toBeVisible();
    expect(existsSync(exportPath)).toBe(true);
    const savedHome = await new HomeFileRecorder().readHomeFromZip(new Uint8Array(readFileSync(exportPath)));
    expect(savedHome.home.getFurniture()).toHaveLength(2);
    expect(savedHome.home.getFurniture()[0]?.getWidth()).toBe(220);
    expect(savedHome.home.getFurniture()[1]?.getWidth()).toBe(220);
    expect(savedHome.home.getFurniture()[0]?.getModelMaterials()?.length).toBeGreaterThan(0);
    expect(savedHome.home.getFurniture()[0]?.getModelMaterials()?.find((material) => material.getName() === "carpet")?.getColor()).toBe(0x696d6b);
    expect(savedHome.home.getFurniture()[0]?.getProperty("casafeita.finish")).toBe("grafite");
    expect(savedHome.home.getFurniture()[1]?.getProperty("casafeita.finish")).toBe("grafite");
    expect(savedHome.home.getFurniture()[0]?.getX()).not.toBe(savedHome.home.getFurniture()[1]?.getX());
    await page.getByRole("button", { name: "Fechar" }).click();

    const isModified = () => page.evaluate(() =>
      (globalThis as unknown as { __homeScene?: { item?: { isModified(): boolean } } }).__homeScene?.item?.isModified() ?? null,
    );
    await page.getByRole("spinbutton", { name: "Largura" }).fill("230");
    expect(await isModified()).toBe(true);
    await expect(page.getByTestId("unsaved-indicator")).toBeVisible();
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByText("Projeto salvo na biblioteca local")).toBeVisible();
    await expect.poll(isModified).toBe(false);
    await expect(page.getByTestId("unsaved-indicator")).toBeHidden();
    await page.getByRole("button", { name: "Verde" }).click();
    expect(await isModified()).toBe(true);
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByText("Projeto salvo na biblioteca local")).toBeVisible();
    await expect.poll(isModified).toBe(false);
    await page.getByRole("button", { name: "Girar 45°" }).click();
    expect(await isModified()).toBe(true);
    await page.getByRole("button", { name: "Novo projeto" }).click();
    expect(confirmations).toContain("Criar outro projeto? Salve as alterações antes de continuar.");
    await expect(page.getByText("0 paredes")).toBeVisible();
    await page.getByRole("button", { name: "Paredes", exact: true }).click();
    const plan = page.getByTestId("plan-surface").locator("canvas");
    const bounds = await plan.boundingBox();
    if (!bounds) throw new Error("A área de desenho não foi montada");
    await plan.click({ position: { x: bounds.width * 0.25, y: bounds.height * 0.35 } });
    await plan.dblclick({ position: { x: bounds.width * 0.45, y: bounds.height * 0.35 } });
    await expect(page.getByText(/[1-9] paredes/)).toBeVisible();
    await page.getByRole("button", { name: "Meus projetos" }).click();
    await page.getByRole("dialog", { name: "Meus projetos" }).getByRole("button", { name: "Abrir" }).click();
    await expect(page.getByText("6 paredes")).toBeVisible();
    await expect(page.getByText("2 cômodos")).toBeVisible();
    await expect(page.getByText("2 móveis")).toBeVisible();
    await expect.poll(hasSofaModel).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    await app.close();
  }
});
