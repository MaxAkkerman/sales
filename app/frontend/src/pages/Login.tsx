import { FormEvent, useState } from "react";
import { api } from "../api";

export default function Login({ onOk }: { onOk: (user: string) => void }) {
  const [username, setUsername] = useState("maxAkerman");
  const [password, setPassword] = useState("maxAkerman");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = await api.login(username, password);
      onOk(d.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login" onSubmit={submit}>
        <h1>М-Групп · продажи</h1>
        <p>Внутренний кабинет. Один пользователь.</p>
        <label>
          Логин
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button disabled={busy} type="submit">
          {busy ? "Входим…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
