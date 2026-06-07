import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, saveSession } from "../api";

const demos = [
  ["Admin", "admin@buildflow.test"],
  ["Manager", "manager@buildflow.test"],
  ["Sales", "sales@buildflow.test"],
  ["Viewer", "viewer@buildflow.test"],
];

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("manager@buildflow.test");
  const [password, setPassword] = useState("BuildFlow@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      saveSession(data);
      navigate("/dashboard");
    } catch {
      setError("Login failed. Run backend seed data or check credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-dvh bg-mist md:grid-cols-[1.1fr_0.9fr]">
      <section className="flex flex-col justify-center px-6 py-10 md:px-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-pine">BuildFlow CRM</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight md:text-5xl">AI sales operations for construction teams.</h1>
        <p className="mt-5 max-w-xl text-lg text-steel">Pipeline, proposals, follow-ups, email queue, and dashboard analytics in one recruiter-friendly full-stack CRM.</p>
        <Link className="mt-6 inline-flex text-sm font-bold text-pine underline-offset-4 hover:underline" to="/home">Back to landing page</Link>
      </section>
      <section className="flex items-center justify-center border-l border-line bg-white px-6 py-10">
        <form className="w-full max-w-md rounded-lg border border-line p-6 shadow-soft" onSubmit={submit}>
          <h2 className="text-2xl font-bold">Demo Login</h2>
          <p className="mt-1 text-sm text-steel">Seeded password: BuildFlow@123</p>
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          <label className="field-label" htmlFor="password">Password</label>
          <input id="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="btn-primary mt-5 w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {demos.map(([label, demoEmail]) => (
              <button key={demoEmail} type="button" className="btn-secondary justify-center" onClick={() => setEmail(demoEmail)}>{label}</button>
            ))}
          </div>
        </form>
      </section>
    </main>
  );
}
