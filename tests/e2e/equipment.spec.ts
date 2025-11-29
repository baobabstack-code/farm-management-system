import { test, expect } from "@playwright/test";
import { BasePage } from "../pages/BasePage";

test.describe("Equipment Module", () => {
  test("should redirect to sign-in if not authenticated", async ({ page }) => {
    const basePage = new BasePage(page);
    await basePage.goto("/equipment");
    await expect(page).toHaveURL(/.*sign-in/);
  });
});
