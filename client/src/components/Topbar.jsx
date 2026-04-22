import { Bell, Flame, LogOut, Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ streak = 0, rank, onMenuClick }) {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();

  const initial = (user?.name || "U").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-white/5 dark:bg-[#0b0b14]/70">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="btn-ghost p-2 md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Bem-vindo de volta</p>
          <p className="text-sm font-semibold">{user?.name || "Usuário"}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1.5 text-sm font-semibold text-orange-600 ring-1 ring-orange-500/20 sm:flex dark:text-orange-300">
          <Flame className="h-4 w-4" />
          {streak} dias
        </div>

        {rank ? (
          <div
            className="hidden items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-white shadow-sm sm:flex"
            style={{ backgroundColor: rank.color }}
          >
            Nv {rank.level} · {rank.title}
          </div>
        ) : null}

        <button type="button" onClick={toggle} className="btn-ghost p-2" aria-label="Alternar tema">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button type="button" className="btn-ghost p-2" aria-label="Notificações">
          <Bell className="h-4 w-4" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-bold text-white shadow">
          {initial}
        </div>

        <button type="button" onClick={logout} className="btn-ghost p-2" aria-label="Sair">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
