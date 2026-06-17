import React from "react";
import type { TFunction } from "i18next";
import type { User, ViewRequestData } from "../../../types/declaration.types";

type Props = {
  data: ViewRequestData;
  isAdmin: boolean;
  isCurrent: boolean;
  isCompleted: boolean;
  t: TFunction;

  user: User | null;

  confirming: boolean;
  isAddingStepComment: boolean;

  step4UserComment: string;
  setStep4UserComment: (v: string) => void;
  step4AdminComment: string;
  setStep4AdminComment: (v: string) => void;
  adminStep4File: File | null;
  setAdminStep4File: (f: File | null) => void;
  isUploadingStep4: boolean;
  onStep4Upload: () => Promise<void>;
  onDownloadFile: (fileId: string) => void;
  onConfirmReceipt: (fileId?: string) => Promise<void> | void;
  onAddStepComment: (comment: string) => Promise<void> | void;
};

export default function Stage4Validation({
  data,
  isAdmin,
  isCurrent,
  isCompleted,
  t,
  user,
  confirming,
  isAddingStepComment,
  step4UserComment,
  setStep4UserComment,
  step4AdminComment,
  setStep4AdminComment,
  onDownloadFile,
  onConfirmReceipt,
  onAddStepComment,
  adminStep4File,
  setAdminStep4File,
  isUploadingStep4,
  onStep4Upload,
}: Props) {
  const [isOpen, setIsOpen] = React.useState(!isCompleted);

  React.useEffect(() => {
    if (isCompleted) setIsOpen(false);
  }, [isCompleted]);

  const stepsArr = data.steps ?? [];
  const reviewStep =
    stepsArr.find((s: any) => s?.id === "reviewAndValidation") ||
    stepsArr.find((s: any) => s?.nameKey === "steps.reviewAndValidation") ||
    stepsArr.find(
      (s: any) =>
        typeof s?.id === "string" &&
        s.id.toLowerCase().includes("review") &&
        !s.id.toLowerCase().includes("documents")
    ) ||
    stepsArr.find(
      (s: any) =>
        typeof s?.nameKey === "string" &&
        s.nameKey.toLowerCase().includes("review") &&
        !s.nameKey.toLowerCase().includes("documents")
    ) ||
    null;

  const commentHistory: any[] = reviewStep?.meta?.commentHistory ?? [];
  const lastComment: any = reviewStep?.meta?.lastComment ?? null;

  const step4Files = (data.files ?? []).filter(
    (f: any) => f?.meta?.deliveredForStep === "reviewAndValidation"
  );
  const latest = step4Files.length ? step4Files[step4Files.length - 1] : null;

  const currentCommentValue = isAdmin ? step4AdminComment : step4UserComment;
  const setCurrentCommentValue = (v: string) => {
    if (isAdmin) setStep4AdminComment(v);
    else setStep4UserComment(v);
  };

  const formatDateTime = (value: any) => {
    if (!value) return t("common.unknownTime");
    const d = new Date(value);
    return isNaN(d.getTime()) ? t("common.unknownTime") : d.toLocaleString();
  };

  const downloadedBy = (latest as any)?.meta?.downloadedBy;
  const hasUserDownloadedLatest =
    !!latest &&
    !!user?.id &&
    (downloadedBy === user.id ||
      (Array.isArray(downloadedBy) && downloadedBy.includes(user.id)));

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
            <h3 className="stage1-title">
              {t("view.step4.title")}
            </h3>
            <p className="stage1-subtitle">{t("view.step4.description")}</p>

            <div className="stage1-meta-row">
              {isCompleted && (
                <div className="stage1-meta-item">
                  <span className="stage1-status-badge">
                    <span className="stage1-status-badge-icon">✓</span>
                    {t("stepStatus.done", { defaultValue: "Completed" })}
                  </span>
                </div>
              )}

              {latest && !isCompleted && (
                <div className="stage1-meta-item">
                  <span className="stage1-progress-text">
                    {t("view.step4.draftAvailable", { defaultValue: "Draft available" })}
                  </span>
                </div>
              )}

              {commentHistory.length > 0 && (
                <div className="stage1-meta-item">
                  <span className="stage1-progress-text">
                    {t("view.step4.commentsCount", {
                      count: commentHistory.length,
                      defaultValue: `${commentHistory.length} comment(s)`,
                    })}
                  </span>
                </div>
              )}
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

      {/* ── Collapsible body ── */}
      {isOpen && (
        <div className="stage1-body">

          {/* Documents card */}
          <div className="stage4-card">
            <div className="stage4-section-header">
              <h4 className="stage4-section-title">{t("dashboard.steps.documents")}</h4>
            </div>

            {latest ? (
              <div className="stage4-file-box">
                <div className="stage4-file-left">
                  <span className="stage4-file-icon" aria-hidden="true">PDF</span>

                  <div className="stage4-file-meta">
                    <strong className="stage4-file-name">{latest.originalName}</strong>

                    {latest.uploadedAt && (
                      <div className="stage4-meta-line">
                        {t("view.step4.uploadedAt")} {formatDateTime(latest.uploadedAt)}
                      </div>
                    )}

                    {lastComment && (
                      <div className="stage4-meta-line stage4-meta-line-comment">
                        {t("view.step4.lastComment")} <strong>{lastComment.text}</strong>{" "}
                        <em>({formatDateTime(lastComment.at)})</em>
                      </div>
                    )}
                  </div>
                </div>

                <div className="stage4-file-actions">
                  <button className="btn-secondary" onClick={() => onDownloadFile(latest.id)}>
                    {t("dashboard.steps.documents")}
                  </button>
                </div>
              </div>
            ) : (
              <p className="stage4-empty-text">{t("view.step4.noDraftYet")}</p>
            )}

            {!isAdmin && !latest && (
              <p className="stage4-note-text">{t("view.step4.waitingForAdmin")}</p>
            )}

            {latest && hasUserDownloadedLatest && data.currentStage === 4 && (
              <div className="stage4-top-actions">
                <button
                  className="btn-primary"
                  disabled={!!confirming}
                  onClick={() => onConfirmReceipt(latest.id)}
                >
                  {confirming ? t("view.step4.confirming") : t("view.step4.confirmReceipt")}
                </button>
              </div>
            )}
          </div>

          {/* Add comment card */}
          {isCurrent && (
            <div className="stage4-card">
              <div className="stage4-section-header">
                <h4 className="stage4-section-title">
                  {t("view.step4.addComment.label")}{" "}
                  {isAdmin
                    ? t("view.step4.addComment.forClient")
                    : t("view.step4.addComment.optional")}
                </h4>
              </div>

              <textarea
                className="input-textarea stage4-textarea"
                value={currentCommentValue}
                onChange={(e) => setCurrentCommentValue(e.target.value)}
                placeholder={
                  isAdmin
                    ? t("view.step4.addComment.placeholderAdmin")
                    : t("view.step4.addComment.placeholderUser")
                }
                rows={4}
              />

              <div className="stage4-actions-row">
                <button
                  className="btn-secondary"
                  onClick={() => setCurrentCommentValue("")}
                  disabled={isAddingStepComment}
                >
                  {t("common.cancel")}
                </button>

                <button
                  className="btn-primary"
                  onClick={() => onAddStepComment(currentCommentValue ?? "")}
                  disabled={isAddingStepComment || !currentCommentValue?.trim()}
                >
                  {isAddingStepComment ? t("common.sending") : t("view.step4.addComment.submit")}
                </button>
              </div>
            </div>
          )}

          {/* Comment history card */}
          <div className="stage4-card">
            <div className="stage4-section-header">
              <h4 className="stage4-section-title">{t("view.step4.comments.title")}</h4>
            </div>

            {commentHistory.length > 0 ? (
              <ul className="stage4-comments-list">
                {commentHistory.map((c: any, idx: number) => (
                  <li key={idx} className="stage4-comment-item">
                    <div className="stage4-comment-meta">
                      <strong>
                        {c.by === user?.id
                          ? t("common.you")
                          : c.byName || c.byEmail || t("common.unknown")}
                      </strong>{" "}
                      — {c.at ? formatDateTime(c.at) : t("common.unknownTime")}
                    </div>
                    <div className="stage4-comment-text">{c.text}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="stage4-empty-text">{t("view.step4.comments.empty")}</p>
            )}
          </div>

          {/* Admin upload card */}
          {isAdmin && (
            <div className="stage4-card">
              <div className="stage4-section-header">
                <h4 className="stage4-section-title">{t("view.step4.uploadFile")}</h4>
              </div>

              <div className="stage4-upload-panel">
                <input
                  id="stage4-file-input"
                  type="file"
                  accept="application/pdf"
                  className="stage4-file-input-hidden"
                  disabled={isUploadingStep4}
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setAdminStep4File(f);
                    e.target.value = "";
                  }}
                />

                {adminStep4File && (
                  <div className="stage4-selected-file-row">
                    <span className="stage4-file-icon">PDF</span>
                    <span className="stage4-selected-file-name">{adminStep4File.name}</span>
                    <button
                      type="button"
                      className="stage4-clear-file-btn"
                      disabled={isUploadingStep4}
                      onClick={() => setAdminStep4File(null)}
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                )}

                <div className="stage4-upload-row">
                  <label
                    htmlFor="stage4-file-input"
                    className={`stage4-choose-btn ${isUploadingStep4 ? "is-disabled" : ""}`}
                  >
                    {t("common.chooseFile")}
                  </label>

                  <button
                    type="button"
                    className="stage4-upload-btn"
                    disabled={!adminStep4File || isUploadingStep4}
                    onClick={onStep4Upload}
                  >
                    {isUploadingStep4 ? t("common.uploading") : t("common.upload")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isCompleted && (
            <p className="success-text" style={{ marginTop: 12 }}>
              {t("view.step4.completed", { defaultValue: "Step 4 completed." })}
            </p>
          )}

        </div>
      )}
    </div>
  );
}