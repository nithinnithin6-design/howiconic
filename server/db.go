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

	// Existing additive migrations — safe to run repeatedly
	db.Exec("ALTER TABLE users ADD COLUMN generations_count INTEGER NOT NULL DEFAULT 0")
	db.Exec("ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'explorer'")

	// v4 brand table extensions
	migrateAddColumn(db, "brands", "parent_brand_id", "INTEGER")
	migrateAddColumn(db, "brands", "brand_type", "TEXT DEFAULT 'standalone'")
	migrateAddColumn(db, "brands", "category", "TEXT DEFAULT ''")
	migrateAddColumn(db, "brands", "subcategory", "TEXT DEFAULT ''")
	migrateAddColumn(db, "brands", "status", "TEXT DEFAULT 'active'")

	// v4 new tables
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS brand_assets (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			brand_id INTEGER NOT NULL,
			asset_type TEXT NOT NULL,
			file_path TEXT,
			file_format TEXT,
			version INTEGER DEFAULT 1,
			metadata TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (brand_id) REFERENCES brands(id)
		);

		CREATE TABLE IF NOT EXISTS brand_architecture (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			parent_brand_id INTEGER NOT NULL,
			child_brand_id INTEGER NOT NULL,
			relationship_type TEXT DEFAULT 'sub-brand',
			position INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (parent_brand_id) REFERENCES brands(id),
			FOREIGN KEY (child_brand_id) REFERENCES brands(id)
		);

		CREATE TABLE IF NOT EXISTS brand_kit_links (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			brand_id INTEGER NOT NULL,
			token TEXT NOT NULL UNIQUE,
			permissions TEXT DEFAULT 'view',
			expires_at DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (brand_id) REFERENCES brands(id)
		);

		CREATE TABLE IF NOT EXISTS design_productions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			brand_id INTEGER NOT NULL,
			user_id INTEGER NOT NULL,
			production_type TEXT NOT NULL,
			template_id TEXT,
			content TEXT,
			output_path TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (brand_id) REFERENCES brands(id)
		);

		CREATE TABLE IF NOT EXISTS education_moments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			context TEXT NOT NULL,
			category TEXT NOT NULL,
			content TEXT NOT NULL,
			source TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		return err
	}

	if err := seedEducationMoments(db); err != nil {
		return err
	}

	return nil
}

// migrateAddColumn safely adds a column only if it doesn't already exist.
// SQLite has no IF NOT EXISTS for ALTER TABLE, so we check via PRAGMA.
func migrateAddColumn(db *sql.DB, table, column, definition string) {
	rows, err := db.Query("PRAGMA table_info(" + table + ")")
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var cid, notNull, pk int
		var name, colType string
		var dfltValue interface{}
		if err := rows.Scan(&cid, &name, &colType, &notNull, &dfltValue, &pk); err != nil {
			continue
		}
		if name == column {
			return // Column already exists — skip
		}
	}

	db.Exec("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition)
}
