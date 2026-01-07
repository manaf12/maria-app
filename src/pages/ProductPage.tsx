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
            <button type="button" className="step-back-link" onClick={onPrev}>
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

    // In your screenshot row is blank (no checks). If you want ✓ for all, set all true.
    {
      key: "ratesAccordingToProfile",
      standard: false,
      premium: false,
      confort: false,
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
    formState: { isSubmitting },
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
      const questionId = localStorage.getItem("questionnaireId");
      const fromAuth = (location.state as any)?.fromAuth;
      if (draft && draft.form) {
        if (!mounted) return;
        reset(draft.form);
        setSelectedOffer(
          draft.selectedOfferId
            ? offers.find((o) => o.id === draft.selectedOfferId) ?? null
            : null,
        );

        if (user && draft.selectedOfferId) {
          setStep(9);
        } else {
          setStep(draft.step ?? 1);
        }

        setRestored(true);
        return;
      }

      if (questionId) {
        try {
          const res = await axiosClient.get(`/questionnaire/${questionId}`);
          const serverForm = res.data?.data;

          if (serverForm) {
            reset(serverForm as any);

            // restore selected offer if exists
            if (res.data?.data?.offer) {
              const offerFound = offers.find(
                (o) =>
                  o.id.toLowerCase() ===
                  String(res.data.data.offer).toLowerCase(),
              );
              if (offerFound) setSelectedOffer(offerFound);
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
    const currentValues = getValues();
    await saveStepData(currentValues);
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
        if (!questionnaireId) {
          /* ... معالجة الخطأ ... */ return;
        }
        try {
          const res = await axiosClient.get(
            `/pricing/calculate-all/${questionnaireId}`,
          );
          setOfferPrices(res.data);
          setStep(8);
        } catch (error: any) {
          /* ... معالجة الخطأ ... */
        }
      } else {
        setStep(7);
      }
    } else if (step < 9) {
      setStep((s) => s + 1);
    }
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
                            const isRecommended = !!offer.recommended;

                            return (
                              <th
                                key={offer.id}
                                className={
                                  "pricing-th pricing-plan-col" +
                                  (isRecommended ? " is-recommended" : "") +
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
                                    <span className="pricing-plan-desc">
                                      {offer.description}
                                    </span>
                                    {isRecommended && (
                                      <span className="pricing-badge">
                                        {t("product.recommended")}
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    className={
                                      "pricing-select-btn" +
                                      (isSelected ? " is-selected" : "") +
                                      (isRecommended ? " is-primary" : "")
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
                              const isRecommended = !!offer.recommended;

                              return (
                                <td
                                  key={offer.id}
                                  className={
                                    "pricing-td pricing-plan-col" +
                                    (isRecommended ? " is-recommended" : "") +
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
