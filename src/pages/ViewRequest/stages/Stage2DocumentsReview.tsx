/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TFunction } from "i18next";
import type { User, ViewRequestData } from "../../../types/declaration.types";

type Props = {
  data: ViewRequestData;
  isAdmin: boolean;
  isCurrent: boolean;
  isCompleted: boolean;
  t: TFunction;

  adminNote: string;

  // comment input (kept same behavior)
  step2UserComment: string;
  setStep2UserComment: (v: string) => void;
  step2AdminComment: string;
  setStep2AdminComment: (v: string) => void;
  isAddingStep2Comment: boolean;

  user: User | null;

  onDownloadFile: (fileId: string) => void;
  onApproveStep2: (note?: string) => void;
  onAddStep2Comment: (comment: string) => Promise<void>;
};

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

  return (
    <div className="stage-block">
      <p className="muted">
        {isAdmin ? t("view.step2.admin.description") : t("view.step2.description")}
      </p>

      <h3>{t("view.step2.admin.filesTitle")}</h3>

      <ul className="doc-list">
        {(data.files ?? []).map((file) => (
          <li key={file.id} className="doc-item-row">
            <div className="doc-item-main">
              <span>
                {file.originalName} ({file.documentType})
              </span>
            </div>
            <button className="btn-secondary btn-small" onClick={() => onDownloadFile(file.id)}>
              {t("view.step2.admin.downloadBtn")}
            </button>
          </li>
        ))}
      </ul>

      {missingDocs.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <h4>{t("view.step2.missingDocumentsTitle")}</h4>
          <ul className="doc-list">
            {missingDocs.map((doc: any, index: number) => (
              <li key={index} className="doc-item-row">
                <div className="doc-item-main">
                  <span>
                    {doc.documentType}
                    {doc.reason ? ` - ${t("view.step2.admin.missingReason")}: ${doc.reason}` : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted small" style={{ marginTop: 8 }}>
          {t("view.step2.noMissingDocuments")}
        </p>
      )}

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

        <div style={{ marginTop: 16 }}>
          {commentHistory.length > 0 ? (
            <ul style={{ marginTop: 8 }}>
              {commentHistory.map((c: any, idx: number) => (
                <li key={idx} className="border rounded p-3 mb-2">
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
            <p className="muted small" style={{ marginTop: 8 }}>
              {t("view.step2.noComments")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
