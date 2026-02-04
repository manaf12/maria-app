/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";
import { useTranslation } from "react-i18next";

export type Step1Question = {
  id: string;
  labelKey: string;
  type?: "text" | "number" | "select";
  sectionKey?: string; // إذا عم تستخدمه بالعرض
  required?: boolean;
  options?: { value: string; labelKey: string }[];
  min?: number;
  max?: number;
};

export function Step1Questions({
  declarationId,
  initialAnswers,
  questions,
  onSaved,
  disabled = false,
}: {
  declarationId: string;
  initialAnswers?: Record<string, any>;
  questions: Step1Question[];
  onSaved?: () => void;
  disabled?: boolean;
}) {
<<<<<<< HEAD
  const { t, i18n } = useTranslation(); 
=======
  const { t } = useTranslation();
>>>>>>> 164eeec025b1bad7649daa1e72cbda319e322620
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers ?? {});
  const [statusMap, setStatusMap] = useState<
    Record<string, "idle" | "saving" | "saved" | "error">
  >({});
  const [savedAt, setSavedAt] = useState<Record<string, string>>({});
  const timers = useRef<Record<string, number | undefined>>({});
  const controllers = useRef<Record<string, AbortController | undefined>>({});
  const DEBOUNCE_MS = 800;
  const hasLoadedRef = useRef(false);

  // ✅ helper: if label is a translation key, translate it; otherwise use as-is
  const tr = (maybeKeyOrText: string) =>
    i18n.exists(maybeKeyOrText) ? t(maybeKeyOrText) : maybeKeyOrText;

  useEffect(() => {
    setAnswers(initialAnswers ?? {});
    setStatusMap({});
    setSavedAt({});
    hasLoadedRef.current = false;
  }, [declarationId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axiosClient.get<{ answers: Record<string, any> }>(
          `/files/${declarationId}/step1/answers`,
        );
        if (!mounted) return;
        setAnswers(res.data.answers ?? {});
        hasLoadedRef.current = true;
      } catch (err) {
        console.error("Could not load step1 answers", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [declarationId]);

  const handleChange = (qid: string, value: string) => {
    if (disabled) return;
    setAnswers((p) => ({ ...p, [qid]: value }));
    setStatusMap((s) => ({ ...s, [qid]: "idle" }));

    if (timers.current[qid]) {
      clearTimeout(timers.current[qid]);
    }

    const nextValue = value; // ✅ capture value
    timers.current[qid] = window.setTimeout(() => {
      void saveSingle(qid, nextValue);
    }, DEBOUNCE_MS);
  };

  useEffect(() => {
    if (!disabled) return;

    // clear pending debounce timers
    Object.values(timers.current).forEach((tmr) => {
      if (tmr) clearTimeout(tmr);
    });
    timers.current = {};

    // abort any in-flight saves
    Object.values(controllers.current).forEach((c) => {
      try {
        c?.abort();
      } catch {}
    });
    controllers.current = {};

    // optionally show neutral status
    setStatusMap({});
  }, [disabled]);

  const saveSingle = async (qid: string, value: string) => {
    // ألغي أي طلب سابق لنفس الحقل
    try {
      controllers.current[qid]?.abort();
    } catch {}

    const controller = new AbortController();
    controllers.current[qid] = controller;

    setStatusMap((s) => ({ ...s, [qid]: "saving" }));

    try {
      await axiosClient.post(
        `/files/${declarationId}/step1/answers`,
        { answers: { [qid]: value } }, 
        { signal: controller.signal as any },
      );

      const now = new Date().toISOString();
      setStatusMap((s) => ({ ...s, [qid]: "saved" }));
      setSavedAt((s) => ({ ...s, [qid]: now }));

      await queryClient.invalidateQueries({
        queryKey: ["declaration", declarationId],
      });

      onSaved?.();

      setTimeout(() => {
        setStatusMap((s) => ({ ...s, [qid]: "idle" }));
      }, 1200);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error("Save single error", err);
      setStatusMap((s) => ({ ...s, [qid]: "error" }));
    } finally {
      // لا تمسحي controller إذا تغير أثناء الطلب (احتياط)
      if (controllers.current[qid] === controller) {
        controllers.current[qid] = undefined;
      }
    }
  };

  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <div key={q.id} className="flex items-start gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1" htmlFor={q.id}>
              {t(q.labelKey, { defaultValue: q.labelKey })}
            </label>
         {q.type === "select" ? (
  <select
    id={q.id}
    className={
      "w-full p-2 border rounded focus:outline-none focus:ring focus:ring-opacity-50 " +
      (disabled ? "bg-gray-100 cursor-not-allowed" : "")
    }
    value={answers[q.id] ?? ""}
    disabled={disabled}
    onChange={(e) => handleChange(q.id, e.target.value)}
  >
  <option value="">{t("common.select", { defaultValue: "Select..." })}</option>
    {(q.options ?? []).map((opt) => (
      <option key={opt.value} value={opt.value}>
        {t(opt.labelKey, { defaultValue: opt.labelKey })}
      </option>
    ))}
  </select>
) : (
  <input
    id={q.id}
    className={
      "w-full p-2 border rounded focus:outline-none focus:ring focus:ring-opacity-50 " +
      (disabled ? "bg-gray-100 cursor-not-allowed" : "")
    }
    type={q.type === "number" ? "number" : "text"}
    value={answers[q.id] ?? ""}
    disabled={disabled}
    onChange={(e) => handleChange(q.id, e.target.value)}
  />
)}

            {statusMap[q.id] === "error" && (
              <div className="text-xs text-red-600 mt-1">
                {t("common.error")} 
              </div>
            )}
          </div>

          <div style={{ width: 140 }} className="text-right text-sm">
            {statusMap[q.id] === "saving" && (
              <div className="text-gray-500 animate-pulse">{t("common.saving")}</div>
            )}
            {statusMap[q.id] === "saved" && (
              <div className="text-green-600">✓ {t("common.saved")}</div> 
            )}
            {statusMap[q.id] === "error" && (
              <div className="text-red-600">{t("common.error")}</div> 
            )}
            {savedAt[q.id] && (
              <div className="text-xs text-gray-500 mt-1">
                {t("common.last")}:{" "}
                {new Date(savedAt[q.id]).toLocaleString(i18n.language)} 
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
