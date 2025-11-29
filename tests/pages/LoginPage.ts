import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto("/sign-in");
  }

  async signIn(
    email: string = "test@example.com",
    password: string = "password"
  ) {
    // Note: Clerk testing usually requires specific setup or "testing tokens"
    // For E2E on a real app, we might need to interact with the actual Clerk UI
    // or bypass auth if in a test environment.
    // This is a placeholder for the actual interaction.
    await this.fillInput("Email address", email);
    await this.clickButton("Continue");
    await this.fillInput("Password", password);
    await this.clickButton("Sign in");
  }
}
