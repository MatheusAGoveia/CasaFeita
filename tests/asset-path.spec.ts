// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import { expect, test } from "@playwright/test";
import path from "node:path";
import assets from "../apps/desktop/electron/asset-path.cjs";

const root = path.resolve("apps/desktop/dist");

test("protocolo local aceita somente arquivos dentro do build", () => {
  expect(assets.resolveAssetPath(root, "casafeita://app/")).toBe(path.join(root, "index.html"));
  expect(assets.resolveAssetPath(root, "casafeita://app/assets/model.obj")).toBe(path.join(root, "assets", "model.obj"));
  expect(assets.resolveAssetPath(root, "casafeita://outro/index.html")).toBeNull();
  expect(assets.resolveAssetPath(root, "casafeita://app/%2e%2e%2fsecret.txt")).toBeNull();
  expect(assets.resolveAssetPath(root, "casafeita://app/%E0%A4%A")).toBeNull();
  expect(assets.resolveAssetPath(root, "casafeita://app/%00secret")).toBeNull();
});
