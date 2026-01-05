import axiosClient from "../api/axiosClient";

export type Locale = "en" | "fr" | "de";

export type AdminDeclaration = {
  id: string;
  status: string;
  offer: string | null;
  currentStep: number;

  createdAt: string;
  updatedAt: string;

  assignedAdminId: string | null;
  assignedAt: string | null;

  clientProfile?: {
    firstName: string;
    lastName: string;
    languagePreference?: Locale;
    user?: { email: string; id: string };
  };

  questionnaireSnapshot?: {
    taxYear?: number;
    offer?: string;
  };
};

export type DeclarationsListResponse = { items: AdminDeclaration[] };

export type AssignDeclarationsBody = {
  declarationIds: string[];
  adminId: string;
  note?: string;
};

export type AssignDeclarationsResponse = {
  updatedCount: number;
  updated: AdminDeclaration[];
};

export async function fetchAdminDeclarations(): Promise<DeclarationsListResponse> {
  const res = await axiosClient.get<DeclarationsListResponse>("/admin/declarations");
  return res.data;
}

export async function postAssignDeclarations(
  body: AssignDeclarationsBody
): Promise<AssignDeclarationsResponse> {
  const res = await axiosClient.post<AssignDeclarationsResponse>(
    "/admin/declarations/assign",
    body
  );
  return res.data;
}
