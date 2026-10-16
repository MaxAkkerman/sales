import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  segment TEXT,
  priority TEXT,
  company TEXT NOT NULL,
  city TEXT,
  region TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  inn TEXT,
  contact_name TEXT,
  contact_role TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  collection_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_client_idx ON comments(client_id);
CREATE INDEX IF NOT EXISTS clients_status_idx ON clients(status);
CREATE INDEX IF NOT EXISTS clients_segment_idx ON clients(segment);
`;

async function waitForDb(attempts = 30) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (err) {
      console.log(`Postgres ещё не готов (${i}/${attempts}): ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("Postgres не ответил за отведённое время");
}

export async function initDb() {
  await waitForDb();
  await pool.query(SCHEMA);
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM clients");
  if (rows[0].n > 0) return { seeded: false, count: rows[0].n };

  const seedPath = path.join(__dirname, "../data/leads.json");
  const raw = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const leads = raw.leads || [];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const lead of leads) {
      const inserted = await client.query(
        `INSERT INTO clients
          (segment, priority, company, city, region, phone, email, website, inn,
           contact_name, contact_role, source, status, collection_notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'new',$13)
         RETURNING id`,
        [
          lead.segment || null,
          lead.priority || null,
          lead.company,
          lead.city || null,
          lead.region || null,
          lead.phone || null,
          lead.email || null,
          lead.website || null,
          lead.inn || null,
          lead.contact_name || null,
          lead.contact_role || null,
          lead.source || null,
          lead.notes || null,
        ]
      );
      if (lead.notes) {
        await client.query(
          "INSERT INTO comments (client_id, body) VALUES ($1, $2)",
          [inserted.rows[0].id, `Заметка сбора: ${lead.notes}`]
        );
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return { seeded: true, count: leads.length };
}
