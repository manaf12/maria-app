/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import ViewRequestContent from "./ViewRequest/ViewRequestContent";
import type { ViewRequestData, User } from "../types/declaration.types";

export default function TestViewRequestPage() {
  const mockData: ViewRequestData = {
    id: "mock-1",
    taxYear: 2024,
    clientName: "TAG Solutions SA",
    productName: "Comfort package CHF 390.–",
    currentStage: 3,
    status: "IN_PROGRESS",
    summary: {
      maritalStatus: "Married",
      childrenCount: 2,
      incomes: "2 salaries + AVS + LPP",
      properties: "1 main residence, 1 rental apartment",
      offerName: "Comfort package",
      offerPrice: 390,
      taxYear: 2024,
    },
    step1: { documents: [] },
    step2: { questions: [] },
    step5: { date: "18.02.2025", method: "Electronic filing" },
    invoice: {
      offerName: "Comfort package – 2024",
      totalAmount: "CHF 390.–",
      invoiceUrl: "https://example.com/invoice.pdf",
    },
    files: [],
    steps: [],
  };

  const user: User | null = null;

  const [step2UserComment, setStep2UserComment] = useState("");
  const [step2AdminComment, setStep2AdminComment] = useState("");
  const [step4UserComment, setStep4UserComment] = useState("");
  const [step4AdminComment, setStep4AdminComment] = useState("");

  const [adminDraftFile, setAdminDraftFile] = useState<File | null>(null);
  const [adminFinalFile, setAdminFinalFile] = useState<File | null>(null);
  const [userSubmissionFile, setUserSubmissionFile] = useState<File | null>(null);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <ViewRequestContent
        data={mockData}
        user={user}
        isAdmin={true}
        onBackToDashboard={() => alert("Back to dashboard (mock)")}
        onUploadDocuments={() => alert("Upload docs (mock)")}

        // Stage 2
        onApproveStep2={() => alert("Approve Step2 (mock)")}
        onAddStep2Comment={async (comment) => alert("Step2 comment: " + comment)}
        step2UserComment={step2UserComment}
        setStep2UserComment={setStep2UserComment}
        step2AdminComment={step2AdminComment}
        setStep2AdminComment={setStep2AdminComment}
        isAddingStep2Comment={false}

        // Stage 3
        onCompleteStep3={() => alert("Complete Step3 (mock)")}
        onStep3DraftUpload={async () => alert("Upload draft (mock)")}
        adminDraftFile={adminDraftFile}
        setAdminDraftFile={setAdminDraftFile}
        isUploadingDraft={false}

        // Stage 4
        confirming={false}
        onConfirmReceipt={async () => alert("Confirm receipt (mock)")}
        onAddStepComment={async (comment) => alert("Step4 comment: " + comment)}
        step4UserComment={step4UserComment}
        setStep4UserComment={setStep4UserComment}
        step4AdminComment={step4AdminComment}
        setStep4AdminComment={setStep4AdminComment}
        isAddingStepComment={false}

        // Stage 5
        onCompleteStep5={() => alert("Complete Step5 (mock)")}
        userSubmissionFile={userSubmissionFile}
        setUserSubmissionFile={setUserSubmissionFile}
        isUploadingUserSubmission={false}
        onUserUploadSubmission={async () => alert("User upload submission (mock)")}
        onAdminUploadFinal={async () => alert("Admin upload final (mock)")}
        adminFinalFile={adminFinalFile}
        setAdminFinalFile={setAdminFinalFile}
        isUploadingFinal={false}

        // Shared
        onDownloadFile={(fileId) => alert("Download file (mock): " + fileId)}
      />
    </div>
  );
}
