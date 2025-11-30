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


const saveStepData = async (dataToSave: Partial<FormValues>) => {
  // 1. اقرأ الـ ID من localStorage
  const questionnaireId = localStorage.getItem("questionnaireId");

  if (!questionnaireId) {
    console.error("Questionnaire ID not found. Cannot save progress.");
    // لا تفعل شيئاً إذا لم يكن هناك ID
    return;
  }

  // 2. لا داعي لترجمة الحقول، الـ Backend مرن بما يكفي
  //    فقط تأكد من أن الواجهة الخلفية يمكنها التعامل مع أسماء الحقول كما هي في الفورم
  //    (e.g., 'maritalStatus', 'childrenCount')
  const payload = dataToSave;

  // 3. لا ترسل طلباً إذا لم يكن هناك بيانات جديدة للحفظ
  if (!payload || Object.keys(payload).length === 0) {
    console.log("No new data to save.");
    return;
  }

  try {
    const url = `/questionnaire/${questionnaireId}/save-step`;
    console.log(`Saving step data to ${url} with payload:`, payload);
    
    // 4. أرسل الطلب
    await axiosClient.post(url, payload);

    console.log("Progress saved successfully.");
  } catch (error) {
    console.error("Failed to save progress:", error);
    // يمكنك عرض رسالة خطأ غير مزعجة هنا إذا أردت
  }
};





