// src/pages/DashboardPage.tsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";
import TaxDeclarationCard from "../components/TaxDeclarationCard";
import type { TaxDeclaration } from "../components/TaxDeclarationCard";

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [declarations, setDeclarations] = useState<TaxDeclaration[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        setIsLoading(true);
        const res = await axiosClient.get("/api/declarations");
        const items = (res.data as TaxDeclaration[])
          .slice()
          .sort((a, b) => b.taxYear - a.taxYear);
        setDeclarations(items);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user]);

  const handleNewDeclaration = () => {
    localStorage.removeItem("taxonline_quote_draft");
    navigate("/product");
  };

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <header className="dashboard-header">
        <div>
          <h1>{t("dashboard.title")}</h1>
          <p className="dashboard-subtitle">
            {t("dashboard.subtitle")}
          </p>
        </div>

        <button
          type="button"
          className="dashboard-new-btn"
          onClick={handleNewDeclaration}
        >
          {t("dashboard.newDeclaration")}
        </button>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>{t("dashboard.myDeclarations")}</h2>
            <Link className="dashboard-help-link" to="/faq">
              {t("dashboard.helpLink")}
            </Link>
          </div>

          {isLoading && (
            <p className="muted">{t("dashboard.loading")}</p>
          )}

          {!isLoading && declarations.length === 0 && (
            <div className="empty-state">
              <p className="muted">{t("dashboard.empty")}</p>
              <button
                type="button"
                className="dashboard-empty-btn"
                onClick={handleNewDeclaration}
              >
                {t("dashboard.startFirst")}
              </button>
            </div>
          )}

          <div className="declarations-list">
            {declarations.map((decl) => (
              <TaxDeclarationCard
                key={decl.id}
                declaration={decl}
                onActionClick={(d) =>
                  navigate(`/declarations/${d.id}`) // أو `/dashboard/requests/${d.id}` حسب اللي معرّفته
                }
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}


// // src/pages/DashboardPage1.tsx
// import { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import { useNavigate, Link } from "react-router-dom";
// import axiosClient from "../api/axiosClient";
// import { useAuth } from "../auth/AuthContext";

// type DeclarationStep = 1 | 2 | 3 | 4 | 5;

// type Declaration = {
//   id: string;
//   taxYear: number;
//   clientName: string;
//   currentStep: DeclarationStep;
//   description?: string; 
//   // نص مختصر للبانر (ممكن يجي من الباك إند، أو من i18n)
//   stepMessage?: string;
//   // وقت تقريبي لكل خطوة – اختياري
//   stepEta?: string;
// };

// const STEP_COUNT = 5;

// // إعداد ثابت لأسماء الخطوات والأزرار
// const STEP_CONFIG: {
//   id: DeclarationStep;
//   titleKey: string;
//   etaKey: string;
//   actionKey: string;
// }[] = [
//   {
//     id: 1,
//     titleKey: "dashboard.steps.request",
//     etaKey: "dashboard.eta.request",
//     actionKey: "dashboard.actions.request",
//   },
//   {
//     id: 2,
//     titleKey: "dashboard.steps.documents",
//     etaKey: "dashboard.eta.documents",
//     actionKey: "dashboard.actions.upload",
//   },
//   {
//     id: 3,
//     titleKey: "dashboard.steps.preparation",
//     etaKey: "dashboard.eta.preparation",
//     actionKey: "dashboard.actions.view",
//   },
//   {
//     id: 4,
//     titleKey: "dashboard.steps.review",
//     etaKey: "dashboard.eta.review",
//     actionKey: "dashboard.actions.review",
//   },
//   {
//     id: 5,
//     titleKey: "dashboard.steps.submission",
//     etaKey: "dashboard.eta.submission",
//     actionKey: "dashboard.actions.viewFinal",
//   },
// ];

// function getStepProgressPercent(step: DeclarationStep) {
//   if (step <= 1) return 0;
//   if (step >= STEP_COUNT) return 100;
//   return ((step - 1) / (STEP_COUNT - 1)) * 100;
// }

// export default function DashboardPage() {
//   const { t } = useTranslation();
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [declarations, setDeclarations] = useState<Declaration[]>([]);
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     // لو ما في user المفروض يكون الباك إند رافض، بس كـ احتياط:
//     if (!user) return;

//     const load = async () => {
//       try {
//         setIsLoading(true);
//         const res = await axiosClient.get("/api/declarations");
//         // عدّلي شكل الداتا حسب الـ API الحقيقي
//         setDeclarations(res.data as Declaration[]);
//       } catch (e) {
//         console.error(e);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     load();
//   }, [user]);

//   const handleNewDeclaration = () => {
//     // يروح مباشرة على الـ ProductPage (الـ questionnaire)
//     navigate("/product");
//   };

//   const handleDeclarationAction = (decl: Declaration) => {
//     // حسب الخطوة، بتودي المستخدم على صفحة مناسبة
//     // هون حطّينا route عام، عدّليه حسب بنية التطبيق عندك
//     navigate(`/declarations/${decl.id}`);
//   };

//   return (
//     <div className="dashboard-page">
//       {/* Header */}
//       <header className="dashboard-header">
//         <div>
//           <h1>{t("dashboard.title")}</h1>
//           <p className="dashboard-subtitle">
//             {t(
//               "dashboard.subtitle"
//             )}
//           </p>
//         </div>

//         <button
//           type="button"
//           className="btn-primary"
//           onClick={handleNewDeclaration}
//         >
//           {t("dashboard.newDeclaration", "New tax declaration")}
//         </button>
//       </header>

//       {/* محتوى الصفحة */}
//       <main className="dashboard-main">
//         {/* ممكن تحطي لاحقًا بلوك لإحصائيات أو welcome message هون */}

//         <section className="dashboard-section">
//           <div className="dashboard-section-header">
//             <h2>{t("dashboard.myDeclarations", "My tax declarations")}</h2>
//             {/* رابط ثانوي للـ help / FAQ لو حبيتي */}
//             <Link className="link" to="/faq">
//               {t("dashboard.helpLink", "Need help?")}
//             </Link>
//           </div>

//           {isLoading && (
//             <p className="muted">{t("dashboard.loading", "Loading…")}</p>
//           )}

//           {!isLoading && declarations.length === 0 && (
//             <div className="empty-state">
//               <p className="muted">
//                 {t(
//                   "dashboard.empty"
//                 )}
//               </p>
//               <button
//                 type="button"
//                 className="btn-secondary"
//                 onClick={handleNewDeclaration}
//               >
//                 {t("dashboard.startFirst")}
//               </button>
//             </div>
//           )}

//           <div className="declarations-list">
//             {declarations.map((decl) => (
//               <DeclarationCard
//                 key={decl.id}
//                 declaration={decl}
//                 onAction={() => handleDeclarationAction(decl)}
//               />
//             ))}
//           </div>
//         </section>
//       </main>
//     </div>
//   );
// }

// function DeclarationCard({
//   declaration,
//   onAction,
// }: {
//   declaration: Declaration;
//   onAction: () => void;
// }) {
//   const { t } = useTranslation();
//   const currentStep = declaration.currentStep;

//   // رسالة البانر بحسب الخطوة الحالية
//   const bannerMessage =
//     declaration.stepMessage ??
//     t(`dashboard.banner.step${currentStep}`);

//   // data للـ 5 خطوات (العناوين + الزمن) من i18n: dashboard.steps1
//   const steps = [1, 2, 3, 4, 5].map((index) => ({
//     index,
//     title: t(`dashboard.steps1.${index}.title`),
//     time: t(`dashboard.steps1.${index}.time`),
//   }));

//   return (
//     <article className="declaration-card">
//       {/* ===== أعلى الكارت: الاسم + الزر ===== */}
//       <div className="declaration-header-row">
//         <div>
//           <h3 className="declaration-title">
//             {t("dashboard.declarationTitle", {
//               year: declaration.taxYear,
//               name: declaration.clientName,
//               defaultValue: `${declaration.taxYear} – ${declaration.clientName}`,
//             })}
//           </h3>

//           {declaration.description && (
//             <p className="declaration-subtitle">{declaration.description}</p>
//           )}
//         </div>

//         <button
//           type="button"
//           className="declaration-action-btn"
//           onClick={onAction}
//         >
//           {t(
//             STEP_CONFIG.find((s) => s.id === currentStep)?.actionKey ??
//               "dashboard.actions.view"
//           )}
//         </button>
//       </div>

//       {/* ===== بانر ملخّص الخطوة الحالية ===== */}
//       <div className="declaration-banner">
//         <div className="banner-left">
//           <span className="banner-icon">i</span>
//           <p className="banner-text">{bannerMessage}</p>
//         </div>
//       </div>

//       {/* ===== سطر الخطوات الخمسة (دوائر + عنوان + زمن) ===== */}
//       <div className="declaration-steps-row">
//         {steps.map((step) => {
//           let status: "done" | "current" | "future" = "future";
//           if (step.index < currentStep) status = "done";
//           else if (step.index === currentStep) status = "current";

//           return (
//             <div
//               key={step.index}
//               className={`decl-step decl-step-${status}`}
//             >
//               <div className="decl-step-circle">
//                 {step.index}
//               </div>

//               <div className="decl-step-text">
//                 <div className="decl-step-title">{step.title}</div>
//                 <div className="decl-step-time">{step.time}</div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </article>
//   );
// }

