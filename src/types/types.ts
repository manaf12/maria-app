/* eslint-disable @typescript-eslint/no-explicit-any */
/* src/types/types.ts */
export const StepStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELED: "CANCELED",
} as const;

export type StepStatus = (typeof StepStatus)[keyof typeof StepStatus];

export type StepMeta = {
  files?: string[]; // قائمة معرفات الملفات أو أي بيانات إضافية
  [k: string]: any;
};

export type Step = {
  id: string;           // مثال: 'documentsUploaded' أو 'documentsPreparation'
  order: number;        // 1..N
  nameKey?: string;     // مفتاح i18n مثل 'steps.documentsPreparation'
  name?: string;        // اسم مباشر (اختياري)
  status: StepStatus;
  updatedAt?: string;
  updatedBy?: string;
  meta?: StepMeta;
  [k: string]: any;
};

/* بقية الأنواع كما لديك لكن مع تعديل steps إلى Step[] */
export type QuestionnaireSnapshot = {
  offer?: string;
  taxYear?: number;
  properties?: number;
  newProperties?: number;
  childrenCount?: number;
  incomeSources?: number;
  maritalStatus?: 'single' | 'married' | string;
  wealthStatements?: number;
  billingFirstName?: string;
  billingLastName?: string;
  billingStreet?: string;
  billingPostalCode?: string;
  billingCity?: string;
  numKids?: number;
  isMarried?: boolean;
  numIncomeSources?: number;
  [key: string]: any;
};

export type Pricing = {
  id: string;
  basePrice?: number;
  surcharges?: Record<string, number>;
  finalPrice?: number;
  status?: string;
  calculatedAt?: string;
  [k: string]: any;
};

export type FileMeta = {
  id: string;
  originalName?: string;
  storagePath?: string;
  mimetype?: string;
  size?: string | number;
  uploadedAt?: string;
};

export type ClientUser = {
  id: string;
  email?: string;
  isEmailVerified?: boolean;
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
  [k: string]: any;
};

export type ClientProfile = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  canton?: string | null;
  streetAddress?: string | null;
  postalCode?: string | null;
  city?: string | null;
  languagePreference?: string;
  user?: ClientUser;
  [k: string]: any;
};

export type DeclarationStatus =
  | 'PENDING_PAYMENT'
  | 'IN_REVIEW'
  | 'COMPLETED'
  | 'DRAFT'
  | 'CANCELED'
  | string;

export type TaxDeclarationFull = {
  id: string;
  clientProfile?: ClientProfile;
  offer?: string | null;
  steps?: Step[];                     // <-- ملاحظة: أصبح مصفوفة
  currentStep?: number;               // رقم الخطوة الحالية (1..N) — اختياري
  status?: DeclarationStatus;
  questionnaireSnapshot?: QuestionnaireSnapshot;
  pricing?: Pricing | null;
  files?: FileMeta[];
  createdAt?: string;
  updatedAt?: string;
  [k: string]: any;
};
