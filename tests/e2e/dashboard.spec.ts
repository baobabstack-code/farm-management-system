import { test, expect } from "@playwright/test";
import { DashboardPage } from "../pages/DashboardPage";

test.describe("Dashboard", () => {
  test.beforeEach(async () => {
    // Mock authentication state or use a setup step to sign in
    // For this example, we assume we can bypass or mock the auth state
    // In a real scenario, use global setup or storage state
  });

  test("should redirect to sign-in if not authenticated", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await expect(page).toHaveURL(/.*sign-in/);
  });
});
