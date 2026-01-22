/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Stage1Section from "../../components/Stage1Section";
import FilesSummaryModal from "../../components/files/FilesSummaryModal";

import type {
  StageId,
  StageStatus,
  User,
  ViewRequestData,
} from "../../types/declaration.types";

import Stage2DocumentsReview from "./stages/Stage2DocumentsReview";
import Stage3Preparation from "./stages/Stage3Preparation";
import Stage4Validation from "./stages/Stage4Validation";
import Stage5Submission from "./stages/Stage5Submission";
import { getDocumentsReviewStep } from "./stageHelpers";

export type ViewRequestContentProps = {
  data: ViewRequestData;
  user: User | null;
  isAdmin: boolean;

  // navigation
  onBackToDashboard: () => void;

  // Stage 1
  onUploadDocuments?: () => void;

  // Stage 2
  onApproveStep2: (note?: string) => void;
  onAddStep2Comment: (comment: string) => Promise<void>;
  step2UserComment: string;
  setStep2UserComment: (value: string) => void;
  step2AdminComment: string;
  setStep2AdminComment: (value: string) => void;
  isAddingStep2Comment: boolean;

  // Stage 3
  onCompleteStep3: () => void;
  onStep3DraftUpload: () => Promise<void>;
  adminDraftFile: File | null;
  setAdminDraftFile: (f: File | null) => void;
  isUploadingDraft: boolean;

  // Stage 4
  confirming: boolean;
  onConfirmReceipt: (fileId?: string) => Promise<void>;
  onAddStepComment: (comment: string) => Promise<void>;
  step4UserComment: string;
  setStep4UserComment: (value: string) => void;
  step4AdminComment: string;
  setStep4AdminComment: (value: string) => void;
  isAddingStepComment: boolean;

  // Stage 5
  onCompleteStep5: () => void;

  userSubmissionFile: File | null;
  setUserSubmissionFile: (f: File | null) => void;
  isUploadingUserSubmission: boolean;
  onUserUploadSubmission: () => Promise<void>;

  adminFinalFile: File | null;
  setAdminFinalFile: (f: File | null) => void;
  isUploadingFinal: boolean;
  onAdminUploadFinal: () => Promise<void>;

  // shared
  onDownloadFile: (fileId: string) => void;
};


