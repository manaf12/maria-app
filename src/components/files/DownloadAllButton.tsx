// src/components/files/DownloadAllButton.tsx
import { useTranslation } from "react-i18next";
import { DownloadIcon } from "../Icons";
import { useDownloadAll } from "../../hooks/useDownloadAll";
import type { FileEntity } from "../../types/declaration.types";

type Props = {
  files: FileEntity[];
  zipName?: string;
  className?: string;
};

export default function DownloadAllButton({ files, zipName, className }: Props) {
  const { t } = useTranslation();
  const { downloadAll, isDownloading, progress } = useDownloadAll();

  const count = files?.length ?? 0;
  if (count === 0) return null; // nothing to download → no button

  const handleClick = async () => {
    const result = await downloadAll(files, zipName ?? "documents.zip");
    if (!result) return;

    if (!result.ok) {
      alert(
        t("filesModal.downloadAllFailed", {
          defaultValue: "Could not download the files. Please try again.",
        })
      );
      return;
    }

    if (result.failed.length > 0) {
      alert(
        t("filesModal.downloadAllPartial", {
          count: result.failed.length,
          defaultValue: `${result.failed.length} file(s) could not be downloaded.`,
        })
      );
    }
  };

  const label =
    isDownloading && progress
      ? t("filesModal.downloadingProgress", {
          completed: progress.completed,
          total: progress.total,
          defaultValue: `Preparing ${progress.completed}/${progress.total}…`,
        })
      : t("filesModal.downloadAll", {
          count,
          defaultValue: `Download all (${count})`,
        });

  return (
    <button
      type="button"
      className={className ?? "download-all-btn"}
      onClick={handleClick}
      disabled={isDownloading}
      aria-busy={isDownloading}
    >
      <DownloadIcon size={16} color="#ffffff" />
      <span>{label}</span>
    </button>
  );
}