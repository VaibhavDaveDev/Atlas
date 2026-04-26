// Finance Module Types

export interface InvoiceCreateInput {
  invoiceType: 'SALES' | 'PURCHASE';
  customerId?: string;
  vendorId?: string;
  invoiceDate: Date;
  dueDate: Date;
  items: InvoiceItemInput[];
}

export interface InvoiceItemInput {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

export interface PaymentCreateInput {
  paymentType: 'RECEIVED' | 'PAID';
  partyId?: string;
  invoiceId?: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
}
