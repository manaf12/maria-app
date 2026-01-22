/* eslint-disable @typescript-eslint/no-explicit-any */
export function isStepDone(steps: any[] | undefined, stepId: string) {
  return (steps ?? []).find((s: any) => s?.id === stepId)?.status === "DONE";
}

export function getDocumentsReviewStep(steps: any[] | undefined) {
  return (steps ?? []).find((s: any) => s?.id === "documentsReview");
}
