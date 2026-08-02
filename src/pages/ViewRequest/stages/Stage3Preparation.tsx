import React from "react";
import { type ViewRequestData } from "../../../types/declaration.types";
import type { TFunction } from "i18next";

type Props = {
  data: ViewRequestData;
  isAdmin: boolean;
  isCurrent: boolean;
  isCompleted: boolean;
  t: TFunction;

  adminDraftFile: File | null;
  setAdminDraftFile: (f: File | null) => void;
  isUploadingDraft: boolean;

  onUploadDraft: () => Promise<void> | void;
  onCompleteStep3: () => void;
};

export default function Stage3Preparation({
  data,
  isAdmin,
  isCurrent,
  isCompleted,
  t,
  adminDraftFile,
  setAdminDraftFile,
  isUploadingDraft,
  onUploadDraft,
  onCompleteStep3,
}: Props) {
  const [isOpen, setIsOpen] = React.useState(!isCompleted);

  React.useEffect(() => {
    if (isCompleted) setIsOpen(false);
  }, [isCompleted]);

  const draftFileForStep4 = (data.files ?? []).find(
    (f) => f.meta?.deliveredForStep === "reviewAndValidation"
  );

  const adminDraftInputId = "admin-draft-upload-input";

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
              {t("view.step3.title")}
            </h3>
            <p className="stage1-subtitle">{t("view.step3.text")}</p>

            <div className="stage1-meta-row">
              {isCompleted && (
                <div className="stage1-meta-item">
                  <span className="stage1-status-badge">
                    <span className="stage1-status-badge-icon">✓</span>
                    {t("stepStatus.done", { defaultValue: "Completed" })}
                  </span>
                </div>
              )}

              {draftFileForStep4 && !isCompleted && (
                <div className="stage1-meta-item">
                  <span className="stage1-progress-text">
                    {t("view.step3.draftReady", { defaultValue: "Draft uploaded" })}
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
          <p className="muted small">{t("view.step3.eta")}</p>

          {/* Admin: upload draft */}
          {isCurrent && isAdmin && (
            <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 16 }}>
              <label className="stage-field-label" htmlFor={adminDraftInputId}>
                {t("view.step3.admin.uploadDraftLabel")}
              </label>

              <input
                id={adminDraftInputId}
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setAdminDraftFile(f);
                }}
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  padding: 0,
                  margin: -1,
                  overflow: "hidden",
                  clip: "rect(0, 0, 0, 0)",
                  whiteSpace: "nowrap",
                  border: 0,
                }}
              />

              <div
                className="stage3-file-picker-row"
                style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
              >
                <label
                  htmlFor={adminDraftInputId}
                  className="btn-primary"
                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                >
                  {t("common.chooseFile")}
                </label>

                <span className="muted small">
                  {adminDraftFile
                    ? adminDraftFile.name
                    : t("common.noFileChosen", "No file chosen")}
                </span>
              </div>

              <div className="stage3-action-row" style={{ marginTop: 8 }}>
                <button
                  className="btn-primary"
                  disabled={isUploadingDraft || !adminDraftFile}
                  onClick={onUploadDraft}
                >
                  {isUploadingDraft
                    ? t("common.uploading", "Uploading...")
                    : t("view.step3.admin.uploadDraftBtn")}
                </button>
              </div>
            </div>
          )}

          {/* Admin: complete step */}
          {isAdmin && isCurrent && (
            <div className="stage3-action-row" style={{ marginTop: 24 }}>
              <button
                className="btn-primary"
                onClick={onCompleteStep3}
                disabled={!draftFileForStep4}
              >
                {t("view.step3.admin.completeBtn", "Mark as Prepared & Complete Step 3")}
              </button>

              {!draftFileForStep4 && (
                <p className="stage-help-text">
                  {t("view.step3.admin.mustUploadFirst", "You must upload the draft file before completing this step.")}
                </p>
              )}
            </div>
          )}

          {isCompleted && (
            <p className="success-text" style={{ marginTop: 12 }}>
              {t("view.step3.completed", { defaultValue: "Step 3 completed." })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
