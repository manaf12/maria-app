import React from "react";
import type { TFunction } from "i18next";
import type { ViewRequestData } from "../../../types/declaration.types";
import { DownloadIcon } from "../../../components/Icons";

type Props = {
  data: ViewRequestData;
  isAdmin: boolean;
  isCurrent: boolean;
  isCompleted: boolean;
  t: TFunction;
  adminFinalFile: File | null;
  setAdminFinalFile: (f: File | null) => void;
  isUploadingFinal: boolean;

  userSubmissionFile: File | null;
  setUserSubmissionFile: (f: File | null) => void;
  isUploadingUserSubmission: boolean;

  onDownloadFile: (fileId: string) => void;

  onAdminUploadFinal: () => Promise<void> | void;
  onUserUploadSubmission: () => Promise<void> | void;
  onCompleteStep5: () => void;
};

export default function Stage5Submission({
  data,
  isAdmin,
  isCurrent,
  isCompleted,
  t,
  adminFinalFile,
  setAdminFinalFile,
  isUploadingFinal,
  userSubmissionFile,
  setUserSubmissionFile,
  isUploadingUserSubmission,
  onDownloadFile,
  onAdminUploadFinal,
  onUserUploadSubmission,
  onCompleteStep5,
}: Props) {
  const [isOpen, setIsOpen] = React.useState(!isCompleted);

  React.useEffect(() => {
    if (isCompleted) setIsOpen(false);
  }, [isCompleted]);

  const submissionFiles = (data.files ?? []).filter((f: any) => f?.meta?.deliveredForStep === "submission");
  const adminFiles = submissionFiles.filter((f) => f?.meta?.uploaderRole === "admin");
  const userFiles = submissionFiles.filter((f) => f?.meta?.uploaderRole === "user");

  const canUserUploadInStep5 = !isAdmin && (isCurrent || isCompleted);

  const adminFinalInputId = "admin-final-upload-input";
  const userSubmissionInputId = "user-submission-upload-input";

  const formatDateTime = (value: any) => {
    if (!value) return t("common.unknownTime");
    const d = new Date(value);
    return isNaN(d.getTime()) ? t("common.unknownTime") : d.toLocaleString();
  };

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
              {t("view.step5.title")}
            </h3>
            <p className="stage1-subtitle">{t("view.step5.description")}</p>

            <div className="stage1-meta-row">
              {isCompleted && (
                <div className="stage1-meta-item">
                  <span className="stage1-status-badge">
                    <span className="stage1-status-badge-icon">✓</span>
                    {t("stepStatus.done")}
                  </span>
                </div>
              )}

              {adminFiles.length > 0 && (
                <div className="stage1-meta-item">
                  <span className="stage1-progress-text">
                    {t("view.step5.adminFilesCount")}{" "}
                    <span className="stage1-progress-value">{adminFiles.length}</span>
                  </span>
                </div>
              )}

              {userFiles.length > 0 && (
                <div className="stage1-meta-item">
                  <span className="stage1-progress-text">
                    {t("view.step5.userFilesCount",)}{" "}
                    <span className="stage1-progress-value">{userFiles.length}</span>
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

          {/* <ul className="submission-info">
            <li>
              <strong>{t("view.step5.date")}:</strong> {data.step5?.date || "—"}
            </li>
            <li>
              <strong>{t("view.step5.method")}:</strong> {data.step5?.method || "—"}
            </li>
          </ul> */}

          {/* Files two-column layout */}
          <div className="files-modal-body" style={{ marginTop: 16 }}>

            {/* Admin files column */}
            <div>
              <h3 className="font-semibold text-lg mb-4">{t("view.step5.adminFilesTitle")}</h3>

              {adminFiles.length ? (
                <ul className="space-y-3">
                  {adminFiles.map((f: any) => (
                    <li key={f.id} className="file-row">
                      <div className="file-row-left">
                        <span className="file-icon">PDF</span>
                        <div className="file-meta">
                          <div className="file-name">{f.originalName}</div>
                          <div className="file-type">
                            {t("view.step5.uploaded")}: {f.uploadedAt ? formatDateTime(f.uploadedAt) : t("common.unknown")}
                            {" · "}{t("view.step5.by")}: {t("view.step5.admin1")}
                          </div>
                        </div>
                      </div>
                      <button
                        className="file-download-btn"
                        onClick={() => onDownloadFile(f.id)}
                        aria-label={t("filesModal.downloadAria")}
                      >
                        <DownloadIcon size={18} color="#ffffff" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">{t("view.step5.noAdminFilesYet")}</p>
              )}
            </div>

            {/* User files column */}
            <div>
              <h3 className="font-semibold text-lg mb-4">{t("view.step5.userFilesTitle")}</h3>

              {userFiles.length ? (
                <ul className="space-y-3">
                  {userFiles.map((f: any) => (
                    <li key={f.id} className="file-row">
                      <div className="file-row-left">
                        <span className="file-icon">PDF</span>
                        <div className="file-meta">
                          <div className="file-name">{f.originalName}</div>
                          <div className="file-type">
                            {t("view.step5.uploaded")}: {f.uploadedAt ? formatDateTime(f.uploadedAt) : t("common.unknown")}
                            {" · "}{t("view.step5.by")}: {f.meta?.uploadedBy ?? t("view.step5.user1")}
                          </div>
                        </div>
                      </div>
                      <button
                        className="file-download-btn"
                        onClick={() => onDownloadFile(f.id)}
                        aria-label={t("filesModal.downloadAria")}
                      >
                        <DownloadIcon size={18} color="#ffffff" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">{t("view.step5.noUserFilesYet")}</p>
              )}
            </div>
          </div>

          {/* Admin upload */}
          {isCurrent && isAdmin && (
            <div style={{ marginTop: 20 }}>
              <label className="block mb-2 font-medium">{t("view.step5.admin.uploadFinalLabel")}</label>

              <input
                id={adminFinalInputId}
                type="file"
                accept="application/pdf"
                onChange={(e) => setAdminFinalFile(e.target.files?.[0] ?? null)}
                style={{
                  position: "absolute",
                  width: 1, height: 1, padding: 0, margin: -1,
                  overflow: "hidden", clip: "rect(0,0,0,0)",
                  whiteSpace: "nowrap", border: 0,
                }}
              />

              <div className="document-card" style={{ marginTop: 8 }}>
                <div className="uploaded-file-item">
                  <div className="uploaded-file-left">
                    <span className="uploaded-file-name">
                      {adminFinalFile ? adminFinalFile.name : t("common.noFileChosen")}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label
                      htmlFor={adminFinalInputId}
                      style={{
                        border: "1px solid rgb(229,231,235)", background: "#fff",
                        borderRadius: 10, padding: "10px 14px", fontSize: 14,
                        fontWeight: 600, color: "rgb(22,62,100)", cursor: "pointer",
                        lineHeight: "18px", display: "inline-flex", alignItems: "center",
                      }}
                    >
                      {t("common.chooseFile")}
                    </label>
                    <button
                      type="button"
                      disabled={isUploadingFinal || !adminFinalFile}
                      onClick={onAdminUploadFinal}
                      style={{
                        border: "1px solid rgb(22,62,100)", background: "rgb(22,62,100)",
                        borderRadius: 10, padding: "10px 14px", fontSize: 14,
                        fontWeight: 600, color: "#fff", cursor: "pointer",
                        lineHeight: "18px",
                        opacity: (isUploadingFinal || !adminFinalFile) ? 0.5 : 1,
                      }}
                    >
                      {isUploadingFinal ? t("common.uploading") : t("view.step5.admin.uploadFinalBtn")}
                    </button>
                  </div>
                </div>
              </div>

              {/* Mark as fully completed */}
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #eee" }}>
                <label className="block mb-2 font-medium">{t("view.step5.admin.markFullyCompleted")}</label>
                <div className="document-card">
                  <div className="uploaded-file-item">
                    <div className="uploaded-file-left">
                      <span className="uploaded-file-name muted small">
                        {t("view.step5.admin.markFullyCompletedHint")}
                      </span>
                    </div>
                    <button className="btn-primary" onClick={onCompleteStep5} style={{ margin: 0 }}>
                      {t("view.step5.admin.markFullyCompleted")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User upload */}
          {canUserUploadInStep5 && (
            <div style={{ marginTop: 20 }}>
              <label className="block mb-2 font-medium">{t("view.step5.user.uploadNoticeLabel")}</label>

              <input
                id={userSubmissionInputId}
                type="file"
                accept="application/pdf"
                onChange={(e) => setUserSubmissionFile(e.target.files?.[0] ?? null)}
                style={{
                  position: "absolute",
                  width: 1, height: 1, padding: 0, margin: -1,
                  overflow: "hidden", clip: "rect(0,0,0,0)",
                  whiteSpace: "nowrap", border: 0,
                }}
              />

              <div className="document-card" style={{ marginTop: 8 }}>
                <div className="uploaded-file-item">
                  <div className="uploaded-file-left">
                    <span className="uploaded-file-name">
                      {userSubmissionFile ? userSubmissionFile.name : t("common.noFileChosen")}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label
                      htmlFor={userSubmissionInputId}
                      style={{
                        border: "1px solid rgb(229,231,235)", background: "#fff",
                        borderRadius: 10, padding: "10px 14px", fontSize: 14,
                        fontWeight: 600, color: "rgb(22,62,100)", cursor: "pointer",
                        lineHeight: "18px", display: "inline-flex", alignItems: "center",
                      }}
                    >
                      {t("common.chooseFile")}
                    </label>
                    <button
                      type="button"
                      disabled={isUploadingUserSubmission || !userSubmissionFile}
                      onClick={onUserUploadSubmission}
                      style={{
                        border: "1px solid rgb(22,62,100)", background: "rgb(22,62,100)",
                        borderRadius: 10, padding: "10px 14px", fontSize: 14,
                        fontWeight: 600, color: "#fff", cursor: "pointer",
                        lineHeight: "18px",
                        opacity: (isUploadingUserSubmission || !userSubmissionFile) ? 0.5 : 1,
                      }}
                    >
                      {isUploadingUserSubmission ? t("common.uploading") : t("view.step5.user.uploadNoticeBtn")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isCompleted && (
            <p className="success-text" style={{ marginTop: 12 }}>
              {t("view.step5.thanks")}
            </p>
          )}

        </div>
      )}
    </div>
  );
}