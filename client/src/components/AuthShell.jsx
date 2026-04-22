import { Dumbbell, Flame, Sparkles, Target } from "lucide-react";

export default function AuthShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0b14] text-slate-100">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-accent-500/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <div className="mx-auto grid min-h-screen max-w-6xl gap-10 px-4 py-10 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col justify-center">
          <div className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <p className="text-2xl font-bold tracking-tight">GymPE</p>
          </div>

          <h1 className="mt-8 text-4xl font-bold leading-tight sm:text-5xl">
            Domine seu corpo, sua fé e seu dinheiro.
          </h1>
          <p className="mt-4 max-w-md text-slate-300">
            O GymPE une hábitos diários, devoção e controle financeiro em um só lugar. Defina metas,
            ganhe XP e desbloqueie patentes conforme evolui.
          </p>

          <div className="mt-8 grid max-w-md gap-3">
            {[
              { icon: Target, text: "Metas diárias, semanais e mensais com progresso visual" },
              { icon: Flame, text: "Streaks, XP e patentes que premiam sua constância" },
              { icon: Sparkles, text: "Insights automáticos para vida, fé e finanças" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3 backdrop-blur">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-slate-200">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-white/5 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
