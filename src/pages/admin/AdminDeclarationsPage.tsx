
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useTranslation } from "react-i18next";
import DeclarationsTableRow from "../../components/admin/DeclarationsTableRow";
import { isSuperAdminRole } from "../../auth/AdminRoute";
import {
  fetchAdminDeclarations,
  postAssignDeclarations,
  type AdminDeclaration,
  fetchAdmins,
  type AdminUser,
  deleteAdminDeclaration,
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
  const { user } = useAuth();

  const isSuperAdmin = isSuperAdminRole(user?.roles);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdminDeclaration[]>([]);
  const [error, setError] = useState("");

  // UI controls
  const [mode, setMode] = useState<AssignMode>("unassigned");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [stepFilter, setStepFilter] = useState<"ALL" | "1" | "2" | "3" | "4" | "5">("ALL");
  const [query, setQuery] = useState("");

  // bulk assign
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [adminId, setAdminId] = useState("");
  const [note, setNote] = useState(t("admin.declarations.defaultNote"));
  const [assigning, setAssigning] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const debouncedQuery = useDebouncedValue(query, 250);
  const canDelete = isSuperAdminRole(user?.roles);
  const [assignedAdminFilter, setAssignedAdminFilter] = useState<string>(""); // "" = all admins
  

  useEffect(() => {
    fetchAdmins()
      .then((data) => {
        setAdmins(data);
      })
      .catch((err) => {
        console.error("Failed to load admins", err);
      });
  }, []);

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
      .filter((d) =>
        stepFilter === "ALL"
          ? true
          : d.currentStep === Number(stepFilter)
      )
      .filter((d) => {
        // no admin chosen → keep everything
        if (!assignedAdminFilter) return true;

        // only declarations assigned to this admin
        return d.assignedAdminId === assignedAdminFilter;
      })
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
  }, [items, mode, statusFilter, yearFilter, stepFilter, debouncedQuery, assignedAdminFilter]);

  const selectedIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [selected],
  );
  const handleAdminFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setAssignedAdminFilter(value);

    // 🔴 Fix the logical conflict:
    // if we were on "unassigned" and user picked an admin,
    // switch to "assigned" so the filters make sense.
    if (value && mode === "unassigned") {
      setMode("assigned");
    }
  };

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
  const handleDelete = async (id: string) => {
    if (!canDelete) return; // extra safety

    if (
      !window.confirm(
        t("admin.declarations.confirmDelete")
      )
    ) {
      return;
    }

    try {
      await deleteAdminDeclaration(id);
      // Remove it from UI
      setItems((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      alert(
        t("admin.declarations.deleteFailed")
      );
    }
  };




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
          {isSuperAdmin && (
            <select
              className="select-base"
              value={assignedAdminFilter}
              onChange={handleAdminFilterChange}
            >
              <option value="">{t("admin.declarations.filter.allAdmins")}</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.email}
                </option>
              ))}
            </select>
          )}

          <select
            className="select-base"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">{t("admin.declarations.status.all")}</option>
            <option value="DRAFT">{t("admin.declarations.status.draft")}</option>
            <option value="PENDING_PRICING">{t("admin.declarations.status.pending_pricing")}</option>
            <option value="DONE">{t("admin.declarations.status.done")}</option>
          </select>
          <select
            className="select-base"
            value={stepFilter}
            onChange={(e) => setStepFilter(e.target.value as any)}
          >
            <option value="ALL">{t("admin.declarations.steps.all")}</option>
            <option value="1">{t("admin.declarations.steps.step1")}</option>
            <option value="2">{t("admin.declarations.steps.step2")}</option>
            <option value="3">{t("admin.declarations.steps.step3")}</option>
            <option value="4">{t("admin.declarations.steps.step4")}</option>
            <option value="5">{t("admin.declarations.steps.step5")}</option>
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
      {isSuperAdmin && (
        <div className="bulk-card">
          <div className="bulk-grid">
            <span>
              {t("admin.declarations.selectedCount")}: {selectedIds.length}
            </span>

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
      )}

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
                  {canDelete && (
                    <th className="table-header-cell">
                      {t("admin.declarations.columns.delete")}
                    </th>
                  )}

                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <DeclarationsTableRow
                    key={d.id}
                    item={d}
                    checked={!!selected[d.id]}
                    onToggle={toggle}
                    onDelete={canDelete ? handleDelete : undefined}
                  />
                ))}

              </tbody>
            </table>
          )}
        </div>
      </div>
    </div >
  );
}