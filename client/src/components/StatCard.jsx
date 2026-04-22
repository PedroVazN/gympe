export default function StatCard({ icon: Icon, label, value, hint, accent = "brand" }) {
  const accentMap = {
    brand: "from-brand-500 to-accent-500",
    success: "from-emerald-500 to-teal-500",
    warning: "from-amber-500 to-orange-500",
    danger: "from-rose-500 to-red-500",
    purple: "from-fuchsia-500 to-purple-500",
  };

  return (
    <div className="card flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold leading-tight">{value}</p>
        {hint ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        ) : null}
      </div>
      {Icon ? (
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accentMap[accent]} text-white shadow-md`}
        >
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
    </div>
  );
}
