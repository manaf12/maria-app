import { useEffect } from "react";
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

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const userFiles = (files ?? []).filter((f) => f.meta?.uploaderRole !== "admin");
  const adminFiles = (files ?? []).filter((f) => f.meta?.uploaderRole === "admin");

  return (
    <div className="files-modal-overlay">
      <div className="files-modal-backdrop" onClick={onClose} />

      <div className="files-modal">
        <div className="files-modal-header">
          <div>
            <h2 className="text-lg font-semibold">{t("filesModal.title")}</h2>
            <p className="text-sm text-white/70">{t("filesModal.subtitle")}</p>
          </div>

          {/* <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-md
               hover:bg-white/10 active:bg-white/20 transition"
            aria-label={t("filesModal.closeAria")}
          >
            <CloseIcon size={18} color="#ffffff" />
          </button> */}

          <div className="p-4 border-t bg-gray-50 flex justify-end" style={{ gap: 10 }}>
            {isAdmin && (
              <DownloadAllButton
                files={files ?? []}
                zipName={`declaration-${declarationId ?? "files"}.zip`}
              />
            )}

            <button
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
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        {title}
        {admin && (
          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
            {t("common.admin")}
          </span>
        )}
      </h3>

      {files.length ? (
        <ul className="space-y-3">
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
        <p className="text-gray-500">{t("filesModal.empty")}</p>
      )}
    </div>
  );
}
