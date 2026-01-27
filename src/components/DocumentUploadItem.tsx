/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";

export type FileEntity = {
  id: string;
  documentType: string;
  originalName: string;
};

export type DocumentUploadItemProps = {
  declarationId: string;
  documentType: string;

  uploadedFiles: FileEntity[]; // من السيرفر
  isMissing: boolean; // من السيرفر

  onUpload: (file: File) => Promise<void>;
  onUploadMultiple?: (files: File[]) => Promise<void>;

  onMarkMissing: (reason?: string) => Promise<void>;
  onUndoMissing: () => Promise<void>;

  allowMultiple?: boolean; // مهم لـ "others"
  disableMissing?: boolean; // مهم لـ "others"
};

export default function DocumentUploadItem({
  documentType,
  uploadedFiles,
  isMissing,
  onUpload,
  onUploadMultiple,
  onMarkMissing,
  onUndoMissing,
  allowMultiple = false,
  disableMissing = false,
}: DocumentUploadItemProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [missingReason, setMissingReason] = useState("");
  const [showMissingBox, setShowMissingBox] = useState(false);
  const [busy, setBusy] = useState<"upload" | "missing" | "undo" | null>(null);

  const canUpload = !isMissing;
  const canMarkMissing = !disableMissing && uploadedFiles.length === 0 && !isMissing;

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles(files);
      e.target.value = "";
  };

  const doUpload = async () => {
    if (!selectedFiles.length) return;
    setBusy("upload");
    try {
      if (allowMultiple && onUploadMultiple) {
        await onUploadMultiple(selectedFiles);
      } else {
        await onUpload(selectedFiles[0]);
      }
      setSelectedFiles([]);
      setShowMissingBox(false);
      setMissingReason("");
    } finally {
      setBusy(null);
    }
  };

  const doMarkMissing = async () => {
    setBusy("missing");
    try {
      await onMarkMissing(missingReason || undefined);
      setShowMissingBox(false);
      setMissingReason("");
    } finally {
      setBusy(null);
    }
  };

  const doUndo = async () => {
    setBusy("undo");
    try {
      await onUndoMissing();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload */}
      {canUpload && (
        <div className="flex items-center gap-2">
          <input
            id={`file-${documentType}`}
            type="file"
            accept="application/pdf"
            multiple={allowMultiple}
            hidden
            onChange={onPickFiles}
          />
          <button
            className="btn btn-secondary"
            onClick={() => document.getElementById(`file-${documentType}`)?.click()}
          >
            {selectedFiles.length
              ? allowMultiple
                ? `${selectedFiles.length} file(s) selected`
                : selectedFiles[0].name
              : "Choose file"}
          </button>

          <button
            className="btn btn-primary"
            disabled={!selectedFiles.length || busy === "upload"}
            onClick={doUpload}
          >
            {busy === "upload" ? "Uploading..." : "Upload"}
          </button>
        </div>
      )}

      {/* Mark missing */}
      {canMarkMissing && (
        <button
          className="text-sm text-gray-500 underline"
          onClick={() => setShowMissingBox(true)}
        >
          I don’t have this document
        </button>
      )}

      {showMissingBox && canMarkMissing && (
        <div className="rounded-lg border bg-gray-50 p-3 space-y-2">
          <input
            className="w-full p-2 border rounded"
            placeholder="Reason (optional)"
            value={missingReason}
            onChange={(e) => setMissingReason(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="btn btn-outline" onClick={() => setShowMissingBox(false)}>
              Cancel
            </button>
            <button className="btn btn-warning" disabled={busy === "missing"} onClick={doMarkMissing}>
              {busy === "missing" ? "Saving..." : "Confirm not available"}
            </button>
          </div>
        </div>
      )}

      {/* Undo */}
      {isMissing && (
        <button className="btn btn-outline btn-sm" disabled={busy === "undo"} onClick={doUndo}>
          {busy === "undo" ? "Undo..." : "Undo"}
        </button>
      )}
    </div>
  );
}
