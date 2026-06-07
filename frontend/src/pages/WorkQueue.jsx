import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarPlus, CheckCircle2, FileText, PhoneCall, Sparkles, UserRoundPlus } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { api, unwrapList } from "../api";
import { PageTitle } from "./Dashboard.jsx";

const stageLabels = {
  new: "New Lead",
  contacted: "Contacted",
  site_visit_scheduled: "Visit Scheduled",
  site_visit_completed: "Visit Completed",
  proposal_sent: "Proposal Sent",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

const queueMeta = {
  assign: {
    title: "Assign Leads",
    subtitle: "Pick a salesperson for each new incoming lead.",
    icon: UserRoundPlus,
    filter: (lead) => !lead.assigned_to,
  },
  contact: {
    title: "First Contact",
    subtitle: "Record whether the salesperson spoke with the client.",
    icon: PhoneCall,
    filter: (lead) => lead.assigned_to && lead.stage === "new",
  },
  "site-visits": {
    title: "Site Visits",
    subtitle: "Schedule visits for contacted leads and complete scheduled inspections.",
    icon: CalendarPlus,
    filter: (lead) => ["contacted", "site_visit_scheduled"].includes(lead.stage),
  },
  proposals: {
    title: "Proposals",
    subtitle: "Open lead records to generate proposals, then move sent proposals forward.",
    icon: FileText,
    filter: (lead) => ["site_visit_completed", "proposal_sent"].includes(lead.stage),
  },
  decisions: {
    title: "Final Decisions",
    subtitle: "Close negotiation leads as Won with revenue or Lost with reason.",
    icon: CheckCircle2,
    filter: (lead) => lead.stage === "negotiation",
  },
};

export function WorkQueue() {
  const { queue = "assign" } = useParams();
  const meta = queueMeta[queue] || queueMeta.assign;
  const Icon = meta.icon;
  const queryClient = useQueryClient();
  const leads = useQuery({ queryKey: ["leads", "queues"], queryFn: async () => (await api.get("/leads/?page_size=100")).data });
  const users = useQuery({ queryKey: ["users"], queryFn: async () => (await api.get("/users/")).data });
  const lostReasons = useQuery({ queryKey: ["lost-reasons"], queryFn: async () => (await api.get("/lost-reasons/")).data });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["leads"] });
  const assignLead = useMutation({ mutationFn: ({ id, assigned_to }) => api.patch(`/leads/${id}/assign/`, { assigned_to }), onSuccess: refresh });
  const [scoreResult, setScoreResult] = useState(null);
  const scoreLead = useMutation({
    mutationFn: (id) => api.post("/ai/score-lead", { lead_id: id }),
    onSuccess: ({ data }) => {
      setScoreResult(data);
      refresh();
    },
  });
  const contactLead = useMutation({ mutationFn: ({ id, note }) => api.post(`/leads/${id}/contact/`, { note }), onSuccess: refresh });
  const scheduleVisit = useMutation({ mutationFn: ({ id, payload }) => api.post(`/leads/${id}/schedule-site-visit/`, payload), onSuccess: refresh });
  const completeVisit = useMutation({ mutationFn: ({ id, note }) => api.post(`/leads/${id}/complete-site-visit/`, { note }), onSuccess: refresh });
  const moveStage = useMutation({ mutationFn: ({ id, payload }) => api.patch(`/leads/${id}/stage/`, payload), onSuccess: refresh });
  const visible = unwrapList(leads.data).filter(meta.filter);
  const error = assignLead.error || scoreLead.error || contactLead.error || scheduleVisit.error || completeVisit.error || moveStage.error;

  return (
    <div className="space-y-5">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-pine" to="/workflow"><ArrowLeft size={16} /> Back to workflow</Link>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <PageTitle title={meta.title} subtitle={meta.subtitle} />
        <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-3 shadow-soft">
          <Icon className="text-pine" size={20} aria-hidden="true" />
          <span className="text-sm font-bold">{visible.length} pending</span>
        </div>
      </div>
      {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{formatError(error)}</p>}
      <section className="grid gap-4">
        {visible.length === 0 && <EmptyQueue />}
        {visible.map((lead) => (
          <LeadTaskCard key={lead.id} lead={lead}>
            {queue === "assign" && <AssignForm lead={lead} users={users.data || []} mutate={assignLead.mutate} />}
            {queue === "contact" && <ContactForm lead={lead} scoreLead={scoreLead.mutate} scorePending={scoreLead.isPending && scoreLead.variables === lead.id} scoreResult={scoreResult} mutate={contactLead.mutate} />}
            {queue === "site-visits" && lead.stage === "contacted" && <ScheduleForm lead={lead} mutate={scheduleVisit.mutate} />}
            {queue === "site-visits" && lead.stage === "site_visit_scheduled" && <CompleteVisitForm lead={lead} mutate={completeVisit.mutate} />}
            {queue === "proposals" && <ProposalForm lead={lead} moveStage={moveStage.mutate} />}
            {queue === "decisions" && <DecisionForm lead={lead} lostReasons={lostReasons.data || []} moveStage={moveStage.mutate} />}
          </LeadTaskCard>
        ))}
      </section>
    </div>
  );
}

function LeadTaskCard({ lead, children }) {
  return (
    <article className="action-card">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link className="text-lg font-bold text-pine hover:underline" to={`/leads/${lead.id}`}>{lead.name}</Link>
            <span className="badge">{stageLabels[lead.stage]}</span>
          </div>
          <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            <Info label="Phone" value={lead.phone} />
            <Info label="Project" value={lead.project_type_label} />
            <Info label="Budget" value={`Rs. ${Number(lead.budget || 0).toLocaleString("en-IN")}`} />
            <Info label="Owner" value={lead.assigned_to_detail?.email || "Unassigned"} />
          </dl>
        </div>
        <div className="rounded-lg border border-line bg-mist p-3">{children}</div>
      </div>
    </article>
  );
}

