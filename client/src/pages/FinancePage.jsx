import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Banknote } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ReceivablesTab from "./finance/ReceivablesTab";
import PayablesTab from "./finance/PayablesTab";
import BankTab from "./finance/BankTab";

const TABS = [
  {
    key: "receivables",
    label: "Contas a Receber",
    icon: ArrowUpRight,
    description: "Tudo que entra no seu caixa.",
  },
  {
    key: "payables",
    label: "Contas a Pagar",
    icon: ArrowDownRight,
    description: "Despesas, parcelas e recorrências.",
  },
  {
    key: "bank",
    label: "Banco",
    icon: Banknote,
    description: "Seu painel financeiro em tempo real.",
  },
];

export default function FinancePage() {
  const [active, setActive] = useState("receivables");
  const tab = TABS.find((t) => t.key === active);

  return (
    <div className="space-y-6">
      <PageHeader title="Finanças" subtitle={tab?.description} />

      <div className="card !p-2">
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
          {TABS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActive(item.key)}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-gradient-to-r from-brand-600 to-accent-500 text-white shadow-lg shadow-brand-500/25"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {active === "receivables" ? <ReceivablesTab /> : null}
      {active === "payables" ? <PayablesTab /> : null}
      {active === "bank" ? <BankTab /> : null}
    </div>
  );
}
