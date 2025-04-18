import axios from 'axios';
import fs from 'fs';

const baseURL = 'https://pokeapi.co/api/v2';
var pokemonURL = "https://pokeapi.co/api/v2/pokemon/1/";

const formatDateTime = () => { const now = new Date(); const day = now.getDate().toString().padStart(2, '0'); const month = (now.getMonth() + 1).toString().padStart(2, '0'); const year = now.getFullYear(); const hours = now.getHours().toString().padStart(2, '0'); const minutes = now.getMinutes().toString().padStart(2, '0'); const seconds = now.getSeconds().toString().padStart(2, '0'); return `[${day}/${month}/${year} ${hours}:${minutes}:${seconds}]`; };

const PRELOAD_SKIP = {
	abilities: false,
	colors: false,
	evolution_chains: false,
	moves: false,
	pokemons: false,
	shapes: false,
	types: false
};

const colorTable = {
	"green": {
		"hex": "#77BA44",
		"rgba": "rgba(119, 186, 68, 1)"
	},
	"red": {
		"hex": "#FF0000",
		"rgba": "rgba(255, 0, 0, 1)"
	},
	"blue": {
		"hex": "#00ADEF",
		"rgba": "rgba(0, 173, 239, 1)"
	},
	"yellow": {
		"hex": "#FFCB05",
		"rgba": "rgba(255, 203, 5, 1)"
	},
	"brown": {
		"hex": "#A0522D",
		"rgba": "rgba(160, 82, 45, 1)"
	},
	"purple": {
		"hex": "#800080",
		"rgba": "rgba(128, 0, 128, 1)"
	},
	"gray": {
		"hex": "#808080",
		"rgba": "rgba(128, 128, 128, 1)"
	},
	"white": {
		"hex": "#FFFFFF",
		"rgba": "rgba(255, 255, 255, 1)"
	},
	"pink": {
		"hex": "#FF69B4",
		"rgba": "rgba(255, 105, 180, 1)"
	},
	"black": {
		"hex": "#000000",
		"rgba": "rgba(0, 0, 0, )"
	}
};

async function fetchAbility(url) {
	try {
		const response = await axios.get(url);
		const { id, name, effect_entries, flavor_text_entries, names, pokemon } = response.data;
		const display_name = names.find((entry) => entry.language.name === 'en').name;
		const flavor_text = flavor_text_entries.length ? flavor_text_entries.find((entry) => entry.language.name === 'en').flavor_text : "";
		const effect = effect_entries.length ? effect_entries.find((entry) => entry.language.name === 'en').effect : "";
		const short_effect = effect_entries.length ? effect_entries.find((entry) => entry.language.name === 'en').short_effect : "";
		const pokemons = pokemon.map((item) => {
			const { is_hidden, slot } = item;
			const { name } = item.pokemon;
			return { is_hidden, slot, name };
		});
		return { id, name, display_name, flavor_text, effect, short_effect, pokemons };
	} catch (error) {
		console.log("URL: " + url);
		console.error("Error fetching ability data:", error.message);

	}
	return null;
}

async function fetchAbilityList() {
	const url = `${baseURL}/ability?limit=1000`;
	try {
		const response = await axios.get(url);
		const { results } = response.data;
		return results;
	} catch (error) {
		console.error("Error fetching ability list:", error.message);
	}
	return [];
}

async function fetchColor(url) {
	/*
	id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
	name VARCHAR(255) NOT NULL,
	hex_code VARCHAR(7) NOT NULL,  #FFFFFF 
	rgba_code VARCHAR(30) NOT NULL, rgba(255,255,255,0.3)
	display_name VARCHAR(50) NOT NULL,
	*/
	try {
		const response = await axios.get(url);
		const { id, name } = response.data;
		const display_name = response.data.names.find((entry) => entry.language.name === 'en').name;
		const hex_code = colorTable[name].hex;
		const rgba_code = colorTable[name].rgba;
		return { id, name, display_name, hex_code, rgba_code };
	} catch (error) {
		console.error("Error fetching color data:", error.message);
	}
	return null;
}

async function fetchColorList() {
	const url = `${baseURL}/pokemon-color/`;
	try {
		const response = await axios.get(url);
		const { results } = response.data;
		return results;
	} catch (error) {
		console.error("Error fetching color list:", error.message);
	}
	return [];
}

