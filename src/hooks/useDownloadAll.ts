// src/hooks/useDownloadAll.ts
import { useCallback, useState } from "react";
import {
  downloadAllFilesAsZip,
  type DownloadAllProgress,
} from "../utils/downloadAllFiles";
import type { FileEntity } from "../types/declaration.types";

type DownloadAllOutcome =
  | { ok: true; failed: { id: string; name: string }[] }
  | { ok: false; reason: string };

export function useDownloadAll() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadAllProgress | null>(null);

  const downloadAll = useCallback(
    async (files: FileEntity[], zipName?: string): Promise<DownloadAllOutcome | undefined> => {
      if (isDownloading) return; // guard against double-clicks
      setIsDownloading(true);
      setProgress({ completed: 0, total: files?.length ?? 0, failed: [] });

      try {
        const { failed } = await downloadAllFilesAsZip(files, {
          zipName,
          onProgress: setProgress,
        });
        return { ok: true, failed };
      } catch (e: any) {
        return { ok: false, reason: e?.message ?? "DOWNLOAD_FAILED" };
      } finally {
        setIsDownloading(false);
      }
    },
    [isDownloading]
  );

  return { downloadAll, isDownloading, progress };
}