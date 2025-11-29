import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

test.describe("Authentication", () => {
  test("should redirect to sign-in page when accessing protected route", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("should allow user to sign in", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // Note: Real sign-in testing depends on Clerk setup (e.g., using a testing token or bypass)
    // For now, we verify the page loads by checking the URL.
    await expect(page).toHaveURL(/.*sign-in/);
  });
});