export default function ViewRequestContent(props: ViewRequestContentProps) {
  const {
    data,
    user,
    isAdmin,
    onBackToDashboard,
    onUploadDocuments,

    // step2
    onApproveStep2,
    onAddStep2Comment,
    step2UserComment,
    setStep2UserComment,
    step2AdminComment,
    setStep2AdminComment,
    isAddingStep2Comment,

    // step3
    onCompleteStep3,
    onStep3DraftUpload,
    adminDraftFile,
    setAdminDraftFile,
    isUploadingDraft,

    // step4
    confirming,
    onConfirmReceipt,
    onAddStepComment,
    step4UserComment,
    setStep4UserComment,
    step4AdminComment,
    setStep4AdminComment,
    isAddingStepComment,

    // step5
    onCompleteStep5,
    userSubmissionFile,
    setUserSubmissionFile,
    isUploadingUserSubmission,
    onUserUploadSubmission,
    onAdminUploadFinal,
        adminFinalFile,
    setAdminFinalFile,
    isUploadingFinal,

    // shared
    onDownloadFile,
  } = props;

  const { t } = useTranslation();
  const [adminNote] = useState("");
  const [isFilesModalOpen, setFilesModalOpen] = useState(false);

  const { currentStage, status: declarationStatus, steps } = data;
  const isStep5Done = (steps ?? []).find((s: any) => s.id === "submission")?.status === "DONE";

  const stages: { id: StageId; titleKey: string; status: StageStatus }[] = [
    {
      id: 1,
      titleKey: "view.sections.initialUpload",
      status: currentStage > 1 ? "completed" : currentStage === 1 ? "current" : "locked",
    },
    {
      id: 2,
      titleKey: "view.sections.reviewDocuments",
      status: currentStage > 2 ? "completed" : currentStage === 2 ? "current" : "locked",
    },
    {
      id: 3,
      titleKey: "view.sections.prepareDeclaration",
      status: currentStage > 3 ? "completed" : currentStage === 3 ? "current" : "locked",
    },
    {
      id: 4,
      titleKey: "view.sections.validation",
      status: currentStage > 4 ? "completed" : currentStage === 4 ? "current" : "locked",
    },
    {
      id: 5,
      titleKey: "view.sections.submission",
      status:
        declarationStatus === "COMPLETED" || isStep5Done
          ? "completed"
          : currentStage === 5
          ? "current"
          : "locked",
    },
  ];

  const documentsReviewStep = getDocumentsReviewStep(data.steps);
  const isStep2Approved = documentsReviewStep?.status === "DONE";

  return (
    <div className="view-page">
      <div className="view-top-bar">
        <button className="btn-secondary" onClick={onBackToDashboard}>
          {t("view.back")}
        </button>
      </div>

      <h1 className="view-title">{t("view.title")}</h1>

      <section className="view-block">
        <h2>{t("view.formSummary")}</h2>

        <dl className="summary-grid">
          <div>
            <dt>{t("view.summary.maritalStatus")}</dt>
            <dd>{data.summary.maritalStatus}</dd>
          </div>
          <div>
            <dt>{t("view.summary.childrenCount")}</dt>
            <dd>{data.summary.childrenCount}</dd>
          </div>
          <div>
            <dt>{t("view.summary.incomes")}</dt>
            <dd>{data.summary.incomes}</dd>
          </div>
          <div>
            <dt>{t("view.summary.properties")}</dt>
            <dd>{data.summary.properties}</dd>
          </div>
          <div>
            <dt>{t("view.summary.offer")}</dt>
            <dd>{data.summary.offerName}</dd>
          </div>
          <div>
            <dt>{t("view.summary.price")}</dt>
            <dd>CHF {data.summary.offerPrice}.–</dd>
          </div>
          <div>
            <dt>{t("view.summary.taxYear")}</dt>
            <dd>{data.summary.taxYear}</dd>
          </div>
        </dl>
      </section>

      <div className="view-top-bar">
        <button className="btn-secondary" onClick={() => setFilesModalOpen(true)}>
          {t("view.filesSummary.open", "Show files summary")}
        </button>
        <button className="btn-secondary" onClick={onBackToDashboard}>
          {t("view.back")}
        </button>
      </div>

      <FilesSummaryModal
        files={data.files ?? []}
        onDownloadFile={onDownloadFile}
        isOpen={isFilesModalOpen}
        onClose={() => setFilesModalOpen(false)}
      />

      <section className="view-stages">
        {stages.map((stage) => {
          const isLocked = stage.status === "locked";
          const isCurrent = stage.status === "current";
          const isCompleted = stage.status === "completed";

          return (
            <details
              key={stage.id}
              className={
                "view-section" +
                (isLocked ? " is-locked" : "") +
                (isCurrent ? " is-current" : "") +
                (isCompleted ? " is-completed" : "")
              }
              open={isCurrent || stage.id === 1}
              onClick={(e) => {
                if (isLocked) e.preventDefault();
              }}
            >
              <summary>
                <div className="view-section-title-row">
                  <span>{t(stage.titleKey)}</span>
                  <span className="view-section-status">
                    {isLocked && t("view.status.locked")}
                    {isCurrent && t("view.status.current")}
                    {isCompleted && t("view.status.completed")}
                  </span>
                </div>
              </summary>

              <div className="view-section-content">
                {stage.id === 1 && (
                  <Stage1Section
                    declaration={data}
                    isCurrent={!(isStep2Approved && !isAdmin)}
                    onUploadDocuments={onUploadDocuments}
                    lockEditing={isStep2Approved && !isAdmin}
                  />
                )}

                {stage.id === 2 && (
                  <Stage2DocumentsReview
                    data={data}
                    isAdmin={isAdmin}
                    isCurrent={isCurrent}
                    isCompleted={isCompleted}
                    t={t}
                    adminNote={adminNote}
                    step2UserComment={step2UserComment}
                    setStep2UserComment={setStep2UserComment}
                    step2AdminComment={step2AdminComment}
                    setStep2AdminComment={setStep2AdminComment}
                    isAddingStep2Comment={isAddingStep2Comment}
                    user={user}
                    onDownloadFile={onDownloadFile}
                    onApproveStep2={onApproveStep2}
                    onAddStep2Comment={onAddStep2Comment}
                  />
                )}

                {stage.id === 3 && (
                  <Stage3Preparation
                    data={data}
                    isAdmin={isAdmin}
                    isCurrent={isCurrent}
                    t={t}
                    adminDraftFile={adminDraftFile}
                    setAdminDraftFile={setAdminDraftFile}
                    isUploadingDraft={isUploadingDraft}
                    onUploadDraft={onStep3DraftUpload}
                    onCompleteStep3={onCompleteStep3}
                  />
                )}

                {stage.id === 4 && (
                  <Stage4Validation
                    data={data}
                    isAdmin={isAdmin}
                    isCurrent={isCurrent}
                    t={t}
                    user={user}
                    confirming={confirming}
                    isAddingStepComment={isAddingStepComment}
                    step4UserComment={step4UserComment}
                    setStep4UserComment={setStep4UserComment}
                    step4AdminComment={step4AdminComment}
                    setStep4AdminComment={setStep4AdminComment}
                    onDownloadFile={onDownloadFile}
                    onConfirmReceipt={onConfirmReceipt}
                    onAddStepComment={onAddStepComment}
                  />
                )}

                {stage.id === 5 && (
                  <Stage5Submission
  data={data}
  isAdmin={isAdmin}
  isCurrent={isCurrent}
  isCompleted={isCompleted}
  t={t}
  adminFinalFile={adminFinalFile}
  setAdminFinalFile={setAdminFinalFile}
  isUploadingFinal={isUploadingFinal}
  userSubmissionFile={userSubmissionFile}
  setUserSubmissionFile={setUserSubmissionFile}
  isUploadingUserSubmission={isUploadingUserSubmission}
  onDownloadFile={onDownloadFile}
  onAdminUploadFinal={onAdminUploadFinal}
  onUserUploadSubmission={onUserUploadSubmission}
  onCompleteStep5={onCompleteStep5}
/>
                )}
              </div>
            </details>
          );
        })}
      </section>

      <div style={{ marginTop: 24 }}>
        <button className="btn-secondary" onClick={onBackToDashboard}>
          {t("view.back")}
        </button>
      </div>
    </div>
  );
}
