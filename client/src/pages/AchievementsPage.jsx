import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";

const rarityStyle = {
  common: "from-slate-400 to-slate-500",
  rare: "from-sky-500 to-indigo-500",
  epic: "from-fuchsia-500 to-purple-600",
  legendary: "from-amber-400 via-orange-500 to-rose-500",
};

const rarityLabel = {
  common: "Comum",
  rare: "Rara",
  epic: "Épica",
  legendary: "Lendária",
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    api.get("/gamification/achievements").then((response) => setAchievements(response.data));
  }, []);

  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conquistas"
        subtitle={`${unlocked}/${achievements.length} desbloqueadas. Cada conquista reflete uma vitória real.`}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {achievements.map((item) => {
          const Icon = Icons[item.icon] || Icons.Award;
          const gradient = rarityStyle[item.rarity] || rarityStyle.common;
          return (
            <div
              key={item.key}
              className={`relative overflow-hidden rounded-2xl border p-5 transition ${
                item.unlocked
                  ? "border-transparent bg-white shadow-lg dark:bg-white/[0.04]"
                  : "border-dashed border-slate-200 bg-white/50 dark:border-white/10 dark:bg-white/[0.02]"
              }`}
            >
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg ${
                  item.unlocked ? "" : "opacity-30 grayscale"
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <p className="mb-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-white/5 dark:text-slate-300">
                {rarityLabel[item.rarity]}
              </p>
              <h3 className={`text-lg font-bold ${item.unlocked ? "" : "text-slate-400"}`}>
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
              {item.unlocked ? (
                <p className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                  Desbloqueada em {new Date(item.unlockedAt).toLocaleDateString("pt-BR")}
                </p>
              ) : (
                <p className="mt-3 text-xs font-semibold text-slate-400">Bloqueada</p>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
