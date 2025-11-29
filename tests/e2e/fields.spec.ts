import { test, expect } from "@playwright/test";
import { BasePage } from "../pages/BasePage";

test.describe("Fields Module", () => {
  test("should redirect to sign-in if not authenticated", async ({ page }) => {
    const basePage = new BasePage(page);
    await basePage.goto("/fields");
    await expect(page).toHaveURL(/.*sign-in/);
  });
});
