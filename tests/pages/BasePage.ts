import { Page, Locator, expect } from "@playwright/test";

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForUrl(url: string | RegExp) {
    await this.page.waitForURL(url);
  }

  async getByTestId(testId: string): Promise<Locator> {
    return this.page.getByTestId(testId);
  }

  async clickButton(name: string) {
    await this.page.getByRole("button", { name }).click();
  }

  async fillInput(label: string, value: string) {
    await this.page.getByLabel(label).fill(value);
  }

  async expectHeading(name: string) {
    await expect(this.page.getByRole("heading", { name })).toBeVisible();
  }

  async expectText(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }
}
