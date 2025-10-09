declare module "node-quickbooks" {
  export interface QuickBooksConfig {
    consumerKey: string;
    consumerSecret: string;
    token: string;
    tokenSecret: string;
    sandbox: boolean;
    realmId: string;
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

    findAccounts(callback: (err: any, accounts: any) => void): void;
    findVendors(callback: (err: any, vendors: any) => void): void;
    createAccount(
      account: any,
      callback: (err: any, account: any) => void
    ): void;
    createVendor(vendor: any, callback: (err: any, vendor: any) => void): void;
    findItems(callback: (err: any, items: any) => void): void;
    createItem(item: any, callback: (err: any, item: any) => void): void;
    findCustomers(callback: (err: any, customers: any) => void): void;
    createCustomer(
      customer: any,
      callback: (err: any, customer: any) => void
    ): void;
    createPurchase(
      purchase: any,
      callback: (err: any, purchase: any) => void
    ): void;
    requestToken(code: string, callback: (err: any, tokens: any) => void): void;
    refreshAccessToken(
      refreshToken: string,
      callback: (err: any, tokens: any) => void
    ): void;
    getCompanyInfo(
      realmId: string,
      callback: (err: any, companyInfo: any) => void
    ): void;
  }
}
