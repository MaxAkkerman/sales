import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { pool, initDb } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 8000);
const JWT_SECRET = process.env.JWT_SECRET || "mgroup-dev-secret";
const AUTH_USER = process.env.AUTH_USER || "maxAkerman";
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || "maxAkerman";
const COOKIE = "mgroup_session";

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

function signToken() {
  return jwt.sign({ sub: AUTH_USER }, JWT_SECRET, { expiresIn: "7d" });
}

function authRequired(req, res, next) {
  const token = req.cookies[COOKIE];
  if (!token) return res.status(401).json({ error: "Нужна авторизация" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Сессия истекла" });
  }
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/login", (req, res) => {
  const username = String(req.body?.username || "");
  const password = String(req.body?.password || "");
  if (username !== AUTH_USER || password !== AUTH_PASSWORD) {
    return res.status(401).json({ error: "Неверный логин или пароль" });
  }
  res.cookie(COOKIE, signToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ user: AUTH_USER });
});

app.post("/api/logout", (_req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

app.get("/api/me", authRequired, (req, res) => {
  res.json({ user: req.user.sub });
});

const STATUSES = [
  "new",
  "in_progress",
  "qualification",
  "negotiation",
  "rejected",
  "client",
];

app.get("/api/clients", authRequired, async (req, res) => {
  const { q, segment, status, priority } = req.query;
  const where = [];
  const params = [];
  const add = (sql, value) => {
    params.push(value);
    where.push(sql.replace("?", `$${params.length}`));
  };
  if (q) {
    const like = `%${q}%`;
    params.push(like, like, like, like, like, like);
    const n = params.length;
    where.push(
      `(company ILIKE $${n - 5} OR city ILIKE $${n - 4} OR region ILIKE $${n - 3} OR phone ILIKE $${n - 2} OR email ILIKE $${n - 1} OR COALESCE(inn,'') ILIKE $${n})`
    );
  }
  if (segment) add("segment = ?", segment);
  if (status) add("status = ?", status);
  if (priority) add("priority = ?", priority);
  const sql = `
    SELECT c.*,
      (SELECT COUNT(*)::int FROM comments cm WHERE cm.client_id = c.id) AS comments_count
    FROM clients c
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY c.id ASC
  `;
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

app.get("/api/clients/:id", authRequired, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM clients WHERE id = $1", [
    req.params.id,
  ]);
  if (!rows[0]) return res.status(404).json({ error: "Клиент не найден" });
  const comments = await pool.query(
    "SELECT * FROM comments WHERE client_id = $1 ORDER BY created_at DESC",
    [req.params.id]
  );
  res.json({ ...rows[0], comments: comments.rows });
});

function clientFields(body) {
  return [
    body.segment || null,
    body.priority || null,
    body.company,
    body.city || null,
    body.region || null,
    body.phone || null,
    body.email || null,
    body.website || null,
    body.inn || null,
    body.contact_name || null,
    body.contact_role || null,
    body.source || null,
    STATUSES.includes(body.status) ? body.status : "new",
    body.collection_notes || null,
  ];
}

app.post("/api/clients", authRequired, async (req, res) => {
  if (!req.body?.company?.trim()) {
    return res.status(400).json({ error: "Укажите компанию" });
  }
  const { rows } = await pool.query(
    `INSERT INTO clients
      (segment, priority, company, city, region, phone, email, website, inn,
       contact_name, contact_role, source, status, collection_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    clientFields(req.body)
  );
  res.status(201).json(rows[0]);
});

app.put("/api/clients/:id", authRequired, async (req, res) => {
  if (!req.body?.company?.trim()) {
    return res.status(400).json({ error: "Укажите компанию" });
  }
  const fields = clientFields(req.body);
  const { rows } = await pool.query(
    `UPDATE clients SET
      segment=$1, priority=$2, company=$3, city=$4, region=$5, phone=$6, email=$7,
      website=$8, inn=$9, contact_name=$10, contact_role=$11, source=$12, status=$13,
      collection_notes=$14, updated_at=now()
     WHERE id=$15 RETURNING *`,
    [...fields, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Клиент не найден" });
  res.json(rows[0]);
});

app.post("/api/clients/:id/comments", authRequired, async (req, res) => {
  const body = String(req.body?.body || "").trim();
  if (!body) return res.status(400).json({ error: "Пустой комментарий" });
  const exists = await pool.query("SELECT id FROM clients WHERE id = $1", [
    req.params.id,
  ]);
  if (!exists.rows[0]) return res.status(404).json({ error: "Клиент не найден" });
  const { rows } = await pool.query(
    "INSERT INTO comments (client_id, body) VALUES ($1, $2) RETURNING *",
    [req.params.id, body]
  );
  await pool.query("UPDATE clients SET updated_at = now() WHERE id = $1", [
    req.params.id,
  ]);
  res.status(201).json(rows[0]);
});

const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(publicDir, "index.html"));
});

initDb()
  .then((info) => {
    console.log(
      info.seeded
        ? `База создана, импортировано ${info.count} клиентов`
        : `База уже есть, клиентов: ${info.count}`
    );
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Listening on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
