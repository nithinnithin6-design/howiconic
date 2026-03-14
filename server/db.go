package server

import "database/sql"

func migrate(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			name TEXT NOT NULL DEFAULT '',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS brands (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			name TEXT NOT NULL DEFAULT '',
			uid TEXT UNIQUE NOT NULL,
			brand_data TEXT DEFAULT '{}',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS audits (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			brand_id INTEGER,
			audit_input TEXT DEFAULT '',
			audit_data TEXT DEFAULT '{}',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id),
			FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
		);

		CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
		CREATE INDEX IF NOT EXISTS idx_brands_uid ON brands(uid);
		CREATE INDEX IF NOT EXISTS idx_audits_user_id ON audits(user_id);
	`)
	if err != nil {
		return err
	}

	// Additive migrations — safe to run repeatedly (SQLite ignores if column exists only via error suppression)
	// generations_count: tracks how many brands a user has generated (for usage gating)
	db.Exec("ALTER TABLE users ADD COLUMN generations_count INTEGER NOT NULL DEFAULT 0")
	// plan: user's subscription tier
	db.Exec("ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'explorer'")

	return nil
}
