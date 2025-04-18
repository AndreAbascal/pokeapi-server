import sqlite3 from 'sqlite3';
sqlite3.verbose();
import fs from 'fs';

/*async function appendQuery(filepath,query){
	const fs = require('fs');
	const path = require('path');

	// Get the absolute path of the file
	const absolutePath = path.resolve(filepath);

	// If file does not exist, create it
	if (!fs.existsSync(absolutePath)) {
		fs.writeFileSync(absolutePath, '');
	}


	// Append the query to the file
	await fs.appendFile(absolutePath, query + '\n');
}*/

const DB_NAME = "pokeapi.db";

async function createDB() {
	let db = new sqlite3.Database(DB_NAME);
	let sql = fs.readFileSync('./db_sqlite.sql', 'utf8');
	await new Promise((resolve, reject) => {
		db.exec(sql, (err) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
	return db;
}

async function fillAbilities() {
	const filepath = "logs/abilities.json";
	const fileContent = fs.readFileSync(filepath, 'utf8');
	const abilities = JSON.parse(fileContent);
	const table = "abilities";
	for(const ability of abilities){
		delete ability.pokemons;
		const columns = Object.keys(ability).join(', ');
		const placeholders = Object.keys(ability).map(() => '?').join(', ');
		const values = Object.values(ability);
		const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders});`;
		const { err, result } = await runAsync(query, values);
		if (err) {
			return console.error(err.message);
		}
		logEntry(`Ability inserted: ${ability.name}`);
		//appendQuery(filepath, query);
	}
}

async function fillColors() {
	const filepath = "logs/colors.json";
	const fileContent = fs.readFileSync(filepath, 'utf8');
	const colors = JSON.parse(fileContent);
	const table = "colors";
	for(const color of colors){
		const columns = Object.keys(color).join(', ');
		const placeholders = Object.keys(color).map(() => '?').join(', ');
		const values = Object.values(color);
		const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders});`;
		const { err, result } = await runAsync(query, values);
		if (err) {
			return console.error(err.message);
		}
		logEntry(`Color inserted: ${color.name}`);
		//appendQuery(filepath, query);
	}
}

async function fillEvolutionChains(){
	const filepath = "logs/evolution_chains.json";
	const fileContent = fs.readFileSync(filepath, 'utf8');
	const evolution_chains = JSON.parse(fileContent);
	const table = "evolution_chains";
	for(const chain of evolution_chains){
		const pokemon_name = chain.name;
		const res = await getAsync("SELECT * FROM pokemons WHERE name = ?", [pokemon_name]);
		if (res.err) {
			return console.error(selectErr.message);
		}
		const pokemon = res.result;
		if(!pokemon){
			console.error(`Pokemon not found using '${pokemon_name}'`);
			process.exit(0);
		}
		chain.pokemon_id = pokemon.id;
		delete chain.name;
		chain.evolutions = JSON.stringify(chain.evolutions);
		const columns = Object.keys(chain).join(', ');
		const placeholders = Object.keys(chain).map(() => '?').join(', ');
		const values = Object.values(chain);
		const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders});`;
		const { err, result } = await runAsync(query, values);
		if (err) {
			return console.error(err.message);
		}
		logEntry(`Evolution chain inserted: ${pokemon_name}`);
		//appendQuery(filepath, query);
	}
}

async function fillMoves() {
	const filepath = "logs/moves.json";
	const fileContent = fs.readFileSync(filepath, 'utf8');
	const moves = JSON.parse(fileContent);
	const table = "moves";
	for(const move of moves){
		delete move.pokemons;
		const type_name = move.type_name;
		delete move.type_name;
		const res = await getAsync("SELECT * FROM types WHERE name = ?", [type_name]);
		if (res.err) {
			return console.error(selectErr.message);
		}
		if(!res.result) {
			return console.error(`Type not found: ${type_name} for move ${move.name}`);
		}
		move.type_id = res.result.id;
		const columns = Object.keys(move).join(', ');
		const placeholders = Object.keys(move).map(() => '?').join(', ');
		const values = Object.values(move);
		const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders});`;
		const { err, result } = await runAsync(query, values);
		if (err) {
			logEntry("Error for move: ", move);
			return console.error(err.message);
		}
		logEntry(`Move inserted: ${move.name}`);
		//appendQuery(filepath, query);
	}
}

