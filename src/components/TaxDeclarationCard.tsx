// src/components/TaxDeclarationCard.tsx
import { useTranslation } from "react-i18next";

export type TaxDeclaration = {
  id: string;
  taxYear: number;
  clientName: string;
  productName: string;          // مثال: "TaxOnline Basic CHF 59.–"
  currentStep: 1 | 2 | 3 | 4 | 5;
};

type Props = {
  declaration: TaxDeclaration;
  onActionClick?: (decl: TaxDeclaration) => void;
};

/**
 * كارت واحد لتصريح ضريبي في صفحة الـ Dashboard
 * يعرض:
 * - بانر الحالة
 * - العنوان (السنة + اسم العميل + اسم المنتج)
 * - زر الأكشن حسب المرحلة
 * - ٥ خطوات مع أوقات تقريبية
 */
export default function TaxDeclarationCard({ declaration, onActionClick }: Props) {
  const { t } = useTranslation();
  const steps = [1, 2, 3, 4, 5] as const;

  // أي زر نستخدم لكل مرحلة؟
  // 1,2,3,5 → View request
  // 4       → View declaration
  const actionKeyByStep: Record<(typeof steps)[number], string> = {
    1: "dashboard.actions.viewRequest",
    2: "dashboard.actions.viewRequest",
    3: "dashboard.actions.viewRequest",
    4: "dashboard.actions.viewDeclaration",
    5: "dashboard.actions.viewRequest"
  };

  const actionLabel = t(actionKeyByStep[declaration.currentStep]);

  // Banner message for current step
  const bannerKey = `dashboard.banner.step${declaration.currentStep}`;
  const bannerText = t(bannerKey, {
    defaultValue: t("dashboard.defaultStepMessage", {
      step: declaration.currentStep
    })
  });

  return (
    <article className="declaration-card">
      {/* ===== Banner أعلى الكارت ===== */}
      <div className="declaration-banner">
        <div className="banner-left">
          <span className="banner-icon">i</span>
          <p className="banner-text">{bannerText}</p>
        </div>
      </div>

      {/* ===== هيدر: العنوان + المنتج + زر الأكشن ===== */}
      <div className="declaration-header-row">
        <div>
          <h3 className="declaration-title">
            {t("dashboard.declarationTitle", {
              year: declaration.taxYear,
              name: declaration.clientName,
              defaultValue: `${declaration.taxYear} – ${declaration.clientName}`
            })}
          </h3>
          <p className="declaration-subtitle">{declaration.productName}</p>
        </div>

        <button
          type="button"
          className="declaration-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onActionClick?.(declaration);
          }}
        >
          {actionLabel}
        </button>
      </div>

      {/* ===== سطر الخطوات الخمسة (دوائر + عنوان + زمن) ===== */}
      <div className="declaration-steps-row">
        {steps.map((step) => {
          const isCurrent = step === declaration.currentStep;
          const isDone = step < declaration.currentStep;

          let status: "done" | "current" | "future" = "future";
          if (isDone) status = "done";
          else if (isCurrent) status = "current";

          return (
            <div
              key={step}
              className={`decl-step decl-step-${status}`}
            >
              <div className="decl-step-circle">
                {/* لو حابة تحطي ✓ للمنتهي بدل الرقم */}
                {isDone ? "✓" : step}
              </div>

              <div className="decl-step-text">
                <div className="decl-step-title">
                  {t(`dashboard.steps1.${step}.title`)}
                </div>
                <div className="decl-step-time">
                  {t(`dashboard.steps1.${step}.time`)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
