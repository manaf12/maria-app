import type { TFunction } from "i18next";
import type { User, ViewRequestData } from "../../../types/declaration.types";
import { DownloadIcon } from "../../../components/Icons";
import React from "react";
import axiosClient from "../../../api/axiosClient";
import { useTranslation } from "react-i18next";
import type { Step1Question } from "../../../components/Step1Questions";
import { DEFAULT_STEP1_QUESTIONS } from "../../../components/step1-questions.constant";

type Props = {
  data: ViewRequestData;
  isAdmin: boolean;
  isCurrent: boolean;
  isCompleted: boolean;
  t: TFunction;
  adminNote: string;
  step2UserComment: string;
  setStep2UserComment: (v: string) => void;
  step2AdminComment: string;
  setStep2AdminComment: (v: string) => void;
  isAddingStep2Comment: boolean;
  user: User | null;
  onDownloadFile: (fileId: string) => void | Promise<void>;
  onApproveStep2: (note?: string) => void;
  onAddStep2Comment: (comment: string) => Promise<void>;
};

const DOCUMENT_TRANSLATION_TYPE_MAP: Record<string, string> = {
  property_deed_main_residence: "property_deed_main",
  property_deed_rental_property: "property_deed_rental",
  debt_loan_statement: "debt_statement",
};

function getDocumentTranslationType(documentType: string): string {
  return DOCUMENT_TRANSLATION_TYPE_MAP[documentType] ?? documentType;
}

