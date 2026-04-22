import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h2 className="text-2xl font-bold">Entrar</h2>
      <p className="mt-1 text-sm text-slate-300">Continue de onde parou — sua disciplina espera você.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        <button disabled={loading} className="btn-primary w-full">
          <LogIn className="h-4 w-4" />
          {loading ? "Entrando..." : "Entrar no GymPE"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Ainda não tem conta?{" "}
        <Link to="/register" className="font-semibold text-brand-300 hover:underline">
          Comece agora
        </Link>
      </p>
    </AuthShell>
  );
}
