// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import { _electron as electron, expect, test } from "@playwright/test";
import path from "node:path";

test("minimapa caminha, duplo clique teleporta e controle ajusta velocidade", async () => {
  const app = await electron.launch({
    executablePath: path.resolve("node_modules/electron/dist/electron.exe"),
    args: [path.resolve("apps/desktop")],
    timeout: 60000,
  });
  try {
    const page = await app.firstWindow();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.getByRole("button", { name: "Alternar modo" }).click();
    await page.getByRole("button", { name: "Passear" }).click();
    await expect(page.getByTestId("walkthrough")).toBeVisible();
    await expect(page.getByTestId("minimap")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Ir para cômodo" })).toBeVisible();
    await page.screenshot({ path: "test-results/walkthrough.png" });

    const cameraPosition = () => page.evaluate(() => {
      const scene = (globalThis as unknown as { __homeScene?: { item?: { getObserverCamera(): { getX(): number; getY(): number } } } }).__homeScene;
      const camera = scene?.item?.getObserverCamera();
      return camera ? { x: camera.getX(), y: camera.getY() } : null;
    });
    const start = await cameraPosition();
    expect(start).not.toBeNull();
    const target = await page.getByTestId("minimap").evaluate((svg: SVGSVGElement) => {
      const point = svg.createSVGPoint();
      point.x = 620;
      point.y = 450;
      const mapped = point.matrixTransform(svg.getScreenCTM()!);
      return { x: mapped.x, y: mapped.y };
    });
    await page.mouse.click(target.x, target.y);
    await expect(page.getByText(/Caminhando até o destino/)).toBeVisible();
    await expect.poll(async () => (await cameraPosition())?.x ?? 0, { timeout: 5000 }).toBeGreaterThan(start!.x + 20);
    const blocked = await page.getByTestId("minimap").evaluate((svg: SVGSVGElement) => {
      const point = svg.createSVGPoint();
      point.x = 360; point.y = 100;
      const mapped = point.matrixTransform(svg.getScreenCTM()!);
      return { x: mapped.x, y: mapped.y };
    });
    await page.mouse.click(blocked.x, blocked.y);
    await expect(page.getByText("Escolha um ponto livre dentro da planta.")).toBeVisible();
    await expect(page.getByTestId("minimap").locator("polyline")).toHaveCount(0);
    await page.mouse.click(target.x, target.y);
    await page.getByRole("slider", { name: "Velocidade do passeio" }).fill("2");
    await expect(page.getByText("2.0 m/s")).toBeVisible();
    await page.mouse.dblclick(target.x, target.y);
    await expect.poll(async () => (await cameraPosition())?.x ?? 0).toBeGreaterThan(610);
    await expect.poll(async () => (await cameraPosition())?.y ?? 0).toBeGreaterThan(440);
    await page.evaluate(() => {
      const scene = (globalThis as unknown as { __homeScene?: { item?: { getObserverCamera(): { setYaw(yaw: number): void } } } }).__homeScene;
      scene?.item?.getObserverCamera().setYaw(Math.PI / 2);
    });
    await page.keyboard.down("w");
    await page.waitForTimeout(1500);
    await page.keyboard.up("w");
    expect((await cameraPosition())!.x).toBeLessThan(835);
    await page.getByRole("button", { name: "Voltar ao editor" }).click();
    await expect(page.getByTestId("plan-surface")).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await app.close();
  }
});
