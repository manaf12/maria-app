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
        <h4>Admin uploaded files</h4>
        {adminFiles.length ? (
          <ul>
            {adminFiles.map((f: any) => (
              <li key={f.id} className="flex items-center justify-between mb-2">
                <div>
                  <strong>{f.originalName}</strong>
                  <div className="muted small">
                    uploaded: {f.uploadedAt ? new Date(f.uploadedAt).toLocaleString() : "unknown"}
                  </div>
                  <div className="muted small">by: admin</div>
                </div>
                <button className="btn-secondary btn-small" onClick={() => onDownloadFile(f.id)}>
                  {t("view.download")}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">No admin files yet.</p>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <h4>User uploaded files</h4>
        {userFiles.length ? (
          <ul>
            {userFiles.map((f: any) => (
              <li key={f.id} className="flex items-center justify-between mb-2">
                <div>
                  <strong>{f.originalName}</strong>
                  <div className="muted small">
                    uploaded: {f.uploadedAt ? new Date(f.uploadedAt).toLocaleString() : "unknown"}
                  </div>
                  <div className="muted small">by: {f.meta?.uploadedBy ?? "user"}</div>
                </div>
                <button className="btn-secondary btn-small" onClick={() => onDownloadFile(f.id)}>
                  {t("view.download")}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">No user files yet.</p>
        )}
      </div>

      {isCurrent && isAdmin && (
        <div style={{ marginTop: 16 }}>
          <label className="block mb-2 font-medium">Admin: upload final file (PDF)</label>
   <input
  type="file"
  accept="application/pdf"
  onChange={(e) => setAdminFinalFile(e.target.files?.[0] ?? null)}
/>
          <div style={{ marginTop: 8 }}>
           <button
  className="btn-primary"
  disabled={isUploadingFinal || !adminFinalFile}
  onClick={onAdminUploadFinal}
>
  {isUploadingFinal ? "Uploading..." : "Upload final file"}
</button>

            <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #eee" }}>
              <button className="btn-primary" onClick={onCompleteStep5}>
                Mark as Fully Completed & Finish Declaration
              </button>
            </div>
          </div>
        </div>
      )}

      {canUserUploadInStep5 && (
        <div style={{ marginTop: 16 }}>
          <label className="block mb-2 font-medium">Upload assessment notice (if any)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setUserSubmissionFile(e.target.files?.[0] ?? null)}
          />
          <div style={{ marginTop: 8 }}>
            <button
              className="btn-primary"
              disabled={isUploadingUserSubmission || !userSubmissionFile}
              onClick={onUserUploadSubmission}
            >
              {isUploadingUserSubmission ? "Uploading..." : "Upload notice"}
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
