import { PageTitle } from "./Dashboard.jsx";

export function Settings() {
  return (
    <div className="space-y-5">
      <PageTitle title="Settings" subtitle="Demo-safe operating modes and future integration scope." />
      <section className="card">
        <h2 className="section-title">Current Modes</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Mode label="AI" value="Mock by default; Gemini when AI_MODE=gemini and GEMINI_API_KEY is set." />
          <Mode label="Email" value="Mock by default; Gmail SMTP when EMAIL_MODE=smtp and app password is configured." />
        </div>
      </section>
      <section className="card">
        <h2 className="section-title">Future Scope</h2>
        <p className="mt-2 text-sm text-steel">Direct WhatsApp sending is intentionally outside V1. BuildFlow generates WhatsApp-ready text and supports copy-to-clipboard now; official WhatsApp Business API integration can be added later.</p>
      </section>
    </div>
  );
}

function Mode({ label, value }) {
  return (
    <div className="rounded-md border border-line p-4">
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-1 text-sm text-steel">{value}</p>
    </div>
  );
}

