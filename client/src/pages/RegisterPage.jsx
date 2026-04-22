import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Rocket } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Não foi possível criar sua conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h2 className="text-2xl font-bold">Criar conta</h2>
      <p className="mt-1 text-sm text-slate-300">
        Em 1 minuto você começa a monitorar sua vida com disciplina e clareza.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label text-slate-400">Nome</label>
          <input
            className="input"
            placeholder="Seu nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label text-slate-400">E-mail</label>
          <input
            className="input"
            type="email"
            placeholder="voce@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label text-slate-400">Senha</label>
          <input
            className="input"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
        </div>
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        <button disabled={loading} className="btn-primary w-full">
          <Rocket className="h-4 w-4" />
          {loading ? "Criando..." : "Começar minha jornada"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Já tem conta?{" "}
        <Link to="/login" className="font-semibold text-brand-300 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
