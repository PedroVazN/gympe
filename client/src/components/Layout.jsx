import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import api from "../services/api";

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    api
      .get("/gamification/progress")
      .then((response) => setProgress(response.data))
      .catch(() => setProgress(null));
  }, []);

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-30 flex md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 h-full">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          streak={progress?.streak || 0}
          rank={progress?.rank}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6">
          <Outlet context={{ progress, refreshProgress: () => api.get("/gamification/progress").then((r) => setProgress(r.data)) }} />
        </main>
      </div>
    </div>
  );
}
