/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslation } from "react-i18next";
import type { TaxDeclarationFull } from "../types/types";
import {  useNavigate } from "react-router";

type Props = {
  declaration: TaxDeclarationFull;
  onActionClick?: (decl: TaxDeclarationFull) => void;
};

function computeCurrentFromSteps(steps?: { id: string; order: number; status: string }[]) {
  if (!Array.isArray(steps) || steps.length === 0) return 0;
  const inProgress = steps.find((s) => s.status === "IN_PROGRESS");
  if (inProgress) return inProgress.order;
  const firstNotDone = steps.find((s) => s.status !== "DONE");
  if (firstNotDone) return firstNotDone.order;
  return steps.length;
}

export default function TaxDeclarationCard({ declaration }: Props) {
  const { t } = useTranslation();
  const stepsArray = [1, 2, 3, 4, 5] as const;
const navigate=useNavigate()
  const fallback = computeCurrentFromSteps(declaration.steps as any);
  const current = typeof declaration.currentStep === "number" && declaration.currentStep > 0
    ? declaration.currentStep
    : fallback; 
  const totalSteps = Array.isArray(declaration.steps) ? declaration.steps.length : 5;
  const bannerText = current > 0
    ? t("dashboard.banner.stepProgress", {
        current,
        total: totalSteps,
        defaultValue: `we are now in step${current} from  ${totalSteps}`,
      })
    : t("dashboard.banner.noStepInfo", { defaultValue: "no step found" });


  console.debug("Declaration steps:", declaration.steps, "currentStep (backend):", declaration.currentStep, "computed:", fallback);
  const handleViewRequestClick = () => {
    // 3. Navigate to the dynamic URL with the declaration's ID
    navigate(`/declaration/${declaration.id}`);
  };

  return (
    <article className="declaration-card">
      {/* Banner */}
      <div className="declaration-banner">
        <div className="banner-left">
          <span className="banner-icon">i</span>
          <p className="banner-text">{bannerText}</p>
        </div>
      </div>

      {/* Header */}
      <div className="declaration-header-row">
        <div>
          <h3 className="declaration-title">
            {t("dashboard.declarationTitle", {
              year: declaration.questionnaireSnapshot?.taxYear,
              name: declaration.clientProfile?.firstName ?? "",
              defaultValue: `${declaration.questionnaireSnapshot?.taxYear ?? ""} – ${declaration.clientProfile?.firstName ?? ""}`,
            })}
          </h3>
          <p className="declaration-subtitle">{declaration.questionnaireSnapshot?.offer}</p>
        </div>

        <div>
          {declaration.pricing?.finalPrice} {declaration.questionnaireSnapshot?.billingFirstName}
        </div>

        <button
          type="button"
          className="declaration-action-btn"
          onClick={handleViewRequestClick} // 4. Use the new handler

        >
          View Request
        </button>
      </div>

      {/* Steps row */}
      <div className="declaration-steps-row">
        {stepsArray.map((stepNum) => {
          const isCurrent = stepNum === current;
          const isDone = current > 0 && stepNum < current;

          let statusClass: "done" | "current" | "future" = "future";
          if (isDone) statusClass = "done";
          else if (isCurrent) statusClass = "current";

          const stepMeta = Array.isArray(declaration.steps)
            ? declaration.steps.find((s) => s.order === stepNum)
            : undefined;
          const stepTitle = stepMeta?.name
            ? stepMeta.name
            :
              t(`dashboard.steps1.${stepNum}.title`);
          const stepTime = t(`dashboard.steps1.${stepNum}.time`);

          return (
            <div key={stepNum} className={`decl-step decl-step-${statusClass}`}>
              <div className="decl-step-circle">
                {isDone ? "✓" : stepNum}
              </div>

              <div className="decl-step-text">
                <div className="decl-step-title">{stepTitle}</div>
                <div className="decl-step-time">{stepTime}</div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
