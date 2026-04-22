import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import api from "../../services/api";
import StatCard from "../../components/StatCard";

const currency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const emptyForm = () => ({
  description: "",
  amount: "",
  category: "Salário",
  dueDate: new Date().toISOString().slice(0, 10),
  paid: false,
});

export default function ReceivablesTab() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));

  const load = async () => {
    const { data } = await api.get("/receivables", { params: { month: monthFilter } });
    setItems(data);
  };

  useEffect(() => {
    load();
  }, [monthFilter]);

  const totals = useMemo(() => {
    const received = items.filter((i) => i.paid).reduce((acc, i) => acc + i.amount, 0);
    const pending = items.filter((i) => !i.paid).reduce((acc, i) => acc + i.amount, 0);
    return { received, pending, total: received + pending };
  }, [items]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.description || !form.amount) return;
    await api.post("/receivables", {
      ...form,
      amount: Number(form.amount),
    });
    setForm(emptyForm());
    load();
  };

  const togglePaid = async (item) => {
    await api.patch(`/receivables/${item._id}/toggle-paid`);
    load();
  };

  const remove = async (item) => {
    if (!confirm(`Excluir "${item.description}"?`)) return;
    await api.delete(`/receivables/${item._id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={ArrowUpRight}
          label="Recebido no mês"
          value={currency(totals.received)}
          accent="success"
        />
        <StatCard
          label="A receber"
          value={currency(totals.pending)}
          hint="Ainda não confirmados"
          accent="warning"
        />
        <StatCard
          label="Total previsto"
          value={currency(totals.total)}
          hint="Mês selecionado"
          accent="brand"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
        <form onSubmit={handleCreate} className="card space-y-3">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-brand-500" />
            <h3 className="text-lg font-semibold">Nova entrada</h3>
          </div>
          <div>
            <label className="label">Descrição</label>
            <input
              className="input"
              placeholder="Ex.: Salário, comissão, freela..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor</label>
              <input
                className="input"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Categoria</label>
              <input
                className="input"
                placeholder="Salário, comissão..."
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Data de recebimento</label>
              <input
                className="input"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.paid}
              onChange={(e) => setForm({ ...form, paid: e.target.checked })}
              className="h-4 w-4 accent-emerald-500"
            />
            Já recebi este valor
          </label>
          <button className="btn-primary w-full">Registrar entrada</button>
        </form>

        <div className="card">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">Entradas do mês</h3>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="input w-auto"
            />
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              Nenhuma conta a receber neste mês.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {items.map((item) => (
                <li key={item._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => togglePaid(item)}
                      className={`mt-1 rounded-full p-1 transition ${
                        item.paid
                          ? "text-emerald-500"
                          : "text-slate-400 hover:text-emerald-500"
                      }`}
                      title={item.paid ? "Marcar como pendente" : "Marcar como recebido"}
                    >
                      {item.paid ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          item.paid ? "text-slate-500 line-through dark:text-slate-400" : ""
                        }`}
                      >
                        {item.description}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.category} ·{" "}
                        {new Date(item.dueDate || item.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-emerald-600">
                      +{currency(item.amount)}
                    </p>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
