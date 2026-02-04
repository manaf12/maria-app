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

  const adminDraftInputId = "admin-draft-upload-input";

  return (
    <div className="stage-block">
      <p className="muted">{t("view.step3.text")}</p>
      <p className="muted small">{t("view.step3.eta")}</p>

      {isCurrent && isAdmin && (
        <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 16 }}>
          <label className="block mb-2 font-medium">
            {t(
              "view.step3.admin.uploadDraftLabel"
            )}
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

          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
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

          <div style={{ marginTop: 8 }}>
            <button className="btn-primary" disabled={isUploadingDraft || !adminDraftFile} onClick={onUploadDraft}>
              {isUploadingDraft
                ? t("common.uploading", "Uploading...")
                : t("view.step3.admin.uploadDraftBtn")}
            </button>
          </div>
        </div>
      )}

      {isAdmin && isCurrent && (
        <div style={{ marginTop: 24 }}>
          <button className="btn-primary" onClick={onCompleteStep3} disabled={!draftFileForStep4}>
            {t(
              "view.step3.admin.completeBtn",
              "Mark as Prepared & Complete Step 3"
            )}
          </button>
          {!draftFileForStep4 && (
            <p className="muted small mt-2">
              {t(
                "view.step3.admin.mustUploadFirst",
                "You must upload the draft file before completing this step."
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
