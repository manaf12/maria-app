/* eslint-disable no-empty */
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
type ServiceRow = {
  key: string;
  standard: boolean;
  premium: boolean;
  confort: boolean;
};

type Offer = {
  id: string;
  name: string;
  price: number;
};

type QuoteDraft = {
  step: number;
  form: FormValues;
  selectedOfferId?: string;
};

const DRAFT_KEY = "taxonline_quote_draft";

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
            <button type="button" className="btn-secondary step-back-link" onClick={onPrev}>
              <span aria-hidden="true"></span>
              <span>{t("product.back")}</span>
            </button>
          ) : (
            <span />
          )}

          {onNext && (
            <button
              type="button"
              className="btn-primary step-next-btn"
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
  const [restored, setRestored] = useState(false);
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const serviceRows: ServiceRow[] = [
    { key: "requestDocuments", standard: true, premium: true, confort: true },
    {
      key: "verifyReceivedDocuments",
      standard: true,
      premium: true,
      confort: true,
    },
    { key: "prepareTaxReturn", standard: true, premium: true, confort: true },
    { key: "maximizeDeductions", standard: true, premium: true, confort: true },
    { key: "deadlineExtension", standard: true, premium: true, confort: true },

    // Excel shows ✗ for Standard, ✓ for Premium, ✓ for Confort
    {
      key: "reviewAndDiscussion",
      standard: false,
      premium: true,
      confort: true,
    },

    { key: "submitByOurTeam", standard: true, premium: true, confort: true },

    // Excel shows ✗ for Standard, ✗ for Premium, ✓ for Confort
    {
      key: "representationBeforeAuthority",
      standard: false,
      premium: false,
      confort: true,
    },
    {
      key: "unlimitedCallsEmails",
      standard: false,
      premium: false,
      confort: true,
    },
    {
      key: "verifyAssessmentNotice",
      standard: false,
      premium: false,
      confort: true,
    },
    {
      key: "appealIfNecessary",
      standard: false,
      premium: false,
      confort: true,
    },
  ];

  const renderCheck = (enabled: boolean) => (
    <span className={enabled ? "tick yes" : "tick no"}>
      {enabled ? "✓" : "—"}
    </span>
  );
  const saveStepData = async (dataToSave: Partial<FormValues>) => {
    const questionnaireId = localStorage.getItem("questionnaireId");
    if (!questionnaireId) {
      return;
    }
    const payload = dataToSave;
    if (!payload || Object.keys(payload).length === 0) {
      return;
    }

    try {
      const url = user
        ? `/questionnaire/${questionnaireId}/save-step`
        : `/questionnaire/${questionnaireId}/save-step-public`;
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
      trigger,
    formState: { isSubmitting , errors },
  } = useForm<FormValues>({
    defaultValues: {
      taxYear: currentYear - 1,
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
const stepFields: Record<number, (keyof FormValues)[]> = {
  1: ["taxYear"],
  2: ["maritalStatus"],
  3: ["childrenCount"],
  4: ["incomeSources"],
  5: ["wealthStatements"],
  6: ["properties"],
  7: ["properties", "newProperties"],
  10: [
    "billingFirstName",
    "billingLastName",
    "billingStreet",
    "billingPostalCode",
    "billingCity",
  ],
};

  const [step, setStep] = useState<number>(1);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
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

  const offers: Offer[] = useMemo(
    () => [
      {
        id: "Standard",
        name: t("product.offers.standard"),
        price: 0,
      },
      {
        id: "Premium",
        name: t("product.offers.premium"),
        price: 0,
      },
      {
        id: "Confort",
        name: t("product.offers.confort"),
        price: 0,
      },
    ],
    [t],
  );
  useEffect(() => {
    if (properties === 0) {
      setValue("newProperties", 0);
    }
  }, [properties, setValue]);
  const canGoFrom7 =
    properties > 0 && newProperties >= 0 && newProperties <= properties;
useEffect(() => {
  let mounted = true;

  const loadState = async () => {
    const draft = loadDraft();
    const questionnaireId = localStorage.getItem("questionnaireId");
    const fromAuth = (location.state as any)?.fromAuth;

    // Helper: build Offer with dynamic price using offerPrices
    const buildOfferWithPrice = (
      offerId: string,
      prices: { standard: number; premium: number; confort: number },
    ) => {
      const base = offers.find((o) => o.id === offerId) ?? null;
      if (!base) return null;

      const price =
        base.id === "Standard"
          ? prices.standard
          : base.id === "Premium"
          ? prices.premium
          : prices.confort;

      return { ...base, price };
    };

    // 1) Restore from local draft first
    if (draft && draft.form) {
      if (!mounted) return;

      reset(draft.form);

      // Default restore (no price yet)
      let restoredOffer =
        draft.selectedOfferId
          ? offers.find((o) => o.id === draft.selectedOfferId) ?? null
          : null;

      // If we have selectedOfferId + questionnaireId => fetch dynamic prices and fix the price
      if (draft.selectedOfferId && questionnaireId) {
        try {
          const pricesRes = await axiosClient.get(
            `/pricing/calculate-all/${questionnaireId}`,
          );
          const prices = pricesRes.data as {
            standard: number;
            premium: number;
            confort: number;
          };

          if (!mounted) return;

          setOfferPrices(prices);

          const withPrice = buildOfferWithPrice(draft.selectedOfferId, prices);
          if (withPrice) restoredOffer = withPrice;
        } catch (e) {
          console.error("Failed to restore offer price from pricing:", e);
          // keep restoredOffer as fallback (might be 0)
        }
      }

      if (!mounted) return;
      setSelectedOffer(restoredOffer);

      // Important: after restoring offer and price, decide step
      if (user && draft.selectedOfferId) {
        setStep(9);
      } else {
        setStep(draft.step ?? 1);
      }

      setRestored(true);
      return;
    }

    // 2) Restore from server questionnaire (if exists)
    if (questionnaireId) {
      try {
        const res = await axiosClient.get(`/questionnaire/${questionnaireId}`);
        const serverForm = res.data?.data;

        if (serverForm) {
          if (!mounted) return;

          reset(serverForm as any);

          // restore selected offer if exists (but fix price)
          const serverOfferIdRaw = res.data?.data?.offer;
          const serverOfferId = serverOfferIdRaw
            ? String(serverOfferIdRaw)
            : null;

          if (serverOfferId) {
            // Fetch prices once, then set both offerPrices and selectedOffer with correct price
            try {
              const pricesRes = await axiosClient.get(
                `/pricing/calculate-all/${questionnaireId}`,
              );
              const prices = pricesRes.data as {
                standard: number;
                premium: number;
                confort: number;
              };

              if (!mounted) return;

              setOfferPrices(prices);

              // Match offer id case-insensitively
              const normalizedId =
                serverOfferId.toLowerCase() === "standard"
                  ? "Standard"
                  : serverOfferId.toLowerCase() === "premium"
                  ? "Premium"
                  : serverOfferId.toLowerCase() === "confort"
                  ? "Confort"
                  : null;

              if (normalizedId) {
                const withPrice = buildOfferWithPrice(normalizedId, prices);
                if (withPrice) setSelectedOffer(withPrice);
              } else {
                // fallback: try old logic (may become 0)
                const offerFound = offers.find(
                  (o) =>
                    o.id.toLowerCase() === serverOfferId.toLowerCase(),
                );
                if (offerFound) setSelectedOffer(offerFound);
              }
            } catch (e) {
              console.error("Failed to calculate prices (server restore):", e);
              // fallback to old logic (price might be 0)
              const offerFound = offers.find(
                (o) =>
                  o.id.toLowerCase() === serverOfferId.toLowerCase(),
              );
              if (offerFound) setSelectedOffer(offerFound);
            }
          } else {
            setSelectedOffer(null);
          }

          const serverStep = Number(
            res.data?.currentStep ?? res.data?.data?.currentStep ?? 1,
          );

          setStep(
            Number.isFinite(serverStep) && serverStep >= 1 ? serverStep : 1,
          );

          setRestored(true);
          return;
        }
      } catch (e) {
        console.error("Failed to load questionnaire:", e);
      }
    }

    // 3) Default initial step
    if (!mounted) return;
    setStep(fromAuth && user ? 8 : 1);
    setRestored(true);
  };

  loadState();

  return () => {
    mounted = false;
  };
}, [location.state, reset, user, offers]);

  useEffect(() => {
    if (!restored) return;
    const form = getValues();
    const draft: QuoteDraft = {
      step,
      form,
      selectedOfferId: selectedOffer?.id,
    };
    saveDraft(draft);
  }, [step, selectedOffer, getValues, restored]);
  useEffect(() => {
    const questionnaireId = localStorage.getItem("questionnaireId");
    if (!restored) return;

    if (step === 8 && questionnaireId && !offerPrices) {
      axiosClient
        .get(`/pricing/calculate-all/${questionnaireId}`)
        .then((res) => setOfferPrices(res.data))
        .catch((e) => {
          console.error("Failed to calculate offer prices (restore):", e);
        });
    }
  }, [step, offerPrices, restored]);
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
  // 1) validate only current step fields
  const fields = stepFields[step] ?? [];
  const ok = fields.length
    ? await trigger(fields as any, { shouldFocus: true })
    : true;

  if (!ok) return; // stop here: do NOT go next

  // 2) save only after validation passes
  const currentValues = getValues();
  await saveStepData(currentValues);

  // 3) your existing navigation logic
  if (step === 7) {
    if (!canGoFrom7) return;

    const questionnaireId = localStorage.getItem("questionnaireId");
    if (!questionnaireId) {
      alert("Session error. Please restart.");
      return;
    }

    try {
      const res = await axiosClient.get(
        `/pricing/calculate-all/${questionnaireId}`,
      );
      setOfferPrices(res.data);
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
      if (!questionnaireId) return;

      try {
        const res = await axiosClient.get(
          `/pricing/calculate-all/${questionnaireId}`,
        );
        setOfferPrices(res.data);
        setStep(8);
      } catch (error) {
        console.error(error);
      }
    } else {
      setStep(7);
    }
    return;
  }

  setStep((s) => s + 1);
};

  const handleChooseOffer = async (offer: Offer) => {
    setSelectedOffer(offer);

    const questionnaireId = localStorage.getItem("questionnaireId");
    if (!questionnaireId) {
      alert("Session error. Please restart.");
      return;
    }

    if (user) {
      setStep(9);
      return;
    }

    // NEW: save latest answers before submit-anonymous
    try {
      await axiosClient.post(
        `/questionnaire/${questionnaireId}/save-step-public`,
        getValues(),
      );
    } catch (e) {
      console.error("Failed to save before submit-anonymous:", e);
    }

    saveDraft({
      step: 9,
      form: getValues(),
      selectedOfferId: offer.id,
    });

    try {
      const res = await axiosClient.post(
        `/questionnaire/${questionnaireId}/submit-anonymous`,
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
      await axiosClient.post(
        `/questionnaire/${questionnaireId}/save-step`,
        formValues,
      );
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
        },
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
            <StepCard title={t("product.sections.profile")} onNext={goNext}>
              <div className="field-row">
                <label>{t("product.taxYear")}</label>
                <select {...register("taxYear", { valueAsNumber: true , required : "Tax year is required"})}>
                  <option value={currentYear - 1}>{currentYear - 1}</option>
                  <option value={currentYear}>{currentYear}</option>
                </select>
                {errors.taxYear?.message && (
  <p className="field-error">{String(errors.taxYear.message)}</p>
)}
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
                    {...register("maritalStatus", { required: "Marital status is required" })}
                  />
                  <span>{t("product.marital.single")}</span>
                </label>
                <label className="pill-choice">
                  <input
                    type="radio"
                    value="married"
                    {...register("maritalStatus", { required: "Marital status is required" })}
                  />
                  <span>{t("product.marital.married")}</span>
                </label>
              </div>
              {errors.maritalStatus?.message && (
  <p className="field-error">{String(errors.maritalStatus.message)}</p>
)}
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
           {...register("childrenCount", {
            valueAsNumber: true,
            required: "Children count is required",
        min: { value: 0, message: "Must be 0 or more" },
  })}
/>
{errors.childrenCount?.message && (
  <p className="field-error">{String(errors.childrenCount.message)}</p>
)}
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
  {...register("incomeSources", {
    valueAsNumber: true,
    setValueAs: (v) => (v === "" ? undefined : Number(v)),
    required: "Income sources is required",
    min: { value: 1, message: "Must be at least 1" },
  })}
/>
{errors.incomeSources?.message && (
  <p className="field-error">{String(errors.incomeSources.message)}</p>
)}
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
  {...register("wealthStatements", {
    valueAsNumber: true,
    required: "Wealth statements is required",
    min: { value: 0, message: "Must be 0 or more" },
  })}
/>
{errors.wealthStatements?.message && (
  <p className="field-error">{String(errors.wealthStatements.message)}</p>
)}
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
  {...register("properties", {
    valueAsNumber: true,
    required: "Properties is required",
    min: { value: 0, message: "Must be 0 or more" },
  })}
/>
{errors.properties?.message && (
  <p className="field-error">{String(errors.properties.message)}</p>
)}
              </div>
            </StepCard>
          )}

          {/* Step 7 */}
    {step === 7 && (
  <StepCard
    title={t("product.propertiesDetailsTitle")}
    onPrev={goPrev}
    onNext={canGoFrom7 ? goNext : undefined}
  >
    <div className="field-row">
      <label>{t("product.propertiesCount")}</label>
      <input
        type="number"
        min={1}
        {...register("properties", {
          setValueAs: (v) => (v === "" ? undefined : Number(v)),
          required: "Properties count is required",
          min: { value: 1, message: "Must be at least 1" },
        })}
      />

      {errors.properties?.message && (
        <p className="field-error">{String(errors.properties.message)}</p>
      )}
    </div>

    <div className="field-row">
      <label>{t("product.newProperties")}</label>
      <input
        type="number"
        min={0}
        max={properties}
        {...register("newProperties", {
          setValueAs: (v) => (v === "" ? undefined : Number(v)),
          required: "New properties is required",
          min: { value: 0, message: "Must be 0 or more" },
          validate: (v) =>
            v <= getValues("properties") ||
            "New properties cannot exceed properties",
        })}
      />

      {errors.newProperties?.message && (
        <p className="field-error">{String(errors.newProperties.message)}</p>
      )}

      <p className="field-hint">{t("product.newPropertiesHint")}</p>
    </div>
  </StepCard>
)}

          {/* Step 8 */}
          {step === 8 && (
            <StepCard
              title={t("product.sections.offers")}
              subtitle={t("product.offersHint")}
              onPrev={goPrev}
            >
              {!offerPrices ? (
                <p>{t("product.calculatingPrices")}</p>
              ) : (
                <div className="pricing-table-card">
                  <div
                    className="pricing-table-wrap"
                    role="region"
                    aria-label="Pricing table"
                  >
                    <table className="pricing-table">
                      <thead>
                        <tr>
                          <th className="pricing-th pricing-feature-col">
                            Package
                          </th>

                          {offers.map((offer) => {
                            const dynamicPrice =
                              offer.id === "Standard"
                                ? offerPrices.standard
                                : offer.id === "Premium"
                                ? offerPrices.premium
                                : offerPrices.confort;

                            const isSelected = selectedOffer?.id === offer.id;
                            return (
                              <th
                                key={offer.id}
                                className={
                                  "pricing-th pricing-plan-col" +
                                  (isSelected ? " is-selected" : "")
                                }
                                scope="col"
                              >
                                <div className="pricing-plan-head">
                                  <div className="pricing-plan-top">
                                    <span className="pricing-plan-name">
                                      {offer.name}
                                    </span>
                                    <span className="pricing-plan-price">
                                      CHF {dynamicPrice.toFixed(0)}.–
                                    </span>
                                  </div>

                                  <div className="pricing-plan-sub">
                             
                                  </div>

                                  <button
                                    type="button"
                                    className={
                                      "pricing-select-btn" +
                                      (isSelected ? " is-selected" : "") 
                                    }
                                    onClick={() =>
                                      handleOfferGuard({
                                        ...offer,
                                        price: dynamicPrice,
                                      })
                                    }
                                  >
                                    {isSelected
                                      ? t("product.editRequest")
                                      : t("product.chooseOffer")}
                                  </button>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      <tbody>
                        {serviceRows.map((row) => (
                          <tr key={row.key}>
                            <th
                              className="pricing-td pricing-feature-col"
                              scope="row"
                            >
                              {t(`product.services.${row.key}`)}
                            </th>

                            {offers.map((offer) => {
                              const enabled =
                                offer.id === "Standard"
                                  ? row.standard
                                  : offer.id === "Premium"
                                  ? row.premium
                                  : row.confort;

                              const isSelected = selectedOffer?.id === offer.id;

                              return (
                                <td
                                  key={offer.id}
                                  className={
                                    "pricing-td pricing-plan-col" +
                                    (isSelected ? " is-selected" : "")
                                  }
                                >
                                  {renderCheck(enabled)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </StepCard>
          )}

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
                  <li>{t("product.summary.taxYear", { year: taxYear })}</li>
                  <li>
                    {t("product.summary.marital", {
                      status:
                        maritalStatus === "single"
                          ? t("product.marital.single")
                          : t("product.marital.married"),
                    })}
                  </li>
                  <li>
                    {t("product.summary.children", { count: childrenCount })}
                  </li>
                  <li>
                    {t("product.summary.incomes", { count: incomeSources })}
                  </li>
                  <li>
                    {t("product.summary.wealth", { count: wealthStatements })}
                  </li>
                  <li>
                    {t("product.summary.properties", { count: properties })}
                  </li>
                  {selectedOffer && (
                    <li>
                      <strong>{t("product.sections.offer")}:</strong>{" "}
                      {selectedOffer.name}
                    </li>
                  )}
                </ul>
                {selectedOffer && (
                  <p className="product-final-price">
                    <strong>{t("product.finalPrice")}:</strong> CHF{" "}
                    {selectedOffer.price.toFixed(0)}.–
                  </p>
                )}
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
                    console.log(
                      "Billing values:",
                      formValues.billingFirstName,
                      formValues.billingCity,
                    );

                    if (!selectedOffer) {
                      alert("Please choose an offer first");
                      setStep(8);
                      return;
                    }

                    const questionnaireId =
                      localStorage.getItem("questionnaireId");
                    if (!questionnaireId) {
                      alert("Session error, please restart.");
                      return;
                    }

                    try {
                      await axiosClient.post(
                        `/questionnaire/${questionnaireId}/finalize`,
                        {
                          offer: selectedOffer.id,
                          billing: {
                            firstName: formValues.billingFirstName,
                            lastName: formValues.billingLastName,
                            street: formValues.billingStreet,
                            postalCode: formValues.billingPostalCode,
                            city: formValues.billingCity,
                          },
                        },
                      );
                      const pdfResponse = await axiosClient.post(
                        "/qr-bill/generate",

                        {
                          creditorAccount: "CH65 3080 8001 0062 4300 3",
                          amount: selectedOffer.price,
                          currency: "CHF",
                          debtor: {
                            name: `${formValues.billingFirstName} ${formValues.billingLastName}`,
                            address: formValues.billingStreet,
                            zip: formValues.billingPostalCode,
                            city: formValues.billingCity,
                            country: "CH",
                          },
                          reference: String(questionnaireId),
                          additionalInformation: `Tax declaration ${taxYear}`,
                          year: taxYear,
                        },
                        { responseType: "blob" },
                      );

                      const url = window.URL.createObjectURL(
                        new Blob([pdfResponse.data]),
                      );
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
                      alert(
                        error?.response?.data?.message ||
                          "Failed to generate QR-Bill.",
                      );
                    }
                  })}
                >
                  {isSubmitting
                    ? t("product.confirming")
                    : t("product.confirm")}
                </button>
              </div>
            </div>
          )}
        </section>
      </form>
    </div>
  );
}
