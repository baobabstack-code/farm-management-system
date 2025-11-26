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

type QuickBooksError = any;

interface QuickBooksCompanyInfo {
  Name?: string;
  CompanyName?: string;
  LegalName?: string;
  [key: string]: unknown;
}

interface QuickBooksInstance {
  requestToken: (
    code: string,
    callback: (
      err: QuickBooksError | null,
      tokens: QuickBooksTokens | null
    ) => void
  ) => void;
  getCompanyInfo: (
    realmId: string,
    callback: (
      err: QuickBooksError | null,
      companyInfo: QuickBooksCompanyInfo | null
    ) => void
  ) => void;
  refreshAccessToken: (
    refreshToken: string,
    callback: (
      err: QuickBooksError | null,
      tokens: QuickBooksTokens | null
    ) => void
  ) => void;
  findAccounts: (
    callback: (
      err: QuickBooksError | null,
      accounts: QuickBooksAccountsResponse | null
    ) => void
  ) => void;
  findVendors: (
    callback: (
      err: QuickBooksError | null,
      vendors: QuickBooksVendorsResponse | null
    ) => void
  ) => void;
  createPurchase: (
    expense: QuickBooksExpense,
    callback: (
      err: QuickBooksError | null,
      result: QuickBooksExpenseResult | null
    ) => void
  ) => void;
  realmId: string;
}

interface QuickBooksAccountsResponse {
  QueryResponse?: {
    Account?: QuickBooksAccount[];
  };
}

interface QuickBooksAccount {
  Id: string;
  Name: string;
  AccountType: string;
  AccountSubType?: string;
  CurrentBalance?: number;
  Active?: boolean;
  [key: string]: unknown;
}

interface QuickBooksVendorsResponse {
  QueryResponse?: {
    Vendor?: QuickBooksVendor[];
  };
}

interface QuickBooksVendor {
  Id: string;
  DisplayName: string;
  CompanyName?: string;
  GivenName?: string;
  FamilyName?: string;
  PrimaryEmailAddr?: { Address?: string };
  PrimaryPhone?: { FreeFormNumber?: string };
  BillAddr?: QuickBooksAddress;
  Active?: boolean;
  [key: string]: unknown;
}

interface QuickBooksAddress {
  Line1?: string;
  Line2?: string;
  City?: string;
  CountrySubDivisionCode?: string;
  PostalCode?: string;
  [key: string]: unknown;
}

interface QuickBooksExpense {
  AccountRef: {
    value: string;
  };
  PaymentType: string;
  EntityRef?: {
    value: string;
    type: string;
  };
  TotalAmt: number;
  PrivateNote?: string;
  Line: Array<{
    Amount: number;
    DetailType: string;
    AccountBasedExpenseLineDetail: {
      AccountRef: {
        value: string;
      };
    };
  }>;
  [key: string]: unknown;
}

