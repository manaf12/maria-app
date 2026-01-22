import { type ViewRequestData } from "../../../types/declaration.types";
import type { TFunction } from "i18next";
type Props = {
  data: ViewRequestData;
  isAdmin: boolean;
  isCurrent: boolean;
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
  t,
  adminDraftFile,
  setAdminDraftFile,
  isUploadingDraft,
  onUploadDraft,
  onCompleteStep3,
}: Props) {
  const draftFileForStep4 = (data.files ?? []).find(
    (f) => f.meta?.deliveredForStep === "reviewAndValidation"
  );

  return (
    <div className="stage-block">
      <p className="muted">{t("view.step3.text")}</p>
      <p className="muted small">{t("view.step3.eta")}</p>

      {isCurrent && isAdmin && (
        <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 16 }}>
          <label className="block mb-2 font-medium">Admin: Upload Tax Declaration Draft (PDF)</label>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setAdminDraftFile(f);
            }}
          />

          <div style={{ marginTop: 8 }}>
            <button className="btn-primary" disabled={isUploadingDraft || !adminDraftFile} onClick={onUploadDraft}>
              {isUploadingDraft ? "Uploading..." : "Upload Draft"}
            </button>
          </div>
        </div>
      )}

      {isAdmin && isCurrent && (
        <div style={{ marginTop: 24 }}>
          <button className="btn-primary" onClick={onCompleteStep3} disabled={!draftFileForStep4}>
            Mark as Prepared & Complete Step 3
          </button>
          {!draftFileForStep4 && (
            <p className="muted small mt-2">You must upload the draft file before completing this step.</p>
          )}
        </div>
      )}
    </div>
  );
}