function AssignForm({ lead, users, mutate }) {
  const [assignedTo, setAssignedTo] = useState("");
  return (
    <div>
      <p className="font-semibold">Assign this lead</p>
      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
        <select className="input mt-0" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
          <option value="">Choose salesperson</option>
          {users.map((user) => <option key={user.id} value={user.id}>{user.email}</option>)}
        </select>
        <button className="btn-primary" disabled={!assignedTo} onClick={() => mutate({ id: lead.id, assigned_to: Number(assignedTo) })}>Assign</button>
      </div>
    </div>
  );
}

function ContactForm({ lead, scoreLead, scorePending, scoreResult, mutate }) {
  const [note, setNote] = useState("Client owns plot. Interested in 3BHK duplex.");
  const result = scoreResult?.output;
  const belongsToLead = scoreResult?.input_snapshot?.lead_id === lead.id || scoreResult?.id;
  return (
    <div>
      <p className="font-semibold">Did the salesperson talk with the client?</p>
      <textarea className="input mt-3 min-h-24 py-2" value={note} onChange={(event) => setNote(event.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn-secondary" disabled={scorePending} onClick={() => scoreLead(lead.id)}>
          {scorePending ? <Spinner /> : <Sparkles size={16} />}
          {scorePending ? "Scoring..." : "AI Score"}
        </button>
        <button className="btn-primary" onClick={() => mutate({ id: lead.id, note })}><PhoneCall size={16} /> Mark Talked</button>
      </div>
      {belongsToLead && result && (
        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-pine">Score: {result.score}/100</span>
            <span className="badge">{scoreResult.provider}{scoreResult.fallback_used ? " fallback" : ""}</span>
          </div>
          <p className="mt-2 text-ink">{result.reason}</p>
          <p className="mt-1 font-semibold">Next action: {result.recommended_action || result.next_action}</p>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />;
}

function ScheduleForm({ lead, mutate }) {
  const [date, setDate] = useState("");
  const [engineer, setEngineer] = useState("Amit");
  return (
    <div>
      <p className="font-semibold">Schedule site visit</p>
      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
        <input className="input mt-0" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <input className="input mt-0" value={engineer} onChange={(event) => setEngineer(event.target.value)} placeholder="Engineer" />
        <button className="btn-primary" disabled={!date || !engineer} onClick={() => mutate({ id: lead.id, payload: { site_visit_date: date, site_visit_engineer: engineer, note: "Site visit scheduled." } })}>Schedule</button>
      </div>
    </div>
  );
}

function CompleteVisitForm({ lead, mutate }) {
  const [note, setNote] = useState("Plot Size: 1800 sq ft. Road Access: Good. Parking: Possible.");
  return (
    <div>
      <p className="font-semibold">Record site visit result</p>
      <textarea className="input mt-3 min-h-24 py-2" value={note} onChange={(event) => setNote(event.target.value)} />
      <button className="btn-primary mt-3" onClick={() => mutate({ id: lead.id, note })}>Mark Visit Completed</button>
    </div>
  );
}

function ProposalForm({ lead, moveStage }) {
  return (
    <div>
      <p className="font-semibold">Proposal work</p>
      <p className="mt-1 text-sm text-steel">Open the lead to generate/edit proposal content. Use this queue to move sent proposals forward.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link className="btn-secondary" to={`/leads/${lead.id}?tab=proposal`}>Open Proposal</Link>
        {lead.stage === "site_visit_completed" && <button className="btn-primary" onClick={() => moveStage({ id: lead.id, payload: { stage: "proposal_sent" } })}>Mark Sent</button>}
        {lead.stage === "proposal_sent" && <button className="btn-primary" onClick={() => moveStage({ id: lead.id, payload: { stage: "negotiation" } })}>Move to Negotiation</button>}
      </div>
    </div>
  );
}

function DecisionForm({ lead, lostReasons, moveStage }) {
  const [dealValue, setDealValue] = useState("");
  const [lostReason, setLostReason] = useState("");
  return (
    <div>
      <p className="font-semibold">Final decision</p>
      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
        <input className="input mt-0" type="number" value={dealValue} onChange={(event) => setDealValue(event.target.value)} placeholder="Won revenue" />
        <button className="btn-primary" disabled={!dealValue} onClick={() => moveStage({ id: lead.id, payload: { stage: "won", deal_value: dealValue } })}>Mark Won</button>
        <select className="input mt-0" value={lostReason} onChange={(event) => setLostReason(event.target.value)}>
          <option value="">Lost reason</option>
          {lostReasons.map((reason) => <option key={reason.id} value={reason.id}>{reason.name}</option>)}
        </select>
        <button className="btn-secondary" disabled={!lostReason} onClick={() => moveStage({ id: lead.id, payload: { stage: "lost", lost_reason: Number(lostReason) } })}>Mark Lost</button>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-steel">{label}</dt>
      <dd className="mt-0.5 font-semibold text-ink">{value}</dd>
    </div>
  );
}

function EmptyQueue() {
  return (
    <section className="card text-center">
      <p className="font-semibold">No work in this queue.</p>
      <p className="mt-1 text-sm text-steel">When leads reach this step, they will appear here.</p>
      <Link className="btn-secondary mt-4" to="/workflow">Back to Workflow</Link>
    </section>
  );
}

function formatError(error) {
  const data = error?.response?.data;
  if (!data) return "Action failed.";
  if (typeof data === "string") return data;
  return Object.values(data).flat().join(" ");
}
