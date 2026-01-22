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

  return (
    <div className="stage-block">
      <p className="muted">{t("view.step4.description")}</p>

      {latest ? (
        <div style={{ marginTop: 12 }} className="flex items-center justify-between">
          <div>
            <strong>{latest.originalName}</strong>
            {latest.uploadedAt && (
              <div className="muted small">Uploaded: {new Date(latest.uploadedAt).toLocaleString()}</div>
            )}
            {lastComment && (
              <div className="muted small" style={{ marginTop: 6 }}>
                Last comment: <strong>{lastComment.text}</strong>{" "}
                <em>({new Date(lastComment.at).toLocaleString()})</em>
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
          {t("view.step4.noDraftYet", "No draft uploaded yet.")}
        </p>
      )}

      {!isAdmin && !latest && (
        <p className="muted small" style={{ marginTop: 12 }}>
          {t("view.step4.waitingForAdmin", "Waiting for admin to upload the draft.")}
        </p>
      )}

      {latest && latest.meta?.downloadedBy === user?.id && data.currentStage === 4 && (
        <div style={{ marginTop: 12 }}>
          <button className="btn-primary" disabled={!!confirming} onClick={() => onConfirmReceipt(latest.id)}>
            {confirming ? "Confirming..." : "Confirm you received the draft"}
          </button>
        </div>
      )}

      {isCurrent && (
        <div style={{ marginTop: 12 }}>
          <label className="block mb-2 font-medium">
            Add Comment {isAdmin ? "(for client)" : "(optional)"}
          </label>

          <textarea
            className="input-textarea"
            value={currentCommentValue}
            onChange={(e) => setCurrentCommentValue(e.target.value)}
            placeholder={
              isAdmin ? "Write a comment for the client..." : "Example: I found an error on page 2, line 5..."
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
              Cancel
            </button>

            <button
              className="btn-primary"
              onClick={() => onAddStepComment(currentCommentValue ?? "")}
              disabled={isAddingStepComment || !currentCommentValue?.trim()}
            >
              {isAddingStepComment ? "Sending..." : "Add Comment"}
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <h4 className="font-medium">Comments</h4>
        {commentHistory.length > 0 ? (
          <ul style={{ marginTop: 8 }}>
            {commentHistory.map((c: any, idx: number) => (
              <li key={idx} className="border rounded p-3 mb-2">
                <div style={{ fontSize: 12, color: "#666" }}>
                  <strong>{c.by === user?.id ? "You" : c.byName || c.byEmail}</strong> —{" "}
                  {c.at ? new Date(c.at).toLocaleString() : "unknown time"}
                </div>
                <div style={{ marginTop: 6 }}>{c.text}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small" style={{ marginTop: 8 }}>
            No comments yet.
          </p>
        )}
      </div>
    </div>
  );
}
