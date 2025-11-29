import { Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto("/dashboard");
  }

  async expectWidgetsVisible() {
    await expect(this.page.getByTestId("weather-widget")).toBeVisible();
    await expect(this.page.getByTestId("tasks-widget")).toBeVisible();
    await expect(this.page.getByTestId("financial-widget")).toBeVisible();
  }

  async navigateTo(linkName: string) {
    await this.page.getByRole("link", { name: linkName }).click();
  }
}
