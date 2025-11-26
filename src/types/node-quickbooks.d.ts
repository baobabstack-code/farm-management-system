declare module "node-quickbooks" {
  export interface QuickBooksConfig {
    consumerKey: string;
    consumerSecret: string;
    token: string;
    tokenSecret: string;
    sandbox: boolean;
    realmId: string;
  }

  export interface QuickBooksAccount {
    Id?: string;
    Name?: string;
    AccountType?: string;
    AccountSubType?: string;
    Classification?: string;
    CurrencyRef?: { value: string };
    CurrentBalance?: number;
    Active?: boolean;
  }

  export interface QuickBooksVendor {
    Id?: string;
    DisplayName?: string;
    CompanyName?: string;
    GivenName?: string;
    FamilyName?: string;
    Active?: boolean;
    PrimaryEmailAddr?: { Address?: string };
    PrimaryPhone?: { FreeFormNumber?: string };
  }

  export interface QuickBooksItem {
    Id?: string;
    Name?: string;
    Type?: string;
    Active?: boolean;
    FullyQualifiedName?: string;
    IncomeAccountRef?: { value?: string; name?: string };
    ExpenseAccountRef?: { value?: string; name?: string };
    UnitPrice?: number;
    PurchaseCost?: number;
    QtyOnHand?: number;
  }

  export interface QuickBooksCustomer {
    Id?: string;
    DisplayName?: string;
    CompanyName?: string;
    GivenName?: string;
    FamilyName?: string;
    Active?: boolean;
    PrimaryEmailAddr?: { Address?: string };
    PrimaryPhone?: { FreeFormNumber?: string };
    BillAddr?: {
      Line1?: string;
      City?: string;
      Country?: string;
      PostalCode?: string;
    };
  }

  export interface QuickBooksPurchase {
    Id?: string;
    PaymentType?: string;
    TotalAmt?: number;
    TxnDate?: string;
    Line?: Array<{
      Id?: string;
      Amount?: number;
      DetailType?: string;
      ItemBasedExpenseLineDetail?: {
        ItemRef?: { value?: string; name?: string };
        Qty?: number;
        UnitPrice?: number;
      };
    }>;
    VendorRef?: { value?: string; name?: string };
    AccountRef?: { value?: string; name?: string };
  }

  export interface QuickBooksTokens {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresIn?: number;
    refreshTokenExpiresIn?: number;
  }

  export interface QuickBooksCompanyInfo {
    CompanyName?: string;
    LegalName?: string;
    CompanyAddr?: {
      Line1?: string;
      City?: string;
      Country?: string;
      PostalCode?: string;
    };
    PrimaryPhone?: { FreeFormNumber?: string };
    Email?: { Address?: string };
    FiscalYearStartMonth?: string;
    SupportedLanguages?: string;
  }

  export interface QuickBooksError {
    fault?: {
      error?: Array<{
        message?: string;
        detail?: string;
        code?: string;
      }>;
    };
  }

  export default class QuickBooks {
    constructor(
      consumerKey: string,
      consumerSecret: string,
      token: string,
      tokenSecret: string,
      sandbox: boolean,
      debug?: boolean,
      minor_version?: number,
      realmId?: string
    );

    findAccounts(
      callback: (
        err: QuickBooksError | null,
        accounts: { QueryResponse?: { Account?: QuickBooksAccount[] } }
      ) => void
    ): void;
    findVendors(
      callback: (
        err: QuickBooksError | null,
        vendors: { QueryResponse?: { Vendor?: QuickBooksVendor[] } }
      ) => void
    ): void;
    createAccount(
      account: QuickBooksAccount,
      callback: (
        err: QuickBooksError | null,
        account: { Account?: QuickBooksAccount }
      ) => void
    ): void;
    createVendor(
      vendor: QuickBooksVendor,
      callback: (
        err: QuickBooksError | null,
        vendor: { Vendor?: QuickBooksVendor }
      ) => void
    ): void;
    findItems(
      callback: (
        err: QuickBooksError | null,
        items: { QueryResponse?: { Item?: QuickBooksItem[] } }
      ) => void
    ): void;
    createItem(
      item: QuickBooksItem,
      callback: (
        err: QuickBooksError | null,
        item: { Item?: QuickBooksItem }
      ) => void
    ): void;
    findCustomers(
      callback: (
        err: QuickBooksError | null,
        customers: { QueryResponse?: { Customer?: QuickBooksCustomer[] } }
      ) => void
    ): void;
    createCustomer(
      customer: QuickBooksCustomer,
      callback: (
        err: QuickBooksError | null,
        customer: { Customer?: QuickBooksCustomer }
      ) => void
    ): void;
    createPurchase(
      purchase: QuickBooksPurchase,
      callback: (
        err: QuickBooksError | null,
        purchase: { Purchase?: QuickBooksPurchase }
      ) => void
    ): void;
    requestToken(
      code: string,
      callback: (err: QuickBooksError | null, tokens: QuickBooksTokens) => void
    ): void;
    refreshAccessToken(
      refreshToken: string,
      callback: (err: QuickBooksError | null, tokens: QuickBooksTokens) => void
    ): void;
    getCompanyInfo(
      realmId: string,
      callback: (
        err: QuickBooksError | null,
        companyInfo: { CompanyInfo?: QuickBooksCompanyInfo[] }
      ) => void
    ): void;
  }
}
