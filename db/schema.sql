-- CERBO — D1 schema (Cloudflare). Mirrors the former Convex tables.
-- Everything the agent does is written here so /proof can read it live (polled).

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session TEXT NOT NULL,
  extId TEXT NOT NULL,
  company TEXT NOT NULL,
  domain TEXT NOT NULL,
  industry TEXT NOT NULL,
  sizeBand TEXT NOT NULL,
  region TEXT NOT NULL,
  signal TEXT NOT NULL,
  source TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS leads_session ON leads(session);

CREATE TABLE IF NOT EXISTS brains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session TEXT NOT NULL,
  version INTEGER NOT NULL,
  markdown TEXT NOT NULL,
  rules TEXT NOT NULL,          -- JSON [{id,text,origin}]
  note TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  UNIQUE(session, version)
);
CREATE INDEX IF NOT EXISTS brains_session ON brains(session);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session TEXT NOT NULL,
  name TEXT NOT NULL,
  version INTEGER NOT NULL,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  brainVersion INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS skills_session ON skills(session);

CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session TEXT NOT NULL,
  step TEXT NOT NULL,
  input TEXT NOT NULL,
  ruleCited TEXT NOT NULL,
  output TEXT NOT NULL,
  verdict TEXT NOT NULL,
  score INTEGER,
  latencyMs INTEGER NOT NULL,
  costUsd REAL NOT NULL,
  tokensIn INTEGER NOT NULL,
  tokensOut INTEGER NOT NULL,
  toolCalls TEXT NOT NULL,      -- JSON [{tool,ok,latencyMs,summary}]
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS decisions_session ON decisions(session);

CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session TEXT NOT NULL,
  step TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  tokensIn INTEGER NOT NULL,
  tokensOut INTEGER NOT NULL,
  costUsd REAL NOT NULL,
  latencyMs INTEGER NOT NULL,
  ok INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS receipts_session ON receipts(session);

CREATE TABLE IF NOT EXISTS powerups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session TEXT NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  status TEXT NOT NULL,
  detail TEXT NOT NULL,
  lastEventAt INTEGER NOT NULL,
  UNIQUE(session, key)
);
CREATE INDEX IF NOT EXISTS powerups_session ON powerups(session);

CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  createdAt INTEGER NOT NULL
);

-- Freemium accounts: one row per email, with a credit balance.
CREATE TABLE IF NOT EXISTS accounts (
  email TEXT PRIMARY KEY,
  credits INTEGER NOT NULL,
  createdAt INTEGER NOT NULL,
  lastSeen INTEGER NOT NULL
);

-- Magic-code auth: one active code per email (upserted), short-lived.
CREATE TABLE IF NOT EXISTS auth_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expiresAt INTEGER NOT NULL
);