async function fetchEvolutionChain(url) {
	try {
		const response = await axios.get(url);
		const { id, chain } = response.data;
		const name = chain.species.name;
		const evolutions = getEvolutionsChained(response.data);
		return { id, name, evolutions };
	} catch (error) {
		console.error("Error fetching evolution chain data:", error.message);
	}
	return null;
}

async function fetchEvolutionChainList() {
	const url = `${baseURL}/evolution-chain?offset=0&limit=1000`;
	try {
		const response = await axios.get(url);
		const { results } = response.data;
		return results;
	} catch (error) {
		console.error("Error fetching evolution chain list:", error.message);
	}
	return [];
}

function getEvolutionsChained(evolutionChain) {
	const evolutions = [];

	function traverseChain(chain, currentChain) {
		const nextChain = [...currentChain, chain.species.name];
		if (chain && chain.evolves_to && chain.evolves_to.length > 0) {
			chain.evolves_to.forEach(evolution => {
				traverseChain(evolution, nextChain);
			});
		} else {
			if (nextChain.length > 1) {
				evolutions.push(nextChain);
			}
		}
	}

	if (evolutionChain && evolutionChain.chain && evolutionChain.chain.species) {
		traverseChain(evolutionChain.chain, []);
	}

	return evolutions.filter(chain => chain.length > 1); // Ensure there's at least one evolution
}

async function fetchMove(url) {
	/*
		{
			"accuracy": 100,
			"effect": "",
			"flavor_text":"",
			"id": 13,
			"name": "razor-wind",
			"display_name": "",
			"power": 80,
			"pp": 10,
			"priority": 0
		}
	*/
	try {
		const response = await axios.get(url);
		const { id, name, effect_entries, flavor_text_entries, names, accuracy, power, pp, priority, type } = response.data;
		const flavor_text = flavor_text_entries.length ? flavor_text_entries.find((entry) => entry.language.name === 'en').flavor_text : "";
		const display_name = names.find((entry) => entry.language.name === 'en').name;
		const effect_entry = effect_entries.length ? effect_entries.find((entry) => entry.language.name === 'en') : "";
		const effect = effect_entry ? effect_entry.effect : "";
		const short_effect = effect_entry ? effect_entry.short_effect : "";
		const type_name = type.name;
		return {
			id,
			name,
			display_name,
			flavor_text,
			effect,
			short_effect,
			accuracy: accuracy ?? 0,
			power: power ?? 0,
			pp: pp ?? 0,
			priority: priority ?? 0,
			type_name
		};
	} catch (error) {
		console.error("Error fetching move data:", error.message, "for url: ", url);
	}
}

async function fetchMoveList(){
	const url = `${baseURL}/move?offset=0&limit=1000`;
	try {
		const response = await axios.get(url);
		const { results } = response.data;
		return results;
	} catch (error) {
		console.error("Error fetching move list:", error.message);
	}
	return [];
}

async function fetchPokemon(url) {
	try {
		const response = await axios.get(url);
		let { abilities, base_experience, cries, height, id, moves, name, order, sprites, stats, types, weight } = response.data;
		const sprite = sprites.other["official-artwork"].front_default;
		abilities = abilities.map((item) => item.ability.name).slice(0, 4);
		moves = moves.map((item) => item.move.name).slice(0, 4);
		types = types.map((item) => item.type.name);
		stats = stats.map((item) => {
			const { base_stat, effort } = item;
			const stat_name = item.stat.name;
			return { base_stat, effort, stat_name };
		});
		const sound = (cries.latest || cries.legacy) ?? null;
		const species = await fetchPokemonSpecies(response.data.species.url);
		const seq = order;
		/*
			Spread species attributes before so that, for some different pokemons which have all the same species,
			the spread attributes id/name from the species will be overwritten by the pokemon's unique ones.
		*/
		let pokemonObject = { ...species, abilities, base_experience, height, id, moves, name, seq, sound, /*stats, */sprite, types, weight };
		let statObject = {
			accuracy: 0,
			attack: 0,
			defense: 0,
			evasion: 0,
			hp: 0,
			special_attack: 0,
			special_defense: 0,
			speed: 0
		};
		stats.forEach((stat) => {
			pokemonObject[stat.stat_name.replace("-", "_")] = stat.base_stat;
		});
		return pokemonObject;
	} catch (error) {
		console.error("Error fetching Pokémon data:", error.message);
	}
}