interface QuickBooksExpenseResult {
  Id: string;
  [key: string]: unknown;
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
        "", // accessToken
        "", // tokenSecret - not used in OAuth 2.0
        config.sandbox,
        false, // debug
        2, // minor_version
        realmId
      );

      const tokens = await this.exchangeCodeForTokens(qbo as any, code);

      // Get company info
      const companyInfo = await this.getCompanyInfo(qbo as any);

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

  private static exchangeCodeForTokens(
    qbo: QuickBooksInstance,
    code: string
  ): Promise<QuickBooksTokens> {
    return new Promise((resolve, reject) => {
      qbo.requestToken(
        code,
        (err: QuickBooksError | null, tokens: QuickBooksTokens | null) => {
          if (err) {
            reject(err);
          } else if (tokens) {
            resolve(tokens);
          } else {
            reject(new Error("No tokens received"));
          }
        }
      );
    });
  }

  private static getCompanyInfo(
    qbo: QuickBooksInstance
  ): Promise<QuickBooksCompanyInfo> {
    return new Promise((resolve, reject) => {
      qbo.getCompanyInfo(
        qbo.realmId,
        (
          err: QuickBooksError | null,
          companyInfo: QuickBooksCompanyInfo | null
        ) => {
          if (err) {
            reject(err);
          } else if (companyInfo) {
            resolve(companyInfo);
          } else {
            reject(new Error("No company info received"));
          }
        }
      );
    });
  }

  private static async storeConnection(
    userId: string,
    tokens: QuickBooksTokens,
    companyInfo: QuickBooksCompanyInfo
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
          "", // tokenSecret - not used in OAuth 2.0
          config.sandbox,
          false, // debug
          2, // minor_version
          connection.realmId
        );

        const newTokens = await this.refreshTokens(
          qbo as any,
          connection.refreshToken
        );

        await prisma.quickBooksConnection.update({
          where: { userId },
          data: {
            accessToken: (newTokens as any).access_token,
            refreshToken: (newTokens as any).refresh_token,
            tokenExpiresAt: new Date(
              Date.now() + (newTokens as any).expires_in * 1000
            ),
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

  private static refreshTokens(
    qbo: QuickBooksInstance,
    refreshToken: string
  ): Promise<QuickBooksTokens> {
    return new Promise((resolve, reject) => {
      qbo.refreshAccessToken(
        refreshToken,
        (err: QuickBooksError | null, tokens: QuickBooksTokens | null) => {
          if (err) {
            reject(err);
          } else if (tokens) {
            resolve(tokens);
          } else {
            reject(new Error("No tokens received"));
          }
        }
      );
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
        "", // tokenSecret - not used in OAuth 2.0
        config.sandbox,
        false, // debug
        2, // minor_version
        connection.realmId
      );

      const accounts = await this.getAccounts(qbo as any);
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

  private static getAccounts(
    qbo: QuickBooksInstance
  ): Promise<QuickBooksAccount[]> {
    return new Promise((resolve, reject) => {
      qbo.findAccounts(
        (
          err: QuickBooksError | null,
          accounts: QuickBooksAccountsResponse | null
        ) => {
          if (err) {
            reject(err);
          } else {
            resolve(accounts?.QueryResponse?.Account || []);
          }
        }
      );
    });
  }

  private static async syncAccount(
    userId: string,
    qbAccount: QuickBooksAccount
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
        accountName: qbAccount.Name as any,
        accountType,
        accountNumber: (qbAccount.AcctNum || null) as any,
        description: (qbAccount.Description || null) as any,
        isActive: qbAccount.Active as any,
        balance: parseFloat((qbAccount.CurrentBalance || "0") as any),
        updatedAt: new Date(),
      },
      create: {
        userId,
        accountName: qbAccount.Name as any,
        accountType,
        accountNumber: (qbAccount.AcctNum || null) as any,
        description: (qbAccount.Description || null) as any,
        quickbooksId: qbAccount.Id as any,
        isActive: qbAccount.Active as any,
        balance: parseFloat((qbAccount.CurrentBalance || "0") as any),
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
        "", // tokenSecret - not used in OAuth 2.0
        config.sandbox,
        false, // debug
        2, // minor_version
        connection.realmId
      );

      const vendors = await this.getVendors(qbo as any);
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

  private static getVendors(
    qbo: QuickBooksInstance
  ): Promise<QuickBooksVendor[]> {
    return new Promise((resolve, reject) => {
      qbo.findVendors(
        (
          err: QuickBooksError | null,
          vendors: QuickBooksVendorsResponse | null
        ) => {
          if (err) {
            reject(err);
          } else {
            resolve(vendors?.QueryResponse?.Vendor || []);
          }
        }
      );
    });
  }

  private static async syncVendor(
    userId: string,
    qbVendor: QuickBooksVendor
  ): Promise<void> {
    await prisma.supplier.upsert({
      where: {
        userId_quickbooksId: {
          userId,
          quickbooksId: qbVendor.Id,
        },
      },
      update: {
        name: qbVendor.Name as any,
        contactName: ((qbVendor.ContactInfo as any)?.Name || null) as any,
        email: (qbVendor.PrimaryEmailAddr?.Address || null) as any,
        phone: (qbVendor.PrimaryPhone?.FreeFormNumber || null) as any,
        address: this.formatAddress(qbVendor.BillAddr),
        taxId: (qbVendor.TaxIdentifier || null) as any,
        isActive: qbVendor.Active as any,
        updatedAt: new Date(),
      },
      create: {
        userId,
        name: qbVendor.Name as any,
        contactName: ((qbVendor.ContactInfo as any)?.Name || null) as any,
        email: (qbVendor.PrimaryEmailAddr?.Address || null) as any,
        phone: (qbVendor.PrimaryPhone?.FreeFormNumber || null) as any,
        address: this.formatAddress(qbVendor.BillAddr),
        taxId: (qbVendor.TaxIdentifier || null) as any,
        quickbooksId: qbVendor.Id as any,
        isActive: qbVendor.Active as any,
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
  ): Promise<QuickBooksExpenseResult> {
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
      "", // tokenSecret - not used in OAuth 2.0
      config.sandbox,
      false, // debug
      2, // minor_version
      connection.realmId
    );

    return new Promise((resolve, reject) => {
      const expense: QuickBooksExpense = {
        AccountRef: {
          value: expenseData.accountId,
        },
        TotalAmt: expenseData.amount,
        TxnDate: expenseData.date.toISOString().split("T")[0],
        PaymentType: "Cash",
        Line: [
          {
            Amount: expenseData.amount,
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

      qbo.createPurchase(
        expense,
        (err: QuickBooksError | null, result: any) => {
          if (err) {
            reject(err);
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error("No result received"));
          }
        }
      );
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

  private static mapAccountType(
    qbAccountType: string
  ):
    | "CHECKING"
    | "SAVINGS"
    | "CREDIT_CARD"
    | "ACCOUNTS_PAYABLE"
    | "ACCOUNTS_RECEIVABLE"
    | "EXPENSE"
    | "REVENUE"
    | "ASSET"
    | "LIABILITY"
    | "EQUITY" {
    const mapping: Record<
      string,
      | "CHECKING"
      | "SAVINGS"
      | "CREDIT_CARD"
      | "ACCOUNTS_PAYABLE"
      | "ACCOUNTS_RECEIVABLE"
      | "EXPENSE"
      | "REVENUE"
      | "ASSET"
      | "LIABILITY"
      | "EQUITY"
    > = {
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

  private static formatAddress(
    address: QuickBooksAddress | undefined
  ): string | null {
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
        syncErrors: errorMessage ? { error: errorMessage } : undefined,
        updatedAt: new Date(),
      },
    });
  }
}
