CREATE TABLE IF NOT EXISTS colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    hex_code VARCHAR(7) NOT NULL, /* #FFFFFF */
    rgba_code VARCHAR(30) NOT NULL, /*rgba(255,255,255,0.3)*/
    display_name VARCHAR(50) NOT NULL,
    created_at TEXT DEFAULT (strftime('%H:%M:%S', 'now')), -- Store time as TEXT
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shapes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS abilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    flavor_text TEXT,
    effect TEXT,
    short_effect TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    sprite VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS moves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
	type_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    accuracy INTEGER NOT NULL,
    effect TEXT,
	short_effect VARCHAR(255),
    flavor_text TEXT,
    power INTEGER NOT NULL,
    pp INTEGER NOT NULL,
    priority INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (type_id) REFERENCES types(id) ON DELETE CASCADE
);

CREATE TABLE stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pokemons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    sprite VARCHAR(255),
	sound VARCHAR(255),
    color_id INTEGER NOT NULL,
    shape_id INTEGER NOT NULL,
    seq INTEGER NOT NULL,
    base_experience INTEGER,
	base_happiness INTEGER,
	capture_rate INTEGER,
	flavor_text TEXT,
    height INTEGER,
    weight INTEGER,
	hp INTEGER,
    attack INTEGER,
    defense INTEGER,
	speed INTEGER,
    evasion INTEGER,
    special_attack INTEGER,
    special_defense INTEGER,
	accuracy INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE,
    FOREIGN KEY (shape_id) REFERENCES shapes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evolution_chains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pokemon_id INTEGER NOT NULL,
    evolutions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pokemon_id) REFERENCES pokemons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pokemon_has_ability (
    pokemon_id INTEGER NOT NULL,
    ability_id INTEGER NOT NULL,
    is_hidden INTEGER DEFAULT 0, -- Using INTEGER for BOOLEAN
    slot INTEGER DEFAULT 0,
    PRIMARY KEY (pokemon_id, ability_id),
    FOREIGN KEY (pokemon_id) REFERENCES pokemons(id) ON DELETE CASCADE,
    FOREIGN KEY (ability_id) REFERENCES abilities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pokemon_has_moves (
    pokemon_id INTEGER NOT NULL,
    move_id INTEGER NOT NULL,
    slot INTEGER DEFAULT 0,
    PRIMARY KEY (pokemon_id, move_id),
    FOREIGN KEY (pokemon_id) REFERENCES pokemons(id) ON DELETE CASCADE,
    FOREIGN KEY (move_id) REFERENCES moves(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pokemon_has_stat (
    pokemon_id INTEGER NOT NULL,
    stat_id INTEGER NOT NULL,
    base_stat INTEGER NOT NULL,
    effort INTEGER DEFAULT 0,
    PRIMARY KEY (pokemon_id, stat_id),
    FOREIGN KEY (pokemon_id) REFERENCES pokemons(id) ON DELETE CASCADE,
    FOREIGN KEY (stat_id) REFERENCES stats(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pokemon_has_type (
    pokemon_id INTEGER NOT NULL,
    type_id INTEGER NOT NULL,
    slot INTEGER DEFAULT 0,
    PRIMARY KEY (pokemon_id, type_id),
    FOREIGN KEY (pokemon_id) REFERENCES pokemons(id) ON DELETE CASCADE,
    FOREIGN KEY (type_id) REFERENCES types(id) ON DELETE CASCADE
);