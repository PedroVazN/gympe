import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  PiggyBank,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../services/api";
import StatCard from "../../components/StatCard";

const currency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const PIE_COLORS = ["#6366f1", "#22d3ee", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#f472b6"];

export default function BankTab() {
  const [data, setData] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    api.get("/bank/overview", { params: { month } }).then((r) => setData(r.data));
  }, [month]);

  if (!data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300/70 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-300">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span>
            Esta tela é somente visualização. Os valores refletem suas contas a pagar e a receber.
          </span>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="input w-auto"
        />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Saldo atual"
          value={currency(data.balance)}
          hint="Entradas pagas - Saídas pagas"
          accent="brand"
        />
        <StatCard
          icon={ArrowUpRight}
          label="Recebido no mês"
          value={currency(data.monthReceived)}
          hint={`A receber: ${currency(data.monthToReceive)}`}
          accent="success"
        />
        <StatCard
          icon={ArrowDownRight}
          label="Pago no mês"
          value={currency(data.monthPaid)}
          hint={`Em aberto: ${currency(data.monthToPay)}`}
          accent="danger"
        />
        <StatCard
          icon={PiggyBank}
          label="Resultado do mês"
          value={currency(data.monthBalance)}
          hint="Recebido - Pago"
          accent={data.monthBalance >= 0 ? "success" : "danger"}
        />
      </section>

      {data.overdueCount > 0 ? (
        <section className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              {data.overdueCount} {data.overdueCount === 1 ? "conta em atraso" : "contas em atraso"} ·{" "}
              {currency(data.overdueAmount)}
            </p>
            <p className="text-xs opacity-80">
              Abra a aba "Contas a Pagar" para regularizar ou alterar o vencimento.
            </p>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="card">
          <h3 className="mb-3 text-lg font-semibold">Fluxo financeiro</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.flow}>
                <defs>
                  <linearGradient id="bankIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="bankExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  formatter={(value) => currency(value)}
                  contentStyle={{
                    background: "rgba(15,23,42,0.92)",
                    border: "none",
                    borderRadius: 12,
                    color: "#f8fafc",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="entradas"
                  stroke="#22c55e"
                  fill="url(#bankIncome)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="saidas"
                  stroke="#ef4444"
                  fill="url(#bankExpense)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-3 text-lg font-semibold">Despesas por categoria</h3>
          {data.categories.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              Sem despesas neste mês.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categories}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.categories.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => currency(value)}
                    contentStyle={{
                      background: "rgba(15,23,42,0.92)",
                      border: "none",
                      borderRadius: 12,
                      color: "#f8fafc",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <h3 className="mb-3 text-lg font-semibold">Próximos vencimentos (30 dias)</h3>
        {data.upcoming.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nenhum vencimento à vista. Respire fundo.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {data.upcoming.map((item) => (
              <li key={item._id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-semibold">{item.description}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.category} ·{" "}
                    {new Date(item.dueDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <p className="font-semibold text-rose-500">-{currency(item.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
