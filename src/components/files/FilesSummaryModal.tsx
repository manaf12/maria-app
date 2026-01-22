import { useEffect } from "react";
import {type FileEntity } from "../../types/declaration.types";

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
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between">
          <div>
            <h2 className="text-lg font-semibold">Uploaded Files</h2>
            <p className="text-sm text-slate-300">Documents for this declaration</p>
          </div>
          <button onClick={onClose} className="text-xl hover:opacity-80">
            ×
          </button>
        </div>

        <div className="p-6 max-h-[65vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileColumn title="Client Files" files={userFiles} onDownloadFile={onDownloadFile} />
          <FileColumn title="Admin Files" files={adminFiles} onDownloadFile={onDownloadFile} admin />
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            Close
          </button>
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
  return (
    <div>
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        {title}
        {admin && (
          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
            ADMIN
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
                  {file.documentType.replace(/_/g, " ")}
                </div>
              </div>

              <button
                onClick={() => onDownloadFile(file.id)}
                className="ml-4 shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                ⬇
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No files uploaded yet.</p>
      )}
    </div>
  );
}