function saveDraft(draft: QuoteDraft) {
    console.log('--- SAVING DRAFT ---', draft); // <-- أضف هذا
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function loadDraft(): QuoteDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
        console.log('--- LOADING DRAFT ---', raw ? JSON.parse(raw) : null); // <-- أضف هذا

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
  // watch values
  const taxYear = watch("taxYear");
  const maritalStatus = watch("maritalStatus");
  const childrenCount = watch("childrenCount");
  const incomeSources = watch("incomeSources");
  const wealthStatements = watch("wealthStatements");
  const properties = watch("properties");
  const newProperties = watch("newProperties");

  // -------- Price Calculator (offers) --------
  const offers: Offer[] = useMemo(() => {
    const complexityScore =
      (maritalStatus === "married" ? 2 : 1) +
      childrenCount * 0.3 +
      incomeSources * 0.5 +
      wealthStatements * 0.4 +
      properties * 0.7;

    const base = 59;
    const standard = Math.round(base + complexityScore * 20);
    const premium = Math.round(base + complexityScore * 35);

    return [
      {
        id: "standard",
        name: t("product.offers.basic"),
        description: t("product.offers.basicDesc"),
        price: base,
      },
      {
        id: "premium",
        name: t("product.offers.standard"),
        description: t("product.offers.standardDesc"),
        price: standard,
        recommended: true,
      },
      {
        id: "confort",
        name: t("product.offers.premium"),
        description: t("product.offers.premiumDesc"),
        price: premium,
      },
    ];
  }, [maritalStatus, childrenCount, incomeSources, wealthStatements, properties, t]);

  // const totalPrice = selectedOffer?.price ?? (offers[0]?.price ?? 0);

  // إذا عدد العقارات 0 خلي newProperties دائماً 0
  useEffect(() => {
    if (properties === 0) {
      setValue("newProperties", 0);
    }
  }, [properties, setValue]);

  // شرط صالحية Step 7 (نستخدمه لعرض/إخفاء زر Next)
  const canGoFrom7 =
    properties > 0 &&
    newProperties >= 0 &&
    newProperties <= properties;

  // ----- تحميل مسوّدة بعد الـ sign-in / sign-up -----
  useEffect(() => {
    const draft = loadDraft();
    const fromAuth = (location.state as any)?.fromAuth;

    if (draft && draft.form) {
      reset(draft.form);

      const offerFromDraft = draft.selectedOfferId
        ? offers.find((o) => o.id === draft.selectedOfferId) ?? null
        : null;

      if (offerFromDraft) {
        setSelectedOffer(offerFromDraft);
      }

      if (user && offerFromDraft) {
        setStep(9);
      } else {
        setStep(draft.step || 1);
      }
    } else if (fromAuth && user) {
      setStep(8);
    }
    // ما حطّينا offers بالـ deps حتى ما نرجع نعمل reset كل ما تتغيّر القيم
  }, [location.state, reset, user]);

  // لما تتغير الفورم أو الستب، خزّن draft
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
      setOfferPrices(res.data); // خزّن الأسعار في متغير الحالة
      console.log("Prices calculated:", res.data);
      
      setStep(8); // انتقل إلى صفحة العروض
    } catch (error) {
      console.error("Failed to calculate prices:", error);
      alert("Could not calculate offer prices.");
      // لا تنتقل إلى الخطوة التالية إذا فشل حساب السعر
    }
    return; // <-- مهم: أوقف تنفيذ باقي الدالة هنا
  }
  


  if (step === 6) {
    if (properties === 0) {
      // إذا لا توجد عقارات، اقفز مباشرة إلى الخطوة 8 (صفحة العروض)
      // لكننا نحتاج لحساب الأسعار هنا أيضاً!
      // لتجنب تكرار الكود، من الأفضل تعديل هذا الجزء قليلاً
      
      // تعديل مقترح:
      // بدلاً من setStep(8)، استدعِ goNext مرة أخرى من الخطوة 7 الوهمية
      // هذا معقد. دعنا نختار الحل الأبسط: كرر منطق حساب السعر.
      
      const questionnaireId = localStorage.getItem("questionnaireId");
      if (!questionnaireId) { /* ... معالجة الخطأ ... */ return; }
      try {
        const res = await axiosClient.get(`/pricing/calculate-all/${questionnaireId}`);
        setOfferPrices(res.data);
        setStep(8);
      } catch (error : any) { /* ... معالجة الخطأ ... */ }

    } else {
      setStep(7); // انتقل إلى خطوة تفاصيل العقارات
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
    console.error("ID not found, cannot proceed.");
    return;
  }

  try {
    // --- بداية التعديل ---

    // 1. إنهاء الاستبيان وتحديد العرض
    const finalizeUrl = `/questionnaire/${questionnaireId}/finalize`;
    await axiosClient.post(finalizeUrl, { offer: offer.id });
    console.log("Questionnaire finalized with offer:", offer.id);

    // 2. بعد النجاح، قم بحساب السعر فوراً
    console.log(`Calculating price for questionnaire ${questionnaireId}...`);
    const calculateUrl = `/pricing/calculate`;
    const pricingResponse = await axiosClient.post(calculateUrl, {
      questionnaireId: questionnaireId,
      offer: offer.id,
    });
    
    // 3. خزّن السعر المحسوب في متغير الحالة
    const finalPrice = pricingResponse.data.finalPrice;
    setCalculatedPrice(finalPrice);
    console.log(`Price calculated successfully: ${finalPrice}`);

    // 4. انتقل إلى الخطوة 9 الجديدة (عرض السعر)
    setStep(9);

    // --- نهاية التعديل ---

  } catch (error) {
    console.error("Failed to select offer and calculate price:", error);
    alert("An error occurred. Please try again.");
  }
};


  // Guard: ما منسمح بالـ choose قبل Step 8
  const handleOfferGuard = (offer: Offer) => {
    if (step < 8) {
      setStep(8);
      return;
    }
    handleChooseOffer(offer);
  };

