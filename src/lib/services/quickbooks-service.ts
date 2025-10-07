import QuickBooks from "node-quickbooks";
import { prisma } from "@/lib/prisma";

export interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
  sandbox: boolean;
}

export interface QuickBooksTokens {
  accessToken: string;
  refreshToken: string;
  realmId: string;
  expiresAt: Date;
}

export class QuickBooksService {
  private static getConfig(): QuickBooksConfig {
    return {
      clientId: process.env.QUICKBOOKS_CLIENT_ID!,
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
      redirectUrl: process.env.QUICKBOOKS_REDIRECT_URI!,
      sandbox: process.env.QUICKBOOKS_SANDBOX_MODE === "true",
    };
  }

  static getAuthUrl(userId: string): string {
    const config = this.getConfig();
    const state = Buffer.from(JSON.stringify({ userId })).toString("base64");

    const scopes = "com.intuit.quickbooks.accounting";
    const baseUrl = config.sandbox
      ? "https://appcenter.intuit.com/connect/oauth2"
      : "https://appcenter.intuit.com/connect/oauth2";

    const params = new URLSearchParams({
      client_id: config.clientId,
      scope: scopes,
      redirect_uri: config.redirectUrl,
      response_type: "code",
      access_type: "offline",
      state: state,
    });

    return `${baseUrl}?${params.toString()}`;
  }

  static async handleAuthCallback(
    code: string,
    state: string,
    realmId: string
  ): Promise<{ userId: string }> {
    try {
      const config = this.getConfig();
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
      const userId = stateData.userId;

      // Exchange code for tokens
      const qbo = new QuickBooks(
        config.clientId,
        config.clientSecret,
        "", // accessToken - will be set after exchange
        false,
        realmId,
        config.sandbox,
        true, // Enable OAuth 2.0
        null,
        "2.0",
        config.redirectUrl
      );

      const tokens = await this.exchangeCodeForTokens(qbo, code);

      // Get company info
      const companyInfo = await this.getCompanyInfo(qbo);

      // Store connection in database
      await this.storeConnection(
        userId,
        {
          ...tokens,
          realmId,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        },
        companyInfo
      );

      return { userId };
    } catch (error) {
      console.error("QuickBooks auth callback error:", error);
      throw new Error("Failed to complete QuickBooks authentication");
    }
  }

