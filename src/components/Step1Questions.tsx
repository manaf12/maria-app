/* eslint-disable no-empty */

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";
import { useTranslation } from "react-i18next";

export type Step1Question = {
  id: string;
  labelKey: string;
  type?: "text" | "number" | "select";
  sectionKey?: string;
  required?: boolean;
  spouseQuestion?: boolean;
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
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers ?? {});
const [statusMap, setStatusMap] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({});

  const [savedAt, setSavedAt] = useState<Record<string, string>>({});
  const timers = useRef<Record<string, number | undefined>>({});
  const controllers = useRef<Record<string, AbortController | undefined>>({});
  const DEBOUNCE_MS = 800;
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    setAnswers(initialAnswers ?? {});
    setStatusMap({});
    setSavedAt({});
    hasLoadedRef.current = false;
  }, [declarationId, initialAnswers]);

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

  useEffect(() => {
    if (!disabled) return;
    Object.values(timers.current).forEach((tmr) => {
      if (tmr) clearTimeout(tmr);
    });
    timers.current = {};
    Object.values(controllers.current).forEach((c) => {
      try { c?.abort(); } catch {}
    });
    controllers.current = {};
    setStatusMap({});
  }, [disabled]);

  const handleChange = (qid: string, value: string) => {
    if (disabled) return;
    setAnswers((p) => ({ ...p, [qid]: value }));
    setStatusMap((s: any) => ({ ...s, [qid]: "idle" }));

    if (timers.current[qid]) clearTimeout(timers.current[qid]);

    timers.current[qid] = window.setTimeout(() => {
      void saveSingle(qid, value);
    }, DEBOUNCE_MS);
  };

  const saveSingle = async (qid: string, value: string) => {
    try { controllers.current[qid]?.abort(); } catch {}

    const controller = new AbortController();
    controllers.current[qid] = controller;
    setStatusMap((s: any) => ({ ...s, [qid]: "saving" }));

    try {
      await axiosClient.post(
        `/files/${declarationId}/step1/answers`,
        { answers: { [qid]: value } },
        { signal: controller.signal as any },
      );

      const now = new Date().toISOString();
      setStatusMap((s: any) => ({ ...s, [qid]: "saved" }));
      setSavedAt((s) => ({ ...s, [qid]: now }));

      await queryClient.invalidateQueries({
        queryKey: ["declaration", declarationId],
      });

      onSaved?.();

      setTimeout(() => {
        setStatusMap((s: any) => ({ ...s, [qid]: "idle" }));
      }, 1200);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error("Save single error", err);
      setStatusMap((s: any) => ({ ...s, [qid]: "error" }));
    } finally {
      if (controllers.current[qid] === controller) {
        controllers.current[qid] = undefined;
      }
    }
  };

  // ── Group questions by sectionKey ─────────────────────────────
  const sections = questions.reduce(
    (acc, q) => {
      const key = q.sectionKey ?? "other";
      (acc[key] ??= []).push(q);
      return acc;
    },
    {} as Record<string, Step1Question[]>,
  );

  const renderQuestion = (q: Step1Question) => (
    <div key={q.id} className="flex items-start gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1" htmlFor={q.id}>
          {t(q.labelKey, { defaultValue: q.labelKey })}
          {!q.required && (
            <span className="ml-1 text-xs font-normal text-gray-400">
              ({t("common.optional", { defaultValue: "optional" })})
            </span>
          )}
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
            <option value="">
              {t("common.select", { defaultValue: "Select..." })}
            </option>
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
            min={q.type === "number" ? q.min : undefined}
            value={answers[q.id] ?? ""}
            disabled={disabled}
            onChange={(e) => handleChange(q.id, e.target.value)}
          />
        )}

        {statusMap[q.id] === "error" && (
          <div className="text-xs text-red-600 mt-1">{t("common.error")}</div>
        )}
      </div>

      {/* Save status indicator */}
      <div style={{ width: 140 }} className="text-right text-sm pt-6">
        {statusMap[q.id] === "saving" && (
          <div className="text-gray-500 animate-pulse">{t("common.saving")}</div>
        )}
        {statusMap[q.id] === "saved" && (
          <div className="text-green-600">✓ {t("common.saved")}</div>
        )}
        {statusMap[q.id] === "error" && (
          <div className="text-red-600">{t("common.error")}</div>
        )}
        {savedAt[q.id] && statusMap[q.id] !== "saving" && (
          <div className="text-xs text-gray-400 mt-1">
            {t("common.last")}:{" "}
            {new Date(savedAt[q.id]).toLocaleString(i18n.language)}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {Object.entries(sections).map(([sectionKey, sectionQuestions]) => {
        const isSpouseSection = sectionQuestions.some((q) => q.spouseQuestion);

        return (
          <div key={sectionKey}>
            {/* Section header */}
            <div
              className={
                "flex items-center gap-2 mb-4 pb-2 border-b " +
                (isSpouseSection ? "border-blue-200" : "border-gray-200")
              }
            >
              {isSpouseSection && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs">
                  S
                </span>
              )}
              <span
                className={
                  "text-xs font-semibold uppercase tracking-wide " +
                  (isSpouseSection ? "text-blue-600" : "text-gray-400")
                }
              >
                {t(sectionKey, { defaultValue: sectionKey })}
              </span>
            </div>

            {/* Questions in this section */}
            <div className="space-y-4">
              {sectionQuestions.map((q) => renderQuestion(q))}
            </div>
          </div>
        );
      })}
    </div>
  );
}