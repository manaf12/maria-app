import { useParams } from "react-router-dom";

export default function AdminDeclarationDetailsPage() {
  const { id } = useParams();

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px" }}>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Declaration details</h1>
      <p style={{ color: "#64748b", marginTop: 8 }}>ID: {id}</p>

      {/* Later: fetch by id, show steps/files/pricing/assignment history */}
    </div>
  );
}
