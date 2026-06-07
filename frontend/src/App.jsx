import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { currentUser } from "./api";
import { AppShell } from "./components/AppShell.jsx";
import { Login } from "./pages/Login.jsx";
import { Landing } from "./pages/Landing.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Leads } from "./pages/Leads.jsx";
import { Pipeline } from "./pages/Pipeline.jsx";
import { Workflow } from "./pages/Workflow.jsx";
import { WorkQueue } from "./pages/WorkQueue.jsx";
import { LeadDetail } from "./pages/LeadDetail.jsx";
import { Emails } from "./pages/Emails.jsx";
import { Settings } from "./pages/Settings.jsx";
import { WonLeads } from "./pages/WonLeads.jsx";
import { LostLeads } from "./pages/LostLeads.jsx";
import { Team } from "./pages/Team.jsx";

function Protected({ children }) {
  return currentUser() ? children : <Navigate to="/login" replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(ref.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.22, ease: "power2.out" });
  }, [location.pathname]);

  return (
    <main ref={ref} className="min-w-0 flex-1 p-4 pb-24 md:p-6 md:pb-6">
      <Routes location={location}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/workflow" element={<Workflow />} />
        <Route path="/workflow/:queue" element={<WorkQueue />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/won-leads" element={<WonLeads />} />
        <Route path="/lost-leads" element={<LostLeads />} />
        <Route path="/team" element={<Team />} />
        <Route path="/emails" element={<Emails />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <Protected>
            <AppShell>
              <AnimatedRoutes />
            </AppShell>
          </Protected>
        }
      />
    </Routes>
  );
}
