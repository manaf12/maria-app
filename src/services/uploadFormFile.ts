import axiosClient from "../api/axiosClient";

export async function uploadFormFile(params: {
  url: string;
  file: File;
  extra?: Record<string, string | undefined>;
}) {
  const fd = new FormData();
  fd.append("file", params.file);

  Object.entries(params.extra ?? {}).forEach(([k, v]) => {
    if (v != null) fd.append(k, v);
  });

  return axiosClient.post(params.url, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
