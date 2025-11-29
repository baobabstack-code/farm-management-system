import { Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class AnimalsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto("/animals");
  }

  async createGroup(name: string, quantity: string, species: string) {
    await this.clickButton("Add Group");
    await this.fillInput("Group Name", name);
    await this.fillInput("Quantity", quantity);
    // Select species (assuming it's a select dropdown)
    await this.page.getByRole("combobox", { name: "Species" }).click();
    await this.page.getByRole("option", { name: species }).click();
    await this.clickButton("Create Group");
  }

  async expectGroupVisible(name: string) {
    await this.expectText(name);
  }
}
