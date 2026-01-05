// src/pages/admin/AdminDeclarationsPage.tsx
import { useEffect, useMemo, useState } from "react";
import AdminDeclarationAssignCard from "../../components/admin/AdminDeclarationAssignCard";
import {
  assignDeclarations,
  getAdminDeclarations,
  type AdminDeclaration,
} from "../../services/admin-declarations.service";

export default function AdminDeclarationsPage() {
  const [items, setItems] = useState<AdminDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // assignment form
  const [adminId, setAdminId] = useState("");
  const [note, setNote] = useState("Assigned due to high priority workload");
  const [assigning, setAssigning] = useState(false);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const res = await getAdminDeclarations();
      setItems(res.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load declarations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // “Files to assign” = unassigned
  const unassigned = useMemo(
    () => items.filter((x) => !x.assignedAdminId),
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return unassigned;

    return unassigned.filter((d) => {
      const fullName = `${d.clientProfile?.firstName ?? ""} ${d.clientProfile?.lastName ?? ""}`.toLowerCase();
      const email = (d.clientProfile?.user?.email ?? "").toLowerCase();
      const id = (d.id ?? "").toLowerCase();
      const year = String(d.questionnaireSnapshot?.taxYear ?? "").toLowerCase();
      return fullName.includes(q) || email.includes(q) || id.includes(q) || year.includes(q);
    });
  }, [unassigned, query]);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  );

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleAllVisible() {
    const allSelected = filtered.every((d) => selected[d.id]);
    setSelected((prev) => {
      const next = { ...prev };
      for (const d of filtered) next[d.id] = !allSelected;
      return next;
    });
  }

  async function onAssign() {
    if (!adminId.trim()) {
      setError("Please provide adminId to assign.");
      return;
    }
    if (selectedIds.length === 0) {
      setError("Please select at least one declaration.");
      return;
    }

    setError("");
    setAssigning(true);
    try {
      await assignDeclarations({
        declarationIds: selectedIds,
        adminId: adminId.trim(),
        note: note?.trim() || undefined,
      });

      // refresh list (assigned ones will disappear from “Files to assign”)
      setSelected({});
      await load();
    } catch (e: any) {
      setError(e?.message || "Assign failed");
    } finally {
      setAssigning(false);
    }
  }

  function openRequest(id: string) {
    // adapt to your admin detail route if you already have it
    // e.g. /admin/declarations/:id
    window.location.href = `/admin/declarations/${id}`;
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Admin · Declarations</h1>
        <p className="dashboard-subtitle">
          Files to assign (Super Admin) — search, select, and assign to an admin.
        </p>
      </header>

      {/* Search + assign controls */}
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Files to assign</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center", width: "100%", maxWidth: 720 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, file id, year…"
              style={{ height: 42, borderRadius: 999, padding: "0 14px" }}
            />
            <button type="button" className="btn-outline" onClick={toggleAllVisible}>
              {filtered.every((d) => selected[d.id]) ? "Unselect visible" : "Select visible"}
            </button>
          </div>
        </div>

        {/* Bulk assign row */}
        <div
          className="view-block"
          style={{ marginBottom: 18, display: "grid", gap: 12 }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field-row" style={{ margin: 0 }}>
              <label>Admin ID</label>
              <input
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="fbbf3e56-43ac-4bb6-988d-7bcc6f1a961e"
              />
            </div>
            <div className="field-row" style={{ margin: 0 }}>
              <label>Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Assigned due to high priority workload"
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Selected: <b>{selectedIds.length}</b>
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={assigning || selectedIds.length === 0 || !adminId.trim()}
              onClick={onAssign}
            >
              {assigning ? "Assigning..." : "Assign selected"}
            </button>
          </div>
        </div>

        {/* Errors */}
        {error ? (
          <div className="view-block" style={{ background: "#fff7f7", border: "1px solid #fecaca" }}>
            <div style={{ color: "#b91c1c", fontSize: 14 }}>{error}</div>
          </div>
        ) : null}

        {/* List */}
        {loading ? (
          <div className="dashboard-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="dashboard-empty">No unassigned files found.</div>
        ) : (
          <div className="declarations-list">
            {filtered.map((d) => (
              <AdminDeclarationAssignCard
                key={d.id}
                declaration={d}
                checked={!!selected[d.id]}
                onToggle={toggle}
                onOpen={openRequest}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