export default function Stage2DocumentsReview({
  data,
  isAdmin,
  isCurrent,
  isCompleted,
  t,
  adminNote,
  step2UserComment,
  setStep2UserComment,
  step2AdminComment,
  setStep2AdminComment,
  isAddingStep2Comment,
  user,
  onDownloadFile,
  onApproveStep2,
  onAddStep2Comment,
}: Props) {
  const { t: tLocal } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(!isCompleted);
  const [step1Answers, setStep1Answers] = React.useState<Record<string, any>>({});
  const step1Questions: Step1Question[] = DEFAULT_STEP1_QUESTIONS;
  const [isDownloadingAll, setIsDownloadingAll] = React.useState(false);
  const [downloadedCount, setDownloadedCount] = React.useState(0);
  const [downloadAllError, setDownloadAllError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isCompleted) setIsOpen(false);
  }, [isCompleted]);

  React.useEffect(() => {
    (async () => {
      try {
        const aRes = await axiosClient.get<{ answers: Record<string, any> }>(
          `/files/${data.id}/step1/answers`
        );
        setStep1Answers(aRes.data.answers ?? {});
      } catch (e) {
        console.error("Failed to load step1 answers", e);
      }
    })();
  }, [data.id]);

  const documentsReviewStep = (data.steps ?? []).find((s: any) => s.id === "documentsReview");
  const documentsPreparationStep = (data.steps ?? []).find((s: any) => s.id === "documentsPreparation");

  const commentHistory: any[] = documentsReviewStep?.meta?.commentHistory ?? [];
  const lastComment: any = documentsReviewStep?.meta?.lastComment ?? null;
  const missingDocs = documentsPreparationStep?.meta?.missingDocs ?? [];

  const currentCommentValue = isAdmin ? (step2AdminComment ?? "") : (step2UserComment ?? "");
  const setCurrentCommentValue = (v: string) => {
    if (isAdmin) setStep2AdminComment(v);
    else setStep2UserComment(v);
  };

  const handleSend = async () => {
    const text = currentCommentValue.trim();
    if (!text) return;
    await onAddStep2Comment(text);
  };

  const handleDownloadAll = async () => {
    if (!isAdmin || isDownloadingAll || allFiles.length === 0) return;

    setIsDownloadingAll(true);
    setDownloadedCount(0);
    setDownloadAllError(null);

    let failedCount = 0;

    for (let index = 0; index < allFiles.length; index += 1) {
      const file = allFiles[index];

      try {
        await Promise.resolve(onDownloadFile(file.id));
      } catch (error) {
        failedCount += 1;
        console.error(`Failed to download file ${file.id}`, error);
      } finally {
        setDownloadedCount(index + 1);
      }

      // A small delay prevents browsers from receiving all download requests
      // at exactly the same time.
      if (index < allFiles.length - 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 150));
      }
    }

    if (failedCount === allFiles.length) {
      setDownloadAllError(
        String(
          t("filesModal.downloadAllFailed", {
            defaultValue:
              "Could not download the files. Please try again.",
          })
        )
      );
    } else if (failedCount > 0) {
      setDownloadAllError(
        String(
          t("filesModal.downloadAllPartial", {
            count: failedCount,
            defaultValue: `${failedCount} file(s) could not be downloaded.`,
          })
        )
      );
    }

    setIsDownloadingAll(false);
  };

  const docTitle = (type?: string) => {
    if (!type) {
      return t("documents.unknown.title", {
        defaultValue: "Unknown document",
      });
    }

    const translationType = getDocumentTranslationType(type);

    return t(`documents.${translationType}.title`, {
      defaultValue: type,
    });
  };

  const allFiles = data.files ?? [];
  // const adminFiles = allFiles.filter((f: any) => f?.meta?.uploaderRole === "admin");
  // const userFiles = allFiles.filter((f: any) => f?.meta?.uploaderRole === "user");

  // Match answers to questions for translated labels
  const answerRows = step1Questions
    .filter((q) => {
      const val = step1Answers[q.id];
      return val !== undefined && val !== null && val !== "";
    })
    .map((q) => ({
      label: tLocal(q.labelKey, { defaultValue: q.labelKey }),
      value: step1Answers[q.id],
    }));

  const formatValue = (value: any): string => {
    if (typeof value === "boolean") return value ? tLocal("common.yes", { defaultValue: "Yes" }) : tLocal("common.no", { defaultValue: "No" });
    if (value === null || value === undefined) return "—";
    return String(value);
  };
  const uploadedCount = allFiles.length;

  return (
    <div className="stage1-container">
      {/* ── Collapsible toggle header ── */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="stage1-toggle"
      >
        <div className="stage1-header">
          <div className="stage1-header-content">
            <h3 className="stage1-title">{t("view.step2.title")}</h3>
            <p className="stage1-subtitle">
              {isAdmin ? t("view.step2.admin.description") : t("view.step2.description")}
            </p>

            <div className="stage1-meta-row">
              {isCompleted && (
                <div className="stage1-meta-item">
                  <span className="stage1-status-badge">
                    <span className="stage1-status-badge-icon">✓</span>
                    {t("stepStatus.done")}
                  </span>
                </div>
              )}

              {uploadedCount > 0 && (
                <div className="stage1-meta-item">
                  <span className="stage1-progress-text">
                    {t("view.step5.userFilesCount")}{" "}
                    <span className="stage1-progress-value">{uploadedCount}</span>
                  </span>
                </div>
              )}

              {/* {userFiles.length > 0 && (
                <div className="stage1-meta-item">
                  <span className="stage1-progress-text">
                    {t("view.step2.userFilesLabel", { defaultValue: "Your files" })}{" "}
                    <span className="stage1-progress-value">{userFiles.length}</span>
                  </span>
                </div>
              )} */}
            </div>
          </div>

          <span aria-hidden="true" className={`stage1-chevron ${isOpen ? "is-open" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M5 12l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </button>

      {/* ── Collapsible body ── */}
      {isOpen && (
        <div className="stage1-body">

          {/* ── Step 1 Answers ── */}
          {answerRows.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 className="font-semibold text-lg mb-4">
                {t("view.step2.answersTitle", { defaultValue: "Questionnaire Answers" })}
              </h3>
              <div className="document-card" style={{ padding: 0, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {answerRows.map(({ label, value }, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: idx < answerRows.length - 1 ? "1px solid #f0f0f0" : "none",
                          background: idx % 2 === 0 ? "#fff" : "#fafafa",
                        }}
                      >
                        <td style={{ padding: "10px 16px", fontSize: 13, color: "#555", width: "50%", fontWeight: 500 }}>
                          {label}
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 13, color: "#111", fontWeight: 600 }}>
                          {formatValue(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Files two-column layout */}
          <div
            className="files-modal-body"
            style={{
              alignItems: "start",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  minHeight: 42,
                  marginBottom: 16,
                }}
              >
                <h3 className="font-semibold text-lg" style={{ margin: 0 }}>
                  {t("view.step2.admin.filesTitle")}
                </h3>

                {isAdmin && allFiles.length > 0 && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleDownloadAll}
                    disabled={isDownloadingAll}
                    aria-label={t("filesModal.downloadAll", {
                      count: allFiles.length,
                    })}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <DownloadIcon size={17} color="#ffffff" />

                    {isDownloadingAll
                      ? t("filesModal.downloadingProgress", {
                          completed: downloadedCount,
                          total: allFiles.length,
                          defaultValue: `Preparing ${downloadedCount}/${allFiles.length}…`,
                        })
                      : t("filesModal.downloadAll", {
                          count: allFiles.length,
                          defaultValue: `Download all (${allFiles.length})`,
                        })}
                  </button>
                )}
              </div>

              {downloadAllError && (
                <div
                  role="alert"
                  className="stage1-upload-error"
                  style={{ marginBottom: 12 }}
                >
                  {downloadAllError}
                </div>
              )}

              {allFiles.length ? (
                <ul className="space-y-3">
                  {allFiles.map((file) => (
                    <li key={file.id} className="file-row">
                      <div className="file-row-left">
                        <span className="file-icon">PDF</span>
                        <div className="file-meta">
                          <div className="file-name">{file.originalName}</div>
                          <div className="file-type">{docTitle(file.documentType)}</div>
                        </div>
                      </div>
                      <button
                        className="file-download-btn"
                        onClick={() => onDownloadFile(file.id)}
                        aria-label={t("filesModal.downloadAria")}
                      >
                        <DownloadIcon size={18} color="#ffffff" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">{t("filesModal.empty")}</p>
              )}
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: 42,
                  marginBottom: 16,
                }}
              >
                <h3 className="font-semibold text-lg" style={{ margin: 0 }}>
                  {t("view.step2.missingDocumentsTitle")}
                </h3>
              </div>

              {missingDocs.length ? (
                <ul className="space-y-3">
                  {missingDocs.map((doc: any, index: number) => (
                    <li key={index} className="file-row">
                      <div className="file-row-left">
                        <span className="file-icon">!</span>
                        <div className="file-meta">
                          <div className="file-name">{docTitle(doc.documentType)}</div>
                          {doc.reason && (
                            <div className="file-type">
                              {t("view.step2.admin.missingReason")}: {doc.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 muted small">{t("view.step2.noMissingDocuments")}</p>
              )}
            </div>
          </div>

          {/* Approve button */}
          {isAdmin && isCurrent && (
            <button
              className="btn-primary"
              style={{ marginTop: 12 }}
              onClick={() => onApproveStep2(adminNote)}
            >
              {t("view.step2.admin.approveBtn")}
            </button>
          )}

          {isCompleted && (
            <p className="success-text" style={{ marginTop: 12 }}>
              {t("view.step2.completed")}
            </p>
          )}

          {/* Comments section */}
          <div style={{ marginTop: 16 }}>
            <h4 className="font-medium">{t("view.step2.commentSectionTitle")}</h4>

            {lastComment && (
              <div className="muted small" style={{ marginTop: 6 }}>
                {t("view.step2.lastComment")}: <strong>{lastComment.text}</strong>{" "}
                <em>({new Date(lastComment.at).toLocaleString()})</em>
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <label className="block mb-2 font-medium">
                {isAdmin ? t("view.step2.addCommentLabelAdmin") : t("view.step2.addCommentLabelUser")}
              </label>

              <textarea
                className="input-textarea"
                value={currentCommentValue}
                onChange={(e) => setCurrentCommentValue(e.target.value)}
                rows={4}
                placeholder={
                  isAdmin
                    ? t("view.step2.commentPlaceholderAdmin")
                    : t("view.step2.commentPlaceholderUser")
                }
              />

              <div style={{ marginTop: 8 }}>
                <button
                  className="btn-secondary"
                  onClick={() => setCurrentCommentValue("")}
                  disabled={!!isAddingStep2Comment}
                  style={{ marginRight: 8 }}
                >
                  {t("view.step2.cancel")}
                </button>

                <button
                  className="btn-primary"
                  onClick={handleSend}
                  disabled={!!isAddingStep2Comment || !currentCommentValue.trim()}
                >
                  {isAddingStep2Comment ? t("view.step2.sending") : t("view.step2.addCommentBtn")}
                </button>
              </div>
            </div>

            {/* Comment history */}
            <div style={{ marginTop: 16 }}>
              {commentHistory.length > 0 ? (
                <ul className="space-y-3" style={{ marginTop: 8 }}>
                  {commentHistory.map((c: any, idx: number) => (
                    <li
                      key={idx}
                      className="file-row"
                      style={{ flexDirection: "column", alignItems: "flex-start" }}
                    >
                      <div style={{ fontSize: 12, color: "#666" }}>
                        <strong>
                          {c.by === user?.id
                            ? t("view.step2.you")
                            : c.byName || c.byEmail || t("view.step2.unknown")}
                        </strong>{" "}
                        — {c.at ? new Date(c.at).toLocaleString() : t("view.step2.unknownTime")}
                      </div>
                      <div style={{ marginTop: 6 }}>{c.text}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 muted small" style={{ marginTop: 8 }}>
                  {t("view.step2.noComments")}
                </p>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}