const onSubmit = async () => { // <-- اترك 'data' كما هو
  if (!selectedOffer) {
    alert("Please select an offer first.");
    setStep(8);
    return;
  }

  const questionnaireId = localStorage.getItem("questionnaireId");
  if (!questionnaireId) {
    alert("Critical error: Session lost. Please start over.");
    return;
  }

  try {
    // --- الخطوة 1: تحديث عنوان الفوترة (تم تعطيلها مؤقتاً للاختبار) ---
    /*
    console.log("Updating user profile with billing address...");
    await axiosClient.patch('/users/me/profile', {
      firstName: data.billingFirstName,
      lastName: data.billingLastName,
      streetAddress: data.billingStreet,
      postalCode: data.billingPostalCode,
      city: data.billingCity,
    });
    console.log("User profile updated successfully.");
    */
    // --- نهاية الجزء المعطل ---


    // --- الخطوة 2: حساب السعر ---
    console.log(`Calculating price for questionnaire ${questionnaireId}...`);
    const pricingResponse = await axiosClient.post(
      `/pricing/calculate`,
      {
        questionnaireId: questionnaireId,
        offer: selectedOffer.id,
      }
    );
    const pricingId = pricingResponse.data.id;
    console.log(`Price calculated. Pricing ID: ${pricingId}`);

    // --- الخطوة 3: قبول السعر ---
    console.log(`Accepting pricing with ID: ${pricingId}`);
    await axiosClient.post(`/pricing/${pricingId}/accept`);
    console.log("Pricing accepted. Final order created!");

    // --- الخطوة 4: تنظيف وإنهاء ---
    clearDraft();
    localStorage.removeItem("questionnaireId");
    navigate("/client-dashboard");

  } catch (e: any) {
    console.error("Failed to confirm the final request:", e);
    alert(e?.response?.data?.message ?? "Could not confirm your request. Please try again.");
  }
};

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

      <form className="product-layout" onSubmit={handleSubmit(onSubmit)}>
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

          {/* Step 8 – Offers ككارد على اليسار */}
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
          if (offer.id === 'standard') {
            dynamicPrice = offerPrices.standard;
          } else if (offer.id === 'premium') {
            dynamicPrice = offerPrices.premium;
          } else if (offer.id === 'confort') { // افترض أن لديك عرض 'confort'
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


{/* --- الخطوة 10 (الجديدة): الفوترة والتأكيد النهائي --- */}
{step === 10 && (
  <div className="product-block">
    <div className="product-block-header">
      <h2>{t("product.sections.billing")}</h2>
      {/* زر الرجوع الآن يرجع إلى الخطوة 9 */}
      <button
        type="button"
        className="link-like edit-request-inline"
        onClick={() => setStep(9)}
      >
        {t("product.back")}
      </button>
    </div>

    {/* حقول الفوترة هنا */}
    <div className="field-grid-2">
      <div className="field-row">
        <label>{t("product.billing.firstName")}</label>
        <input type="text" {...register("billingFirstName")} />
      </div>
      <div className="field-row">
        <label>{t("product.billing.lastName")}</label>
        <input type="text" {...register("billingLastName")} />
      </div>
    </div>
    {/* ... باقي حقول الفوترة ... */}

    <div className="product-actions">
      <button
        type="button"
        className="btn-secondary"
        onClick={handleCancel}
      >
        {t("product.cancel")}
      </button>
      {/* هذا هو الزر الذي يشغل onSubmit */}
      <button
        type="submit"
        className="btn-primary"
        disabled={isSubmitting}
        onClick={()=>navigate('/client-dashboard')}
      >
        {isSubmitting
          ? t("product.confirming")
          : t("product.confirm")}
      </button>
    </div>
  </div>
)}

        </section>

        {/* RIGHT – Section 8 (Offers & price)
        <aside className="
        product-sidebar">
          <div className="product-block sticky">
            <h2>{t("product.sections.offers")}</h2>
            <p className="field-hint">{t("product.offersHint")}</p>

            <p className="product-total">
              {t("product.totalPrice")} CHF {totalPrice.toFixed(0)}.–
            </p>

            {step >= 8 && (
              <button
                type="button"
                className="link-like edit-request-inline"
                onClick={() => setStep(8)}
              >
                {t("product.editRequest")}
              </button>
            )}

            {offers.map((offer) => (
              <button
                key={offer.id}
                type="button"
                className={
                  "offer-card" +
                  (selectedOffer?.id === offer.id ? " selected" : "") +
                  (offer.recommended ? " recommended" : "")
                }
                onClick={() => handleOfferGuard(offer)}
              >
                <div className="offer-header">
                  <span className="offer-name">{offer.name}</span>
                  <span className="offer-price">
                    CHF {offer.price.toFixed(0)}.–
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
            ))}
          </div>
        </aside> */}
        
      </form>
    </div>
  );
}
