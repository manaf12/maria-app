// src/components/admin/AdminDeclarationAssignCard.tsx
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AdminDeclaration } from "../../services/admin-declarations.service";

type Props = {
  declaration: AdminDeclaration;
  onAssign: (args: { declarationId: string; adminId: string; note?: string }) => Promise<void>;
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function AdminDeclarationAssignCard({ declaration, onAssign }: Props) {
  const { t } = useTranslation();

  const clientName = useMemo(() => {
    const first = declaration.clientProfile?.firstName ?? "";
    const last = declaration.clientProfile?.lastName ?? "";
    const full = `${first} ${last}`.trim();
    return full || t("admin.declarations.unknownClient");
  }, [declaration.clientProfile?.firstName, declaration.clientProfile?.lastName, t]);

  const taxYear = declaration.questionnaireSnapshot?.taxYear ?? "—";
  const email = declaration.clientProfile?.user?.email ?? "—";

  const [adminId, setAdminId] = useState("");
  const [note, setNote] = useState(t("admin.declarations.defaultNote"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isAssigned = !!declaration.assignedAdminId;

  async function handleAssign() {
    setError("");
    if (!adminId.trim()) {
      setError(t("admin.declarations.errors.adminIdRequired"));
      return;
    }
    try {
      setBusy(true);
      await onAssign({
        declarationId: declaration.id,
        adminId: adminId.trim(),
        note: note.trim() || undefined,
      });
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          t("admin.declarations.errors.assignFailed")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="declaration-card">
      <div className="declaration-header-row" style={{ alignItems: "center" }}>
        <div>
          <h3 className="declaration-title">
            {t("admin.declarations.cardTitle", { year: taxYear, name: clientName })}
          </h3>
          <p className="declaration-subtitle">
            {t("admin.declarations.cardSubtitle", {
              fileIdShort: declaration.id.slice(0, 8),
              email,
              status: declaration.status ?? "—",
            })}
          </p>
          <p className="declaration-subtitle" style={{ marginTop: 6 }}>
            {t("admin.declarations.datesLine", {
              createdAt: fmtDate(declaration.createdAt),
              updatedAt: fmtDate(declaration.updatedAt),
            })}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 360 }}>
          <input
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            placeholder={t("admin.declarations.adminIdPlaceholder")}
            disabled={busy || isAssigned}
            style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #e5e7eb" }}
          />

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("admin.declarations.notePlaceholder")}
            disabled={busy || isAssigned}
            style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #e5e7eb" }}
          />

          <button
            type="button"
            className="declaration-action-btn"
            onClick={handleAssign}
            disabled={busy || isAssigned}
            style={{ opacity: busy || isAssigned ? 0.6 : 1 }}
          >
            {isAssigned
              ? t("admin.declarations.assigned")
              : busy
              ? t("admin.declarations.assigning")
              : t("admin.declarations.assign")}
          </button>

          {error ? <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
        </div>
      </div>
    </article>
  );
}
