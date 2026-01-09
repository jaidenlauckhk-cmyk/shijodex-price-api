require("dotenv").config();
const express = require("express");
const Database = require("better-sqlite3");

const app = express();
app.use(express.json());

const API_KEY = process.env.API_KEY;

// create DB
const db = new Database("prices.db");
db.prepare(`
  CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_key TEXT,
    condition TEXT,
    price_jpy INTEGER,
    updated_at INTEGER
  )
`).run();

// auth middleware
function auth(req, res, next) {
  if (req.headers["x-api-key"] !== API_KEY) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

// get price
app.get("/price", auth, (req, res) => {
  const { card_key, condition } = req.query;

  const row = db.prepare(`
    SELECT price_jpy, updated_at
    FROM prices
    WHERE card_key = ? AND condition = ?
    ORDER BY updated_at DESC
    LIMIT 1
  `).get(card_key, condition);

  if (!row) return res.status(404).json({ error: "not_found" });
  res.json(row);
});

// set price
app.post("/price", auth, (req, res) => {
  const { card_key, condition, price_jpy } = req.body;

  db.prepare(`
    INSERT INTO prices (card_key, condition, price_jpy, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(card_key, condition, price_jpy, Date.now());

  res.json({ ok: true });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("API running");
});
