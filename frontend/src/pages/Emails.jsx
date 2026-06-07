import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { api } from "../api";
import { PageTitle } from "./Dashboard.jsx";

export function Emails() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["emails"], queryFn: async () => (await api.get("/communications/emails/")).data });
  const send = useMutation({
    mutationFn: (id) => api.post(`/communications/emails/${id}/send/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emails"] }),
  });

  return (
    <div className="space-y-5">
      <PageTitle title="Email Queue" subtitle="Preview, queue, and mock-send Gmail SMTP-ready follow-up emails." />
      <section className="grid gap-4">
        {data.map((email) => (
          <article key={email.id} className="card">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-steel">{email.recipient}</p>
                <h2 className="text-lg font-bold">{email.subject}</h2>
                <p className="mt-2 max-w-3xl text-sm text-steel">{email.body}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge">{email.status_label}</span>
                <button className="btn-primary" disabled={send.isPending && send.variables === email.id} onClick={() => send.mutate(email.id)}>{send.isPending && send.variables === email.id ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} {send.isPending && send.variables === email.id ? "Sending..." : "Send"}</button>
              </div>
            </div>
            {send.isSuccess && send.variables === email.id && <p className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-pine">Email action completed. Status refreshed.</p>}
            {send.error && send.variables === email.id && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formatError(send.error)}</p>}
          </article>
        ))}
      </section>
    </div>
  );
}



function formatError(error) {
  const data = error?.response?.data;
  if (!data) return "Send failed.";
  if (typeof data === "string") return data;
  return Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join(" ");
}
