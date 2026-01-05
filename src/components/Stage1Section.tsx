/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";
import DocumentUploadItem, { type FileEntity } from "./DocumentUploadItem";
import { Step1Questions } from "./Step1Questions";

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
};

const REQUIRED_DOCUMENT_TYPES = [
  "salary_certificate",
  "bank_statement",
  "pillar_3_certificate",
  "property_deed_main",
  "property_deed_rental",
  "debt_statement",
  "medical_expense_receipt",
];

const OPTIONAL_DOCUMENT_TYPES = ["others"];

export default function Stage1Section({
  declaration,
  isCurrent,
  onUploadDocuments,
}: Stage1SectionProps) {
  const queryClient = useQueryClient();

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

  const invalidateDeclaration = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["declaration", declaration.id],
    });
  };

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
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">
              Step 1 — Documents & Questions
            </h3>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Documents progress</div>
            <div className="text-lg font-semibold">
              {requiredProgress.done}/{requiredProgress.total}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h4 className="font-semibold mb-3">Additional questions</h4>
        <Step1Questions
          declarationId={declaration.id}
          questions={[
            {
              id: "distanceToWork",
              label: "How far is your home from your workplace?",
            },
            {
              id: "familyMembers",
              label: "How many family members?",
              type: "number",
            },
          ]}
          initialAnswers={initialStep1Answers}
          onSaved={invalidateDeclaration}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {allDocTypesForUI.map((docType) => {
          const uploadedFiles = filesByType[docType] ?? [];
          const isMissing = !!declaredMissingMap[docType];
          const isOthers = docType === "others";
          const canEditDocType = isCurrent || isOthers;
          return (
            <div
              key={docType}
              className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg capitalize">
                    {docType.replace(/_/g, " ")}
                  </h4>
                  <div className="text-xs text-gray-500">
                    {isOthers ? "Optional" : "Required"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {uploadedFiles.length > 0 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                      Uploaded ({uploadedFiles.length})
                    </span>
                  )}
                  {isMissing && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                      Not available
                    </span>
                  )}
                  {!isMissing && uploadedFiles.length === 0 && !isOthers && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-700 border">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {uploadedFiles.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 border"
                    >
                      <span className="truncate">{file.originalName}</span>
                      <button
                        className="text-sm text-red-600 underline"
                        onClick={async () => {
                          if (!confirm("Delete this file?")) return;
                          await axiosClient.delete(`/files/${file.id}`);
                          await queryClient.invalidateQueries({
                            queryKey: ["declaration", declaration.id],
                          });
                        }}
                      >
                        Delete
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
                  allowMultiple={isOthers} // others يسمح multiple
                  disableMissing={isOthers} // others لا يوجد missing
                  onUpload={(file) => uploadOne(docType, file)}
                  onUploadMultiple={(files) => uploadMultiple(docType, files)}
                  onMarkMissing={(reason) => markMissing(docType, reason)}
                  onUndoMissing={() => undoMissing(docType)}
                />
              ) : (
                <p className="text-sm text-gray-500">
                  This step is not currently editable.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
