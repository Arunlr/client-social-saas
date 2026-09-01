-- Client Social SaaS MVP schema
-- Provider-neutral SQLite/Postgres-compatible logical schema.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE memberships (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  UNIQUE(client_id, user_id)
);

CREATE TABLE social_connections (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('youtube','instagram')),
  external_account_id TEXT,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected',
  secret_reference TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(client_id, provider)
);

CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  monthly_job_limit INTEGER NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TEXT,
  current_period_end TEXT
);

CREATE TABLE publishing_jobs (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source_file_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','published','failed')),
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT,
  error_message TEXT
);

CREATE TABLE publishing_results (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES publishing_jobs(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('youtube','instagram')),
  external_post_id TEXT,
  external_url TEXT,
  status TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE usage_events (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  job_id TEXT REFERENCES publishing_jobs(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  units INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_jobs_client_requested ON publishing_jobs(client_id, requested_at DESC);
CREATE INDEX idx_results_job ON publishing_results(job_id);
CREATE INDEX idx_usage_client_created ON usage_events(client_id, created_at DESC);

INSERT INTO plans (id, name, monthly_job_limit) VALUES ('free', 'Free', 10);
INSERT INTO plans (id, name, monthly_job_limit) VALUES ('starter', 'Starter', 50);
