import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { AdminDeclaration } from "../../services/admin-declarations.service";

type Props = {
  item: AdminDeclaration;
  checked: boolean;
  onToggle: (id: string) => void;
};

function shortId(id: string) {
  return id?.slice(0, 8) ?? "—";
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function StatusBadge({ status }: { status: string }) {
  const style: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid #e5e7eb",
    color: "#111827",
    background: "#f9fafb",
    display: "inline-block",
  };

  if (status === "DRAFT") style.background = "#fff7ed";
  if (status === "PENDING_PRICING") style.background = "#eff6ff";
  if (status === "DONE") style.background = "#ecfdf5";

  return <span style={style}>{status}</span>;
}

export default function DeclarationsTableRow({ item, checked, onToggle }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const name = useMemo(() => {
    const first = item.clientProfile?.firstName ?? "";
    const last = item.clientProfile?.lastName ?? "";
    const full = `${first} ${last}`.trim();
    return full || t("admin.declarations.unknownClient", { defaultValue: "Unknown client" });
  }, [item.clientProfile?.firstName, item.clientProfile?.lastName, t]);

  const email = item.clientProfile?.user?.email ?? "—";
  const year = item.questionnaireSnapshot?.taxYear ?? "—";
  const offer = item.questionnaireSnapshot?.offer ?? item.offer ?? "—";

  function openDetails() {
    navigate(`/admin/declarations/${item.id}`);
  }

  return (
    <tr
      onClick={openDetails}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") openDetails();
      }}
      style={{ borderBottom: "1px solid #eef2f7", cursor: "pointer" }}
    >
      {/* Checkbox: must NOT trigger row navigation */}
      <td style={{ padding: "12px 10px" }} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(item.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </td>

      <td style={{ padding: "12px 10px" }}>
        <div style={{ fontWeight: 800, color: "#0f172a" }}>{name}</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>{email}</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>
          {t("admin.declarations.fileShort", {
            id: shortId(item.id),
            defaultValue: `File #${shortId(item.id)}`,
          })}
        </div>
      </td>

      <td style={{ padding: "12px 10px" }}>
        <div style={{ fontWeight: 700 }}>{year}</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>{offer}</div>
      </td>

      <td style={{ padding: "12px 10px" }}>
        <StatusBadge status={item.status} />
      </td>

      <td style={{ padding: "12px 10px" }}>
        <div style={{ fontWeight: 700 }}>
          {t("admin.declarations.step", { n: item.currentStep, defaultValue: `Step ${item.currentStep}` })}
        </div>
      </td>

      <td style={{ padding: "12px 10px", color: "#64748b", fontSize: 13 }}>
        {fmtDate(item.createdAt)}
      </td>

      <td style={{ padding: "12px 10px", color: "#64748b", fontSize: 13 }}>
        {fmtDate(item.updatedAt)}
      </td>

      <td style={{ padding: "12px 10px" }}>
        {item.assignedAdminId ? (
          <span style={{ color: "#16a34a", fontWeight: 800 }}>
            {t("admin.declarations.assigned", { defaultValue: "Assigned" })}
          </span>
        ) : (
          <span style={{ color: "#b45309", fontWeight: 800 }}>
            {t("admin.declarations.unassigned", { defaultValue: "Unassigned" })}
          </span>
        )}
      </td>
    </tr>
  );
}
