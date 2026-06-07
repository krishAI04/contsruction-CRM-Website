import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy, FileText, Loader2, MailPlus, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { PageTitle } from "./Dashboard.jsx";

const tabs = [
  ["overview", "Overview"],
  ["ai", "AI Assistant"],
  ["proposal", "Proposal"],
  ["meetings", "Meetings"],
  ["activity", "Activity"],
];

export function LeadDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const activeTab = searchParams.get("tab") || "overview";
  const { data: lead } = useQuery({ queryKey: ["lead", id], queryFn: async () => (await api.get(`/leads/${id}/`)).data });
  const proposals = useQuery({ queryKey: ["proposals", id], queryFn: async () => (await api.get(`/proposals/?lead=${id}`)).data });
  const meetings = useQuery({ queryKey: ["meetings", id], queryFn: async () => (await api.get(`/meetings/?lead=${id}`)).data });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["lead", id] });
    queryClient.invalidateQueries({ queryKey: ["proposals", id] });
    queryClient.invalidateQueries({ queryKey: ["meetings", id] });
  };

  if (!lead) return <p>Loading lead...</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <PageTitle title={lead.name} subtitle={`${lead.project_type_label} / ${lead.stage_label}`} />
        <Link className="btn-primary" to="/workflow">Go to Workflow</Link>
      </div>
      <LeadHeader lead={lead} />
      <nav className="flex gap-2 overflow-x-auto rounded-lg border border-line bg-white p-1">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            className={`min-h-11 whitespace-nowrap rounded-md px-4 text-sm font-semibold ${activeTab === key ? "bg-pine text-white" : "text-steel hover:bg-blue-50 hover:text-pine"}`}
            onClick={() => setSearchParams({ tab: key })}
          >
            {label}
          </button>
        ))}
      </nav>
      {activeTab === "overview" && <OverviewTab lead={lead} />}
      {activeTab === "ai" && <AiTab lead={lead} refresh={refresh} />}
      {activeTab === "proposal" && <ProposalTab lead={lead} proposals={proposals.data || []} refresh={refresh} />}
      {activeTab === "meetings" && <MeetingsTab lead={lead} meetings={meetings.data || []} refresh={refresh} />}
      {activeTab === "activity" && <ActivityTab lead={lead} />}
    </div>
  );
}

function LeadHeader({ lead }) {
  const nextStep = useMemo(() => {
    if (!lead.assigned_to) return "Assign this lead from Workflow.";
    if (lead.stage === "new") return "Call the client and mark whether they talked.";
    if (lead.stage === "contacted") return "Schedule a site visit.";
    if (lead.stage === "site_visit_scheduled") return "Complete the site visit.";
    if (lead.stage === "site_visit_completed") return "Generate and send a proposal.";
    if (lead.stage === "proposal_sent") return "Move to negotiation after client response.";
    if (lead.stage === "negotiation") return "Close as Won or Lost.";
    return "Lead is closed.";
  }, [lead]);

  return (
    <section className="grid gap-4 rounded-lg border border-line bg-white p-4 shadow-soft xl:grid-cols-[1fr_0.8fr]">
      <div>
        <p className="text-sm font-semibold text-steel">Recommended next action</p>
        <h2 className="mt-1 text-xl font-bold">{nextStep}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="badge">{lead.stage_label}</span>
          <span className="badge">{lead.source_detail?.name}</span>
          <span className="badge">Rs. {Number(lead.budget || 0).toLocaleString("en-IN")}</span>
        </div>
      </div>
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <Info label="Phone" value={lead.phone} />
        <Info label="Email" value={lead.email || "Not captured"} />
        <Info label="Owner" value={lead.assigned_to_detail?.email || "Unassigned"} />
        <Info label="Timeline" value={lead.timeline_label} />
        <Info label="Assignment" value={lead.assignment_method ? lead.assignment_method.replaceAll("_", " ") : "Not assigned"} />
        <Info label="Why" value={lead.assignment_reason || "No assignment reason recorded."} />
      </div>
    </section>
  );
}

function OverviewTab({ lead }) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <div className="card">
        <h2 className="section-title">Lead Profile</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <Row label="Name" value={lead.name} />
          <Row label="Phone" value={lead.phone} />
          <Row label="Email" value={lead.email || "Not captured"} />
          <Row label="City" value={lead.city || "Not captured"} />
          <Row label="Project" value={lead.project_type_label} />
          <Row label="Budget" value={`Rs. ${Number(lead.budget || 0).toLocaleString("en-IN")}`} />
        </dl>
      </div>
      <div className="card">
        <h2 className="section-title">Site Visit</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <Row label="Date" value={lead.site_visit_date || "Not scheduled"} />
          <Row label="Engineer" value={lead.site_visit_engineer || "Not assigned"} />
          <Row label="Current Stage" value={lead.stage_label} />
        </dl>
        <p className="mt-4 rounded-md bg-mist p-3 text-sm text-steel">{lead.notes || "No notes yet."}</p>
      </div>
    </section>
  );
}

