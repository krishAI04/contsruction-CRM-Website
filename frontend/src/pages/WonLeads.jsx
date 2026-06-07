import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CheckCircle2, IndianRupee, Trophy, UsersRound } from "lucide-react";
import { api, unwrapList } from "../api";
import { KpiCard } from "../components/KpiCard.jsx";
import { PageTitle } from "./Dashboard.jsx";

export function WonLeads() {
  const leads = useQuery({ queryKey: ["won-leads"], queryFn: async () => (await api.get("/leads/?stage=won")).data });
  const clients = useQuery({ queryKey: ["clients"], queryFn: async () => (await api.get("/clients/")).data });
  const data = unwrapList(leads.data);
  const totalRevenue = data.reduce((sum, lead) => sum + Number(lead.deal_value || 0), 0);
  const averageDeal = data.length ? totalRevenue / data.length : 0;

  return (
    <div className="space-y-5">
      <PageTitle title="Won Leads" subtitle="Confirmed projects, final revenue, and automatically created client records." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Won leads" value={data.length} />
        <KpiCard label="Clients created" value={(clients.data || []).length} tone="steel" />
        <KpiCard label="Revenue" value={`Rs. ${totalRevenue.toLocaleString("en-IN")}`} tone="amber" />
        <KpiCard label="Avg deal" value={`Rs. ${Math.round(averageDeal).toLocaleString("en-IN")}`} />
      </div>
      <section className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <Trophy className="mt-0.5 text-emerald-700" size={22} aria-hidden="true" />
          <div>
            <h2 className="font-bold text-ink">Won lead becomes a client</h2>
            <p className="mt-1 text-sm text-steel">When a lead is marked Won with final deal value, the backend creates a Client record automatically. That makes the CRM feel like real SaaS, not just a pipeline board.</p>
          </div>
        </div>
      </section>
      <section className="grid gap-4">
        {data.length === 0 && <EmptyWon />}
        {data.map((lead) => (
          <article key={lead.id} className="action-card">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link className="text-lg font-bold text-pine hover:underline" to={`/leads/${lead.id}`}>{lead.name}</Link>
                  <span className="badge"><CheckCircle2 size={14} /> Won</span>
                </div>
                <p className="mt-1 text-sm text-steel">{lead.project_type_label} / {lead.source_detail?.name} / {lead.assigned_to_detail?.email || "Unassigned"}</p>
              </div>
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <Metric icon={IndianRupee} label="Revenue" value={`Rs. ${Number(lead.deal_value || 0).toLocaleString("en-IN")}`} />
                <Metric icon={UsersRound} label="Client" value="Created" />
                <Metric icon={CheckCircle2} label="Won date" value={lead.won_date ? new Date(lead.won_date).toLocaleDateString() : "Recorded"} />
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-md border border-line bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-steel"><Icon size={14} aria-hidden="true" /> {label}</div>
      <p className="mt-1 font-bold text-ink">{value}</p>
    </div>
  );
}

function EmptyWon() {
  return (
    <section className="card text-center">
      <p className="font-semibold">No won leads yet.</p>
      <p className="mt-1 text-sm text-steel">Won leads will appear here after a manager marks a negotiation lead as Won with revenue.</p>
      <Link className="btn-primary mt-4" to="/workflow/decisions">Go to Decisions</Link>
    </section>
  );
}
