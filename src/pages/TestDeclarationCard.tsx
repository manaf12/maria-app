// src/pages/TestDeclarationCard.tsx
// import { useTranslation } from "react-i18next";
import TaxDeclarationCard from "../components/TaxDeclarationCard";

import type { TaxDeclaration } from "../components/TaxDeclarationCard";

export default function TestDeclarationCard() {
  const testDecl: TaxDeclaration = {
    id: "12345",
    taxYear: 2024,
    clientName: "TAG Solutions SA",
    productName: "SA Basic CHF 590.–",
    currentStep: 3
  };
  
  return (
    <div style={{ maxWidth: "900px", margin: "40px auto" }}>
      <TaxDeclarationCard
        declaration={testDecl}
        onActionClick={() => alert("Action clicked!")}
      />
    </div>
  );
}
