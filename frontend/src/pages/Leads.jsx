import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Upload, UserPlus, X } from "lucide-react";
import { api, unwrapList } from "../api";
import { PageTitle } from "./Dashboard.jsx";

const projectTypes = [
  ["residential", "Residential House"],
  ["office", "Office Interior"],
  ["commercial", "Commercial"],
  ["renovation", "Renovation"],
  ["villa", "Villa Construction"],
];

const timelines = [
  ["immediate", "Immediate"],
  ["one_month", "1 Month"],
  ["three_months", "3 Months"],
  ["not_decided", "Not Decided"],
];

export function Leads() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [page, setPage] = useState(1);
  const leads = useQuery({ queryKey: ["leads", page], queryFn: async () => (await api.get(`/leads/?page=${page}`)).data });
  const data = unwrapList(leads.data);
  const totalPages = Math.max(1, Math.ceil((leads.data?.count || data.length) / 20));
  const { data: sources = [] } = useQuery({ queryKey: ["lead-sources"], queryFn: async () => (await api.get("/lead-sources/")).data });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: async () => (await api.get("/users/")).data });
  const createLead = useMutation({
    mutationFn: (payload) => api.post("/leads/", payload),
    onSuccess: () => {
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setShowForm(false);
    },
  });
  const importLeads = useMutation({
    mutationFn: (formData) => api.post("/leads/import-file/", formData, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: ({ data: summary }) => {
      setImportSummary(summary);
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <PageTitle title="Leads" subtitle="Manual walk-in entry and spreadsheet imports from ads or website forms." />
        <button className="btn-primary" onClick={() => setShowForm(true)}><UserPlus size={16} /> New Lead</button>
      </div>

      {showForm && (
        <LeadForm
          sources={sources}
          users={users}
          onClose={() => setShowForm(false)}
          onSubmit={(payload) => createLead.mutate(payload)}
          error={createLead.error}
          loading={createLead.isPending}
        />
      )}

      <ImportPanel
        sources={sources}
        users={users}
        onSubmit={(formData) => importLeads.mutate(formData)}
        loading={importLeads.isPending}
        error={importLeads.error}
        summary={importSummary}
      />

      <section className="card overflow-hidden p-0">
        <div className="flex flex-col gap-2 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="section-title">Lead Directory</h2>
            <p className="mt-1 text-sm text-steel">{leads.data?.count ?? data.length} total leads, showing 20 per page.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" disabled={page <= 1 || leads.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
            <span className="rounded-md border border-line bg-mist px-3 py-2 text-sm font-semibold">Page {page} / {totalPages}</span>
            <button className="btn-secondary" disabled={!leads.data?.next || leads.isFetching} onClick={() => setPage((current) => current + 1)}>Next</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-mist text-xs uppercase text-steel">
              <tr>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leads.isLoading && <tr><td className="px-4 py-5" colSpan="6">Loading leads...</td></tr>}
              {data.map((lead) => (
                <tr key={lead.id} className="hover:bg-mist/60">
                  <td className="px-4 py-3">
                    <Link className="font-semibold text-pine underline-offset-4 hover:underline" to={`/leads/${lead.id}`}>{lead.name}</Link>
                    <p className="text-xs text-steel">{lead.phone}</p>
                  </td>
                  <td className="px-4 py-3">{lead.source_detail?.name}</td>
                  <td className="px-4 py-3">{lead.project_type_label}</td>
                  <td className="px-4 py-3">Rs. {Number(lead.budget || 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3"><span className="badge">{lead.stage_label}</span></td>
                  <td className="px-4 py-3">
                    <p>{lead.assigned_to_detail?.email || "Unassigned"}</p>
                    {lead.assignment_method && <p className="text-xs capitalize text-steel">{lead.assignment_method.replaceAll("_", " ")}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function LeadForm({ sources, users, onClose, onSubmit, error, loading }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    source: sources[0]?.id || "",
    project_type: "renovation",
    budget: "",
    timeline: "not_decided",
    notes: "",
    assigned_to: "",
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSubmit({
      ...form,
      source: Number(form.source),
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      budget: form.budget || null,
    });
  }

  return (
    <section className="card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title">Manual Lead Entry</h2>
        <button className="btn-secondary" onClick={onClose} aria-label="Close lead form"><X size={16} /></button>
      </div>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={submit}>
        <Field label="Name" value={form.name} onChange={(value) => update("name", value)} required />
        <Field label="Phone" value={form.phone} onChange={(value) => update("phone", value)} required />
        <Field label="Email" type="email" value={form.email} onChange={(value) => update("email", value)} />
        <Field label="City" value={form.city} onChange={(value) => update("city", value)} />
        <Select label="Source" value={form.source} onChange={(value) => update("source", value)} options={sources.map((source) => [source.id, source.name])} required />
        <Select label="Project Type" value={form.project_type} onChange={(value) => update("project_type", value)} options={projectTypes} />
        <Field label="Budget" type="number" value={form.budget} onChange={(value) => update("budget", value)} />
        <Select label="Timeline" value={form.timeline} onChange={(value) => update("timeline", value)} options={timelines} />
        <Select label="Assignment" value={form.assigned_to} onChange={(value) => update("assigned_to", value)} options={[["", "Auto assign by city/budget/round robin"], ...users.filter((user) => user.role === "executive").map((user) => [user.id, user.email])]} />
        <label className="md:col-span-2">
          <span className="field-label mt-0">Notes</span>
          <textarea className="input min-h-24 py-2" value={form.notes} onChange={(event) => update("notes", event.target.value)} />
        </label>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2">{formatError(error)}</p>}
        <div className="flex justify-end gap-2 md:col-span-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={loading}>{loading ? "Creating..." : "Create Lead"}</button>
        </div>
      </form>
    </section>
  );
}

function ImportPanel({ sources, users, onSubmit, loading, error, summary }) {
  const [file, setFile] = useState(null);
  const [defaultSource, setDefaultSource] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [autoAssign, setAutoAssign] = useState(true);

  function submit(event) {
    event.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    if (defaultSource) formData.append("default_source", defaultSource);
    if (assignedTo) formData.append("assigned_to", assignedTo);
    formData.append("auto_assign", autoAssign ? "true" : "false");
    onSubmit(formData);
  }

  return (
    <section className="card">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="section-title">Import Leads From Excel</h2>
          <p className="mt-1 text-sm text-steel">Supports `.xlsx` and `.csv` exports from Facebook Ads, Instagram Ads, and website forms.</p>
        </div>
        <span className="badge">Required columns: name, phone</span>
      </div>
      <form className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px_260px_auto]" onSubmit={submit}>
        <label>
          <span className="field-label mt-0">Lead file</span>
          <input className="input pt-2" type="file" accept=".xlsx,.csv" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        <Select label="Default Source" value={defaultSource} onChange={setDefaultSource} options={[["", "From file / Spreadsheet Import"], ...sources.map((source) => [source.id, source.name])]} />
        <Select label="Assignment" value={assignedTo} onChange={setAssignedTo} options={[["", "Auto assign each lead"], ...users.filter((user) => user.role === "executive").map((user) => [user.id, user.email])]} />
        <div className="flex items-end">
          <button className="btn-primary w-full" disabled={!file || loading}><Upload size={16} /> {loading ? "Importing..." : "Import"}</button>
        </div>
      </form>
      <label className="mt-3 flex items-start gap-2 text-sm text-steel">
        <input className="mt-1" type="checkbox" checked={autoAssign} disabled={!!assignedTo} onChange={(event) => setAutoAssign(event.target.checked)} />
        <span>Use automatic assignment for unassigned rows: city match, then high-budget best converter, then round robin.</span>
      </label>
      <p className="mt-3 text-xs text-steel">Accepted headers include: name, full name, phone, mobile, email, city, source, project type, budget, timeline, notes.</p>
      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formatError(error)}</p>}
      {summary && (
        <div className="mt-4 rounded-md border border-line bg-mist p-3">
          <p className="font-semibold">Import result: {summary.created} created, {summary.skipped} skipped</p>
          {!!summary.errors?.length && (
            <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-sm text-steel">
              {summary.errors.slice(0, 8).map((item, index) => <li key={`${item.row}-${index}`}>Row {item.row}: {item.reason}</li>)}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <label>
      <span className="field-label mt-0">{label}</span>
      <input className="input" type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

function Select({ label, value, onChange, options, required = false }) {
  return (
    <label>
      <span className="field-label mt-0">{label}</span>
      <select className="input" value={value} onChange={(event) => onChange(event.target.value)} required={required}>
        {options.map(([optionValue, labelText]) => <option key={`${optionValue}-${labelText}`} value={optionValue}>{labelText}</option>)}
      </select>
    </label>
  );
}

function formatError(error) {
  const data = error?.response?.data;
  if (!data) return "Something went wrong.";
  if (typeof data === "string") return data;
  return Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join(" ");
}