async function fillPokemons(){
	const filepath = "logs/pokemons.json";
	const fileContent = fs.readFileSync(filepath, 'utf8');
	const pokemons = JSON.parse(fileContent);
	const table = "pokemons";
	for(const pokemon of pokemons){
		try {
			const color_name = pokemon.color_name;
			const shape_name = pokemon.shape_name;
			delete pokemon.moves;
			delete pokemon.types;
			delete pokemon.shape_name;
			delete pokemon.color_name;
			// Get color
			const colorRes = await getAsync("SELECT * FROM colors WHERE name = ?", [color_name]);
			if (colorRes.err) {
				console.error(colorRes.err.message);
			}else if(!colorRes.result) {
				console.error(`Color not found: ${color_name} for pokemon ${pokemon.name}`);
			}
			pokemon.color_id = colorRes.result.id;
			// Get shape
			const shapeRes = await getAsync("SELECT * FROM shapes WHERE name = ?", [shape_name]);
			if (shapeRes.err) {
				console.error(shapeRes.err.message);
			}else if(!shapeRes.result) {
				console.error(`Shape not found: ${shape_name} for pokemon ${pokemon.name}`);
			}
			pokemon.shape_id = shapeRes.result.id;
			const columns = Object.keys(pokemon).join(', ');
			const placeholders = Object.keys(pokemon).map(() => '?').join(', ');
			const values = Object.values(pokemon);
			const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders});`;
			const { err, result } = await runAsync(query, values);
			if (err) {
				logEntry("Error for pokemon: ", pokemon);
				return console.error(err.message);
			}
			logEntry(`Pokemon inserted: ${pokemon.name}`);
		} catch (error){
			throw error;
		}
	}
}

async function fillPokemonRelatedTables(){
	const abilities = JSON.parse(fs.readFileSync("logs/abilities.json", 'utf8'));
	const pokemons = JSON.parse(fs.readFileSync("logs/pokemons.json", 'utf8'));
	const types = JSON.parse(fs.readFileSync("logs/types.json", 'utf8'));
	// pokemon_has_ability
	for(const ability of abilities) {
		for(const pokemon_entry of ability.pokemons){
			const res = await getAsync("SELECT * FROM pokemons WHERE name = ?", [pokemon_entry.name]);
			const pokemon = res.result;
			const {slot, is_hidden} = pokemon_entry;
			if(!pokemon){
				console.error(`Pokemon not found using '${pokemon_entry.name}' for ability ${ability.name}`);
				process.exit(0);
			}
			const pokemon_has_ability = {"pokemon_id": pokemon.id, "ability_id": ability.id, slot, is_hidden: +is_hidden};
			const columns = Object.keys(pokemon_has_ability).join(', ');
			const placeholders = Object.keys(pokemon_has_ability).map(() => '?').join(', ');
			const values = Object.values(pokemon_has_ability);
			const query = `INSERT INTO pokemon_has_ability (${columns}) VALUES (${placeholders});`;
			const { err, result } = await runAsync(query, values);
			if (err) {
				logEntry(`Pokemon-Ability insert error: ${pokemon.name} - ${ability.name}... err: ${err.message}`);
				return console.error(err.message);
			}
			logEntry(`Pokemon-Ability relationship inserted: ${pokemon_entry.name} - ${ability.name}`);
		}
	}

	// pokemon_has_move
	for(const pokemon of pokemons) {
		for(const move_name of pokemon.moves){
			const res = await getAsync("SELECT * FROM moves WHERE name = ?", [move_name]);
			const move = res.result;
			const slot = pokemon.moves.findIndex((item) => item === move_name)+1;
			const pokemon_has_move = {"pokemon_id": pokemon.id, "move_id": move.id, slot};
			const columns = Object.keys(pokemon_has_move).join(', ');
			const placeholders = Object.keys(pokemon_has_move).map(() => '?').join(', ');
			const values = Object.values(pokemon_has_move);
			const query = `INSERT INTO pokemon_has_moves (${columns}) VALUES (${placeholders});`;
			const { err, result } = await runAsync(query, values);
			if (err) {
				logEntry(`Pokemon-Move insert error: ${pokemon.name} - ${move_name}... err: ${err.message}`);
				return console.error(err.message);
			}
			logEntry(`Pokemon-Move relationship inserted: ${pokemon.name} - ${move_name}`);
		}
	}

	// pokemon_has_type
	for(const type of types) {
		for(const pokemon_entry of type.pokemons){
			const res = await getAsync("SELECT * FROM pokemons WHERE name = ?", [pokemon_entry.name]);
			const pokemon = res.result;
			const pokemon_has_type = {"pokemon_id": pokemon.id, "type_id": type.id, "slot": pokemon.slot};
			const columns = Object.keys(pokemon_has_type).join(', ');
			const placeholders = Object.keys(pokemon_has_type).map(() => '?').join(', ');
			const values = Object.values(pokemon_has_type);
			const query = `INSERT INTO pokemon_has_type (${columns}) VALUES (${placeholders});`;
			const { err, result } = await runAsync(query, values);
			if (err) {
				logEntry(`Pokemon-Type insert error: ${pokemon.name} - ${type.name}... err: ${err.message}`);
				return console.error(err.message);
			}
			logEntry(`Pokemon-Type relationship inserted: ${pokemon_entry.name} - ${type.name}`);
		}
	}
}

async function fillShapes() {
	const filepath = "logs/shapes.json";
	const fileContent = fs.readFileSync(filepath, 'utf8');
	const shapes = JSON.parse(fileContent);
	const table = "shapes";
	for(const shape of shapes){
		delete shape.pokemons;
		const columns = Object.keys(shape).join(', ');
		const placeholders = Object.keys(shape).map(() => '?').join(', ');
		const values = Object.values(shape);
		const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders});`;
		const { err, result } = await runAsync(query, values);
		if (err) {
			return console.error(err.message);
		}
		logEntry(`Shape inserted: ${shape.name}`);
		//appendQuery(filepath, query);
	}
}

