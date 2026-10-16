import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./api";
import Login from "./pages/Login";
import Clients from "./pages/Clients";
import Templates from "./pages/Templates";
import Analytics from "./pages/Analytics";
import Layout from "./pages/Layout";

export default function App() {
  const [user, setUser] = useState<string | null | undefined>(undefined);
  const location = useLocation();

  useEffect(() => {
    api
      .me()
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, [location.pathname]);

  if (user === undefined) {
    return <div className="boot">Загрузка…</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onOk={(u) => setUser(u)} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout user={user} onLogout={() => setUser(null)} />}>
        <Route path="/" element={<Clients />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/templates" element={<Templates />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
