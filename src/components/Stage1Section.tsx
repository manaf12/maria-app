import React, { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";
import DocumentUploadItem, { type FileEntity } from "./DocumentUploadItem";
import { Step1Questions, type Step1Question } from "./Step1Questions";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

type Step = { id: string; meta?: any; status?: string };

type Stage1SectionProps = {
  declaration: {
    id: string;
    files?: FileEntity[];
    steps?: Step[];
    questionnaireSnapshot?: any;
  };
  isCurrent: boolean;
  onUploadDocuments?: () => void;
  lockEditing?: boolean;
};

const REQUIRED_DOCUMENT_TYPES = [
  "previous_tax_return",
  "salary_certificate",
  "bank_statement",
  "pillar_3_certificate",
  "medical_expense_receipt",
  "taxero_invoice_payment_proof",
];

const OPTIONAL_DOCUMENT_TYPES = ["others"];

export default function Stage1Section({
  declaration,
  isCurrent,
  onUploadDocuments,
  lockEditing = false,
}: Stage1SectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [confirming, setConfirming] = React.useState(false);
  const [step1Questions, setStep1Questions] = React.useState<Step1Question[]>(
    []
  );
  const [questionsLoading, setQuestionsLoading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [isOpen, setIsOpen] = React.useState(true);

  const [confirmError, setConfirmError] = React.useState<{
    missingDocs?: string[];
    missingQuestions?: string[];
    message?: string;
  } | null>(null);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      setQuestionsLoading(true);
      try {
        const res = await axiosClient.get<{ questions: Step1Question[] }>(
          `/files/${declaration.id}/step1/questions`
        );
        if (!mounted) return;
        setStep1Questions(res.data.questions ?? []);
      } catch (e) {
        console.error("Failed to load Step 1 questions", e);
        if (!mounted) return;
        setStep1Questions([]);
      } finally {
        if (mounted) setQuestionsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [declaration.id]);

  const step1 = useMemo(() => {
    return (declaration.steps ?? []).find(
      (s) => s.id === "documentsPreparation"
    );
  }, [declaration.steps]);

  const step1Status = (step1 as any)?.status ?? "PENDING";
  const isDone = step1Status === "DONE" || step1Status === "COMPLETED";

  React.useEffect(() => {
    if (isDone) setIsOpen(false);
  }, [isDone]);

  const invalidateDeclaration = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["declaration", declaration.id],
    });
  };

  const confirmStep1 = async () => {
    setConfirming(true);
    setConfirmError(null);

    try {
      await axiosClient.post(
        `/orders/${declaration.id}/steps/documentsPreparation/confirm`
      );
      await invalidateDeclaration();
    } catch (e: any) {
      const data = e?.response?.data;
      setConfirmError({
        message: data?.message ?? "Could not confirm Step 1",
        missingDocs: data?.missingDocs ?? [],
        missingQuestions: data?.missingQuestions ?? [],
      });
    } finally {
      setConfirming(false);
    }
  };

  const filesByType = useMemo(() => {
    return (declaration.files ?? []).reduce((acc, file) => {
      (acc[file.documentType] ??= []).push(file);
      return acc;
    }, {} as Record<string, FileEntity[]>);
  }, [declaration.files]);

  const declaredMissingMap = useMemo(() => {
    const documentsStep = (declaration.steps ?? []).find(
      (s) => s.id === "documentsPreparation"
    );
    const missingMeta = documentsStep?.meta?.missingDocs ?? [];
    const map: Record<string, boolean> = {};

    (missingMeta as any[]).forEach((m) => {
      if (m?.documentType) map[m.documentType] = true;
    });

    return map;
  }, [declaration.steps]);

  const initialStep1Answers =
    declaration.questionnaireSnapshot?.step1Answers ?? {};

  const uploadOne = async (docType: string, file: File) => {
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("documentType", docType);

      await axiosClient.post(`/files/${declaration.id}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await invalidateDeclaration();
      onUploadDocuments?.();
    } catch (e: any) {
      setUploadError(e?.response?.data?.message ?? t("step1.uploadFailed"));
    }
  };

  const uploadMultiple = async (docType: string, files: File[]) => {
    setUploadError(null);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      form.append("documentType", docType);

      await axiosClient.post(`/files/${declaration.id}/upload-multiple`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await invalidateDeclaration();
      onUploadDocuments?.();
    } catch (e: any) {
      setUploadError(e?.response?.data?.message ?? t("step1.uploadFailed"));
    }
  };

  const markMissing = async (docType: string, reason?: string) => {
    await axiosClient.post(
      `/files/${declaration.id}/documents/${docType}/missing`,
      { reason }
    );
    await invalidateDeclaration();
  };

  const undoMissing = async (docType: string) => {
    await axiosClient.delete(
      `/files/${declaration.id}/documents/${docType}/missing`
    );
    await invalidateDeclaration();
  };

  const requiredProgress = useMemo(() => {
    let done = 0;

    REQUIRED_DOCUMENT_TYPES.forEach((docType) => {
      const hasFiles = (filesByType[docType] ?? []).length > 0;
      const isMissing = !!declaredMissingMap[docType];
      if (hasFiles || isMissing) done += 1;
    });

    return { done, total: REQUIRED_DOCUMENT_TYPES.length };
  }, [filesByType, declaredMissingMap]);

  const allDocTypesForUI = [
    ...REQUIRED_DOCUMENT_TYPES,
    ...OPTIONAL_DOCUMENT_TYPES,
  ];

  type StatusBadgeProps = {
    status?: string;
    t: TFunction;
  };

  function StatusBadge({ status, t }: StatusBadgeProps) {
    if (status !== "done") return null;

    return (
      <span className="stage1-status-badge">
        <span className="stage1-status-badge-icon">✓</span>
        {t(`stepStatus.${status}`, { defaultValue: status })}
      </span>
    );
  }

  return (
    <div className="stage1-container">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="stage1-toggle"
      >
        <div className="stage1-header">
          <div className="stage1-header-content">
            <h3 className="stage1-title">{t("step1.title")}</h3>
            <p className="stage1-subtitle">{t("step1.subtitle")}</p>

            <div className="stage1-meta-row">
              <div className="stage1-meta-item">
                <StatusBadge status={step1Status} t={t} />
              </div>

              <div className="stage1-meta-item">
                <span className="stage1-progress-text">
                  {t("step1.progressLabel")}{" "}
                  <span className="stage1-progress-value">
                    {requiredProgress.done}/{requiredProgress.total}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <span
            aria-hidden="true"
            className={`stage1-chevron ${isOpen ? "is-open" : ""}`}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 12l5-5 5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="stage1-body">
          {lockEditing && (
            <div className="stage1-lock-message">{t("step1.lockMessage")}</div>
          )}

          <div className="stage1-card">
            <h4 className="stage1-card-title">
              {t("step1.additionalQuestions")}
            </h4>

            {questionsLoading ? (
              <div className="stage1-loading-text">
                {t("step1.loadingQuestions")}
              </div>
            ) : (
              <Step1Questions
                declarationId={declaration.id}
                questions={step1Questions}
                initialAnswers={initialStep1Answers}
                onSaved={invalidateDeclaration}
                disabled={lockEditing}
              />
            )}
          </div>

          <div className="documents-grid">
            {allDocTypesForUI.map((docType) => {
              const uploadedFiles = filesByType[docType] ?? [];
              const isMissing = !!declaredMissingMap[docType];
              const isOthers = docType === "others";
              const canEditDocType = !lockEditing && (isCurrent || isOthers);

              return (
                <div key={docType} className="document-card">
                  <div className="document-card-header">
                    <div className="document-card-info">
                      <h4 className="document-card-title">
                        {t(`documents.${docType}.title`)}
                      </h4>
                      <div className="document-card-type">
                        {isOthers ? t("common.optional") : t("common.required")}
                      </div>
                    </div>

                    <div className="document-card-badges">
                      {uploadedFiles.length > 0 && (
                        <span className="doc-badge doc-badge-success">
                          {t("step1.uploadedCount", {
                            count: uploadedFiles.length,
                          })}
                        </span>
                      )}

                      {isMissing && (
                        <span className="doc-badge doc-badge-warning">
                          {t("step1.notAvailable")}
                        </span>
                      )}

                      {!isMissing &&
                        uploadedFiles.length === 0 &&
                        !isOthers && (
                          <span className="doc-badge doc-badge-neutral">
                            {t("step1.pending")}
                          </span>
                        )}
                    </div>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <ul className="uploaded-files-list">
                      {uploadedFiles.map((file) => (
                        <li key={file.id} className="uploaded-file-item">
                          <div className="uploaded-file-left">
                            <span
                              aria-hidden="true"
                              className="uploaded-file-icon"
                            >
                              PDF
                            </span>

                            <span className="uploaded-file-name">
                              {file.originalName}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="delete-btn"
                            disabled={lockEditing}
                            onClick={async () => {
                              if (lockEditing) return;

                              const fileName =
                                file.originalName ?? t("common.thisFile");
                              const msg = String(
                                t("step1.confirmDeleteFile", { fileName })
                              );

                              if (!confirm(msg)) return;

                              await axiosClient.delete(`/files/${file.id}`);
                              await queryClient.invalidateQueries({
                                queryKey: ["declaration", declaration.id],
                              });
                            }}
                          >
                            {t("common.delete")}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {uploadError && (
                    <div className="stage1-upload-error">{uploadError}</div>
                  )}

                  {canEditDocType ? (
                    <DocumentUploadItem
                      declarationId={declaration.id}
                      documentType={docType}
                      uploadedFiles={uploadedFiles}
                      isMissing={isMissing}
                      allowMultiple={true}
                      disableMissing={isOthers}
                      onUpload={(file) => uploadOne(docType, file)}
                      onUploadMultiple={(files) =>
                        uploadMultiple(docType, files)
                      }
                      onMarkMissing={(reason) => markMissing(docType, reason)}
                      onUndoMissing={() => undoMissing(docType)}
                    />
                  ) : (
                    <p className="stage1-not-editable">
                      {t("step1.notEditable")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className={`stage1-confirm-card ${isDone ? "is-done" : ""}`}>
            <div className="stage1-confirm-row">
              <div className="stage1-confirm-info">
                <div className="stage1-confirm-label">
                  {t("step1.stepStatusLabel")}
                </div>

                <div className="stage1-confirm-status">
                  <StatusBadge status={step1Status} t={t} />

                  {!isDone &&
                    String(
                      t(`stepStatus.${step1Status}`, {
                        defaultValue: step1Status,
                      })
                    )}
                </div>

                {isDone && (
                  <div className="stage1-confirm-note">
                    {t("step1.notEditable")}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="confirm-step-btn"
                disabled={confirming || lockEditing || isDone}
                onClick={() => {
                  if (lockEditing || isDone) return;
                  if (!confirm(String(t("step1.confirmStep1Prompt")))) return;
                  confirmStep1();
                }}
              >
                {isDone
                  ? String(
                      t(`stepStatus.${step1Status}`, {
                        defaultValue: step1Status,
                      })
                    )
                  : confirming
                  ? t("step1.confirming")
                  : t("step1.confirmStep1")}
              </button>
            </div>

            {confirmError && (
              <div className="stage1-error-box">
                <div className="stage1-error-title">
                  {t("step1.notReady")}
                </div>

                {import.meta.env.MODE === "development" &&
                  confirmError.message && (
                    <div className="stage1-error-dev-message">
                      {String(confirmError.message ?? "")}
                    </div>
                  )}

                {(confirmError.missingDocs?.length ?? 0) > 0 && (
                  <div className="stage1-error-section">
                    <div className="stage1-error-section-title">
                      {t("step1.missingDocuments")}
                    </div>
                    <ul className="stage1-error-list">
                      {confirmError.missingDocs!.map((d) => (
                        <li key={d}>{t(`documents.${d}.title`)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(confirmError.missingQuestions?.length ?? 0) > 0 && (
                  <div className="stage1-error-section">
                    <div className="stage1-error-section-title">
                      {t("step1.missingQuestions")}
                    </div>
                    <ul className="stage1-error-list">
                      {confirmError.missingQuestions!.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}