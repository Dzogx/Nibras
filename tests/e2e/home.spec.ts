import { expect, test } from "@playwright/test";
test("renders Arabic landing page", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("heading", { name: "نبراس" })).toBeVisible(); });
