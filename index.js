const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require("fs");
const https = require('https');

const app = express();
const cors = require('cors');
app.use(cors());

require('dotenv').config();

const environment = process.env.ENVIRONMENT || 'local';

let protocol;
if (environment === 'production') {
	protocol = "https";
} else {
	protocol = "http";
}

// Load HTTPS cert and key
const options = {
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem')
};

const host = '0.0.0.0';//'poke.api';
const port = 3000;

// Connect to SQLite database
const db = new sqlite3.Database('./pokeapi.db');

// Endpoint: Get all Pokémon
app.get('/pokemon', async (req, res) => {
	// If uri has ?offset=0&limit=20, then return only 20 pokemons
	const offset = req.query.offset ? parseInt(req.query.offset) : 0;
	const limit = req.query.limit ? parseInt(req.query.limit) : 14;
	const filters = {
		search: req.query.search || "",
		type: req.query.type || 0
	};
	try {
		const pokemons = await fetchPokemons(offset, limit, filters);
		if (!pokemons) {
			return res.status(404).json({ error: 'No Pokémon found' });
		}
		res.json(pokemons);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
});

// Endpoint: Get Pokémon by ID
app.get('/pokemon/:id', async (req, res) => {
	console.log("REQUEST TO GET POKEMON BY ID");
	try {
		const id = req.params.id;
		let pokemon = await fetchPokemon(id);
		if (!pokemon) {
			return res.status(404).json({ error: 'Pokemon not found' });
		}
		console.log("X: ", pokemon);
		res.json(pokemon);
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
});

if(protocol === "https") {
	https.createServer(options, app).listen(port, host, () => {
		console.log(`Server running at ${protocol}://${host}:${port}/`);
	});
}else {
	app.listen(port, () => {
		console.log(`Server running at ${protocol}://${host}:${port}`);
	});
}

async function fetchPokemon(id) {
	let { err, result } = await getAsync('SELECT * FROM pokemons WHERE id = ?', id);
	if (err) {
		throw err;
	}
	const pokemon = { ...result };
	console.log("pokemon: ", pokemon);
	if (pokemon) {
		// Types
		let queryTypes = "SELECT types.*,slot FROM pokemon_has_type "
			+ "JOIN types ON types.id = pokemon_has_type.type_id "
			+ "WHERE pokemon_has_type.pokemon_id = ? ORDER BY slot ASC";
		let resTypes = await allAsync(queryTypes, pokemon.id);
		let types = resTypes.rows;
		pokemon.types = types;

		let queryMoves = "SELECT moves.*,slot FROM pokemon_has_moves "
			+ "JOIN moves ON moves.id = pokemon_has_moves.move_id "
			+ "WHERE pokemon_has_moves.pokemon_id = ? ORDER BY slot ASC";
		let resMoves = await allAsync(queryMoves, pokemon.id);
		let moves = resMoves.rows;
		pokemon.moves = moves;

		let queryAbilities = "SELECT abilities.*,slot FROM pokemon_has_ability "
			+ "JOIN abilities ON abilities.id = pokemon_has_ability.ability_id "
			+ "WHERE pokemon_has_ability.pokemon_id = ? ORDER BY slot ASC";
		let resAbilities = await allAsync(queryAbilities, pokemon.id);
		let abilities = resAbilities.rows;
		pokemon.abilities = abilities;

		let resColor = await getAsync("SELECT * FROM colors WHERE id = ?", pokemon.color_id);
		let color = resColor.result;
		pokemon.color = color;
		const labels = {
			"hp": "HP",
			"attack": "Attack",
			"defense": "Defense",
			"special-attack": "Sp. Attack",
			"special-defense": "Sp. Defense",
			"speed": "Speed"
		};
		pokemon.stats = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"].map((name) => {
			return {
				name,
				label: labels[name],
				value: pokemon[name]
			};
		});
		return pokemon;
	}
	return null;
}

async function fetchPokemons(offset, limit, filters) {
	const {search, type} = filters;
	let where = "";
	if (search) {
		where = `WHERE (name LIKE '%${search}%' OR id LIKE '%${search}%')`;
	}
	if (type) {
		where = where ? `${where} AND` : 'WHERE';
		where += ` id IN (
			SELECT pokemon_id FROM pokemon_has_type WHERE type_id = ${type}
		)`;
	}
	const totalCount = await new Promise((resolve, reject) => {
		db.get(`SELECT COUNT(*) as count FROM pokemons ${where}`, [], (err, row) => {
			if (err) reject(err);
			else resolve(row.count);
		});
	});
	let { err, rows } = await allAsync(`SELECT * FROM pokemons ${where} LIMIT ? OFFSET ?`, limit, offset);
	if (err) {
		throw err;
	}
	const pokemons = await Promise.all(rows.map(async (pokemon) => {
		let resColor = await getAsync("SELECT * FROM colors WHERE id = ?", pokemon.color_id);
		let color = resColor.result;
		let { id, name, display_name, sprite} = pokemon;
		let searchable = `${id} ${name}`;
		return {
			id,
			name,
			display_name,
			sprite,
			color,
			searchable
		}
	}));
	const hasMore = offset + limit < totalCount ? true : false;
	return {
		results: pokemons,
		hasMore: hasMore,
		total: totalCount
	};
}

function allAsync(sql, ...args) {
	const flatParams = args.flat(); // <— FLATTENS nested arrays
	return new Promise((resolve, reject) => {
		db.all(sql, flatParams, (err, rows) => {
			if (err) {
				console.error("ERROR: ", err);
				reject(err);
			}
			resolve({ err, rows });
		});
	});
}

function getAsync(sql, ...args) {
	const flatParams = args.flat(); // <— FLATTENS nested arrays
	return new Promise((resolve, reject) => {
		db.get(sql, flatParams, (err, result) => {
			if (err) {
				console.error("ERROR: ", err);
				reject(err);
			}
			resolve({ err, result });
		});
	});
}