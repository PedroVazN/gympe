import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckCircle2,
  Target,
  Trophy,
  Users,
  Wallet,
  Settings,
  Dumbbell,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/habitos", label: "Hábitos", icon: CheckCircle2 },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/conquistas", label: "Conquistas", icon: Trophy },
  { to: "/social", label: "Social", icon: Users },
  { to: "/financas", label: "Finanças", icon: Wallet },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar({ onNavigate }) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col gap-2 border-r border-slate-200/70 bg-white/70 p-4 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.02]">
      <div className="mb-4 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-500/30">
          <Dumbbell className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">GymPE</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Vida, fé e finanças
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-gradient-to-r from-brand-600/15 to-accent-500/10 font-semibold text-brand-700 ring-1 ring-brand-500/20 dark:text-brand-200"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-4 w-4 ${isActive ? "text-brand-600 dark:text-brand-300" : ""}`}
                  />
                  {link.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 p-4 text-white shadow-lg shadow-brand-500/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
          Dica GymPE
        </p>
        <p className="mt-1 text-sm leading-snug">
          Acompanhe uma meta de cada tipo para evoluir em vida e finanças todo dia.
        </p>
      </div>
    </aside>
  );
}
