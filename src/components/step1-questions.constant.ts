import type { Step1Question } from "./Step1Questions";

// Canonical Step 1 question catalog. Kept on the frontend so no backend
// endpoint is required. If the backend ever exposes GET /files/:id/step1/questions,
// re-introduce a fetch and merge against this list by id.
export const DEFAULT_STEP1_QUESTIONS: Step1Question[] = [
  {
    id: "personalChanges",
    labelKey: "step1.questions.personalChanges",
    type: "text",
    required: false,
    sectionKey: "step1.sections.personalInformation",
  },
  {
    id: "transportMode",
    labelKey: "step1.questions.transportMode",
    type: "select",
    required: true,
    sectionKey: "step1.sections.professionalExpenses",
    options: [
      { value: "publicTransport", labelKey: "step1.options.transportMode.publicTransport" },
      { value: "bicycle", labelKey: "step1.options.transportMode.bicycle" },
      { value: "vehicle", labelKey: "step1.options.transportMode.vehicle" },
    ],
  },
  {
    id: "distanceToWorkKm",
    labelKey: "step1.questions.distanceToWorkKm",
    type: "number",
    required: true,
    sectionKey: "step1.sections.professionalExpenses",
    min: 0,
  },
  {
    id: "weeklyTripsToWork",
    labelKey: "step1.questions.weeklyTripsToWork",
    type: "number",
    required: true,
    sectionKey: "step1.sections.professionalExpenses",
    min: 0,
  },
  {
    id: "mealsOutsidePerWeek",
    labelKey: "step1.questions.mealsOutsidePerWeek",
    type: "number",
    required: true,
    sectionKey: "step1.sections.professionalExpenses",
    min: 0,
  },
  {
    id: "netAnnualRentVD_GE",
    labelKey: "step1.questions.netAnnualRentVD_GE",
    type: "number",
    required: false,
    sectionKey: "step1.sections.housing",
    min: 0,
  },
  {
    id: "canton",
    labelKey: "step1.questions.canton",
    type: "select",
    required: true,
    sectionKey: "step1.sections.taxAuthorityNumbers",
    options: [
      { value: "FR", labelKey: "step1.options.canton.FR" },
      { value: "BE", labelKey: "step1.options.canton.BE" },
      { value: "VD", labelKey: "step1.options.canton.VD" },
      { value: "VS", labelKey: "step1.options.canton.VS" },
      { value: "NE", labelKey: "step1.options.canton.NE" },
      { value: "GE", labelKey: "step1.options.canton.GE" },
      { value: "OTHER", labelKey: "step1.options.canton.OTHER" },
    ],
  },
  {
    id: "taxpayerNumber",
    labelKey: "step1.questions.taxpayerNumber",
    type: "text",
    required: true,
    sectionKey: "step1.sections.taxAuthorityNumbers",
  },
  {
    id: "controlOrDeclarationCode",
    labelKey: "step1.questions.controlOrDeclarationCode",
    type: "text",
    required: false,
    sectionKey: "step1.sections.taxAuthorityNumbers",
  },
];
