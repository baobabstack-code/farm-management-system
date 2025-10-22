/**
 * Type definitions for Paynow Zimbabwe SDK
 */

declare module "paynow" {
  export interface PaynowResponse {
    success: boolean;
    pollUrl?: string;
    redirectUrl?: string;
    instructions?: string;
    error?: string;
    hash?: string;
  }

  export interface PaymentStatus {
    paid: boolean;
    amount: number;
    reference: string;
    paynowReference: string;
    status: string;
    hash: string;
  }

  export interface Payment {
    add(name: string, amount: number): void;
  }

  export class Paynow {
    constructor(
      integrationId: string,
      integrationKey: string,
      resultUrl: string,
      returnUrl: string
    );

    createPayment(reference: string, email: string): Payment;
    send(payment: Payment): Promise<PaynowResponse>;
    pollTransaction(pollUrl: string): Promise<PaymentStatus>;
    hash(reference: string, amount: string, status: string): string;
  }
}
