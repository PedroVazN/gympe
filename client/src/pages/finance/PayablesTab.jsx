import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Circle,
  CreditCard,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import api from "../../services/api";
import StatCard from "../../components/StatCard";

const currency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const emptyForm = () => ({
  description: "",
  amount: "",
  category: "Despesa",
  dueDate: new Date().toISOString().slice(0, 10),
  paid: false,
  mode: "single",
  installmentCount: 2,
  recurrenceFrequency: "monthly",
  recurrenceCount: 12,
  recurrenceEndDate: "",
});

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Em aberto" },
  { key: "paid", label: "Pagas" },
  { key: "overdue", label: "Em atraso" },
];

export default function PayablesTab() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [newDate, setNewDate] = useState("");

  const load = async () => {
    const params = { month: monthFilter };
    if (statusFilter !== "all") params.status = statusFilter;
    const { data } = await api.get("/payables", { params });
    setItems(data);
  };

  useEffect(() => {
    load();
  }, [monthFilter, statusFilter]);

  const totals = useMemo(() => {
    const paid = items.filter((i) => i.paid).reduce((acc, i) => acc + i.amount, 0);
    const pending = items.filter((i) => !i.paid).reduce((acc, i) => acc + i.amount, 0);
    const overdue = items
      .filter((i) => i.overdue)
      .reduce((acc, i) => acc + i.amount, 0);
    return { paid, pending, overdue };
  }, [items]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.description || !form.amount || !form.dueDate) return;

    const payload = {
      description: form.description,
      amount: Number(form.amount),
      category: form.category,
      dueDate: form.dueDate,
      paid: form.paid && form.mode === "single",
      mode: form.mode,
    };
    if (form.mode === "installment") {
      payload.installmentCount = Number(form.installmentCount);
    }
    if (form.mode === "recurring") {
      payload.recurrenceFrequency = form.recurrenceFrequency;
      if (form.recurrenceEndDate) payload.recurrenceEndDate = form.recurrenceEndDate;
      else payload.recurrenceCount = Number(form.recurrenceCount);
    }

    await api.post("/payables", payload);
    setForm(emptyForm());
    load();
  };

  const togglePaid = async (item) => {
    await api.patch(`/payables/${item._id}/toggle-paid`);
    load();
  };

  const remove = async (item) => {
    const isGroup = item.installmentGroupId || item.recurrenceGroupId;
    let scope = "single";
    if (isGroup) {
      const confirmAll = confirm(
        "Excluir apenas esta conta? Clique em OK para esta, Cancelar para excluir o grupo todo."
      );
      scope = confirmAll ? "single" : "group";
    } else if (!confirm(`Excluir "${item.description}"?`)) {
      return;
    }
    await api.delete(`/payables/${item._id}`, { params: { scope } });
    load();
  };

  const saveDueDate = async () => {
    if (!editing || !newDate) return;
    await api.patch(`/payables/${editing._id}/due-date`, { dueDate: newDate });
    setEditing(null);
    setNewDate("");
    load();
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={CheckCircle2}
          label="Pago no mês"
          value={currency(totals.paid)}
          accent="success"
        />
        <StatCard
          icon={CalendarClock}
          label="Em aberto"
          value={currency(totals.pending)}
          hint="Ainda sem pagamento"
          accent="warning"
        />
        <StatCard
          icon={AlertTriangle}
          label="Em atraso"
          value={currency(totals.overdue)}
          hint="Contas vencidas não pagas"
          accent="danger"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
        <form onSubmit={handleCreate} className="card space-y-3">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-brand-500" />
            <h3 className="text-lg font-semibold">Nova conta a pagar</h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <ModeButton
              active={form.mode === "single"}
              icon={CreditCard}
              label="Única"
              onClick={() => setForm({ ...form, mode: "single" })}
            />
            <ModeButton
              active={form.mode === "installment"}
              icon={CreditCard}
              label="Parcelada"
              onClick={() => setForm({ ...form, mode: "installment" })}
            />
            <ModeButton
              active={form.mode === "recurring"}
              icon={Repeat}
              label="Recorrente"
              onClick={() => setForm({ ...form, mode: "recurring" })}
            />
          </div>

          <div>
            <label className="label">Descrição</label>
            <input
              className="input"
              placeholder="Ex.: Aluguel, Internet, Notebook..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">
                {form.mode === "installment" ? "Valor total" : "Valor"}
              </label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Categoria</label>
              <input
                className="input"
                placeholder="Moradia, transporte..."
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="label">
                {form.mode === "recurring" ? "Primeira cobrança" : "Vencimento"}
              </label>
              <input
                className="input"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          {form.mode === "installment" ? (
            <div>
              <label className="label">Parcelas</label>
              <input
                className="input"
                type="number"
                min="2"
                value={form.installmentCount}
                onChange={(e) => setForm({ ...form, installmentCount: e.target.value })}
              />
              {form.amount && form.installmentCount ? (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {currency(Number(form.amount) / Number(form.installmentCount))} por parcela mensal
                </p>
              ) : null}
            </div>
          ) : null}

          {form.mode === "recurring" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Frequência</label>
                  <select
                    className="input"
                    value={form.recurrenceFrequency}
                    onChange={(e) =>
                      setForm({ ...form, recurrenceFrequency: e.target.value })
                    }
                  >
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="label">Quantas vezes</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={form.recurrenceCount}
                    onChange={(e) => setForm({ ...form, recurrenceCount: e.target.value })}
                    disabled={Boolean(form.recurrenceEndDate)}
                  />
                </div>
              </div>
              <div>
                <label className="label">Prazo final (opcional)</label>
                <input
                  className="input"
                  type="date"
                  value={form.recurrenceEndDate}
                  onChange={(e) => setForm({ ...form, recurrenceEndDate: e.target.value })}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Se preencher, a quantidade é calculada automaticamente.
                </p>
              </div>
            </div>
          ) : null}

          {form.mode === "single" ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.paid}
                onChange={(e) => setForm({ ...form, paid: e.target.checked })}
                className="h-4 w-4 accent-emerald-500"
              />
              Já paguei esta conta
            </label>
          ) : null}

          <button className="btn-primary w-full">Registrar conta</button>
        </form>

        <div className="card">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">Contas do mês</h3>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="input w-auto"
            />
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  statusFilter === filter.key
                    ? "bg-brand-600 text-white shadow"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              Nada por aqui neste filtro.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {items.map((item) => {
                const isEditing = editing?._id === item._id;
                return (
                  <li
                    key={item._id}
                    className={`flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between ${
                      item.overdue ? "relative" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => togglePaid(item)}
                        className={`mt-1 rounded-full p-1 transition ${
                          item.paid
                            ? "text-emerald-500"
                            : "text-slate-400 hover:text-emerald-500"
                        }`}
                        title={item.paid ? "Marcar como pendente" : "Marcar como paga"}
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
                            item.paid
                              ? "text-slate-500 line-through dark:text-slate-400"
                              : ""
                          }`}
                        >
                          {item.description}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span>{item.category}</span>
                          <span>·</span>
                          <span>
                            Vence em{" "}
                            {new Date(item.dueDate || item.date).toLocaleDateString("pt-BR")}
                          </span>
                          {item.isInstallment ? (
                            <span className="chip">
                              Parcela {item.installmentNumber}/{item.totalInstallments}
                            </span>
                          ) : null}
                          {item.isRecurring ? (
                            <span className="chip">
                              Recorrente {item.recurrenceIndex}/{item.totalOccurrences}
                            </span>
                          ) : null}
                          {item.overdue ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 font-semibold text-rose-500 ring-1 ring-rose-500/30">
                              <AlertTriangle className="h-3 w-3" /> Em atraso
                            </span>
                          ) : null}
                          {item.paid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-600 ring-1 ring-emerald-500/30">
                              Paga
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:pl-3">
                      <p
                        className={`text-sm font-semibold ${
                          item.paid ? "text-slate-400" : "text-rose-500"
                        }`}
                      >
                        -{currency(item.amount)}
                      </p>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            className="input w-auto py-1.5 text-xs"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                          />
                          <button type="button" className="btn-primary px-2 py-1.5 text-xs" onClick={saveDueDate}>
                            Salvar
                          </button>
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1.5 text-xs"
                            onClick={() => {
                              setEditing(null);
                              setNewDate("");
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(item);
                              setNewDate(
                                new Date(item.dueDate || item.date).toISOString().slice(0, 10)
                              );
                            }}
                            className="btn-ghost px-2 py-1.5 text-xs"
                            title="Alterar vencimento"
                          >
                            <CalendarClock className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(item)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function ModeButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-semibold transition ${
        active
          ? "border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-200"
          : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
