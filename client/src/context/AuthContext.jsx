import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isValidUser = (value) =>
    Boolean(value && typeof value === "object" && (value.id || value._id) && value.email);

  useEffect(() => {
    const token = localStorage.getItem("gympe_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((response) => {
        if (isValidUser(response.data)) {
          setUser(response.data);
          return;
        }
        localStorage.removeItem("gympe_token");
        setUser(null);
      })
      .catch(() => {
        localStorage.removeItem("gympe_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (!data?.token || !isValidUser(data.user)) {
      throw new Error("Resposta de autenticação inválida.");
    }
    localStorage.setItem("gympe_token", data.token);
    setUser(data.user);
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    if (!data?.token || !isValidUser(data.user)) {
      throw new Error("Resposta de autenticação inválida.");
    }
    localStorage.setItem("gympe_token", data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("gympe_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
