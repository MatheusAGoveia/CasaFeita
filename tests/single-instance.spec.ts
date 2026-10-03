// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import { _electron as electron, expect, test } from "@playwright/test";
import { spawnSync } from "node:child_process";
import path from "node:path";

test("segunda instância do mesmo perfil encerra sem abrir outro editor", async () => {
  const executablePath = path.resolve("node_modules/electron/dist/electron.exe");
  const appPath = path.resolve("apps/desktop");
  const env = { ...process.env, CASAFEITA_TEST_USER_DATA: path.resolve("test-results", "single-instance-profile") };
  const first = await electron.launch({ executablePath, args: [appPath], env });
  try {
    const window = await first.firstWindow();
    await expect(window.getByText("CasaFeita", { exact: true })).toBeVisible();
    const second = spawnSync(executablePath, [appPath], { env, timeout: 10000, windowsHide: true });
    expect(second.error).toBeUndefined();
    expect(second.status).toBe(0);
    expect(first.windows()).toHaveLength(1);
  } finally {
    await first.close();
  }
});
