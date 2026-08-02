import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { type FileEntity } from "../../types/declaration.types";
import { DownloadIcon } from "../Icons";
import DownloadAllButton from "./DownloadAllButton";

type Props = {
  files: FileEntity[];
  onDownloadFile: (fileId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  declarationId?: string;
};

export default function FilesSummaryModal({
  files,
  onDownloadFile,
  isOpen,
  onClose,
  isAdmin = false,
  declarationId,
}: Props) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusable.length) {
        event.preventDefault();
        modalRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handler);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const userFiles = (files ?? []).filter((f) => f.meta?.uploaderRole !== "admin");
  const adminFiles = (files ?? []).filter((f) => f.meta?.uploaderRole === "admin");

  return (
    <div className="files-modal-overlay">
      <div className="files-modal-backdrop" onClick={onClose} />

      <div
        ref={modalRef}
        className="files-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="files-modal-title"
        tabIndex={-1}
      >
        <div className="files-modal-header">
          <div>
            <h2 id="files-modal-title" className="files-modal-title">
              {t("filesModal.title")}
            </h2>
            <p className="files-modal-subtitle">{t("filesModal.subtitle")}</p>
          </div>

          <div className="files-modal-actions">
            {isAdmin && (
              <DownloadAllButton
                files={files ?? []}
                zipName={`declaration-${declarationId ?? "files"}.zip`}
              />
            )}

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="files-modal-close"
              style={{ textDecoration: "none", color: "#ffffff", padding: "8px", borderRadius: "4px" }}
            >
              {t("common.close")}
            </button>
          </div>

        </div>



        <div className="files-modal-body">
          <FileColumn
            title={t("filesModal.clientFiles")}
            files={userFiles}
            onDownloadFile={onDownloadFile}
          />
          <FileColumn
            title={t("filesModal.adminFiles")}
            files={adminFiles}
            onDownloadFile={onDownloadFile}
          />
        </div>

      </div>
    </div>
  );
}

function FileColumn({
  title,
  files,
  onDownloadFile,
  admin = false,
}: {
  title: string;
  files: FileEntity[];
  onDownloadFile: (id: string) => void;
  admin?: boolean;
}) {
  const { t } = useTranslation(); // ✅ i18n

  return (
    <div>
      <h3 className="files-modal-column-title">
        {title}
        {admin && (
          <span className="files-modal-admin-badge">
            {t("common.admin")}
          </span>
        )}
      </h3>

      {files.length ? (
        <ul className="file-list">
          {files.map((file) => (
            <li
              key={file.id}
              className="file-row"
            >
              <div className="file-row-left">
                <span className="file-icon">PDF</span>

                <div className="file-meta">
                  <div className="file-name">{file.originalName}</div>

                  <div className="file-type">
                    {t(`documentTypes.${file.documentType}`, {
                      defaultValue: file.documentType.replace(/_/g, " "),
                    })}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDownloadFile(file.id)}
                className="file-download-btn"
                aria-label={t("filesModal.downloadAria")}
              >
                <DownloadIcon size={18} color="#ffffff" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="files-modal-empty">{t("filesModal.empty")}</p>
      )}
    </div>
  );
}
