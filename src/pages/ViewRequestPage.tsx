// src/pages/ViewRequestPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";

export type StageId = 1 | 2 | 3 | 4 | 5;
type StageStatus = "completed" | "current" | "locked";

type SummaryBlock = {
  maritalStatus: string;
  childrenCount: number;
  incomes: string;
  properties: string;
  offerName: string;
  offerPrice: number;
  taxYear: number;
};

type RequiredDocument = {
  id: string;
  label: string;
  mandatory: boolean;
  status: "todo" | "uploaded";
};

type AdditionalQuestion = {
  id: string;
  label: string;
  answer?: string;
};

type SubmissionInfo = {
  date?: string;
  method?: string;
};

type InvoiceBlock = {
  offerName: string;
  totalAmount: string;
  invoiceUrl: string;
};

export type ViewRequestData = {
  id: string;
  taxYear: number;
  clientName: string;
  productName: string;
  currentStage: StageId;

  summary: SummaryBlock;

  step1: {
    documents: RequiredDocument[];
  };

  step2: {
    questions: AdditionalQuestion[];
  };

  step5?: SubmissionInfo;

  invoice: InvoiceBlock;
};

type ViewRequestContentProps = {
  data: ViewRequestData;
  onBackToDashboard: () => void;

  onUploadDocuments?: () => void;
  onSubmitStep1?: () => Promise<void> | void;
  onSubmitStep2?: (answers: Record<string, string>) => Promise<void> | void;
  onDownloadDraft?: () => void;
  onValidateDeclaration?: (comments: string) => Promise<void> | void;
  onDownloadFinal?: () => void;
  onUploadAssessmentNotice?: () => void;
  onDownloadInvoice?: (url: string) => void;
};

export function ViewRequestContent({
  data,
  onBackToDashboard,
  onUploadDocuments,
  onSubmitStep1,
  onSubmitStep2,
  onDownloadDraft,
  onValidateDeclaration,
  onDownloadFinal,
  onUploadAssessmentNotice,
  onDownloadInvoice,
}: ViewRequestContentProps) {
  const { t } = useTranslation();
  const [step2Answers, setStep2Answers] = useState<Record<string, string>>({});
  const [step4Comments, setStep4Comments] = useState("");
  // enable/disable optional docs في Step 1
  const [optionalEnabled, setOptionalEnabled] = useState<
    Record<string, boolean>
  >({});

  const { currentStage } = data;

  const stages: { id: StageId; titleKey: string; status: StageStatus }[] = [
    {
      id: 1,
      titleKey: "view.sections.initialUpload",
      status:
        currentStage > 1 ? "completed" : currentStage === 1 ? "current" : "locked",
    },
    {
      id: 2,
      titleKey: "view.sections.reviewDocuments",
      status:
        currentStage > 2 ? "completed" : currentStage === 2 ? "current" : "locked",
    },
    {
      id: 3,
      titleKey: "view.sections.prepareDeclaration",
      status:
        currentStage > 3 ? "completed" : currentStage === 3 ? "current" : "locked",
    },
    {
      id: 4,
      titleKey: "view.sections.validation",
      status:
        currentStage > 4 ? "completed" : currentStage === 4 ? "current" : "locked",
    },
    {
      id: 5,
      titleKey: "view.sections.submission",
      status:
        currentStage > 5 ? "completed" : currentStage === 5 ? "current" : "locked",
    },
  ];

  const handleSubmitStep2Internal = async () => {
    if (!onSubmitStep2) return;
    await onSubmitStep2(step2Answers);
  };

  const handleValidateInternal = async () => {
    if (!onValidateDeclaration) return;
    await onValidateDeclaration(step4Comments);
  };

  return (
    <div className="view-page">
      {/* Top bar */}
      <div className="view-top-bar">
        <button className="btn-secondary" onClick={onBackToDashboard}>
          {t("view.back")}
        </button>
      </div>

      <h1 className="view-title">{t("view.title")}</h1>

      {/* Initial form summary */}
      <section className="view-block">
        <h2>{t("view.formSummary")}</h2>

        <dl className="summary-grid">
          <div>
            <dt>{t("view.summary.maritalStatus")}</dt>
            <dd>{data.summary.maritalStatus}</dd>
          </div>
          <div>
            <dt>{t("view.summary.childrenCount")}</dt>
            <dd>{data.summary.childrenCount}</dd>
          </div>
          <div>
            <dt>{t("view.summary.incomes")}</dt>
            <dd>{data.summary.incomes}</dd>
          </div>
          <div>
            <dt>{t("view.summary.properties")}</dt>
            <dd>{data.summary.properties}</dd>
          </div>
          <div>
            <dt>{t("view.summary.offer")}</dt>
            <dd>{data.summary.offerName}</dd>
          </div>
          <div>
            <dt>{t("view.summary.price")}</dt>
            <dd>CHF {data.summary.offerPrice}.–</dd>
          </div>
          <div>
            <dt>{t("view.summary.taxYear")}</dt>
            <dd>{data.summary.taxYear}</dd>
          </div>
        </dl>
      </section>

      {/* Stages as dropdowns */}
      <section className="view-stages">
        {stages.map((stage) => {
          const isLocked = stage.status === "locked";
          const isCurrent = stage.status === "current";
          const isCompleted = stage.status === "completed";

          return (
            <details
              key={stage.id}
              className={
                "view-section" +
                (isLocked ? " is-locked" : "") +
                (isCurrent ? " is-current" : "") +
                (isCompleted ? " is-completed" : "")
              }
              open={isCurrent || stage.id === 1}
              onClick={(e) => {
                if (isLocked) e.preventDefault();
              }}
            >
              <summary>
                <div className="view-section-title-row">
                  <span>{t(stage.titleKey)}</span>
                  <span className="view-section-status">
                    {isLocked && t("view.status.locked")}
                    {isCurrent && t("view.status.current")}
                    {isCompleted && t("view.status.completed")}
                  </span>
                </div>
              </summary>

              <div className="view-section-content">
                {renderStageContent({
                  data,
                  stageId: stage.id,
                  status: stage.status,
                  t,
                  onUploadDocuments,
                  onSubmitStep1,
                  onDownloadDraft,
                  onDownloadFinal,
                  onUploadAssessmentNotice,
                  step2Answers,
                  setStep2Answers,
                  handleSubmitStep2Internal,
                  step4Comments,
                  setStep4Comments,
                  handleValidateInternal,
                  optionalEnabled,
                  setOptionalEnabled,
                })}
              </div>
            </details>
          );
        })}
      </section>

      {/* Invoice block */}
      <section className="view-block invoice-block">
        <h2>{t("view.invoice")}</h2>
        <p className="invoice-line">
          <span>{t("view.invoice.offer")}</span>
          <span>{data.invoice.offerName}</span>
        </p>
        <p className="invoice-line">
          <span>{t("view.invoice.total")}</span>
          <span>{data.invoice.totalAmount}</span>
        </p>
        <button
          className="btn-primary"
          onClick={() =>
            onDownloadInvoice
              ? onDownloadInvoice(data.invoice.invoiceUrl)
              : window.open(data.invoice.invoiceUrl, "_blank")
          }
        >
          {t("view.downloadInvoice")}
        </button>
      </section>

      <div style={{ marginTop: 24 }}>
        <button className="btn-secondary" onClick={onBackToDashboard}>
          {t("view.back")}
        </button>
      </div>
    </div>
  );
}

