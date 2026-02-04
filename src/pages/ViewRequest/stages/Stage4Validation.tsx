/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TFunction } from "i18next";
import type { User, ViewRequestData } from "../../../types/declaration.types";

type Props = {
  data: ViewRequestData;
  isAdmin: boolean;
  isCurrent: boolean;
  t: TFunction;

  user: User | null;

  confirming: boolean;
  isAddingStepComment: boolean;

  step4UserComment: string;
  setStep4UserComment: (v: string) => void;
  step4AdminComment: string;
  setStep4AdminComment: (v: string) => void;

  onDownloadFile: (fileId: string) => void;
  onConfirmReceipt: (fileId?: string) => Promise<void> | void;
  onAddStepComment: (comment: string) => Promise<void> | void;
};

export default function Stage4Validation({
  data,
  isAdmin,
  isCurrent,
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
}: Props) {
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
    <div className="stage-block">
      <p className="muted">{t("view.step4.description")}</p>

      {latest ? (
        <div style={{ marginTop: 12 }} className="flex items-center justify-between">
          <div>
            <strong>{latest.originalName}</strong>
            {latest.uploadedAt && (
              <div className="muted small">
                {t("view.step4.uploadedAt")} {formatDateTime(latest.uploadedAt)}
              </div>
            )}
            {lastComment && (
              <div className="muted small" style={{ marginTop: 6 }}>
                {t("view.step4.lastComment")} <strong>{lastComment.text}</strong>{" "}
                <em>({formatDateTime(lastComment.at)})</em>
              </div>
            )}
          </div>

          <div>
            <button className="btn-secondary" onClick={() => onDownloadFile(latest.id)}>
              {t("view.download")}
            </button>
          </div>
        </div>
      ) : (
        <p className="muted" style={{ marginTop: 12 }}>
          {t("view.step4.noDraftYet")}
        </p>
      )}

      {!isAdmin && !latest && (
        <p className="muted small" style={{ marginTop: 12 }}>
          {t("view.step4.waitingForAdmin")}
        </p>
      )}

      {latest && hasUserDownloadedLatest && data.currentStage === 4 && (
        <div style={{ marginTop: 12 }}>
          <button className="btn-primary" disabled={!!confirming} onClick={() => onConfirmReceipt(latest.id)}>
            {confirming
              ? t("view.step4.confirming")
              : t("view.step4.confirmReceipt")}
          </button>
        </div>
      )}

      {isCurrent && (
        <div style={{ marginTop: 12 }}>
          <label className="block mb-2 font-medium">
            {t("view.step4.addComment.label")}{" "}
            {isAdmin
              ? t("view.step4.addComment.forClient")
              : t("view.step4.addComment.optional")}
          </label>

          <textarea
            className="input-textarea"
            value={currentCommentValue}
            onChange={(e) => setCurrentCommentValue(e.target.value)}
            placeholder={
              isAdmin
                ? t("view.step4.addComment.placeholderAdmin")
                : t("view.step4.addComment.placeholderUser")
            }
            rows={4}
          />

          <div style={{ marginTop: 8 }}>
            <button
              className="btn-secondary"
              onClick={() => setCurrentCommentValue("")}
              disabled={isAddingStepComment}
              style={{ marginRight: 8 }}
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

      <div style={{ marginTop: 16 }}>
        <h4 className="font-medium">{t("view.step4.comments.title")}</h4>
        {commentHistory.length > 0 ? (
          <ul style={{ marginTop: 8 }}>
            {commentHistory.map((c: any, idx: number) => (
              <li key={idx} className="border rounded p-3 mb-2">
                <div style={{ fontSize: 12, color: "#666" }}>
                  <strong>
                    {c.by === user?.id ? t("common.you") : c.byName || c.byEmail || t("common.unknown")}
                  </strong>{" "}
                  — {c.at ? formatDateTime(c.at) : t("common.unknownTime")}
                </div>
                <div style={{ marginTop: 6 }}>{c.text}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small" style={{ marginTop: 8 }}>
            {t("view.step4.comments.empty")}
          </p>
        )}
      </div>
    </div>
  );
}