async function fetchPokemonSpecies(url) {
	try {
		const response = await axios.get(url);
		const { id, name, base_happiness, capture_rate, color, flavor_text_entries, names, order, shape } = response.data;
		const color_name = color.name;
		const shape_name = shape.name;
		const flavor_text = flavor_text_entries.length ? flavor_text_entries.find((entry) => entry.language.name === 'en').flavor_text : "";
		const display_name = names.find((entry) => entry.language.name === 'en').name;
		return {
			id, name,
			base_happiness: base_happiness ?? 0,
			capture_rate: capture_rate ?? 0,
			color_name, display_name, flavor_text, shape_name };
	} catch (error) {
		console.error("Error fetching Pokémon species data:", error.message);
	}
}

async function fetchPokemonList() {
	const limit = 10000;
	const url = `${baseURL}/pokemon?limit=${limit}`;
	try {
		const response = await axios.get(url);
		const { results } = response.data;
		return results;
	} catch (error) {
		console.error("Error fetching Pokémon list:", error.message);
	}
	return [];
}

async function fetchShape(url) {
	try {
		const response = await axios.get(url);
		const { id, name, pokemon_species } = response.data;
		const display_name = response.data.names.find((entry) => entry.language.name === 'en').name;
		const pokemons = pokemon_species.map((item) => item.name);
		let shape = { id, name, display_name, pokemons };
		return shape;
	} catch (error) {
		console.error("Error fetching shape data: ", error.message);
	}
	return null;
}

async function fetchShapeList() {
	const url = `${baseURL}/pokemon-shape`;
	try {
		const response = await axios.get(url);
		const { results } = response.data;
		return results;
	} catch (error) {
		console.error("Error fetching shape data:", error.message);
	}
	return [];
}

async function fetchStat(id) {
	const url = `${baseURL}/stat/${id}/`;
	try {
		const response = await axios.get(url);
		const { id, name } = response.data
		const display_name = response.data.names.find((entry) => entry.language.name === 'en').name;
		return { id, name, display_name };
	} catch (error) {
		console.error("Error fetching stat data:", error.message);
	}
}

async function fetchType(url) {
	try {
		let response = await axios.get(url);
		let data = response.data;
		const sprite = 
			data.sprites["generation-iii"].colosseum.name_icon 
			?? data.sprites["generation-ix"]["scarlet-violet"].name_icon
			?? "";
		const { id, name, names, pokemon } = data;
		const display_name = names.find((entry) => entry.language.name === 'en').name;
		const pokemons = pokemon.map((item) => {
			const { slot } = item;
			const { name } = item.pokemon;
			return { slot, name };
		});
		return { id, name, display_name, sprite, pokemons };
	} catch (error) {
		console.error("Error fetching type data:", error.message);
	}
}

async function fetchTypeList() {
	const offset = 0;
	const limit = 1000;
	const url = `${baseURL}/type?offset=${offset}&limit=${limit}`;
	try {
		const response = await axios.get(url);
		const { results } = response.data;
		return results;
	} catch (error) {
		console.error("Error fetching type list:", error.message);
	}
	return [];
}

async function processInBatches(items, asyncFn, batchSize, logMessage) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        try {
            const batchResults = await Promise.all(
                batch.map(asyncFn)
            );
            results.push(...batchResults);
            if (logMessage) {
                console.log(formatDateTime() + ": " + logMessage + " - " + i + " to " + (i + batchSize));
            }
        } catch (error) {
            console.error("Error processing batch " + i + " to " + (i + batchSize) + ":", error);
        }
    }
    return results;
}

async function readJSON(filepath) {
	try {
		const data = fs.readFileSync(filepath, 'utf8');
		return JSON.parse(data);
	} catch (error) {
		console.error("Error reading JSON file:", error.message);
	}
	return null;
}

