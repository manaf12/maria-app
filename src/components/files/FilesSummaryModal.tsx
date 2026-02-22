import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { type FileEntity } from "../../types/declaration.types";
import { DownloadIcon } from "../Icons";


type Props = {
  files: FileEntity[];
  onDownloadFile: (fileId: string) => void;
  isOpen: boolean;
  onClose: () => void;
};

export default function FilesSummaryModal({
  files,
  onDownloadFile,
  isOpen,
  onClose,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 bg-[#163E64] text-white flex justify-between items-center">
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
          
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-5 bg-[#163E64] text-white rounded-lg
               hover:bg-[#0F2A4A] active:scale-[0.98] transition
               focus:outline-none focus:ring-2 focus:ring-[#163E64]/30 
               no-underline !no-underline"
            style={{ textDecoration: "none" , color:"#ffffff",padding:"8px", borderRadius:"4px" }}
          >
            {t("common.close")}
          </button>
        </div>

        </div>



        <div className="p-6 max-h-[65vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
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
              className="group flex items-center justify-between p-4 rounded-xl border bg-white shadow-sm hover:shadow-lg transition-all duration-200"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{file.originalName}</div>
                <div className="text-sm text-gray-500 capitalize">
                  {/* keep current behavior, but allow translating doc types if you want */}
                  {t(`documentTypes.${file.documentType}`, {
                    defaultValue: file.documentType.replace(/_/g, " "),
                  })}
                </div>
              </div>

              <button
                onClick={() => onDownloadFile(file.id)}
                className="ml-4 shrink-0 p-2 rounded-lg bg-[#163E64] text-white hover:bg-[#0F2A4A] transition"
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
