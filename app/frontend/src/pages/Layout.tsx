import { NavLink, Outlet } from "react-router-dom";
import { api } from "../api";

export default function Layout({
  user,
  onLogout,
}: {
  user: string;
  onLogout: () => void;
}) {
  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <span className="mark">М</span>
          <div>
            <strong>М-Групп</strong>
            <small>масло 20 кг · продажи</small>
          </div>
        </div>
        <nav>
          <NavLink to="/" end>
            Клиенты
          </NavLink>
          <NavLink to="/analytics">Аналитика</NavLink>
          <NavLink to="/templates">Шаблоны писем</NavLink>
        </nav>
        <div className="user">
          <span>{user}</span>
          <button
            className="ghost"
            onClick={async () => {
              await api.logout();
              onLogout();
            }}
          >
            Выйти
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
