CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by TEXT,
    status TEXT DEFAULT 'processing',
    chunk_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding_id TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    response TEXT,
    sources TEXT,
    model TEXT DEFAULT 'local',
    tokens_used INTEGER DEFAULT 0,
    latency_ms INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    document_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_doc_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_chunk_doc ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_query_created ON queries(created_at);