async function fillTypes() {
	const filepath = "logs/types.json";
	const fileContent = fs.readFileSync(filepath, 'utf8');
	const types = JSON.parse(fileContent);
	const table = "types";
	for(const type of types){
		delete type.pokemons;
		const columns = Object.keys(type).join(', ');
		const placeholders = Object.keys(type).map(() => '?').join(', ');
		const values = Object.values(type);
		const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders});`;
		const { err, result } = await runAsync(query, values);
		if (err) {
			return console.error(err.message);
		}
		logEntry(`Type inserted: ${type.name}`);
		//appendQuery(filepath, query);
	}
}

// Wrap .run()
function runAsync(query, values) {
	return new Promise((resolve, reject) => {
		DB.run(query, values, function (err) {
			resolve({ err, result: this });
		});
	});
}

// Wrap .get()
function getAsync(sql, ...args) {
	const flatParams = args.flat(); // <— FLATTENS nested arrays
	return new Promise((resolve, reject) => {
		DB.get(sql, flatParams, (err, result) => {
			resolve({ err, result });
		});
	});
}

/*async function insertQueries(params) {
	const fs = require('fs');
	const path = require('path');
	// Params
	const { filepath, part } = params.filepath;
	console.log(`(${part}): Will run queries...`);
	// Get the absolute path of the file
	const absolutePath = path.resolve(filepath);

	// Read the file content
	const fileContent = fs.readFileSync(absolutePath, 'utf8');

	// Split the content into lines
	const lines = fileContent.split('\n');

	// Filter out empty lines
	const nonEmptyLines = lines.filter(line => line.trim() !== '');

	// Append each non-empty line to the file
	console.log(`(${part}): Before running queries...`);
	for (const line of nonEmptyLines) {
		await appendQuery(filepath, line);
	}
	console.log(`(${part}): After running queries...`);
}*/

async function main() {
	await fillColors();
	await fillShapes();
	await fillAbilities();
	await fillTypes();
	await fillMoves();
	await fillPokemons();
	await fillEvolutionChains();
	await fillPokemonRelatedTables();
}

/*async function populate() {
	insertQueries({ table: "colors", filepath: "db/colors.sql", part: "Colors" });
}*/

const formatDateTime = () => { const now = new Date(); const day = now.getDate().toString().padStart(2, '0'); const month = (now.getMonth() + 1).toString().padStart(2, '0'); const year = now.getFullYear(); const hours = now.getHours().toString().padStart(2, '0'); const minutes = now.getMinutes().toString().padStart(2, '0'); const seconds = now.getSeconds().toString().padStart(2, '0'); return `[${day}/${month}/${year} ${hours}:${minutes}:${seconds}]`; };

async function logEntry(content) {
	console.log(`${formatDateTime()}: ${content}`);
}

const DB = await createDB();
main(DB);
//populate();