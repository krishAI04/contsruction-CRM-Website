import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarPlus, CheckCircle2, ClipboardCheck, FileText, PhoneCall, UserRoundPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { api, unwrapList } from "../api";
import { PageTitle } from "./Dashboard.jsx";

const queues = [
  {
    to: "/workflow/assign",
    title: "Assign Leads",
    subtitle: "New leads waiting for a salesperson.",
    icon: UserRoundPlus,
    count: (leads) => leads.filter((lead) => !lead.assigned_to).length,
  },
  {
    to: "/workflow/contact",
    title: "First Contact",
    subtitle: "Assigned leads that need a call update.",
    icon: PhoneCall,
    count: (leads) => leads.filter((lead) => lead.assigned_to && lead.stage === "new").length,
  },
  {
    to: "/workflow/site-visits",
    title: "Site Visits",
    subtitle: "Schedule visits and record completed inspections.",
    icon: CalendarPlus,
    count: (leads) => leads.filter((lead) => ["contacted", "site_visit_scheduled"].includes(lead.stage)).length,
  },
  {
    to: "/workflow/proposals",
    title: "Proposals",
    subtitle: "Prepare, send, and move proposal-ready leads.",
    icon: FileText,
    count: (leads) => leads.filter((lead) => ["site_visit_completed", "proposal_sent"].includes(lead.stage)).length,
  },
  {
    to: "/workflow/decisions",
    title: "Decisions",
    subtitle: "Close negotiation leads as Won or Lost.",
    icon: CheckCircle2,
    count: (leads) => leads.filter((lead) => lead.stage === "negotiation").length,
  },
];

export function Workflow() {
  const { data: response } = useQuery({ queryKey: ["leads", "workflow"], queryFn: async () => (await api.get("/leads/?page_size=100")).data });
  const data = unwrapList(response);

  return (
    <div className="space-y-6">
      <PageTitle title="Workflow" subtitle="Choose one job. Each page shows only the leads and controls needed for that step." />
      <section className="rounded-lg border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <ClipboardCheck className="mt-0.5 text-pine" size={22} aria-hidden="true" />
          <div>
            <h2 className="font-bold text-ink">How the CRM work moves</h2>
            <p className="mt-1 text-sm text-steel">Create/import lead, assign it, call the client, schedule and complete site visit, prepare proposal, then mark Won or Lost.</p>
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {queues.map((queue) => {
          const Icon = queue.icon;
          return (
            <Link key={queue.to} to={queue.to} className="action-card group block">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="step-dot"><Icon size={18} aria-hidden="true" /></div>
                  <div>
                    <h2 className="section-title">{queue.title}</h2>
                    <p className="mt-1 text-sm text-steel">{queue.subtitle}</p>
                  </div>
                </div>
                <span className="badge">{queue.count(data)}</span>
              </div>
              <div className="mt-5 flex items-center text-sm font-semibold text-pine">
                Open queue <ArrowRight className="ml-2 transition group-hover:translate-x-1" size={16} aria-hidden="true" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
