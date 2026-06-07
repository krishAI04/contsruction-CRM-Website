import { BarChart3, ClipboardList, Mail, Settings, Trophy, UserCog, UsersRound, XCircle } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearSession, currentUser } from "../api";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/leads", label: "Leads", icon: UsersRound },
  { to: "/workflow", label: "Workflow", icon: ClipboardList },
  { to: "/won-leads", label: "Won", icon: Trophy },
  { to: "/lost-leads", label: "Lost", icon: XCircle },
  { to: "/team", label: "Team", icon: UserCog },
  { to: "/emails", label: "Emails", icon: Mail },
  { to: "/settings", label: "Settings", icon: Settings },
];

const mobileItems = items.slice(0, 5);

export function AppShell({ children }) {
  const user = currentUser();
  const navigate = useNavigate();

  function logout() {
    clearSession();
    navigate("/login");
  }

  return (
    <div className="min-h-dvh bg-mist text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-line bg-white px-4 py-5 md:block">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-steel">UrbanNest</p>
          <h1 className="text-2xl font-bold">BuildFlow CRM</h1>
        </div>
        <nav className="space-y-1">
          {items.map((item) => <NavItem key={item.to} {...item} />)}
        </nav>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur md:px-6">
          <div>
            <p className="text-sm font-semibold">{user?.email}</p>
            <p className="text-xs capitalize text-steel">{user?.role?.replace("_", " ")}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-pine/20 bg-pine/10 px-3 py-1 text-xs font-semibold text-pine">Mock AI Mode</span>
            <button className="btn-secondary" onClick={logout}>Logout</button>
          </div>
        </header>
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white md:hidden">
        {mobileItems.map((item) => <MobileItem key={item.to} {...item} />)}
      </nav>
    </div>
  );
}

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink to={to} end={to === "/dashboard"} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
      <Icon size={19} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );
}

function MobileItem({ to, label, icon: Icon }) {
  return (
    <NavLink to={to} end={to === "/dashboard"} className={({ isActive }) => `flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${isActive ? "text-pine" : "text-steel"}`}>
      <Icon size={20} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );
}
