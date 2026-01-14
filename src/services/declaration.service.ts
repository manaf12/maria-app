/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosClient from "../api/axiosClient";
import type { StageId, ViewRequestData } from "../pages/ViewRequestPage";

export async function fetchDeclaration(declarationId: string) {
  const url = `/orders/${declarationId}`;
  const res = await axiosClient.get(url);
  const payload: any = res.data;
  const mapped: ViewRequestData = {
    id: payload.id,
     files: payload.files ?? [],
     steps: payload.steps ?? [],
    taxYear: payload.questionnaireSnapshot?.taxYear ?? new Date().getFullYear(),
    clientName: `${payload.clientProfile?.firstName ?? ""} ${payload.clientProfile?.lastName ?? ""}`.trim() || "—",
    productName: payload.offer ?? "—",
    currentStage: (payload.currentStep ?? payload.currentStage ?? 1) as StageId,
status: payload.status,
    summary: {
      maritalStatus: payload.questionnaireSnapshot?.maritalStatus ?? "—",
      childrenCount: payload.questionnaireSnapshot?.childrenCount ?? 0,
      incomes: String(payload.questionnaireSnapshot?.incomeSources ?? payload.questionnaireSnapshot?.incomes ?? "—"),
      properties: String(payload.questionnaireSnapshot?.properties ?? "—"),
      offerName: payload.questionnaireSnapshot?.offer ?? payload.offer ?? "—",
  offerPrice: Number(payload.pricing?.finalPrice ?? 0),
      taxYear: payload.questionnaireSnapshot?.taxYear ?? new Date().getFullYear(),
    },

    step1: {
      documents:
        (payload.requiredDocuments?.map((d: any) => ({
          id: d.id,
          label: d.label,
          mandatory: !!d.mandatory,
          status: d.uploaded ? "uploaded" : "todo",
        }))) ?? [],
    },

    step2: {
      questions:
        (payload.additionalQuestions?.map((q: any) => ({
          id: q.id,
          label: q.label,
          answer: q.answer ?? undefined,
        }))) ?? [],
    },

    step5: {
      date: payload.submission?.date ?? payload.submittedAt ?? undefined,
      method: payload.submission?.method ?? undefined,
    },

    invoice: {
      offerName: payload.offer ?? payload.questionnaireSnapshot?.offer ?? "—",
      totalAmount:
  payload.invoice?.totalAmount ??
  `${Number(payload.pricing?.finalPrice ?? 0)} CHF`,
      invoiceUrl: payload.invoice?.url ?? payload.invoiceUrl ?? "",
    },
  };

  return mapped;
}
