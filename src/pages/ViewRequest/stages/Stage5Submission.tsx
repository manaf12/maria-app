/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TFunction } from "i18next";
import type { ViewRequestData } from "../../../types/declaration.types";

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
    <div className="stage-block">
      <p className="muted">{t("view.step5.description")}</p>

      <ul className="submission-info">
        <li>
          <strong>{t("view.step5.date")}:</strong> {data.step5?.date || "—"}
        </li>
        <li>
          <strong>{t("view.step5.method")}:</strong> {data.step5?.method || "—"}
        </li>
      </ul>

      <div style={{ marginTop: 12 }}>
        <h4>{t("view.step5.adminFilesTitle")}</h4>
        {adminFiles.length ? (
          <ul>
            {adminFiles.map((f: any) => (
              <li key={f.id} className="flex items-center justify-between mb-2">
                <div>
                  <strong>{f.originalName}</strong>
                  <div className="muted small">
                    {t("view.step5.uploaded")}: {f.uploadedAt ? formatDateTime(f.uploadedAt) : t("common.unknown")}
                  </div>
                  <div className="muted small">
                    {t("view.step5.by")}: {t("view.step5.admin")}
                  </div>
                </div>
                <button className="btn-secondary btn-small" onClick={() => onDownloadFile(f.id)}>
                  {t("view.download")}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">{t("view.step5.noAdminFilesYet")}</p>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <h4>{t("view.step5.userFilesTitle")}</h4>
        {userFiles.length ? (
          <ul>
            {userFiles.map((f: any) => (
              <li key={f.id} className="flex items-center justify-between mb-2">
                <div>
                  <strong>{f.originalName}</strong>
                  <div className="muted small">
                    {t("view.step5.uploaded")}: {f.uploadedAt ? formatDateTime(f.uploadedAt) : t("common.unknown")}
                  </div>
                  <div className="muted small">
                    {t("view.step5.by")}: {f.meta?.uploadedBy ?? t("view.step5.user")}
                  </div>
                </div>
                <button className="btn-secondary btn-small" onClick={() => onDownloadFile(f.id)}>
                  {t("view.download")}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">{t("view.step5.noUserFilesYet")}</p>
        )}
      </div>

      {isCurrent && isAdmin && (
        <div style={{ marginTop: 16 }}>
          <label className="block mb-2 font-medium">{t("view.step5.admin.uploadFinalLabel")}</label>

          <input
            id={adminFinalInputId}
            type="file"
            accept="application/pdf"
            onChange={(e) => setAdminFinalFile(e.target.files?.[0] ?? null)}
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

          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <label
              htmlFor={adminFinalInputId}
              className="btn-primary"
              style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}
            >
              {t("common.chooseFile")}
            </label>

            <span className="muted small">{adminFinalFile ? adminFinalFile.name : t("common.noFileChosen")}</span>
          </div>

          <div style={{ marginTop: 8 }}>
            <button className="btn-primary" disabled={isUploadingFinal || !adminFinalFile} onClick={onAdminUploadFinal}>
              {isUploadingFinal ? t("common.uploading") : t("view.step5.admin.uploadFinalBtn")}
            </button>

            <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #eee" }}>
              <button className="btn-primary" onClick={onCompleteStep5}>
                {t("view.step5.admin.markFullyCompleted")}
              </button>
            </div>
          </div>
        </div>
      )}

      {canUserUploadInStep5 && (
        <div style={{ marginTop: 16 }}>
          <label className="block mb-2 font-medium">{t("view.step5.user.uploadNoticeLabel")}</label>

          <input
            id={userSubmissionInputId}
            type="file"
            accept="application/pdf"
            onChange={(e) => setUserSubmissionFile(e.target.files?.[0] ?? null)}
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

          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <label
              htmlFor={userSubmissionInputId}
              className="btn-primary"
              style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}
            >
              {t("common.chooseFile")}
            </label>

            <span className="muted small">{userSubmissionFile ? userSubmissionFile.name : t("common.noFileChosen")}</span>
          </div>

          <div style={{ marginTop: 8 }}>
            <button
              className="btn-primary"
              disabled={isUploadingUserSubmission || !userSubmissionFile}
              onClick={onUserUploadSubmission}
            >
              {isUploadingUserSubmission ? t("common.uploading") : t("view.step5.user.uploadNoticeBtn")}
            </button>
          </div>
        </div>
      )}

      <p className="success-text" style={{ marginTop: 12 }}>
        {t("view.step5.thanks")}
      </p>
    </div>
  );
}
