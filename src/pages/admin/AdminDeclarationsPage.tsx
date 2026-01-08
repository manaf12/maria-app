/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import DeclarationsTableRow from "../../components/admin/DeclarationsTableRow";
import {
  fetchAdminDeclarations,
  postAssignDeclarations,
  type AdminDeclaration,
  fetchAdmins,
  type AdminUser,
} from "../../services/admin-declarations.service";

type AssignMode = "unassigned" | "assigned" | "all";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return v;
}

export default function AdminDeclarationsPage() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdminDeclaration[]>([]);
  const [error, setError] = useState("");

  // UI controls
  const [mode, setMode] = useState<AssignMode>("unassigned");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [query, setQuery] = useState("");

  // bulk assign
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [adminId, setAdminId] = useState("");
  const [note, setNote] = useState(t("admin.declarations.defaultNote"));
  const [assigning, setAssigning] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const debouncedQuery = useDebouncedValue(query, 250);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const data = await fetchAdminDeclarations();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || t("admin.declarations.errors.loadFailed"),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    (async () => {
      try {
        const list = await fetchAdmins();
        setAdmins(list);
      } catch (e) {
        // إذا user مش super admin، ممكن يرجع 403، فخليه silent أو اعرض رسالة
        console.error("Failed to fetch admins", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const years = useMemo(() => {
    const set = new Set<string>();
    for (const d of items) {
      const y = d.questionnaireSnapshot?.taxYear;
      if (y) set.add(String(y));
    }
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [items]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();

    return items
      .filter((d) => {
        if (mode === "unassigned") return !d.assignedAdminId;
        if (mode === "assigned") return !!d.assignedAdminId;
        return true;
      })
      .filter((d) =>
        statusFilter === "ALL" ? true : d.status === statusFilter,
      )
      .filter((d) =>
        yearFilter === "ALL"
          ? true
          : String(d.questionnaireSnapshot?.taxYear ?? "") === yearFilter,
      )
      .filter((d) => {
        if (!q) return true;
        const name = `${d.clientProfile?.firstName ?? ""} ${d.clientProfile?.lastName ?? ""
          }`.toLowerCase();
        const email = (d.clientProfile?.user?.email ?? "").toLowerCase();
        const id = (d.id ?? "").toLowerCase();
        const year = String(
          d.questionnaireSnapshot?.taxYear ?? "",
        ).toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          id.includes(q) ||
          year.includes(q)
        );
      });
  }, [items, mode, statusFilter, yearFilter, debouncedQuery]);

  const selectedIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [selected],
  );

  function toggle(id: string) {
    setSelected((p) => ({ ...p, [id]: !p[id] }));
  }

  function selectAllVisible() {
    const allSelected = filtered.every((d) => selected[d.id]);
    setSelected((p) => {
      const next = { ...p };
      for (const d of filtered) next[d.id] = !allSelected;
      return next;
    });
  }

  function clearSelection() {
    setSelected({});
  }

  async function assignSelected() {
    setError("");

    if (!adminId.trim()) {
      setError(t("admin.declarations.errors.adminIdRequired"));
      return;
    }
    if (selectedIds.length === 0) {
      setError(t("admin.declarations.errors.selectAtLeastOne"));
      return;
    }

    setAssigning(true);
    try {
      await postAssignDeclarations({
        declarationIds: selectedIds,
        adminId: adminId.trim(),
        note: note.trim() || undefined,
      });

      setItems((prev) => {
        const next = prev.map((d) =>
          selectedIds.includes(d.id)
            ? {
              ...d,
              assignedAdminId: adminId.trim(),
              assignedAt: new Date().toISOString(),
            }
            : d,
        );

        return mode === "unassigned" ? next.filter((d) => !d.assignedAdminId) : next;
      });

      clearSelection();
    } catch (e: any) {
      setError(
        e?.response?.data?.message || t("admin.declarations.errors.assignFailed"),
      );
    } finally {
      setAssigning(false);
    }
  }


  return (
    <div className="admin-shell">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">{t("admin.declarations.title")}</h1>
          <p className="admin-subtitle">{t("admin.declarations.subtitle")}</p>
        </div>

        <div className="admin-actions">
          <button className="btn-soft" type="button" onClick={load}>
            {t("admin.declarations.refresh")}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar-card">
        <div className="toolbar-grid">
          <input
            className="input-base"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.declarations.searchPlaceholder")}
          />

          <select
            className="select-base"
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
          >
            <option value="all">{t("admin.declarations.filter.all")}</option>
            <option value="unassigned">
              {t("admin.declarations.filter.unassigned")}
            </option>
            <option value="assigned">
              {t("admin.declarations.filter.assigned")}
            </option>
          </select>

          <select
            className="select-base"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">{t("admin.declarations.status.all")}</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PENDING_PRICING">PENDING_PRICING</option>
            <option value="DONE">DONE</option>
          </select>

          <select
            className="select-base"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="ALL">{t("admin.declarations.year.all")}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-row">
          <div className="muted">
            {t("admin.declarations.count", { count: filtered.length })}
          </div>

          <div className="row-actions">
            <button
              className="btn-soft"
              type="button"
              onClick={selectAllVisible}
            >
              {t("admin.declarations.selectVisible")}
            </button>
            <button className="btn-soft" type="button" onClick={clearSelection}>
              {t("admin.declarations.clearSelection")}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Assign */}
      <div className="bulk-card">
        <div className="bulk-grid">
          <div className="muted">
            {t("admin.declarations.selectedCount", {
              count: selectedIds.length,
            })}
          </div>

          <select
            className="select-base"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
          >
            <option value="">{t("admin.declarations.selectAdmin")}</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.email} ({a.roles?.join(", ")})
              </option>
            ))}
          </select>

          <input
            className="input-base"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("admin.declarations.notePlaceholder")}
          />

          <button
            className="btn-primary-wide"
            type="button"
            disabled={assigning || selectedIds.length === 0 || !adminId.trim()}
            onClick={assignSelected}
          >
            {assigning
              ? t("admin.declarations.assigning")
              : t("admin.declarations.assignSelected")}
          </button>
        </div>
      </div>

      {/* Error */}
      {
        error ? (
          <div className="alert">{error}</div>
        ) : loading ? (
          <div className="muted" style={{ padding: 16 }}>
            {t("admin.declarations.loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="muted" style={{ padding: 16 }}>
            {t("admin.declarations.empty")}
          </div>
        ) : null
        // <ResultsTable/>
      }

      {/* Results */}
      <div className="results-card">
        <div className="results-header">
          <div style={{ fontWeight: 800, color: "#0f172a" }}>
            <strong>{t("admin.declarations.results")}</strong>
          </div>
          <span className="muted">
            {t("admin.declarations.count", { count: filtered.length })}
          </span>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 16 }} className="muted">
              {t("admin.declarations.loading")}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 16 }} className="muted">
              {t("admin.declarations.empty")}
            </div>
          ) : (
            <table className="pro-table">
              <thead>
                <tr className="table-header-row">
                  <th className="table-header-cell">
                    {t("admin.declarations.columns.select")}
                  </th>
                  <th className="table-header-cell">
                    {t("admin.declarations.columns.client")}
                  </th>
                  <th className="table-header-cell">
                    {t("admin.declarations.columns.tax")}
                  </th>
                  <th className="table-header-cell">
                    {t("admin.declarations.columns.status")}
                  </th>
                  <th className="table-header-cell">
                    {t("admin.declarations.columns.step")}
                  </th>
                  <th className="table-header-cell">
                    {t("admin.declarations.columns.created")}
                  </th>
                  <th className="table-header-cell">
                    {t("admin.declarations.columns.updated")}
                  </th>
                  <th className="table-header-cell">
                    {t("admin.declarations.columns.assignment")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <DeclarationsTableRow
                    key={d.id}
                    item={d}
                    checked={!!selected[d.id]}
                    onToggle={toggle}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}