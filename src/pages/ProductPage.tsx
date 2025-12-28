/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ProductPage.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import axiosClient from "../api/axiosClient";

type FormValues = {
  taxYear: number;
  maritalStatus: "single" | "married";
  childrenCount: number;
  incomeSources: number;
  wealthStatements: number;
  properties: number;
  newProperties: number;
  billingFirstName: string;
  billingLastName: string;
  billingStreet: string;
  billingPostalCode: string;
  billingCity: string;
};

type Offer = {
  id: string;
  name: string;
  description: string;
  price: number;
  recommended?: boolean;
};

type QuoteDraft = {
  step: number;
  form: FormValues;
  selectedOfferId?: string;
};

const DRAFT_KEY = "taxonline_quote_draft";


// const saveStepData = async (dataToSave: Partial<FormValues>) => {
//   const questionnaireId = localStorage.getItem("questionnaireId");
//   if (!questionnaireId) {
//     console.error("Questionnaire ID not found. Cannot save progress.");
//     return;
//   }
//   const payload = dataToSave;
//   if (!payload || Object.keys(payload).length === 0) {
//     console.log("No new data to save.");
//     return;
//   }

//   try {
//     const url = `/questionnaire/${questionnaireId}/save-step`;
//     console.log(`Saving step data to ${url} with payload:`, payload);
//         await axiosClient.post(url, payload);
//   } catch (error) {
//     console.error("Failed to save progress:", error);
//   }
// };





