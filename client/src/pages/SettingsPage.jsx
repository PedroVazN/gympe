import { Bell, Moon, Sun, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import PageHeader from "../components/PageHeader";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        subtitle="Personalize o GymPE para o seu estilo de vida."
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="card flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-xl font-bold text-white shadow">
            {(user?.name || "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold">{user?.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
          <UserIcon className="h-5 w-5 text-slate-400" />
        </div>

        <div className="card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5">
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-semibold">Aparência</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Modo {theme === "dark" ? "escuro" : "claro"} ativado
              </p>
            </div>
          </div>
          <button type="button" onClick={toggle} className="btn-ghost">
            Alternar
          </button>
        </div>

        <div className="card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Lembretes</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Receba um empurrão diário para manter seu ritual.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => alert("Lembrete definido: registrar hábitos às 21h.")}
          >
            Ativar
          </button>
        </div>

        <div className="card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Sair da conta</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Volte sempre que quiser retomar a disciplina.
              </p>
            </div>
          </div>
          <button type="button" onClick={logout} className="btn-ghost">
            Sair
          </button>
        </div>
      </section>
    </div>
  );
}