function AiTab({ lead, refresh }) {
  const aiScore = useMutation({ mutationFn: () => api.post("/ai/score-lead", { lead_id: lead.id }), onSuccess: refresh });
  const followup = useMutation({ mutationFn: () => api.post("/ai/follow-up", { lead_id: lead.id }), onSuccess: refresh });
  const createEmail = useMutation({ mutationFn: (payload) => api.post("/communications/emails/", payload) });
  const output = followup.data?.data?.output;

  async function copyWhatsApp() {
    await navigator.clipboard.writeText(output?.whatsapp_text || "");
  }

  function saveEmailDraft() {
    createEmail.mutate({
      lead: lead.id,
      recipient: lead.email,
      subject: `Next steps for your ${lead.project_type_label}`,
      body: output.email_message,
    });
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="card">
        <h2 className="section-title">AI Actions</h2>
        <p className="mt-1 text-sm text-steel">Use these after assignment or before contacting the client.</p>
        <div className="mt-4 grid gap-2">
          <button className="btn-primary" disabled={aiScore.isPending} onClick={() => aiScore.mutate()}>{aiScore.isPending ? <Spinner /> : <Sparkles size={16} />} {aiScore.isPending ? "Scoring..." : "Score Lead"}</button>
          <button className="btn-secondary" disabled={followup.isPending} onClick={() => followup.mutate()}>{followup.isPending ? <Spinner /> : <Sparkles size={16} />} {followup.isPending ? "Generating..." : "Generate Follow-Up"}</button>
        </div>
      </div>
      <div className="card">
        <h2 className="section-title">AI Output</h2>
        {!aiScore.data && !output && <p className="mt-3 text-sm text-steel">Generate a score or follow-up to see AI output here.</p>}
        {aiScore.data && <Output title="Lead Score" data={aiScore.data.data.output} />}
        {output && (
          <div className="mt-4 grid gap-3">
            <Message title="Email" text={output.email_message} action={<button className="btn-secondary" onClick={saveEmailDraft}><MailPlus size={16} /> Save Email Draft</button>} />
            <Message title="Call Script" text={output.call_script} />
            <Message title="WhatsApp Copy" text={output.whatsapp_text} action={<button className="btn-secondary" onClick={copyWhatsApp}><Copy size={16} /> Copy Text</button>} />
          </div>
        )}
      </div>
    </section>
  );
}

