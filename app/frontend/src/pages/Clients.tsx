import { useEffect, useMemo, useState } from "react";
import { api, Client, ClientStatus } from "../api";
import { PRIORITIES, SEGMENT_LABEL, SEGMENTS, STATUS_LABEL, STATUSES } from "../labels";

const emptyForm = {
  company: "",
  segment: "opt",
  priority: "A",
  status: "new" as ClientStatus,
  city: "",
  region: "",
  phone: "",
  email: "",
  website: "",
  inn: "",
  contact_name: "",
  contact_role: "",
  source: "",
};

export default function Clients() {
  const [rows, setRows] = useState<Client[]>([]);
  const [q, setQ] = useState("");
  const [segment, setSegment] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Client | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const data = await api.clients({ q, segment, status, priority });
    setRows(data);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [q, segment, status, priority]);

  async function open(id: number) {
    setCreating(false);
    setOpenId(id);
    const c = await api.client(id);
    setDetail(c);
    setForm({
      company: c.company,
      segment: c.segment || "opt",
      priority: c.priority || "A",
      status: c.status,
      city: c.city || "",
      region: c.region || "",
      phone: c.phone || "",
      email: c.email || "",
      website: c.website || "",
      inn: c.inn || "",
      contact_name: c.contact_name || "",
      contact_role: c.contact_role || "",
      source: c.source || "",
    });
    setComment("");
  }

  function startCreate() {
    setOpenId(null);
    setDetail(null);
    setCreating(true);
    setForm(emptyForm);
  }

  async function save() {
    setError("");
    try {
      if (creating) {
        const created = await api.create(form);
        setCreating(false);
        await load();
        await open(created.id);
      } else if (openId) {
        await api.update(openId, form);
        await load();
        await open(openId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    }
  }

  async function sendComment() {
    if (!openId || !comment.trim()) return;
    await api.addComment(openId, comment.trim());
    setComment("");
    await open(openId);
    await load();
  }

  const counts = useMemo(() => {
    return {
      all: rows.length,
    };
  }, [rows]);

  return (
    <main className="page">
      <div className="toolbar">
        <input
          className="search"
          placeholder="Поиск: компания, город, телефон, почта, ИНН"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={segment} onChange={(e) => setSegment(e.target.value)}>
          <option value="">Все сегменты</option>
          {SEGMENTS.map((s) => (
            <option key={s} value={s}>
              {SEGMENT_LABEL[s]}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Все статусы</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">Все приоритеты</option>
          {PRIORITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button onClick={startCreate}>Добавить клиента</button>
        <span className="muted">{counts.all} в выборке</span>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Компания</th>
              <th>Сегмент</th>
              <th>Регион</th>
              <th>Контакты</th>
              <th>Приоритет</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className={openId === r.id ? "active" : ""}
                onClick={() => open(r.id)}
              >
                <td>
                  <strong>{r.company}</strong>
                  {r.inn && <div className="sub">ИНН {r.inn}</div>}
                </td>
                <td>{SEGMENT_LABEL[r.segment || ""] || r.segment || "—"}</td>
                <td>
                  {[r.city, r.region].filter(Boolean).join(", ") || "—"}
                </td>
                <td>
                  {r.phone && <div>{r.phone}</div>}
                  {r.email && <div className="sub">{r.email}</div>}
                  {!r.phone && !r.email && "—"}
                </td>
                <td>
                  <span className={`prio prio-${r.priority}`}>{r.priority || "—"}</span>
                </td>
                <td>
                  <span className={`st st-${r.status}`}>{STATUS_LABEL[r.status]}</span>
                  {!!r.comments_count && (
                    <div className="sub">{r.comments_count} комм.</div>
                  )}
                </td>
                <td className="open">Открыть</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(creating || detail) && (
        <aside className="drawer">
          <div className="drawer-head">
            <h2>{creating ? "Новый клиент" : detail?.company}</h2>
            <button className="ghost" onClick={() => { setCreating(false); setDetail(null); setOpenId(null); }}>
              Закрыть
            </button>
          </div>
          <div className="grid">
            <label>
              Компания
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </label>
            <label>
              Сегмент
              <select value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })}>
                {SEGMENTS.map((s) => (
                  <option key={s} value={s}>{SEGMENT_LABEL[s]}</option>
                ))}
              </select>
            </label>
            <label>
              Приоритет
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Статус
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </label>
            <label>
              Город
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </label>
            <label>
              Регион
              <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </label>
            <label>
              Телефон
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>
              Почта
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label>
              Сайт
              <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </label>
            <label>
              ИНН
              <input value={form.inn} onChange={(e) => setForm({ ...form, inn: e.target.value })} />
            </label>
            <label>
              ЛПР
              <input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
            </label>
            <label>
              Должность
              <input value={form.contact_role} onChange={(e) => setForm({ ...form, contact_role: e.target.value })} />
            </label>
          </div>
          <button onClick={save}>Сохранить</button>

          {!creating && detail && (
            <section className="comments">
              <h3>Комментарии</h3>
              <textarea
                rows={3}
                placeholder="Касание, договорённость, отказ…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button className="secondary" onClick={sendComment} disabled={!comment.trim()}>
                Добавить комментарий
              </button>
              <ul>
                {(detail.comments || []).map((c) => (
                  <li key={c.id}>
                    <time>{new Date(c.created_at).toLocaleString("ru-RU")}</time>
                    <p>{c.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      )}
    </main>
  );
}
