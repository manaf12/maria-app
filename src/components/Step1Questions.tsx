/* eslint-disable no-empty */

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";
import { useTranslation } from "react-i18next";

const STEP1_ANSWER_ALIASES: Record<string, string[]> = {
  personalChanges: ["personalChangesSinceLastYear"],
  transportMode: ["commuteMethod"],
  distanceToWorkKm: ["workplaceDistanceKm"],
  weeklyTripsToWork: ["workplaceTripsPerWeek"],
  mealsOutsidePerWeek: ["workMealsOutsidePerWeek"],
  netAnnualRentVD_GE: ["netAnnualRent"],
  controlOrDeclarationCode: ["controlDeclarationCode"],
};

function normalizeAnswers(source?: Record<string, any>) {
  const normalized = { ...(source ?? {}) };

  Object.entries(STEP1_ANSWER_ALIASES).forEach(([questionId, aliases]) => {
    const currentValue = normalized[questionId];
    if (
      currentValue !== undefined &&
      currentValue !== null &&
      String(currentValue).trim() !== ""
    ) {
      return;
    }

    const alias = aliases.find((key) => {
      const value = normalized[key];
      return value !== undefined && value !== null && String(value).trim() !== "";
    });

    if (alias) normalized[questionId] = normalized[alias];
  });

  return normalized;
}

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

  const [answers, setAnswers] = useState<Record<string, any>>(() =>
    normalizeAnswers(initialAnswers),
  );
  const [statusMap, setStatusMap] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({});

  const [savedAt, setSavedAt] = useState<Record<string, string>>({});
  const timers = useRef<Record<string, number | undefined>>({});
  const controllers = useRef<Record<string, AbortController | undefined>>({});
  const latestInitialAnswers = useRef(initialAnswers);
  const editedQuestionIds = useRef(new Set<string>());
  const DEBOUNCE_MS = 800;

  latestInitialAnswers.current = initialAnswers;

  useEffect(() => {
    // Reset only when navigating to a different declaration. Refreshing the
    // current declaration after a save must not clear the values in the form.
    setAnswers(normalizeAnswers(latestInitialAnswers.current));
    setStatusMap({});
    setSavedAt({});
    editedQuestionIds.current.clear();
  }, [declarationId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axiosClient.get<{ answers: Record<string, any> }>(
          `/files/${declarationId}/step1/answers`,
        );
        if (!mounted) return;
        const loadedAnswers = normalizeAnswers(res.data.answers);

        // A slow initial request can finish after the user has started typing.
        // Keep those local edits while hydrating the rest from the server.
        setAnswers((current) => {
          const merged = { ...loadedAnswers };
          editedQuestionIds.current.forEach((questionId) => {
            merged[questionId] = current[questionId];
          });
          return merged;
        });
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
      try { c?.abort(); } catch { }
    });
    controllers.current = {};
    setStatusMap({});
  }, [disabled]);

  const handleChange = (qid: string, value: string) => {
    if (disabled) return;
    editedQuestionIds.current.add(qid);
    setAnswers((p) => ({ ...p, [qid]: value }));
    setStatusMap((s: any) => ({ ...s, [qid]: "idle" }));

    if (timers.current[qid]) clearTimeout(timers.current[qid]);

    timers.current[qid] = window.setTimeout(() => {
      void saveSingle(qid, value);
    }, DEBOUNCE_MS);
  };

  const saveSingle = async (qid: string, value: string) => {
    try { controllers.current[qid]?.abort(); } catch { }

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
    <div key={q.id} className="step1-question-row">
      <div className="step1-question-main">
        <label className="step1-question-label" htmlFor={q.id}>
          {t(q.labelKey, { defaultValue: q.labelKey })}
          {!q.required && (
            <span className="step1-question-optional">
              ({t("common.optional", { defaultValue: "optional" })})
            </span>
          )}
        </label>

        {q.type === "select" ? (
          <select
            id={q.id}
            className={`step1-question-control${disabled ? " is-disabled" : ""}`}
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
            className={`step1-question-control${disabled ? " is-disabled" : ""}`}
            type={q.type === "number" ? "number" : "text"}
            min={q.type === "number" ? q.min : undefined}
            value={answers[q.id] ?? ""}
            disabled={disabled}
            onChange={(e) => handleChange(q.id, e.target.value)}
          />
        )}

        {statusMap[q.id] === "error" && (
          <div className="step1-question-error">{t("common.error")}</div>
        )}
      </div>

      {/* Save status indicator */}
      <div className="step1-question-save-status" aria-live="polite">
        {statusMap[q.id] === "saving" && (
          <div className="step1-question-saving">{t("common.saving")}</div>
        )}
        {statusMap[q.id] === "saved" && (
          <div className="step1-question-saved">✓ {t("common.saved")}</div>
        )}
        {statusMap[q.id] === "error" && (
          <div className="step1-question-error">{t("common.error")}</div>
        )}
        {savedAt[q.id] && statusMap[q.id] !== "saving" && (
          <div className="step1-question-saved-at">
            {t("common.last")}:{" "}
            {new Date(savedAt[q.id]).toLocaleString(i18n.language)}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="step1-sections">
      {Object.entries(sections).map(([sectionKey, sectionQuestions]) => {
        const isSpouseSection = sectionQuestions.some((q) => q.spouseQuestion);

        return (
          <div
            key={sectionKey}
            className={
              "step1-section" + (isSpouseSection ? " step1-section-spouse" : "")
            }
          >
            <div className="step1-section-header">
              {/* {isSpouseSection && <span className="step1-section-badge">S</span>} */}

              <h3 className="step1-section-title">
                {t(sectionKey, { defaultValue: sectionKey })}
              </h3>
            </div>

            <div className="step1-section-body">
              {sectionQuestions.map((q) => renderQuestion(q))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
