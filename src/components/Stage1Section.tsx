/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";
import DocumentUploadItem, { type FileEntity } from "./DocumentUploadItem";
import { Step1Questions, type Step1Question } from "./Step1Questions";
import { useTranslation } from "react-i18next";

// import type { Step1Question } from "./Step1Questions";
type Step = { id: string; meta?: any };
type Stage1SectionProps = {
  declaration: {
    id: string;
    files?: FileEntity[];
    steps?: Step[];
    questionnaireSnapshot?: any;
  };
  isCurrent: boolean;
  onUploadDocuments?: () => void;
  lockEditing?: boolean;
};

const REQUIRED_DOCUMENT_TYPES = [
  "previous_tax_return",
  "salary_certificate",
  "bank_statement",
  "pillar_3_certificate",
  "medical_expense_receipt",
  "taxero_invoice_payment_proof",
];

const OPTIONAL_DOCUMENT_TYPES = ["others"];

export default function Stage1Section({
  declaration,
  isCurrent,
  onUploadDocuments,
  lockEditing = false,
}: Stage1SectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [confirming, setConfirming] = React.useState(false);
  const [step1Questions, setStep1Questions] = React.useState<Step1Question[]>(
    [],
  );
  const [questionsLoading, setQuestionsLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setQuestionsLoading(true);
      try {
        const res = await axiosClient.get<{ questions: Step1Question[] }>(
          `/files/${declaration.id}/step1/questions`,
        );
        if (!mounted) return;
        setStep1Questions(res.data.questions ?? []);
      } catch (e) {
        console.error("Failed to load Step 1 questions", e);
        if (!mounted) return;
        setStep1Questions([]);
      } finally {
        if (mounted) setQuestionsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [declaration.id]);

  const [confirmError, setConfirmError] = React.useState<{
    missingDocs?: string[];
    missingQuestions?: string[];
    message?: string;
  } | null>(null);

  const step1 = useMemo(() => {
    return (declaration.steps ?? []).find((s) => s.id === "documentsPreparation");
  }, [declaration.steps]);

  const step1Status = (step1 as any)?.status ?? "PENDING";

  const invalidateDeclaration = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["declaration", declaration.id],
    });
  };

  const confirmStep1 = async () => {
    setConfirming(true);
    setConfirmError(null);
    try {
      await axiosClient.post(
        `/orders/${declaration.id}/steps/documentsPreparation/confirm`,
      );
      await invalidateDeclaration();
    } catch (e: any) {
      const data = e?.response?.data;
      setConfirmError({
        message: data?.message ?? "Could not confirm Step 1",
        missingDocs: data?.missingDocs ?? [],
        missingQuestions: data?.missingQuestions ?? [],
      });
    } finally {
      setConfirming(false);
    }
  };

  const filesByType = useMemo(() => {
    return (declaration.files ?? []).reduce((acc, file) => {
      (acc[file.documentType] ??= []).push(file);
      return acc;
    }, {} as Record<string, FileEntity[]>);
  }, [declaration.files]);

  const declaredMissingMap = useMemo(() => {
    const documentsStep = (declaration.steps ?? []).find(
      (s) => s.id === "documentsPreparation",
    );
    const missingMeta = documentsStep?.meta?.missingDocs ?? [];
    const map: Record<string, boolean> = {};
    (missingMeta as any[]).forEach((m) => {
      if (m?.documentType) map[m.documentType] = true;
    });
    return map;
  }, [declaration.steps]);

  const initialStep1Answers =
    declaration.questionnaireSnapshot?.step1Answers ?? {};

  const uploadOne = async (docType: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("documentType", docType);

    await axiosClient.post(`/files/${declaration.id}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    await invalidateDeclaration();
    onUploadDocuments?.();
  };

  const uploadMultiple = async (docType: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    form.append("documentType", docType);

    await axiosClient.post(`/files/${declaration.id}/upload-multiple`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    await invalidateDeclaration();
    onUploadDocuments?.();
  };

  const markMissing = async (docType: string, reason?: string) => {
    await axiosClient.post(
      `/files/${declaration.id}/documents/${docType}/missing`,
      { reason },
    );
    await invalidateDeclaration();
  };

  const undoMissing = async (docType: string) => {
    await axiosClient.delete(
      `/files/${declaration.id}/documents/${docType}/missing`,
    );
    await invalidateDeclaration();
  };

  const requiredProgress = useMemo(() => {
    let done = 0;
    REQUIRED_DOCUMENT_TYPES.forEach((docType) => {
      const hasFiles = (filesByType[docType] ?? []).length > 0;
      const isMissing = !!declaredMissingMap[docType];
      if (hasFiles || isMissing) done += 1;
    });
    return { done, total: REQUIRED_DOCUMENT_TYPES.length };
  }, [filesByType, declaredMissingMap]);

  const allDocTypesForUI = [
    ...REQUIRED_DOCUMENT_TYPES,
    ...OPTIONAL_DOCUMENT_TYPES,
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg">{t("step1.title")}</h3>
            <p className="mt-1 text-sm text-gray-500">{t("step1.subtitle")}</p>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-sm text-gray-500">{t("step1.progressLabel")}</div>
            <div className="text-lg font-semibold">
              {requiredProgress.done}/{requiredProgress.total}
            </div>
          </div>
        </div>

        {lockEditing && (
          <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            {t("step1.lockMessage")}
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="rounded-xl border bg-white p-4">
        <h4 className="font-semibold mb-3">{t("step1.additionalQuestions")}</h4>
        {questionsLoading ? (
          <div className="text-sm text-gray-500">{t("step1.loadingQuestions")}</div>
        ) : (
          <Step1Questions
            declarationId={declaration.id}
            questions={step1Questions}
            initialAnswers={initialStep1Answers}
            onSaved={invalidateDeclaration}
            disabled={lockEditing}
          />
        )}
      </div>

      {/* Documents grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {allDocTypesForUI.map((docType) => {
          const uploadedFiles = filesByType[docType] ?? [];
          const isMissing = !!declaredMissingMap[docType];
          const isOthers = docType === "others";
          const canEditDocType = !lockEditing && (isCurrent || isOthers);

          return (
            <div
              key={docType}
              className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg capitalize">
                    {t(`documents.${docType}.title`)}
                  </h4>
                  <div className="text-xs text-gray-500">
                    {isOthers ? t("common.optional") : t("common.required")}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {uploadedFiles.length > 0 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                      {t("step1.uploadedCount", { count: uploadedFiles.length })}
                    </span>
                  )}
                  {isMissing && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                      {t("step1.notAvailable")}
                    </span>
                  )}
                  {!isMissing && uploadedFiles.length === 0 && !isOthers && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-700 border">
                      {t("step1.pending")}
                    </span>
                  )}
                </div>
              </div>

              {/* Uploaded files list - improved UI */}
              {uploadedFiles.length > 0 && (
                <ul className="mb-4 list-none p-0 m-0 space-y-2">
                  {uploadedFiles.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2 shadow-sm hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          aria-hidden="true"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 text-red-600"
                        >
                          📄
                        </span>
                        <span className="truncate font-medium text-gray-800">
                          {file.originalName}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={`delete-btn ${lockEditing ? "cursor-not-allowed" : ""}`}
                        disabled={lockEditing}
                        onClick={async () => {
                          if (lockEditing) return;

                          const fileName = file.originalName ?? t("common.thisFile");
                          const msg = String(
                            t("step1.confirmDeleteFile", { fileName }),
                          );

                          if (!confirm(msg)) return;

                          await axiosClient.delete(`/files/${file.id}`);
                          await queryClient.invalidateQueries({
                            queryKey: ["declaration", declaration.id],
                          });
                        }}
                      >
                        {t("common.delete")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {canEditDocType ? (
                <DocumentUploadItem
                  declarationId={declaration.id}
                  documentType={docType}
                  uploadedFiles={uploadedFiles}
                  isMissing={isMissing}
                  allowMultiple={isOthers}
                  disableMissing={isOthers}
                  onUpload={(file) => uploadOne(docType, file)}
                  onUploadMultiple={(files) => uploadMultiple(docType, files)}
                  onMarkMissing={(reason) => markMissing(docType, reason)}
                  onUndoMissing={() => undoMissing(docType)}
                />
              ) : (
                <p className="text-sm text-gray-500">{t("step1.notEditable")}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Step status + confirm */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500">{t("step1.stepStatusLabel")}</div>
            <div className="font-semibold">
              {String(t(`stepStatus.${step1Status}`, { defaultValue: step1Status }))}
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-[10px] border border-gray-900 bg-gray-900 px-4 py-[10px] text-sm font-semibold leading-[18px] text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={confirming || lockEditing}
            onClick={() => {
              if (lockEditing) return;
              if (!confirm(String(t("step1.confirmStep1Prompt")))) return;
              confirmStep1();
            }}
          >
            {confirming ? t("step1.confirming") : t("step1.confirmStep1")}
          </button>
        </div>

        {confirmError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
            <div className="font-semibold text-red-700">{t("step1.notReady")}</div>

            {import.meta.env.MODE === "development" && confirmError.message && (
              <div className="mt-1 text-xs text-red-700/80">
                {String(confirmError.message ?? "")}
              </div>
            )}

            {(confirmError.missingDocs?.length ?? 0) > 0 && (
              <div className="mt-2">
                <div className="font-medium text-red-700">
                  {t("step1.missingDocuments")}
                </div>
                <ul className="list-disc pl-5">
                  {confirmError.missingDocs!.map((d) => (
                    <li key={d}>{t(`documents.${d}.title`)}</li>
                  ))}
                </ul>
              </div>
            )}

            {(confirmError.missingQuestions?.length ?? 0) > 0 && (
              <div className="mt-2">
                <div className="font-medium text-red-700">
                  {t("step1.missingQuestions")}
                </div>
                <ul className="list-disc pl-5">
                  {confirmError.missingQuestions!.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
