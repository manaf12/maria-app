// src/pages/TestViewRequestPage.tsx
import { ViewRequestContent, type ViewRequestData } from "./ViewRequestPage";

export default function TestViewRequestPage() {
  const mockData: ViewRequestData = {
    id: "mock-1",
    taxYear: 2024,
    clientName: "TAG Solutions SA",
    productName: "Comfort package CHF 390.–",
    currentStage: 3, // جرّبي تبدليها بين 1 و 5

    summary: {
      maritalStatus: "Married",
      childrenCount: 2,
      incomes: "2 salaries + AVS + LPP",
      properties: "1 main residence, 1 rental apartment",
      offerName: "Comfort package",
      offerPrice: 390,
      taxYear: 2024,
    },

    step1: {
      documents: [
        {
          id: "salary",
          label: "Salary certificates",
          mandatory: true,
          status: "uploaded",
        },
        {
          id: "bank",
          label: "Bank statements",
          mandatory: true,
          status: "todo",
        },
        {
          id: "pillar3",
          label: "3rd pillar certificates",
          mandatory: false,
          status: "todo",
        },
      ],
    },

    step2: {
      questions: [
        {
          id: "q1",
          label: "Did you have any foreign income in 2024?",
        },
        {
          id: "q2",
          label: "Any major medical expenses not covered by insurance?",
          answer: "No",
        },
      ],
    },

    step5: {
      date: "18.02.2025",
      method: "Electronic filing",
    },

    invoice: {
      offerName: "Comfort package – 2024",
      totalAmount: "CHF 390.–",
      invoiceUrl: "https://example.com/invoice.pdf",
    },
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <ViewRequestContent
        data={mockData}
        onBackToDashboard={() => alert("Back to dashboard (mock)")}
        onUploadDocuments={() => alert("Upload docs (mock)")}
        onSubmitStep1={() => alert("Submit step 1 (mock)")}
        onSubmitStep2={(answers) =>
          alert("Submit step 2 (mock): " + JSON.stringify(answers, null, 2))
        }
        onDownloadDraft={() => alert("Download draft (mock)")}
        onValidateDeclaration={(comments) =>
          alert("Validate (mock). Comments: " + comments)
        }
        onDownloadFinal={() => alert("Download final (mock)")}
        onUploadAssessmentNotice={() =>
          alert("Upload assessment notice (mock)")
        }
        onDownloadInvoice={(url) => alert("Download invoice: " + url)}
      />
    </div>
  );
}