  private static exchangeCodeForTokens(qbo: any, code: string): Promise<any> {
    return new Promise((resolve, reject) => {
      qbo.requestToken(code, (err: any, tokens: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(tokens);
        }
      });
    });
  }

  private static getCompanyInfo(qbo: any): Promise<any> {
    return new Promise((resolve, reject) => {
      qbo.getCompanyInfo(qbo.realmId, (err: any, companyInfo: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(companyInfo);
        }
      });
    });
  }

  private static async storeConnection(
    userId: string,
    tokens: QuickBooksTokens,
    companyInfo: any
  ): Promise<void> {
    await prisma.quickBooksConnection.upsert({
      where: { userId },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        realmId: tokens.realmId,
        companyName: companyInfo?.Name || "",
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId,
        companyId: tokens.realmId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        realmId: tokens.realmId,
        companyName: companyInfo?.Name || "",
        isActive: true,
      },
    });
  }

  static async getConnection(userId: string) {
    return await prisma.quickBooksConnection.findUnique({
      where: { userId },
    });
  }

  static async refreshTokenIfNeeded(userId: string): Promise<boolean> {
    const connection = await this.getConnection(userId);
    if (!connection) return false;

    const now = new Date();
    const expiresIn = connection.tokenExpiresAt.getTime() - now.getTime();

    // Refresh if token expires in less than 10 minutes
    if (expiresIn < 600000) {
      try {
        const config = this.getConfig();
        const qbo = new QuickBooks(
          config.clientId,
          config.clientSecret,
          connection.accessToken,
          false,
          connection.realmId,
          config.sandbox,
          true,
          null,
          "2.0",
          config.redirectUrl
        );

        const newTokens = await this.refreshTokens(
          qbo,
          connection.refreshToken
        );

        await prisma.quickBooksConnection.update({
          where: { userId },
          data: {
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token,
            tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
            updatedAt: new Date(),
          },
        });

        return true;
      } catch (error) {
        console.error("Error refreshing QuickBooks token:", error);
        return false;
      }
    }

    return true;
  }

  private static refreshTokens(qbo: any, refreshToken: string): Promise<any> {
    return new Promise((resolve, reject) => {
      qbo.refreshAccessToken(refreshToken, (err: any, tokens: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(tokens);
        }
      });
    });
  }

  static async syncAccounts(userId: string): Promise<void> {
    const connection = await this.getConnection(userId);
    if (!connection || !connection.isActive) {
      throw new Error("No active QuickBooks connection");
    }

    await this.refreshTokenIfNeeded(userId);

    try {
      const config = this.getConfig();
      const qbo = new QuickBooks(
        config.clientId,
        config.clientSecret,
        connection.accessToken,
        false,
        connection.realmId,
        config.sandbox,
        true,
        null,
        "2.0",
        config.redirectUrl
      );

      const accounts = await this.getAccounts(qbo);
      let syncedCount = 0;

      for (const account of accounts) {
        await this.syncAccount(userId, account);
        syncedCount++;
      }

      await this.logSync(userId, "accounts", "success", syncedCount);
    } catch (error) {
      console.error("Error syncing accounts:", error);
      await this.logSync(
        userId,
        "accounts",
        "error",
        0,
        error instanceof Error ? error.message : "Unknown error"
      );
      throw error;
    }
  }

  private static getAccounts(qbo: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      qbo.findAccounts((err: any, accounts: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(accounts.QueryResponse?.Account || []);
        }
      });
    });
  }

  private static async syncAccount(
    userId: string,
    qbAccount: any
  ): Promise<void> {
    const accountType = this.mapAccountType(qbAccount.AccountType);

    await prisma.financialAccount.upsert({
      where: {
        userId_quickbooksId: {
          userId,
          quickbooksId: qbAccount.Id,
        },
      },
      update: {
        accountName: qbAccount.Name,
        accountType,
        accountNumber: qbAccount.AcctNum || null,
        description: qbAccount.Description || null,
        isActive: qbAccount.Active,
        balance: parseFloat(qbAccount.CurrentBalance || "0"),
        updatedAt: new Date(),
      },
      create: {
        userId,
        accountName: qbAccount.Name,
        accountType,
        accountNumber: qbAccount.AcctNum || null,
        description: qbAccount.Description || null,
        quickbooksId: qbAccount.Id,
        isActive: qbAccount.Active,
        balance: parseFloat(qbAccount.CurrentBalance || "0"),
      },
    });
  }

  static async syncVendors(userId: string): Promise<void> {
    const connection = await this.getConnection(userId);
    if (!connection || !connection.isActive) {
      throw new Error("No active QuickBooks connection");
    }

    await this.refreshTokenIfNeeded(userId);

    try {
      const config = this.getConfig();
      const qbo = new QuickBooks(
        config.clientId,
        config.clientSecret,
        connection.accessToken,
        false,
        connection.realmId,
        config.sandbox,
        true,
        null,
        "2.0",
        config.redirectUrl
      );

      const vendors = await this.getVendors(qbo);
      let syncedCount = 0;

      for (const vendor of vendors) {
        await this.syncVendor(userId, vendor);
        syncedCount++;
      }

      await this.logSync(userId, "vendors", "success", syncedCount);
    } catch (error) {
      console.error("Error syncing vendors:", error);
      await this.logSync(
        userId,
        "vendors",
        "error",
        0,
        error instanceof Error ? error.message : "Unknown error"
      );
      throw error;
    }
  }

  private static getVendors(qbo: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      qbo.findVendors((err: any, vendors: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(vendors.QueryResponse?.Vendor || []);
        }
      });
    });
  }

  private static async syncVendor(
    userId: string,
    qbVendor: any
  ): Promise<void> {
    await prisma.supplier.upsert({
      where: {
        userId_quickbooksId: {
          userId,
          quickbooksId: qbVendor.Id,
        },
      },
      update: {
        name: qbVendor.Name,
        contactName: qbVendor.ContactInfo?.Name || null,
        email: qbVendor.PrimaryEmailAddr?.Address || null,
        phone: qbVendor.PrimaryPhone?.FreeFormNumber || null,
        address: this.formatAddress(qbVendor.BillAddr),
        taxId: qbVendor.TaxIdentifier || null,
        isActive: qbVendor.Active,
        updatedAt: new Date(),
      },
      create: {
        userId,
        name: qbVendor.Name,
        contactName: qbVendor.ContactInfo?.Name || null,
        email: qbVendor.PrimaryEmailAddr?.Address || null,
        phone: qbVendor.PrimaryPhone?.FreeFormNumber || null,
        address: this.formatAddress(qbVendor.BillAddr),
        taxId: qbVendor.TaxIdentifier || null,
        quickbooksId: qbVendor.Id,
        isActive: qbVendor.Active,
      },
    });
  }

  static async createExpense(
    userId: string,
    expenseData: {
      accountId: string;
      amount: number;
      description: string;
      vendorId?: string;
      date: Date;
    }
  ): Promise<any> {
    const connection = await this.getConnection(userId);
    if (!connection || !connection.isActive) {
      throw new Error("No active QuickBooks connection");
    }

    await this.refreshTokenIfNeeded(userId);

    const config = this.getConfig();
    const qbo = new QuickBooks(
      config.clientId,
      config.clientSecret,
      connection.accessToken,
      false,
      connection.realmId,
      config.sandbox,
      true,
      null,
      "2.0",
      config.redirectUrl
    );

    return new Promise((resolve, reject) => {
      const expense = {
        AccountRef: {
          value: expenseData.accountId,
        },
        TotalAmt: expenseData.amount,
        TxnDate: expenseData.date.toISOString().split("T")[0],
        PaymentType: "Cash",
        Line: [
          {
            Amount: expenseData.amount,
            Description: expenseData.description,
            DetailType: "AccountBasedExpenseLineDetail",
            AccountBasedExpenseLineDetail: {
              AccountRef: {
                value: expenseData.accountId,
              },
            },
          },
        ],
      };

      if (expenseData.vendorId) {
        expense.EntityRef = {
          value: expenseData.vendorId,
          type: "Vendor",
        };
      }

      qbo.createPurchase(expense, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  static async disconnectUser(userId: string): Promise<void> {
    await prisma.quickBooksConnection.update({
      where: { userId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  private static mapAccountType(qbAccountType: string): string {
    const mapping: Record<string, string> = {
      Bank: "CHECKING",
      "Other Current Asset": "ASSET",
      "Accounts Receivable": "ACCOUNTS_RECEIVABLE",
      "Other Asset": "ASSET",
      "Fixed Asset": "ASSET",
      "Accounts Payable": "ACCOUNTS_PAYABLE",
      "Credit Card": "CREDIT_CARD",
      "Other Current Liability": "LIABILITY",
      "Long Term Liability": "LIABILITY",
      Equity: "EQUITY",
      Income: "REVENUE",
      "Other Income": "REVENUE",
      Expense: "EXPENSE",
      "Other Expense": "EXPENSE",
      "Cost of Goods Sold": "EXPENSE",
    };

    return mapping[qbAccountType] || "ASSET";
  }

  private static formatAddress(address: any): string | null {
    if (!address) return null;

    const parts = [
      address.Line1,
      address.City,
      address.CountrySubDivisionCode,
      address.PostalCode,
      address.Country,
    ].filter(Boolean);

    return parts.join(", ") || null;
  }

  private static async logSync(
    userId: string,
    syncType: string,
    status: string,
    recordsAffected: number,
    errorMessage?: string
  ): Promise<void> {
    await prisma.syncLog.create({
      data: {
        userId,
        syncType,
        status,
        recordsAffected,
        errorMessage,
        syncData: {
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Update connection sync status
    await prisma.quickBooksConnection.update({
      where: { userId },
      data: {
        lastSyncAt: new Date(),
        syncStatus: status,
        syncErrors: errorMessage ? { error: errorMessage } : null,
        updatedAt: new Date(),
      },
    });
  }
}
