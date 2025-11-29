import { test, expect } from "@playwright/test";
import { AnimalsPage } from "../pages/AnimalsPage";

test.describe("Animals Module", () => {
  test("should redirect to sign-in if not authenticated", async ({ page }) => {
    const animalsPage = new AnimalsPage(page);
    await animalsPage.goto();
    await expect(page).toHaveURL(/.*sign-in/);
  });
});
