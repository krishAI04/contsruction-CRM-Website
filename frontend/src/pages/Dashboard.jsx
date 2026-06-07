import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, currentUser } from "../api";
import { KpiCard } from "../components/KpiCard.jsx";

export function Dashboard() {
  const user = currentUser();
  const canManage = ["admin", "manager"].includes(user?.role);
  const overview = useQuery({ queryKey: ["dashboard"], queryFn: async () => (await api.get("/dashboard/overview")).data });
  const sources = useQuery({ queryKey: ["sources"], queryFn: async () => (await api.get("/dashboard/sources")).data });
  const funnel = useQuery({ queryKey: ["funnel"], queryFn: async () => (await api.get("/dashboard/funnel")).data });
  const sales = useQuery({
    queryKey: ["sales-performance"],
    enabled: canManage,
    queryFn: async () => (await api.get("/dashboard/sales-performance")).data,
  });
  const data = overview.data || {};

  return (
    <div className="space-y-5">
      <PageTitle title="Dashboard" subtitle="Lead performance, conversion, source quality, and recent movement." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total leads" value={data.total_leads ?? "-"} />
        <KpiCard label="Active leads" value={data.active_leads ?? "-"} tone="steel" />
        <KpiCard label="Conversion" value={`${data.conversion_rate ?? 0}%`} tone="amber" />
        <KpiCard label="Revenue" value={`Rs. ${Number(data.estimated_revenue || 0).toLocaleString("en-IN")}`} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <ChartCard title="Conversion funnel" data={funnel.data || []} xKey="label" />
        <ChartCard title="Lead sources" data={sources.data || []} xKey="source" />
      </div>
      {canManage && <SalesPerformance rows={sales.data || []} />}
      <section className="card">
        <h2 className="section-title">Recent activity</h2>
        <div className="mt-3 divide-y divide-line">
          {(data.recent_activities || []).map((activity) => (
            <div key={activity.id} className="py-3">
              <p className="text-sm font-semibold">{activity.type_label}</p>
              <p className="text-sm text-steel">{activity.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ChartCard({ title, data, xKey }) {
  return (
    <section className="card min-h-80">
      <h2 className="section-title">{title}</h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

function SalesPerformance({ rows }) {
  const best = [...rows].sort((a, b) => b.conversion_rate - a.conversion_rate)[0];
  const totalRevenue = rows.reduce((sum, row) => sum + Number(row.revenue || 0), 0);

  return (
    <section className="card">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="section-title">Salesperson Performance</h2>
          <p className="mt-1 text-sm text-steel">Manager/Admin view for monitoring conversion, follow-up effort, active workload, and revenue.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-right text-sm">
          <div className="rounded-md border border-line bg-mist px-3 py-2">
            <p className="text-xs text-steel">Top converter</p>
            <p className="font-bold">{best?.name || "-"}</p>
          </div>
          <div className="rounded-md border border-line bg-mist px-3 py-2">
            <p className="text-xs text-steel">Team revenue</p>
            <p className="font-bold">Rs. {totalRevenue.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[940px] text-left text-sm">
          <thead className="bg-mist text-xs uppercase text-steel">
            <tr>
              <th className="px-4 py-3">Salesperson</th>
              <th className="px-4 py-3">Cities</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Contact Rate</th>
              <th className="px-4 py-3">Conversion</th>
              <th className="px-4 py-3">Won/Lost</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-mist/60">
                <td className="px-4 py-3">
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-xs text-steel">{row.email}</p>
                </td>
                <td className="px-4 py-3">{row.city_coverage || "Any city"}</td>
                <td className="px-4 py-3">{row.assigned_leads}</td>
                <td className="px-4 py-3">{row.contact_rate}%</td>
                <td className="px-4 py-3">
                  <span className="badge border-blue-200 bg-blue-50 text-pine">{row.conversion_rate}%</span>
                </td>
                <td className="px-4 py-3">{row.won_leads} / {row.lost_leads}</td>
                <td className="px-4 py-3">Rs. {Number(row.revenue || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">{row.active_leads}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="px-4 py-5 text-steel" colSpan="8">No salespeople found yet. Add sales executives from Team.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function PageTitle({ title, subtitle }) {
  return (
    <div>
      <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-steel">{subtitle}</p>
    </div>
  );
}
