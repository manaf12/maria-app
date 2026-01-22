/* eslint-disable @typescript-eslint/no-explicit-any */
export type StageId = 1 | 2 | 3 | 4 | 5;
export type StageStatus = "completed" | "current" | "locked";

export type SummaryBlock = {
  maritalStatus: string;
  childrenCount: number;
  incomes: string;
  properties: string;
  offerName: string;
  offerPrice: number;
  taxYear: number;
};

export type RequiredDocument = {
  id: string;
  label: string;
  mandatory: boolean;
  status: "todo" | "uploaded";
};

export type AdditionalQuestion = {
  id: string;
  label: string;
  answer?: string;
};

export type SubmissionInfo = {
  date?: string;
  method?: string;
};

export type InvoiceBlock = {
  offerName: string;
  totalAmount: string;
  invoiceUrl: string;
};

export type FileMeta = {
  deliveredForStep?: string;
  downloadedBy?: string;
  downloadedAt?: string;
  uploaderRole?: "admin" | "user";
  uploadedBy?: string;
  [key: string]: any;
};

export type FileEntity = {
  uploadedAt: any;
  id: string;
  originalName: string;
  documentType: string;
  meta?: FileMeta;
};

export type ViewRequestData = {
  id: string;
  taxYear: number;
  clientName: string;
  productName: string;
  currentStage: StageId;
  files?: FileEntity[];
  summary: SummaryBlock;
  status: string;
  step1: { documents: RequiredDocument[] };
  step2: { questions: AdditionalQuestion[] };
  step5?: SubmissionInfo;
  steps?: any[];
  invoice: InvoiceBlock;
};

export type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  locale?: "en" | "fr" | "de";
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  roles?: string[];
};