function saveDraft(draft: QuoteDraft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function loadDraft(): QuoteDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

function StepCard({
  title,
  subtitle,
  children,
  onPrev,
  onNext,
  nextDisabled,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="step-card">
      <div className="step-header">
        <h2 className="step-title">{title}</h2>
        {subtitle && <p className="step-subtitle">{subtitle}</p>}
      </div>

      <div className="step-body">{children}</div>

      {(onPrev || onNext) && (
        <div className="step-footer">
          {onPrev ? (
            <button
              type="button"
              className="step-back-link"
              onClick={onPrev}
            >
              <span aria-hidden="true"></span>
              <span>{t("product.back")}</span>
            </button>
          ) : (
            <span />
          )}

          {onNext && (
            <button
              type="button"
              className="step-next-btn"
              onClick={onNext}
              disabled={nextDisabled}
            >
              <span>{t("product.next")}</span>
              <span aria-hidden="true"></span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}


export default function ProductPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();
const saveStepData = async (dataToSave: Partial<FormValues>) => {
  const questionnaireId = localStorage.getItem("questionnaireId");
  if (!questionnaireId) {
    console.error("Questionnaire ID not found. Cannot save progress.");
    return;
  }
  const payload = dataToSave;
  if (!payload || Object.keys(payload).length === 0) {
    console.log("No new data to save.");
    return;
  }

  try {
    // اختر المسار حسب تسجيل الدخول
    const url = user
      ? `/questionnaire/${questionnaireId}/save-step`         // محمي - يتطلب JWT
      : `/questionnaire/${questionnaireId}/save-step-public`; // عام

    console.log(`Saving step data to ${url} with payload:`, payload);
    await axiosClient.post(url, payload);
  } catch (error) {
    console.error("Failed to save progress:", error);
  }
};
  const {
    register,
    watch,
    handleSubmit,
    setValue,
    reset,
    getValues,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      taxYear: currentYear - 1, // n-1
      maritalStatus: "single",
      childrenCount: 0,
      incomeSources: 1,
      wealthStatements: 0,
      properties: 0,
      newProperties: 0,
      billingFirstName: "",
      billingLastName: "",
      billingStreet: "",
      billingPostalCode: "",
      billingCity: "",
    },
  });

  const [step, setStep] = useState<number>(1);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
   const [offerPrices, setOfferPrices] = useState<{
    standard: number;
    premium: number;
    confort: number;
  } | null>(null);
  const taxYear = watch("taxYear");
  const maritalStatus = watch("maritalStatus");
  const childrenCount = watch("childrenCount");
  const incomeSources = watch("incomeSources");
  const wealthStatements = watch("wealthStatements");
  const properties = watch("properties");
  const newProperties = watch("newProperties");

const offers: Offer[] = useMemo(() => [
  {
    id: "Standard",
    name: t("product.offers.basic"),
    description: t("product.offers.basicDesc"),
    price: 0, 
  },
  {
    id: "Premium",
    name: t("product.offers.standard"),
    description: t("product.offers.standardDesc"),
    price: 0,
    recommended: true,
  },
  {
    id: "Confort",
    name: t("product.offers.premium"),
    description: t("product.offers.premiumDesc"),
    price: 0,
  },
], [t]); 
  useEffect(() => {
    if (properties === 0) {
      setValue("newProperties", 0);
    }
  }, [properties, setValue]);
  const canGoFrom7 =
    properties > 0 &&
    newProperties >= 0 &&
    newProperties <= properties;
useEffect(() => {
  let mounted = true;

  const inferStepFromData = (formData: Partial<FormValues> | null): number => {
    if (!formData) return 1;
    // Heuristic: return the first incomplete step
    if (!formData.taxYear) return 1;
    if (!formData.maritalStatus) return 2;
    if (formData.childrenCount === undefined || formData.childrenCount === null) return 3;
    if (!formData.incomeSources) return 4;
    if (formData.wealthStatements === undefined || formData.wealthStatements === null) return 5;
    if (formData.properties === undefined || formData.properties === null) return 6;
    if (formData.properties > 0 && (formData.newProperties === undefined || formData.newProperties === null)) return 7;
    // if offers were calculated/selected, go to 8/9
    return 8;
  };

  const loadState = async () => {
    const draft = loadDraft();
    const questionId = localStorage.getItem("questionnaireId");
    const fromAuth = (location.state as any)?.fromAuth;
  console.log("🟡 restore start", { draft, questionId, fromAuth });

  if (draft) {
    console.log("🟢 restoring from draft", draft);
  }

  if (questionId) {
    console.log("🟢 fetching questionnaire", questionId);
  }
    // 1) If there is a draft, use it (this preserves exact UX for anonymous and logged)
    if (draft && draft.form) {
      if (!mounted) return;
      reset(draft.form); // populate form
      setSelectedOffer(draft.selectedOfferId ? offers.find((o) => o.id === draft.selectedOfferId) ?? null : null);

      // If user is logged and selectedOffer exists then go to summary
      if (user && draft.selectedOfferId) {
        setStep(9);
        return;
      }

      // Otherwise continue from draft.step
      setStep(draft.step ?? inferStepFromData(draft.form));
      return;
    }

    // 2) If no draft but we have a questionnaireId, try to fetch it from backend
    if (questionId) {
      try {
        const res = await axiosClient.get(`/questionnaire/${questionId}`); // expects { id, data, status, ... }
        const resp = res.data;
        const serverForm = resp?.data ?? null;

        if (!mounted) return;

        if (serverForm) {
          // populate the form with server data
          // reset will replace all fields; ensure serverForm has matching keys
          reset(serverForm as any);

          // set selected offer if present in server snapshot
          if (resp?.data?.offer) {
            const offerFound = offers.find((o) => o.id.toLowerCase() === String(resp.data.offer).toLowerCase());
            if (offerFound) setSelectedOffer(offerFound);
          }

          // Decide step
          if (fromAuth && user) {
            // user just logged in and came back: go to offers (step 8) or summary if offer already chosen
            if (resp.data.offer) setStep(9);
            else setStep(8);
          } else {
            setStep(inferStepFromData(serverForm));
          }
          return;
        }
      } catch (err) {
        console.warn("Could not load questionnaire from server:", err);
        // fallback to starting step 1
      }
    }

    // 3) fallback: start from step 1 or if fromAuth request go to offers
    if (fromAuth && user) {
      setStep(8);
    } else {
      setStep(1);
    }
  };

  loadState();

  return () => {
    mounted = false;
  };
}, [location.state, reset, user, offers]);

  useEffect(() => {
    const form = getValues();
    const draft: QuoteDraft = {
      step,
      form,
      selectedOfferId: selectedOffer?.id,
    };
    saveDraft(draft);
  }, [step, selectedOffer, getValues]);

  const goPrev = () => {
    if (step <= 1) return;
    if (step === 8 && properties === 0) {
      setStep(6);
    } else if (step === 8 && properties > 0) {
      setStep(7);
    } else {
      setStep((s) => s - 1);
    }
  };

const goNext = async () => {
  const currentValues = getValues();
  saveDraft({
    step: step + 1,
    form: currentValues,
    selectedOfferId: selectedOffer?.id,
  });
  await saveStepData(currentValues);
  if (step === 7) {
    if (!canGoFrom7) return; 

    const questionnaireId = localStorage.getItem("questionnaireId");
    if (!questionnaireId) {
      alert("Session error. Please restart.");
      return;
    }

    try {
      console.log("Calculating all offer prices...");
      const res = await axiosClient.get(`/pricing/calculate-all/${questionnaireId}`);
      setOfferPrices(res.data);
      console.log("Prices calculated:", res.data);
      
      setStep(8);
    } catch (error) {
      console.error("Failed to calculate prices:", error);
      alert("Could not calculate offer prices.");
    }
    return;
  }
  


  if (step === 6) {
    if (properties === 0) {
      
      const questionnaireId = localStorage.getItem("questionnaireId");
      if (!questionnaireId) { /* ... معالجة الخطأ ... */ return; }
      try {
        const res = await axiosClient.get(`/pricing/calculate-all/${questionnaireId}`);
        setOfferPrices(res.data);
        setStep(8);
      } catch (error : any) { /* ... معالجة الخطأ ... */ }

    } else {
      setStep(7);
    }
  } else if (step < 9) { // تم تعديل الشرط ليشمل الخطوات الأقل من 9
    setStep((s) => s + 1);
  }
};

// ProductPage.tsx
const handleChooseOffer = async (offer: Offer) => {
  setSelectedOffer(offer);

  const questionnaireId = localStorage.getItem("questionnaireId");
  if (!questionnaireId) {
    alert("Session error. Please restart.");
    return;
  }

  if (user) {
    // Logged in → go to next step
    setStep(9);
    return;
  }

  // Anonymous → submit existing questionnaire & get token + declaration
  try {
    const res = await axiosClient.post(
      `/questionnaire/${questionnaireId}/submit-anonymous`
    );

    const { declarationId, token } = res.data;

    localStorage.setItem("anonymousDeclarationId", declarationId);
    localStorage.setItem("anonymousToken", token);

    navigate("/login", {
      state: { redirectTo: "/product", fromAnonymous: true },
    });
  } catch (e: any) {
    console.error("submit-anonymous failed", e);
    alert("Failed to create temporary quote. Please try again.");
  }
};


  const handleOfferGuard = (offer: Offer) => {
    if (step < 8) {
      setStep(8);
      return;
    }
    handleChooseOffer(offer);
  };

const onSubmit = handleSubmit(async () => {
  const questionnaireId = localStorage.getItem("questionnaireId");
  if (!questionnaireId) {
    alert("Session error");
    return;
  }

  const formValues = getValues(); 
  try {
    await axiosClient.post(`/questionnaire/${questionnaireId}/save-step`, formValues);
    console.log("Billing saved to questionnaire");
    if (!selectedOffer) {
      alert("Please choose an offer first");
      setStep(8);
      return;
    }
    await axiosClient.post(`/questionnaire/${questionnaireId}/finalize`, {
      offer: selectedOffer.id,
      billing: {
        firstName: formValues.billingFirstName,
        lastName: formValues.billingLastName,
        street: formValues.billingStreet,
        postalCode: formValues.billingPostalCode,
        city: formValues.billingCity,
      }
    });
    clearDraft();
    localStorage.removeItem("questionnaireId");
    navigate("/client-dashboard");
  } catch (e: any) {
    console.error("final submit error", e);
    alert(e?.response?.data?.message ?? "Could not complete the request.");
  }
});

  const handleCancel = () => {
    clearDraft();
    window.location.href = "https://www.swisstaxonline.ch";
  };

  // -------------------- UI --------------------
  return (
    <div className="product-page">
      <header className="product-header">
        <div>
          <h1>{t("product.title")}</h1>
          <p className="product-subtitle">{t("product.subtitle")}</p>
        </div>
      </header>

      <form className="product-layout" onSubmit={onSubmit}>
        {/* LEFT – sections 1..9 */}
        <section className="product-main">
          {/* Step 1 */}
          {step === 1 && (
            <StepCard
              title={t("product.sections.profile")}
              onNext={goNext}
            >
              <div className="field-row">
                <label>{t("product.taxYear")}</label>
                <select {...register("taxYear", { valueAsNumber: true })}>
                  <option value={currentYear - 1}>{currentYear - 1}</option>
                  <option value={currentYear}>{currentYear}</option>
                </select>
              </div>
            </StepCard>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <StepCard
              title={t("product.maritalStatus")}
              onPrev={goPrev}
              onNext={goNext}
            >
              <div className="choice-row">
                <label className="pill-choice">
                  <input
                    type="radio"
                    value="single"
                    {...register("maritalStatus")}
                  />
                  <span>{t("product.marital.single")}</span>
                </label>
                <label className="pill-choice">
                  <input
                    type="radio"
                    value="married"
                    {...register("maritalStatus")}
                  />
                  <span>{t("product.marital.married")}</span>
                </label>
              </div>
            </StepCard>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <StepCard
              title={t("product.childrenCount")}
              onPrev={goPrev}
              onNext={goNext}
            >
              <div className="field-row">
                <input
                  type="number"
                  min={0}
                  {...register("childrenCount", { valueAsNumber: true })}
                />
              </div>
            </StepCard>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <StepCard
              title={t("product.sections.situation")}
              onPrev={goPrev}
              onNext={goNext}
            >
              <div className="field-row">
                <label>{t("product.incomeSources")}</label>
                <input
                  type="number"
                  min={1}
                  {...register("incomeSources", { valueAsNumber: true })}
                />
                <p className="field-hint">{t("product.incomeHint")}</p>
              </div>
            </StepCard>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <StepCard
              title={t("product.wealthStatements")}
              onPrev={goPrev}
              onNext={goNext}
            >
              <div className="field-row">
                <input
                  type="number"
                  min={0}
                  {...register("wealthStatements", { valueAsNumber: true })}
                />
                <p className="field-hint">{t("product.wealthHint")}</p>
              </div>
            </StepCard>
          )}

          {/* Step 6 */}
          {step === 6 && (
            <StepCard
              title={t("product.properties")}
              onPrev={goPrev}
              onNext={goNext}
            >
              <div className="field-row">
                <input
                  type="number"
                  min={0}
                  {...register("properties", { valueAsNumber: true })}
                />
              </div>
            </StepCard>
          )}

          {/* Step 7 */}
          {step === 7 && (
            <StepCard
              title={t("product.propertiesDetailsTitle")}
              onPrev={goPrev}
              // مافي Next إلا لما تكون القيم صحيحة
              onNext={canGoFrom7 ? goNext : undefined}
            >
              <div className="field-row">
                <label>{t("product.propertiesCount")}</label>
                <input
                  type="number"
                  min={1}
                  {...register("properties", { valueAsNumber: true })}
                />
              </div>

              <div className="field-row">
                <label>{t("product.newProperties")}</label>
                <input
                  type="number"
                  min={0}
                  max={properties}
                  {...register("newProperties", { valueAsNumber: true })}
                />
                <p className="field-hint">
                  {t("product.newPropertiesHint")}
                </p>
              </div>
            </StepCard>
          )}

   {step === 8 && (
  <StepCard
    title={t("product.sections.offers")}
    subtitle={t("product.offersHint")}
    onPrev={goPrev}
  >
    <div className="offers-list">
      {/* 
        نتحقق أولاً إذا كانت الأسعار قد تم تحميلها.
        إذا لم تكن قد حُملت بعد، يمكننا عرض رسالة "جاري التحميل..." أو لا شيء.
      */}
      {!offerPrices ? (
        <p>{t("product.calculatingPrices")}</p> // "Calculating prices..."
      ) : (
        // إذا تم تحميل الأسعار، نقوم بعرضها
        offers.map((offer) => {
          // 1. نحدد السعر الديناميكي الصحيح لكل عرض
          let dynamicPrice = 0;
          if (offer.id === 'Standard') {
            dynamicPrice = offerPrices.standard;
          } else if (offer.id === 'Premium') {
            dynamicPrice = offerPrices.premium;
          } else if (offer.id === 'Confort') { // افترض أن لديك عرض 'confort'
            dynamicPrice = offerPrices.confort;
          }

          // 2. ننشئ كرت العرض بالسعر الديناميكي
          return (
            <button
              key={offer.id}
              type="button"
              className={
                "offer-card" +
                (selectedOffer?.id === offer.id ? " selected" : "") +
                (offer.recommended ? " recommended" : "")
              }
              // عند الضغط، نمرر العرض مع سعره المحدث
              onClick={() => handleOfferGuard({ ...offer, price: dynamicPrice })}
            >
              <div className="offer-header">
                <span className="offer-name">{offer.name}</span>
                <span className="offer-price">
                  {/* 3. نعرض السعر الديناميكي هنا */}
                  CHF {dynamicPrice.toFixed(0)}.–
                </span>
              </div>
              <p className="offer-desc">{offer.description}</p>
              {offer.recommended && (
                <span className="offer-badge">
                  {t("product.recommended")}
                </span>
              )}
              <span className="offer-cta">
                {t("product.chooseOffer")}
              </span>
            </button>
          );
        })
      )}
    </div>
  </StepCard>
)}



{/* --- الخطوة 9 (الجديدة): عرض السعر والملخص --- */}
{step === 9 && (
  <div className="product-block">
    <div className="product-block-header">
      <h2>{t("product.sections.summary")}</h2>
      <button
        type="button"
        className="link-like edit-request-inline"
        onClick={() => setStep(8)}
      >
        {t("product.editRequest")}
      </button>
    </div>

    <div className="product-profile-summary">
      <h3>{t("product.sections.summary")}</h3>
      
      <ul>
        {/* 1. عناصر الملخص الحالية (صحيحة) */}
        <li>{t("product.summary.taxYear", { year: taxYear })}</li>
        <li>
          {t("product.summary.marital", {
            status:
              maritalStatus === "single"
                ? t("product.marital.single")
                : t("product.marital.married"),
          })}
        </li>
        <li>{t("product.summary.children", { count: childrenCount })}</li>
        <li>{t("product.summary.incomes", { count: incomeSources })}</li>
        <li>{t("product.summary.wealth", { count: wealthStatements })}</li>
        <li>{t("product.summary.properties", { count: properties })}</li>
        
        {/* --- 2. بداية الإضافة: عرض العرض المختار --- */}
        {selectedOffer && (
          <li>
            <strong>{t("product.sections.offer")}:</strong> {selectedOffer.name}
          </li>
        )}
        {/* --- نهاية الإضافة --- */}
      </ul>

      {/* --- 3. بداية التعديل: عرض السعر الصحيح --- */}
      {/* نقرأ السعر مباشرة من selectedOffer */}
      {selectedOffer && (
        <p className="product-final-price"> {/* يمكنك إضافة class للتنسيق */}
          <strong>{t("product.finalPrice")}:</strong>{" "}
          CHF {selectedOffer.price.toFixed(0)}.–
        </p>
      )}
      {/* --- نهاية التعديل --- */}
    </div>

    <div className="product-actions">
      <button
        type="button"
        className="btn-secondary"
        onClick={handleCancel}
      >
        {t("product.cancel")}
      </button>
      <button
        type="button"
        className="btn-primary"
        onClick={() => setStep(10)} 
      >
        {t("product.proceedToBilling")}
      </button>
    </div>
  </div>
)}


{step === 10 && (
  <div className="product-block">
    <div className="product-block-header">
      <h2>{t("product.sections.billing")}</h2>
      <button
        type="button"
        className="link-like edit-request-inline"
        onClick={() => setStep(9)}
      >
        {t("product.back")}
      </button>
    </div>

    <div className="field-grid-2">
      <div className="field-row">
        <label>{t("product.billing.firstName")}</label>
        <input type="text" {...register("billingFirstName")} />
      </div>
      <div className="field-row">
        <label>{t("product.billing.lastName")}</label>
        <input type="text" {...register("billingLastName")} />
      </div>
      <div className="field-row">
        <label>{t("product.billing.street")}</label>
        <input type="text" {...register("billingStreet")} />
      </div>
      <div className="field-row">
        <label>{t("product.billing.postalCode")}</label>
        <input type="text" {...register("billingPostalCode")} />
      </div>
      <div className="field-row">
        <label>{t("product.billing.city")}</label>
        <input type="text" {...register("billingCity")} />
      </div>
    </div>

    <div className="product-actions">
      <button
        type="button"
        className="btn-secondary"
        onClick={handleCancel}
      >
        {t("product.cancel")}
      </button>

<button
  type="button"
  className="btn-primary"
  disabled={isSubmitting}
  onClick={handleSubmit(async (formValues) => {
        console.log("Billing values:", formValues.billingFirstName, formValues.billingCity);

    if (!selectedOffer) {
      alert("Please choose an offer first");
      setStep(8);
      return;
    }

    const questionnaireId = localStorage.getItem("questionnaireId");
    if (!questionnaireId) {
      alert("Session error, please restart.");
      return;
    }

    try {
      // --- Step 1: Finalize questionnaire ---
      await axiosClient.post(`/questionnaire/${questionnaireId}/finalize`, {
        offer: selectedOffer.id,
        billing: {
          firstName: formValues.billingFirstName,
          lastName: formValues.billingLastName,
          street: formValues.billingStreet,
          postalCode: formValues.billingPostalCode,
          city: formValues.billingCity,
        },
      });

      // --- Step 2: Generate QR-Bill PDF ---
      const pdfResponse = await axiosClient.post(
        "/qr-bill/generate",
        {
          creditorAccount: "CH37 8080 8001 0062 4300 3",
          amount: selectedOffer.price,
          currency: "CHF",
          debtor: {
            name: `${formValues.billingFirstName} ${formValues.billingLastName}`,
            address: formValues.billingStreet,
            zip: formValues.billingPostalCode,
            city: formValues.billingCity,
            country: "CH",
          },
          reference: `RF${questionnaireId}`,
          additionalInformation: `Tax declaration ${taxYear}`,
          year: taxYear,
        },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "qr-bill.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();

      clearDraft();
      localStorage.removeItem("questionnaireId");
      navigate("/client-dashboard");

    } catch (error: any) {
      console.error("QR-Bill generation error", error);
      alert(error?.response?.data?.message || "Failed to generate QR-Bill.");
    }
  })}
>
  {isSubmitting ? t("product.confirming") : t("product.confirm")}
</button>
    </div>
  </div>
)}

        </section>

      </form>
    </div>
  );
}
