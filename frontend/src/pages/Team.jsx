import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck, UserCog, UserPlus, UsersRound } from "lucide-react";
import { api, currentUser } from "../api";
import { PageTitle } from "./Dashboard.jsx";

const roles = [
  ["admin", "Admin"],
  ["manager", "Sales Manager"],
  ["executive", "Sales Executive"],
  ["viewer", "Viewer"],
];

export function Team() {
  const user = currentUser();
  const queryClient = useQueryClient();
  const canManage = ["admin", "manager"].includes(user?.role);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "BuildFlow@123",
    role: user?.role === "manager" ? "executive" : "executive",
    city_coverage: "",
    organization_password: "",
  });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: async () => (await api.get("/users/")).data });
  const createUser = useMutation({
    mutationFn: (payload) => api.post("/users/", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setForm((current) => ({ ...current, first_name: "", last_name: "", username: "", email: "", city_coverage: "", organization_password: "" }));
    },
  });

  const stats = {
    admins: users.filter((item) => item.role === "admin").length,
    managers: users.filter((item) => item.role === "manager").length,
    executives: users.filter((item) => item.role === "executive").length,
  };

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    createUser.mutate(form);
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Team" subtitle="Manage admins, managers, sales executives, organization access, and sales city coverage." />
      <div className="grid gap-4 md:grid-cols-3">
        <TeamMetric icon={ShieldCheck} label="Admins" value={stats.admins} />
        <TeamMetric icon={UserCog} label="Managers" value={stats.managers} />
        <TeamMetric icon={UsersRound} label="Sales executives" value={stats.executives} />
      </div>

      {canManage && (
        <section className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="section-title">Add Team Member</h2>
              <p className="mt-1 text-sm text-steel">
                Admin can add admins, managers, and salespeople. Manager can add salespeople only.
              </p>
            </div>
            <span className="badge">One CRM organization</span>
          </div>
          <form className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={submit}>
            <Field label="First name" value={form.first_name} onChange={(value) => update("first_name", value)} />
            <Field label="Last name" value={form.last_name} onChange={(value) => update("last_name", value)} />
            <Field label="Username" value={form.username} onChange={(value) => update("username", value)} required />
            <Field label="Email" type="email" value={form.email} onChange={(value) => update("email", value)} required />
            <Field label="Temporary password" value={form.password} onChange={(value) => update("password", value)} required />
            <label>
              <span className="field-label mt-0">Role</span>
              <select className="input" value={form.role} onChange={(event) => update("role", event.target.value)}>
                {roles
                  .filter(([role]) => user?.role === "admin" || role === "executive")
                  .map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <Field label="City coverage" value={form.city_coverage} onChange={(value) => update("city_coverage", value)} placeholder="Delhi, Noida, Gurgaon" />
            {user?.role === "admin" && form.role === "admin" && (
              <Field label="Organization password" value={form.organization_password} onChange={(value) => update("organization_password", value)} required />
            )}
            {createUser.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2 xl:col-span-3">{formatError(createUser.error)}</p>}
            <div className="flex items-end md:col-span-2 xl:col-span-3">
              <button className="btn-primary" disabled={createUser.isPending}><UserPlus size={16} /> {createUser.isPending ? "Adding..." : "Add user"}</button>
            </div>
          </form>
        </section>
      )}

      <section className="card overflow-hidden p-0">
        <div className="border-b border-line p-4">
          <h2 className="section-title">Organization Users</h2>
          <p className="mt-1 text-sm text-steel">Sales city coverage powers automatic lead assignment.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-mist text-xs uppercase text-steel">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">City Coverage</th>
                <th className="px-4 py-3">Visibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((item) => (
                <tr key={item.id} className="hover:bg-mist/60">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{[item.first_name, item.last_name].filter(Boolean).join(" ") || item.username}</p>
                    <p className="text-xs text-steel">{item.email}</p>
                  </td>
                  <td className="px-4 py-3"><span className="badge capitalize">{item.role}</span></td>
                  <td className="px-4 py-3">{item.organization_detail?.name || "BuildFlow"}</td>
                  <td className="px-4 py-3">{item.city_coverage || "Any city"}</td>
                  <td className="px-4 py-3">{item.team_visibility ? "Team view" : "Assigned leads only"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function TeamMetric({ icon: Icon, label, value }) {
  return (
    <section className="card flex items-center gap-3">
      <div className="step-dot"><Icon size={17} /></div>
      <div>
        <p className="text-sm text-steel">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, type = "text", required = false, placeholder = "" }) {
  return (
    <label>
      <span className="field-label mt-0">{label}</span>
      <input className="input" type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} />
    </label>
  );
}

function formatError(error) {
  const data = error?.response?.data;
  if (!data) return "Something went wrong.";
  if (typeof data === "string") return data;
  return Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join(" ");
}
