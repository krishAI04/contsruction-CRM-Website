import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, unwrapList } from "../api";
import { PageTitle } from "./Dashboard.jsx";

const stages = [
  ["new", "New Lead", "Fresh leads that need assignment or first contact."],
  ["contacted", "Contacted", "Client has been called and basic interest is confirmed."],
  ["site_visit_scheduled", "Visit Scheduled", "Engineer/date assigned for site inspection."],
  ["site_visit_completed", "Visit Completed", "Site details captured; proposal should be prepared."],
  ["proposal_sent", "Proposal Sent", "Client has received estimate/PDF."],
  ["negotiation", "Negotiation", "Client is discussing price, scope, or timeline."],
  ["won", "Won", "Project confirmed and revenue recorded."],
  ["lost", "Lost", "Closed with a reason."],
];

export function Pipeline() {
  const { data: response } = useQuery({ queryKey: ["leads", "pipeline"], queryFn: async () => (await api.get("/leads/?page_size=100")).data });
  const data = unwrapList(response);

  return (
    <div className="space-y-5">
      <PageTitle title="Pipeline Overview" subtitle="A clean stage summary. Use Workflow for day-to-day actions." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stages.map(([stage, label, description]) => {
          const leads = data.filter((lead) => lead.stage === stage);
          return (
            <section key={stage} className="action-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="section-title">{label}</h2>
                  <p className="mt-1 text-sm text-steel">{description}</p>
                </div>
                <span className="badge">{leads.length}</span>
              </div>
              <div className="mt-4 space-y-2">
                {leads.length === 0 && <p className="rounded-md bg-mist p-3 text-sm text-steel">No leads here.</p>}
                {leads.slice(0, 4).map((lead) => (
                  <Link key={lead.id} to={`/leads/${lead.id}`} className="block rounded-md border border-line p-3 transition hover:border-pine hover:bg-blue-50">
                    <p className="font-semibold text-ink">{lead.name}</p>
                    <p className="text-sm text-steel">{lead.project_type_label} / {lead.assigned_to_detail?.email || "Unassigned"}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <section className="card">
        <h2 className="section-title">Where do I perform actions?</h2>
        <p className="mt-2 text-sm text-steel">Go to <Link className="font-semibold text-pine underline" to="/workflow">Workflow</Link> to assign leads, mark calls, schedule site visits, complete visits, generate proposals, and close Won/Lost decisions.</p>
      </section>
    </div>
  );
}
