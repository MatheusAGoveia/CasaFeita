// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import { expect, test } from "@playwright/test";
import { Room } from "@sweethomejs/core";

test("objeto duplicado recebe listeners próprios sem afetar o original", () => {
  const original = new Room([[0, 0], [100, 0], [100, 100], [0, 100]]);
  original.setName("Sala");
  const copy = original.duplicate();
  let originalChanges = 0;
  let copyChanges = 0;
  original.addPropertyChangeListener(() => originalChanges++);
  copy.addPropertyChangeListener(() => copyChanges++);
  copy.setName("Quarto");
  expect(copy.getId()).not.toBe(original.getId());
  expect(original.getName()).toBe("Sala");
  expect(originalChanges).toBe(0);
  expect(copyChanges).toBe(1);
});
