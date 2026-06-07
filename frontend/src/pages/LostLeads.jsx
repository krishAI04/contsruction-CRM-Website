import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RotateCcw, TrendingDown, XCircle } from "lucide-react";
import { api, unwrapList } from "../api";
import { KpiCard } from "../components/KpiCard.jsx";
import { PageTitle } from "./Dashboard.jsx";

export function LostLeads() {
  const queryClient = useQueryClient();
  const leads = useQuery({ queryKey: ["lost-leads"], queryFn: async () => (await api.get("/leads/?stage=lost")).data });
  const reopen = useMutation({
    mutationFn: (id) => api.post(`/leads/${id}/reopen/`, { note: "Lead reopened from lost analysis page." }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lost-leads"] }),
  });
  const data = unwrapList(leads.data);
  const reasonRows = groupCount(data, (lead) => lead.lost_reason_detail?.name || "Unknown");
  const sourceRows = groupCount(data, (lead) => lead.source_detail?.name || "Unknown");
  const averageBudget = data.length ? data.reduce((sum, lead) => sum + Number(lead.budget || 0), 0) / data.length : 0;

  return (
    <div className="space-y-5">
      <PageTitle title="Lost Leads" subtitle="Keep lost leads for analysis, sales coaching, source quality, and future reopening." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Lost leads" value={data.length} tone="steel" />
        <KpiCard label="Avg lost budget" value={`Rs. ${Math.round(averageBudget).toLocaleString("en-IN")}`} tone="amber" />
        <KpiCard label="Top reason" value={reasonRows[0]?.name || "-"} />
        <KpiCard label="Top source" value={sourceRows[0]?.name || "-"} tone="steel" />
      </div>
      <section className="rounded-lg border border-red-100 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 text-red-700" size={22} aria-hidden="true" />
          <div>
            <h2 className="font-bold text-ink">Lost does not mean deleted</h2>
            <p className="mt-1 text-sm text-steel">Lost leads stay in the CRM so the owner can see why deals are lost. If the client comes back later, reopen the same lead instead of creating a duplicate.</p>
          </div>
        </div>
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Lost by reason" data={reasonRows} />
        <ChartCard title="Lost by source" data={sourceRows} />
      </div>
      <section className="grid gap-4">
        {data.length === 0 && <EmptyLost />}
        {data.map((lead) => (
          <article key={lead.id} className="action-card">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link className="text-lg font-bold text-pine hover:underline" to={`/leads/${lead.id}`}>{lead.name}</Link>
                  <span className="badge"><TrendingDown size={14} /> {lead.lost_reason_detail?.name || "Lost"}</span>
                </div>
                <p className="mt-1 text-sm text-steel">{lead.project_type_label} / {lead.source_detail?.name} / Budget Rs. {Number(lead.budget || 0).toLocaleString("en-IN")}</p>
              </div>
              <button className="btn-primary" onClick={() => reopen.mutate(lead.id)}><RotateCcw size={16} /> Reopen to Contacted</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function ChartCard({ title, data }) {
  return (
    <section className="card min-h-80">
      <h2 className="section-title">{title}</h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

function groupCount(items, getName) {
  const map = new Map();
  items.forEach((item) => {
    const name = getName(item);
    map.set(name, (map.get(name) || 0) + 1);
  });
  return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

function EmptyLost() {
  return (
    <section className="card text-center">
      <p className="font-semibold">No lost leads yet.</p>
      <p className="mt-1 text-sm text-steel">Lost leads will appear here when a decision is closed with a lost reason.</p>
      <Link className="btn-secondary mt-4" to="/workflow/decisions">Go to Decisions</Link>
    </section>
  );
}