function ProposalTab({ lead, proposals, refresh }) {
  const aiProposal = useMutation({ mutationFn: () => api.post("/ai/proposal", { lead_id: lead.id }) });
  const createProposal = useMutation({ mutationFn: (payload) => api.post("/proposals/", payload), onSuccess: refresh });
  const approveProposal = useMutation({ mutationFn: (proposalId) => api.patch(`/proposals/${proposalId}/approve/`), onSuccess: refresh });
  const moveStage = useMutation({ mutationFn: (payload) => api.patch(`/leads/${lead.id}/stage/`, payload), onSuccess: refresh });
  const stageSent = lead.stage === "proposal_sent" || lead.stage === "negotiation" || lead.stage === "won";
  const proposalOutput = aiProposal.data?.data?.output;

  function saveProposalDraft() {
    createProposal.mutate({
      lead: lead.id,
      title: proposalOutput.title,
      proposal_text: proposalOutput.proposal_text,
      amount: proposalOutput.amount || lead.budget || 1,
    });
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="card">
        <h2 className="section-title">Proposal Builder</h2>
        <p className="mt-1 text-sm text-steel">Generate a proposal draft, save it, approve it, then mark proposal sent.</p>
        <button className="btn-primary mt-4" disabled={aiProposal.isPending} onClick={() => aiProposal.mutate()}>{aiProposal.isPending ? <Spinner /> : <FileText size={16} />} {aiProposal.isPending ? "Generating..." : "Generate Proposal"}</button>
        {proposalOutput && (
          <div className="mt-4 rounded-md border border-line bg-mist p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="font-semibold">{proposalOutput.title}</p>
              <button className="btn-primary" disabled={createProposal.isPending} onClick={saveProposalDraft}>{createProposal.isPending ? "Saving..." : "Save Draft"}</button>
            </div>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-sm text-steel">{proposalOutput.proposal_text}</pre>
          </div>
        )}
      </div>
      <div className="card">
        <h2 className="section-title">Saved Proposals</h2>
        <div className="mt-3 space-y-3">
          {proposals.length === 0 && <p className="rounded-md bg-mist p-3 text-sm text-steel">No proposals saved yet.</p>}
          {proposals.map((proposal) => (
            <article key={proposal.id} className="rounded-md border border-line p-3">
              <p className="font-semibold">{proposal.title}</p>
              <p className="mt-1 text-sm text-steel">Rs. {Number(proposal.amount).toLocaleString("en-IN")} / {proposal.status_label}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {proposal.status !== "approved" && <button className="btn-secondary" disabled={approveProposal.isPending} onClick={() => approveProposal.mutate(proposal.id)}>{approveProposal.isPending ? <Spinner /> : <CheckCircle2 size={16} />} {approveProposal.isPending ? "Approving..." : "Approve"}</button>}
                <a className="btn-secondary" href={`${api.defaults.baseURL}/proposals/${proposal.id}/pdf/`}>Download PDF</a>
                <button className="btn-primary" disabled={moveStage.isPending || stageSent} onClick={() => moveStage.mutate({ stage: "proposal_sent" })}>{moveStage.isPending ? <Spinner /> : <CheckCircle2 size={16} />} {moveStage.isPending ? "Marking..." : stageSent ? "Sent" : "Mark Sent"}</button>
              </div>
              {moveStage.isSuccess && <p className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-pine">Proposal marked as sent. Lead moved to Proposal Sent.</p>}
              {moveStage.error && <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formatError(moveStage.error)}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MeetingsTab({ lead, meetings, refresh }) {
  const [rawNotes, setRawNotes] = useState("Client wants modern design. Needs parking. Budget around 50 lakh. Completion before Diwali.");
  const createMeeting = useMutation({ mutationFn: (payload) => api.post("/meetings/", payload), onSuccess: refresh });

  return (
    <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="card">
        <h2 className="section-title">Summarize Meeting</h2>
        <p className="mt-1 text-sm text-steel">Paste engineer or sales notes. AI turns them into action items and risks.</p>
        <textarea className="input mt-4 min-h-40 py-2" value={rawNotes} onChange={(event) => setRawNotes(event.target.value)} />
        <button className="btn-primary mt-3" disabled={createMeeting.isPending || !rawNotes.trim()} onClick={() => createMeeting.mutate({ lead: lead.id, raw_notes: rawNotes })}>{createMeeting.isPending ? <Spinner /> : <Sparkles size={16} />} {createMeeting.isPending ? "Summarizing..." : "Summarize"}</button>
      </div>
      <div className="card">
        <h2 className="section-title">Meeting Summaries</h2>
        <div className="mt-3 space-y-3">
          {meetings.length === 0 && <p className="rounded-md bg-mist p-3 text-sm text-steel">No meeting summaries yet.</p>}
          {meetings.map((meeting) => (
            <article key={meeting.id} className="rounded-md border border-line p-3">
              <p className="font-semibold">Summary</p>
              <p className="mt-1 text-sm text-steel">{meeting.summary}</p>
              <p className="mt-3 text-sm font-semibold">Action Items</p>
              <ul className="mt-1 list-inside list-disc text-sm text-steel">{meeting.action_items.map((item) => <li key={item}>{item}</li>)}</ul>
              <p className="mt-3 text-sm font-semibold">Risks</p>
              <ul className="mt-1 list-inside list-disc text-sm text-steel">{meeting.risks.map((item) => <li key={item}>{item}</li>)}</ul>
              <p className="mt-3 text-sm text-steel">Next follow-up: {meeting.next_follow_up_date}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActivityTab({ lead }) {
  return (
    <section className="card">
      <h2 className="section-title">Activity Timeline</h2>
      <div className="mt-3 divide-y divide-line">
        {(lead.activities || []).map((activity) => (
          <div key={activity.id} className="py-3">
            <p className="text-sm font-semibold">{activity.type_label}</p>
            <p className="text-sm text-steel">{activity.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-steel">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}

function Row({ label, value }) {
  return <div className="flex justify-between gap-4"><dt className="text-steel">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>;
}

function Spinner() {
  return <Loader2 className="animate-spin" size={16} aria-hidden="true" />;
}

function Output({ title, data }) {
  return (
    <div className="mt-4 rounded-md border border-line bg-mist p-4">
      <p className="font-semibold">{title}</p>
      <pre className="mt-2 whitespace-pre-wrap text-sm text-steel">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

function Message({ title, text, action }) {
  return (
    <article className="rounded-md border border-line p-3">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm text-steel">{text}</p>
      {action && <div className="mt-3">{action}</div>}
    </article>
  );
}


function formatError(error) {
  const data = error?.response?.data;
  if (!data) return "Action failed.";
  if (typeof data === "string") return data;
  return Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join(" ");
}
