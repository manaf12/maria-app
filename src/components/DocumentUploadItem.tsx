/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from "react";

export type FileEntity = {
  id: string;
  documentType: string;
  originalName: string;
};

export type DocumentUploadItemProps = {
  declarationId: string;
  documentType: string;
  uploadedFiles: FileEntity[];
  isMissing: boolean;
  onUpload: (file: File) => Promise<void>;
  onUploadMultiple?: (files: File[]) => Promise<void>;
  onMarkMissing: (reason?: string) => Promise<void>;
  onUndoMissing: () => Promise<void>;
  allowMultiple?: boolean;
  disableMissing?: boolean;
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
  // const { t } = useTranslation();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showMissingBox, setShowMissingBox] = useState(false);
  const [missingReason, setMissingReason] = useState("");
  const [busy, setBusy] = useState<"upload" | "missing" | "undo" | null>(null);

  const inputId = `file-${documentType}`;
  const canUpload = !isMissing;
  const canMarkMissing =
    !disableMissing && uploadedFiles.length === 0 && !isMissing;

  const pickLabel = useMemo(() => {
    if (!selectedFiles.length) return "Choose file";
    if (!allowMultiple) return selectedFiles[0].name;
    return `${selectedFiles.length} files selected`;
  }, [allowMultiple, selectedFiles]);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles(files);
    e.target.value = "";
  };

  const doUpload = async () => {
    if (!selectedFiles.length) return;
    setBusy("upload");
    try {
      if (allowMultiple && onUploadMultiple) await onUploadMultiple(selectedFiles);
      else await onUpload(selectedFiles[0]);
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
      setSelectedFiles([]);
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

  const styles = {
    card: {
      border: "1px solid #E5E7EB",
      borderRadius: 12,
      padding: 16,
      background: "#fff",
    } as React.CSSProperties,
    row: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    } as React.CSSProperties,
    btn: {
      border: "1px solid #E5E7EB",
      background: "#fff",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: 14,
      fontWeight: 600,
      color: "#111827",
      cursor: "pointer",
      lineHeight: "18px",
    } as React.CSSProperties,
    btnPrimary: {
      border: "1px solid #111827",
      background: "#111827",
      color: "#fff",
    } as React.CSSProperties,
    link: {
      marginLeft: "auto",
      fontSize: 14,
      color: "#111827",
      background: "transparent",
      border: "none",
      textDecoration: "underline",
      cursor: "pointer",
      padding: 0,
    } as React.CSSProperties,
    input: {
      width: "100%",
      border: "1px solid #E5E7EB",
      borderRadius: 10,
      padding: "10px 12px",
      fontSize: 14,
      outline: "none",
    } as React.CSSProperties,
    subtleBox: {
      marginTop: 12,
      border: "1px solid #E5E7EB",
      borderRadius: 12,
      padding: 14,
      background: "#F9FAFB",
    } as React.CSSProperties,
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {canUpload && (
        <div style={styles.card}>
          <input
            id={inputId}
            type="file"
            accept="application/pdf"
            multiple={allowMultiple}
            hidden
            onChange={onPickFiles}
          />

          <div style={styles.row}>
            <button
              type="button"
              style={styles.btn}
              onClick={() => document.getElementById(inputId)?.click()}
              disabled={busy === "upload"}
              title={pickLabel}
            >
              {pickLabel}
            </button>

            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnPrimary, opacity: !selectedFiles.length || busy === "upload" ? 0.5 : 1 }}
              disabled={!selectedFiles.length || busy === "upload"}
              onClick={doUpload}
            >
              {busy === "upload" ? "Uploading…" : "Upload"}
            </button>

            {canMarkMissing && (
              <button
                type="button"
                style={styles.link}
                onClick={() => setShowMissingBox(true)}
                disabled={selectedFiles.length > 0}
                title={selectedFiles.length ? "Clear selection first" : undefined}
              >
                I don’t have this document
              </button>
            )}
          </div>

          {selectedFiles.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 14, color: "#374151" }}>
              <strong>Selected:</strong>{" "}
              {allowMultiple ? `${selectedFiles.length} files` : selectedFiles[0].name}
            </div>
          )}

          {showMissingBox && canMarkMissing && (
            <div style={styles.subtleBox}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                Mark as not available
              </div>

              <div style={{ marginTop: 10 }}>
                <input
                  style={styles.input}
                  value={missingReason}
                  onChange={(e) => setMissingReason(e.target.value)}
                  placeholder="Reason (optional)"
                />
              </div>

              <div style={{ ...styles.row, marginTop: 12 }}>
                <button
                  type="button"
                  style={styles.btn}
                  onClick={() => setShowMissingBox(false)}
                  disabled={busy === "missing"}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={{ ...styles.btn, ...styles.btnPrimary, opacity: busy === "missing" ? 0.6 : 1 }}
                  onClick={doMarkMissing}
                  disabled={busy === "missing"}
                >
                  {busy === "missing" ? "Saving…" : "Confirm not available"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isMissing && (
        <div style={styles.card}>
          <div style={styles.row}>
            <div style={{ fontSize: 14, color: "#374151" }}>
              Marked as not available.
            </div>
            <button
              type="button"
              style={{ ...styles.btn, marginLeft: "auto", opacity: busy === "undo" ? 0.6 : 1 }}
              onClick={doUndo}
              disabled={busy === "undo"}
            >
              {busy === "undo" ? "Undoing…" : "Undo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
