// src/utils/downloadAllFiles.ts
//
// Bundles multiple declaration files into a single .zip and triggers one download.
// No backend change required: it reuses the existing presigned-URL flow
// (declarationActions.getFileUrl) and zips on the client with JSZip.
//
// Install once:  npm i jszip
//
import JSZip from "jszip";
import { declarationActions } from "../services/declarationActions.service";
import type { FileEntity } from "../types/declaration.types";

const DEFAULT_CONCURRENCY = 4;

export type DownloadAllProgress = {
  completed: number;
  total: number;
  failed: { id: string; name: string }[];
};

type DownloadAllOptions = {
  zipName?: string;
  concurrency?: number;
  onProgress?: (p: DownloadAllProgress) => void;
};

export type DownloadAllResult = {
  failed: { id: string; name: string }[];
  total: number;
};

/** Resolve a presigned URL for a file, then fetch it as a Blob. */
async function fetchFileBlob(file: FileEntity): Promise<Blob> {
  const { data } = await declarationActions.getFileUrl(file.id);
  const url: string | undefined = data?.url;
  if (!url) throw new Error(`No URL returned for file ${file.id}`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} while fetching file ${file.id}`);
  return res.blob();
}

/**
 * Returns a function that guarantees unique names inside the zip:
 * report.pdf, report (1).pdf, report (2).pdf, ...
 */
function makeUniqueNamer() {
  const seen = new Map<string, number>();
  return (rawName: string): string => {
    const name = rawName?.trim() || "document.pdf";
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    if (count === 0) return name;

    const dot = name.lastIndexOf(".");
    if (dot <= 0) return `${name} (${count})`;
    return `${name.slice(0, dot)} (${count})${name.slice(dot)}`;
  };
}

function saveBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

/** Run async tasks with a bounded concurrency pool (avoids hammering the API). */
async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  let cursor = 0;
  const size = Math.max(1, Math.min(limit, items.length));
  const runners = Array.from({ length: size }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}

/**
 * Downloads every file as a single zip.
 * - Skips files that fail individually and reports them in `failed`.
 * - Throws "NO_FILES" when the list is empty.
 * - Throws "ALL_FAILED" when not a single file could be fetched.
 */
export async function downloadAllFilesAsZip(
  files: FileEntity[],
  options: DownloadAllOptions = {}
): Promise<DownloadAllResult> {
  const {
    zipName = "documents.zip",
    concurrency = DEFAULT_CONCURRENCY,
    onProgress,
  } = options;

  if (!files?.length) throw new Error("NO_FILES");

  const zip = new JSZip();
  const nameFor = makeUniqueNamer();
  const failed: { id: string; name: string }[] = [];
  let completed = 0;

  await runPool(files, concurrency, async (file) => {
    try {
      const blob = await fetchFileBlob(file);
      zip.file(nameFor(file.originalName), blob);
    } catch {
      failed.push({ id: file.id, name: file.originalName });
    } finally {
      completed += 1;
      onProgress?.({ completed, total: files.length, failed });
    }
  });

  if (Object.keys(zip.files).length === 0) throw new Error("ALL_FAILED");

  const archive = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  saveBlob(archive, zipName);
  return { failed, total: files.length };
}