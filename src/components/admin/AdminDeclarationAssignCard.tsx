/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/admin/AdminDeclarationAssignCard.tsx
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { AdminDeclaration } from "../../services/admin-declarations.service";

type Props = {
  declaration: AdminDeclaration;
  checked: boolean;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function AdminDeclarationAssignCard({
  declaration,
  checked,
  onToggle,
  onOpen,
}: Props) {
  const { t } = useTranslation();

  const clientName = useMemo(() => {
    const first = declaration.clientProfile?.firstName ?? "";
    const last = declaration.clientProfile?.lastName ?? "";
    const full = `${first} ${last}`.trim();
    return full || t("admin.declarations.unknownClient");
  }, [declaration.clientProfile?.firstName, declaration.clientProfile?.lastName, t]);

  const taxYear = declaration.questionnaireSnapshot?.taxYear ?? "—";
  const email = declaration.clientProfile?.user?.email ?? "—";

  const isAssigned = !!declaration.assignedAdminId;

  return (
    <article
      className="declaration-card"
      role="button"
      tabIndex={0}
            onClick={() => {
        console.log("Card clicked", declaration.id); // أضف السجلات هنا للتحقق
        onOpen(declaration.id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(declaration.id);
      }}
      style={{ cursor: "pointer", opacity: isAssigned ? 0.7 : 1 }}
    >
      <div className="declaration-header-row" style={{ alignItems: "center", gap: 12 }}>
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={checked}
          disabled={isAssigned}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onToggle(declaration.id)}
          aria-label={t("admin.declarations.select")}
          style={{ width: 18, height: 18 }}
        />

        <div style={{ flex: 1 }}>
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

        <button
          type="button"
          className="btn-outline"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(declaration.id);
          }}
        >
          {t("admin.declarations.open")}
        </button>
      </div>
    </article>
  );
}
