import { useEffect, useRef, useState } from "react";
import axiosClient from "../api/axiosClient";
import { useTranslation } from "react-i18next";

type FieldKind = "text" | "number" | "select";

type SummaryField = {
  // Primary key actually stored by the project, plus any alias keys the
  // backend might use instead. First non-empty value wins.
  primary: string;
  aliases?: string[];
  labelKey: string;
  kind?: FieldKind;
  optionGroup?: string; // i18n group for select values, e.g. "canton"
  unit?: string; // muted suffix, e.g. "km" or "CHF"
};

const SECTIONS: { titleKey: string; fields: SummaryField[] }[] = [
  {
    titleKey: "step1.sections.personalInformation",
    fields: [
      {
        primary: "personalChanges",
        aliases: ["personalChangesSinceLastYear"],
        labelKey: "step1.questions.personalChanges",
      },
    ],
  },
  {
    titleKey: "step1.sections.professionalExpenses",
    fields: [
      {
        primary: "transportMode",
        aliases: ["commuteMethod"],
        labelKey: "step1.questions.transportMode",
        kind: "select",
        optionGroup: "transportMode",
      },
      {
        primary: "distanceToWorkKm",
        aliases: ["workplaceDistanceKm"],
        labelKey: "step1.questions.distanceToWorkKm",
        kind: "number",
        unit: "km",
      },
      {
        primary: "weeklyTripsToWork",
        aliases: ["workplaceTripsPerWeek"],
        labelKey: "step1.questions.weeklyTripsToWork",
        kind: "number",
      },
      {
        primary: "mealsOutsidePerWeek",
        aliases: ["workMealsOutsidePerWeek"],
        labelKey: "step1.questions.mealsOutsidePerWeek",
        kind: "number",
      },
    ],
  },
  {
    titleKey: "step1.sections.housing",
    fields: [
      {
        primary: "netAnnualRentVD_GE",
        aliases: ["netAnnualRent"],
        labelKey: "step1.questions.netAnnualRentVD_GE",
        kind: "number",
        unit: "CHF",
      },
    ],
  },
  {
    titleKey: "step1.sections.taxAuthorityNumbers",
    fields: [
      {
        primary: "canton",
        labelKey: "step1.questions.canton",
        kind: "select",
        optionGroup: "canton",
      },
      {
        primary: "taxpayerNumber",
        labelKey: "step1.questions.taxpayerNumber",
      },
      {
        primary: "controlOrDeclarationCode",
        aliases: ["controlDeclarationCode"],
        labelKey: "step1.questions.controlOrDeclarationCode",
      },
    ],
  },
];

function pickRaw(answers: Record<string, any>, field: SummaryField) {
  const keys = [field.primary, ...(field.aliases ?? [])];
  for (const k of keys) {
    const v = answers[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

export function Step1AnswersSummary({
  declarationId,
  answers,
  reloadKey = 0,
}: {
  declarationId: string;
  // Optional override; when omitted the component fetches the answers itself.
  answers?: Record<string, any>;
  reloadKey?: number;
}) {
  const { t } = useTranslation();

  const [fetched, setFetched] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const hasOverride = useRef(false);
  hasOverride.current = answers !== undefined;

  useEffect(() => {
    if (answers !== undefined) return; // parent provides the data
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get<{ answers: Record<string, any> }>(
          `/files/${declarationId}/step1/answers`
        );
        if (!mounted) return;
        setFetched(res.data.answers ?? {});
      } catch (err) {
        console.error("Could not load step1 answers (summary)", err);
        if (mounted) setFetched({});
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [declarationId, reloadKey, answers]);

  const data = answers ?? fetched;
  const showSkeleton = loading && !hasOverride.current;

  const renderValue = (field: SummaryField) => {
    const raw = pickRaw(data, field);

    if (raw === undefined) {
      return (
        <span className="step1-summary-empty">
          {t("common.notProvided", { defaultValue: "Not provided" })}
        </span>
      );
    }

    if (field.kind === "select" && field.optionGroup) {
      const label = t(`step1.options.${field.optionGroup}.${raw}`, {
        defaultValue: String(raw),
      });
      return <span className="step1-summary-text">{label}</span>;
    }

    return (
      <span className="step1-summary-text step1-summary-num">
        {String(raw)}
        {field.unit && (
          <span className="step1-summary-unit">{field.unit}</span>
        )}
      </span>
    );
  };

  return (
    <section className="step1-summary">
      <header className="step1-summary-head">
        <span aria-hidden className="step1-summary-accent" />
        <h4 className="step1-summary-title">
          {t("step1.answersSummaryTitle", {
            defaultValue: "Your Step 1 answers",
          })}
        </h4>
      </header>

      <div className="step1-summary-scroll">
        <table className="step1-summary-table">
          <colgroup>
            <col className="step1-summary-col-label" />
            <col />
          </colgroup>

          {showSkeleton ? (
            <tbody>
              {Array.from({ length: 5 }).map((_, r) => (
                <tr key={r} className="step1-summary-row">
                  <td className="step1-summary-label">
                    <span
                      className="step1-summary-skel"
                      style={{ width: "60%" }}
                    />
                  </td>
                  <td className="step1-summary-value">
                    <span
                      className="step1-summary-skel"
                      style={{ width: "45%" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          ) : (
            SECTIONS.map((section, idx) => (
              <tbody key={section.titleKey}>
                <tr className="step1-summary-grouprow">
                  <th
                    scope="colgroup"
                    colSpan={2}
                    className={
                      "step1-summary-group" + (idx > 0 ? " is-divided" : "")
                    }
                  >
                    {t(section.titleKey, { defaultValue: section.titleKey })}
                  </th>
                </tr>

                {section.fields.map((field) => (
                  <tr key={field.primary} className="step1-summary-row">
                    <th scope="row" className="step1-summary-label">
                      {t(field.labelKey, { defaultValue: field.labelKey })}
                    </th>
                    <td className="step1-summary-value">
                      {renderValue(field)}
                    </td>
                  </tr>
                ))}
              </tbody>
            ))
          )}
        </table>
      </div>
    </section>
  );
}