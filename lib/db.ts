/// <reference types="@cloudflare/workers-types" />

/**
 * D1 data layer — replaces the former Convex functions. Every write the agent
 * makes goes through here; /proof polls the read helpers. rules/toolCalls are
 * stored as JSON text.
 */

export type Rule = { id: string; text: string; origin: string };
export type ToolCall = {
  tool: string;
  ok: boolean;
  latencyMs: number;
  summary: string;
};

export type Lead = {
  extId: string;
  company: string;
  domain: string;
  industry: string;
  sizeBand: string;
  region: string;
  signal: string;
  source: string;
};

// ---------- leads ----------
export async function addLead(db: D1Database, session: string, l: Lead) {
  await db
    .prepare(
      `INSERT INTO leads (session,extId,company,domain,industry,sizeBand,region,signal,source,createdAt)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    )
    .bind(
      session,
      l.extId,
      l.company,
      l.domain,
      l.industry,
      l.sizeBand,
      l.region,
      l.signal,
      l.source,
      Date.now()
    )
    .run();
}

export async function listLeads(db: D1Database, session: string) {
  const { results } = await db
    .prepare(`SELECT * FROM leads WHERE session=? ORDER BY id ASC`)
    .bind(session)
    .all();
  return results ?? [];
}

// ---------- brains ----------
export async function saveBrain(
  db: D1Database,
  session: string,
  version: number,
  markdown: string,
  rules: Rule[],
  note: string
) {
  const createdAt = Date.now();
  await db
    .prepare(
      `INSERT INTO brains (session,version,markdown,rules,note,createdAt)
       VALUES (?,?,?,?,?,?)
       ON CONFLICT(session,version) DO UPDATE SET
         markdown=excluded.markdown, rules=excluded.rules,
         note=excluded.note, createdAt=excluded.createdAt`
    )
    .bind(session, version, markdown, JSON.stringify(rules), note, createdAt)
    .run();
  return createdAt;
}

function parseBrain(r: any) {
  return { ...r, rules: JSON.parse(r.rules) as Rule[] };
}

export async function listBrains(db: D1Database, session: string) {
  const { results } = await db
    .prepare(`SELECT * FROM brains WHERE session=? ORDER BY version ASC`)
    .bind(session)
    .all();
  return (results ?? []).map(parseBrain);
}

export async function latestBrain(db: D1Database, session: string) {
  const r = await db
    .prepare(`SELECT * FROM brains WHERE session=? ORDER BY version DESC LIMIT 1`)
    .bind(session)
    .first();
  return r ? parseBrain(r) : null;
}

// ---------- skills ----------
export async function addSkill(
  db: D1Database,
  session: string,
  s: {
    name: string;
    version: number;
    filename: string;
    content: string;
    brainVersion: number;
    createdAt: number;
  }
) {
  await db
    .prepare(
      `INSERT INTO skills (session,name,version,filename,content,brainVersion,createdAt)
       VALUES (?,?,?,?,?,?,?)`
    )
    .bind(
      session,
      s.name,
      s.version,
      s.filename,
      s.content,
      s.brainVersion,
      s.createdAt
    )
    .run();
}

export async function listSkills(db: D1Database, session: string) {
  const { results } = await db
    .prepare(`SELECT * FROM skills WHERE session=? ORDER BY createdAt ASC`)
    .bind(session)
    .all();
  return results ?? [];
}

// ---------- decisions ----------
export async function logDecision(
  db: D1Database,
  session: string,
  d: {
    step: string;
    input: string;
    ruleCited: string;
    output: string;
    verdict: string;
    score?: number;
    latencyMs: number;
    costUsd: number;
    tokensIn: number;
    tokensOut: number;
    toolCalls: ToolCall[];
  }
) {
  await db
    .prepare(
      `INSERT INTO decisions (session,step,input,ruleCited,output,verdict,score,latencyMs,costUsd,tokensIn,tokensOut,toolCalls,createdAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .bind(
      session,
      d.step,
      d.input,
      d.ruleCited,
      d.output,
      d.verdict,
      d.score ?? null,
      d.latencyMs,
      d.costUsd,
      d.tokensIn,
      d.tokensOut,
      JSON.stringify(d.toolCalls),
      Date.now()
    )
    .run();
}

export async function listDecisions(db: D1Database, session: string) {
  const { results } = await db
    .prepare(`SELECT * FROM decisions WHERE session=? ORDER BY createdAt ASC`)
    .bind(session)
    .all();
  return (results ?? []).map((r: any) => ({
    ...r,
    toolCalls: JSON.parse(r.toolCalls) as ToolCall[],
  }));
}

// ---------- receipts ----------
export async function addReceipt(
  db: D1Database,
  session: string,
  r: {
    step: string;
    provider: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
    latencyMs: number;
    ok: boolean;
  }
) {
  await db
    .prepare(
      `INSERT INTO receipts (session,step,provider,model,tokensIn,tokensOut,costUsd,latencyMs,ok,createdAt)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    )
    .bind(
      session,
      r.step,
      r.provider,
      r.model,
      r.tokensIn,
      r.tokensOut,
      r.costUsd,
      r.latencyMs,
      r.ok ? 1 : 0,
      Date.now()
    )
    .run();
}

export async function listReceipts(db: D1Database, session: string) {
  const { results } = await db
    .prepare(`SELECT * FROM receipts WHERE session=? ORDER BY createdAt ASC`)
    .bind(session)
    .all();
  return (results ?? []).map((r: any) => ({ ...r, ok: !!r.ok }));
}

// ---------- powerups ----------
export async function markPowerup(
  db: D1Database,
  session: string,
  key: string,
  label: string,
  status: string,
  detail: string
) {
  await db
    .prepare(
      `INSERT INTO powerups (session,key,label,status,detail,lastEventAt)
       VALUES (?,?,?,?,?,?)
       ON CONFLICT(session,key) DO UPDATE SET
         label=excluded.label, status=excluded.status,
         detail=excluded.detail, lastEventAt=excluded.lastEventAt`
    )
    .bind(session, key, label, status, detail, Date.now())
    .run();
}

export async function listPowerups(db: D1Database, session: string) {
  const { results } = await db
    .prepare(`SELECT * FROM powerups WHERE session=?`)
    .bind(session)
    .all();
  return results ?? [];
}

// ---------- waitlist ----------
export async function joinWaitlist(db: D1Database, email: string) {
  const clean = email.trim().toLowerCase();
  await db
    .prepare(
      `INSERT INTO waitlist (email,createdAt) VALUES (?,?)
       ON CONFLICT(email) DO NOTHING`
    )
    .bind(clean, Date.now())
    .run();
}

export async function waitlistCount(db: D1Database) {
  const r = await db
    .prepare(`SELECT COUNT(*) AS n FROM waitlist`)
    .first<{ n: number }>();
  return r?.n ?? 0;
}

// ---------- accounts / credits ----------
export type Account = { email: string; credits: number; createdAt: number; lastSeen: number };

export async function getAccount(db: D1Database, email: string): Promise<Account | null> {
  return db
    .prepare(`SELECT * FROM accounts WHERE email=?`)
    .bind(email.trim().toLowerCase())
    .first<Account>();
}

/** Get or create an account. New accounts start with `freeCredits`. */
export async function getOrCreateAccount(
  db: D1Database,
  email: string,
  freeCredits: number
): Promise<{ account: Account; isNew: boolean }> {
  const clean = email.trim().toLowerCase();
  const existing = await getAccount(db, clean);
  if (existing) {
    await db.prepare(`UPDATE accounts SET lastSeen=? WHERE email=?`).bind(Date.now(), clean).run();
    return { account: existing, isNew: false };
  }
  const now = Date.now();
  await db
    .prepare(`INSERT INTO accounts (email,credits,createdAt,lastSeen) VALUES (?,?,?,?)`)
    .bind(clean, freeCredits, now, now)
    .run();
  return { account: { email: clean, credits: freeCredits, createdAt: now, lastSeen: now }, isNew: true };
}

/** Atomically spend 1 credit. Returns the new balance, or -1 if none left. */
export async function spendCredit(db: D1Database, email: string): Promise<number> {
  const clean = email.trim().toLowerCase();
  const res = await db
    .prepare(`UPDATE accounts SET credits=credits-1, lastSeen=? WHERE email=? AND credits>0`)
    .bind(Date.now(), clean)
    .run();
  if (!res.meta.changes) return -1;
  const a = await getAccount(db, clean);
  return a?.credits ?? -1;
}

export async function addCredits(db: D1Database, email: string, n: number): Promise<number> {
  const clean = email.trim().toLowerCase();
  await db.prepare(`UPDATE accounts SET credits=credits+? WHERE email=?`).bind(n, clean).run();
  const a = await getAccount(db, clean);
  return a?.credits ?? 0;
}

// ---------- magic-code auth ----------
export async function setAuthCode(db: D1Database, email: string, code: string, expiresAt: number) {
  await db
    .prepare(
      `INSERT INTO auth_codes (email,code,expiresAt) VALUES (?,?,?)
       ON CONFLICT(email) DO UPDATE SET code=excluded.code, expiresAt=excluded.expiresAt`
    )
    .bind(email.trim().toLowerCase(), code, expiresAt)
    .run();
}

/** Returns true if the code matches and is unexpired; consumes it on success. */
export async function consumeAuthCode(db: D1Database, email: string, code: string, now: number): Promise<boolean> {
  const clean = email.trim().toLowerCase();
  const row = await db
    .prepare(`SELECT code,expiresAt FROM auth_codes WHERE email=?`)
    .bind(clean)
    .first<{ code: string; expiresAt: number }>();
  if (!row || row.code !== code.trim() || row.expiresAt < now) return false;
  await db.prepare(`DELETE FROM auth_codes WHERE email=?`).bind(clean).run();
  return true;
}

// ---------- escalations (exception inbox) ----------
export async function createEscalation(
  db: D1Database,
  session: string,
  e: { company: string; domain: string; lead: unknown; verdict: string; ruleCited: string; confidence: number; rationale: string }
) {
  await db
    .prepare(
      `INSERT INTO escalations (session,company,domain,lead,verdict,ruleCited,confidence,rationale,status,createdAt)
       VALUES (?,?,?,?,?,?,?,?,'pending',?)`
    )
    .bind(session, e.company, e.domain, JSON.stringify(e.lead), e.verdict, e.ruleCited, e.confidence, e.rationale, Date.now())
    .run();
}

export async function listEscalations(db: D1Database, session: string) {
  const { results } = await db
    .prepare(`SELECT * FROM escalations WHERE session=? ORDER BY (status='pending') DESC, createdAt DESC`)
    .bind(session)
    .all();
  return (results ?? []).map((r: any) => ({ ...r, lead: safeParse(r.lead) }));
}

export async function resolveEscalation(db: D1Database, id: number, resolution: string) {
  await db
    .prepare(`UPDATE escalations SET status='resolved', resolution=?, resolvedAt=? WHERE id=?`)
    .bind(resolution, Date.now(), id)
    .run();
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// ---------- reset ----------
export async function resetSession(db: D1Database, session: string) {
  for (const t of [
    "leads",
    "brains",
    "skills",
    "decisions",
    "receipts",
    "powerups",
    "escalations",
  ]) {
    await db.prepare(`DELETE FROM ${t} WHERE session=?`).bind(session).run();
  }
}