/** ----- Page with API calls ----- */

export default function ViewRequestPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<ViewRequestData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const declarationId = id!;

  const backToDashboard = () => {
    navigate("/dashboard");
  };

  const load = async () => {
    if (!user || !declarationId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await axiosClient.get(
        `/api/declarations/${declarationId}/request`
      );
      setData(res.data as ViewRequestData);
    } catch (e: any) {
      console.error(e);
      setError(
        e?.response?.data?.error ?? t("view.errors.loadFailed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, declarationId]);

  const handleSubmitStep1 = async () => {
    try {
      await axiosClient.post(
        `/api/declarations/${declarationId}/steps/1/submit`
      );
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Could not submit step 1");
    }
  };

  const handleSubmitStep2 = async (answers: Record<string, string>) => {
    try {
      await axiosClient.post(
        `/api/declarations/${declarationId}/steps/2/submit`,
        {
          answers,
        }
      );
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Could not submit step 2");
    }
  };

  const handleDownloadDraft = () => {
    window.open(`/api/declarations/${declarationId}/draft`, "_blank");
  };

  const handleValidateDeclaration = async (comments: string) => {
    try {
      await axiosClient.post(
        `/api/declarations/${declarationId}/steps/4/validate`,
        {
          comments,
        }
      );
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Could not validate declaration");
    }
  };

  const handleDownloadFinal = () => {
    window.open(`/api/declarations/${declarationId}/final`, "_blank");
  };

  const handleDownloadInvoice = (url: string) => {
    window.open(url, "_blank");
  };

  const handleUploadDocuments = () => {
    alert("TODO: Implement documents upload UI");
  };

  const handleUploadAssessmentNotice = () => {
    alert("TODO: Implement assessment notice upload UI");
  };

  if (isLoading && !data) {
    return (
      <div className="view-page">
        <p>{t("view.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-page">
        <p style={{ color: "red" }}>{error}</p>
        <button className="btn-secondary" onClick={backToDashboard}>
          {t("view.back")}
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="view-page">
        <p>{t("view.notFound")}</p>
        <button className="btn-secondary" onClick={backToDashboard}>
          {t("view.back")}
        </button>
      </div>
    );
  }

  return (
    <ViewRequestContent
      data={data}
      onBackToDashboard={backToDashboard}
      onUploadDocuments={handleUploadDocuments}
      onSubmitStep1={handleSubmitStep1}
      onSubmitStep2={handleSubmitStep2}
      onDownloadDraft={handleDownloadDraft}
      onValidateDeclaration={handleValidateDeclaration}
      onDownloadFinal={handleDownloadFinal}
      onUploadAssessmentNotice={handleUploadAssessmentNotice}
      onDownloadInvoice={handleDownloadInvoice}
    />
  );
}

/** ----- Helper to render each stage ----- */

type RenderProps = {
  data: ViewRequestData;
  stageId: StageId;
  status: StageStatus;
  t: (key: string) => string;
  onUploadDocuments?: () => void;
  onSubmitStep1?: () => Promise<void> | void;
  onDownloadDraft?: () => void;
  onDownloadFinal?: () => void;
  onUploadAssessmentNotice?: () => void;

  step2Answers: Record<string, string>;
  setStep2Answers: (
    fn: (prev: Record<string, string>) => Record<string, string>
  ) => void;
  handleSubmitStep2Internal: () => Promise<void> | void;

  step4Comments: string;
  setStep4Comments: (value: string) => void;
  handleValidateInternal: () => Promise<void> | void;

  optionalEnabled: Record<string, boolean>;
  setOptionalEnabled: (
    fn: (prev: Record<string, boolean>) => Record<string, boolean>
  ) => void;
};

function renderStageContent(props: RenderProps) {
  const {
    data,
    stageId,
    status,
    t,
    onUploadDocuments,
    onSubmitStep1,
    onDownloadDraft,
    onDownloadFinal,
    onUploadAssessmentNotice,
    step2Answers,
    setStep2Answers,
    handleSubmitStep2Internal,
    step4Comments,
    setStep4Comments,
    handleValidateInternal,
    optionalEnabled,
    setOptionalEnabled,
  } = props;

  const isCurrent = status === "current";
  const isCompleted = status === "completed";

  // Step 1
  if (stageId === 1) {
    return (
      <div className="stage-block">
        <p className="muted">{t("view.step1.description")}</p>

        <ul className="doc-list">
          {data.step1.documents.map((doc) => {
            const isOptional = !doc.mandatory;
            const optionalChecked =
              isOptional && !!optionalEnabled[doc.id];
            const showUpload = doc.mandatory || optionalChecked;

            return (
              <li key={doc.id} className="doc-item-row">
                <div className="doc-item-main">
                  <div className="doc-item-label-row">
                    <span>
                      {doc.label}
                      {doc.mandatory && " *"}
                    </span>

                    {isOptional && (
                      <label className="optional-toggle">
                        <input
                          type="checkbox"
                          checked={optionalChecked}
                          onChange={(e) =>
                            setOptionalEnabled((prev) => ({
                              ...prev,
                              [doc.id]: e.target.checked,
                            }))
                          }
                        />
                        {t("view.step1.addOptional")}
                      </label>
                    )}
                  </div>

                  {showUpload && (
                    <input
                      type="file"
                      accept="application/pdf"
                      className="doc-file-input"
                    />
                  )}
                </div>

                <span
                  className={
                    "doc-status" +
                    (doc.status === "uploaded"
                      ? " doc-status-ok"
                      : " doc-status-todo")
                  }
                >
                  {doc.status === "uploaded"
                    ? t("view.doc.status.uploaded")
                    : t("view.doc.status.todo")}
                </span>
              </li>
            );
          })}
        </ul>

        {isCurrent && (
          <>
            {onUploadDocuments && (
              <button className="btn-secondary" onClick={onUploadDocuments}>
                {t("view.step1.uploadBtn")}
              </button>
            )}
            <p className="muted small">{t("view.step1.saveInfo")}</p>
            {onSubmitStep1 && (
              <button
                className="btn-primary"
                onClick={() => {
                  onSubmitStep1();
                }}
              >
                {t("view.step1.submit")}
              </button>
            )}
          </>
        )}

        {isCompleted && (
          <p className="success-text">{t("view.step1.completed")}</p>
        )}
      </div>
    );
  }

  // Step 2
  if (stageId === 2) {
    return (
      <div className="stage-block">
        <p className="muted">{t("view.step2.description")}</p>

        {/* Recap صغير من البيانات الأساسية */}
        <div className="step2-recap">
          <h3 className="step2-recap-title">
            {t("view.step2.recapTitle")}
          </h3>
          <ul className="step2-recap-list">
            <li>
              <strong>{t("view.summary.maritalStatus")}:</strong>{" "}
              {data.summary.maritalStatus}
            </li>
            <li>
              <strong>{t("view.summary.childrenCount")}:</strong>{" "}
              {data.summary.childrenCount}
            </li>
            <li>
              <strong>{t("view.summary.incomes")}:</strong>{" "}
              {data.summary.incomes}
            </li>
            <li>
              <strong>{t("view.summary.properties")}:</strong>{" "}
              {data.summary.properties}
            </li>
          </ul>
        </div>

        {data.step2.questions.map((q) => (
          <div key={q.id} className="question-block">
            <p className="question-label">{q.label}</p>
            {isCurrent ? (
              <>
                <textarea
                  className="input-textarea"
                  value={step2Answers[q.id] ?? ""}
                  onChange={(e) =>
                    setStep2Answers((prev) => ({
                      ...prev,
                      [q.id]: e.target.value,
                    }))
                  }
                  placeholder={t("view.step2.answerPlaceholder")}
                />

                {/* رفع ملفات إضافية لكل سؤال (frontend فقط الآن) */}
                <div className="question-upload">
                  <label className="field-label">
                    {t("view.step2.uploadLabel")}
                  </label>
                  <input
                    type="file"
                    className="question-file-input"
                    // TODO: اربطوها مع API إذا حبيتو تستخدموها فعلياً
                  />
                  <p className="muted small">
                    {t("view.step2.uploadHint")}
                  </p>
                </div>
              </>
            ) : (
              <p className="muted">{q.answer || "—"}</p>
            )}
          </div>
        ))}

        {isCurrent && (
          <button className="btn-primary" onClick={handleSubmitStep2Internal}>
            {t("view.step2.submit")}
          </button>
        )}

        {isCompleted && (
          <p className="success-text">{t("view.step2.completed")}</p>
        )}
      </div>
    );
  }

  // Step 3
  if (stageId === 3) {
    return (
      <div className="stage-block">
        <p className="muted">{t("view.step3.text")}</p>
        <p className="muted small">{t("view.step3.eta")}</p>
      </div>
    );
  }

  // Step 4
  if (stageId === 4) {
    return (
      <div className="stage-block">
        <p className="muted">{t("view.step4.description")}</p>

        {onDownloadDraft && (
          <button className="btn-secondary" onClick={onDownloadDraft}>
            {t("view.step4.downloadDraft")}
          </button>
        )}

        {isCurrent && (
          <>
            <label className="field-label">{t("view.step4.comments")}</label>
            <textarea
              className="input-textarea"
              value={step4Comments}
              onChange={(e) => setStep4Comments(e.target.value)}
              placeholder={t("view.step4.comments.placeholder")}
            />

            <button className="btn-secondary" style={{ marginTop: 8 }}>
              {t("view.step4.uploadExtra")}
            </button>

            {/* Meeting link مفعّل لكل المستخدمين */}
            <p className="muted small" style={{ marginTop: 12 }}>
              {t("view.step4.meetingInfo")}{" "}
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noreferrer"
              >
                {t("view.step4.bookMeeting")}
              </a>
            </p>

            <button
              className="btn-primary"
              style={{ marginTop: 12 }}
              onClick={handleValidateInternal}
            >
              {t("view.step4.validate")}
            </button>
          </>
        )}

        {isCompleted && (
          <p className="success-text">{t("view.step4.completed")}</p>
        )}
      </div>
    );
  }

  // Step 5
  if (stageId === 5) {
    return (
      <div className="stage-block">
        <p className="muted">{t("view.step5.description")}</p>

        <ul className="submission-info">
          <li>
            <strong>{t("view.step5.date")}:</strong>{" "}
            {data.step5?.date || "—"}
          </li>
          <li>
            <strong>{t("view.step5.method")}:</strong>{" "}
            {data.step5?.method || "—"}
          </li>
        </ul>

        {onDownloadFinal && (
          <button className="btn-secondary" onClick={onDownloadFinal}>
            {t("view.step5.downloadFinal")}
          </button>
        )}

        {onUploadAssessmentNotice && (
          <div style={{ marginTop: 12 }}>
            <button
              className="btn-secondary"
              onClick={onUploadAssessmentNotice}
            >
              {t("view.step5.uploadAssessment")}
            </button>
          </div>
        )}

        <p className="success-text" style={{ marginTop: 12 }}>
          {t("view.step5.thanks")}
        </p>
      </div>
    );
  }

  return null;
}