async function main() {
	console.log(formatDateTime() + ": BEGIN");

	let abilities, colors, evolution_chains, moves, pokemons, pokemon_has_abilities, pokemon_has_moves, pokemon_has_types, shapes, types;
	// 01 - Fetch all shapes

	if (PRELOAD_SKIP.shapes) {
		shapes = await readJSON("logs/shapes.json");
	} else {
		shapes = await fetchShapeList();
		shapes = await Promise.all(
			shapes.map(async (item) => await fetchShape(item.url))
		);
		fs.writeFileSync("logs/shapes.json", JSON.stringify(shapes, null, 2));
	}
	console.log(formatDateTime() + ": SHAPES(", shapes.length, ")");

	// 02 - Fetch all colors

	if (PRELOAD_SKIP.colors) {
		colors = await readJSON("logs/colors.json");
	} else {
		colors = await fetchColorList();
		colors = await Promise.all(
			colors.map(async (item) => await fetchColor(item.url))
		);
		fs.writeFileSync("logs/colors.json", JSON.stringify(colors, null, 2));
	}
	console.log(formatDateTime() + ": COLORS(", colors.length, ")");

	// 03 - Fetch all types

	if (PRELOAD_SKIP.types) {
		types = await readJSON("logs/types.json");
		pokemon_has_types = await readJSON("logs/pokemon_has_types.json");
	} else {
		types = await fetchTypeList();
		types = await Promise.all(
			types.map(async (item) => await fetchType(item.url))
		);
		fs.writeFileSync("logs/types.json", JSON.stringify(types, null, 2));
		pokemon_has_types = [];
		types.forEach((type) => {
			type.pokemons.forEach((pokemon) => {
				pokemon_has_types.push({
					pokemon: pokemon.name,
					type: type.name
				});
			});
		});
		fs.writeFileSync("logs/pokemon_has_types.json", JSON.stringify(types, null, 2));
	}
	console.log(formatDateTime() + ": TYPES(", types.length, ")");

	// 04 - Fetch all abilities

	if (PRELOAD_SKIP.abilities) {
		abilities = await readJSON("logs/abilities.json");
	} else {
		abilities = await fetchAbilityList();
		abilities = await processInBatches(
			abilities.map(item => item.url),
			fetchAbility,
			100,
			"Processed ability batch"
		);
		fs.writeFileSync("logs/abilities.json", JSON.stringify(abilities, null, 2));
		pokemon_has_abilities = [];
		abilities.forEach((ability) => {
			ability.pokemons.forEach((pokemon) => {
				pokemon_has_abilities.push({
					pokemon: pokemon.name,
					ability: ability.name
				});
			});
		});
		fs.writeFileSync("logs/pokemon_has_ability.json", JSON.stringify(pokemon_has_abilities, null, 2));
	}
	console.log(formatDateTime() + ": ABILITIES(", abilities.length, ")");

	// 05 - Fetch all evolution chains

	if (PRELOAD_SKIP.evolution_chains) {
		evolution_chains = await readJSON("logs/evolution_chains.json");
	} else {
		evolution_chains = await fetchEvolutionChainList();
		evolution_chains = await processInBatches(
			evolution_chains.map(item => item.url),
			fetchEvolutionChain,
			100,
			"Processed evolution chain batch"
		);
		fs.writeFileSync("logs/evolution_chains.json", JSON.stringify(evolution_chains, null, 2));
	}
	console.log(formatDateTime() + ": EVOLUTION CHAINS(", evolution_chains.length, ")");

	// 06 - Fetch all moves

	if(PRELOAD_SKIP.moves){
		moves = await readJSON("logs/moves.json");
	} else {
		moves = await fetchMoveList();
		moves = await processInBatches(
			moves.map(item => item.url),
			fetchMove,
			100,
			"Processed move batch"
		);
		fs.writeFileSync("logs/moves.json", JSON.stringify(moves, null, 2));
	}
	console.log(formatDateTime() + ": MOVES(", moves.length, ")");

	// 07 - Fetch all pokemons

	if(PRELOAD_SKIP.pokemons) {
		pokemons = await readJSON("logs/pokemons.json");
	}else {
		pokemons = await fetchPokemonList();
		pokemons = await processInBatches(
			pokemons.map(item => item.url),
			fetchPokemon,
			100,
			"Processed pokemon batch"
		);
		fs.writeFileSync("logs/pokemons.json", JSON.stringify(pokemons, null, 2));
	}
	console.log(formatDateTime() + ": POKEMONS(", pokemons.length, ")");

	process.exit(0);
};

main();