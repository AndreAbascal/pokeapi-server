class PokemonList {
	constructor(data) {
		this.data = data;
	}
	toAPP() {
		const pokemons = this.data.pokemons.map((pokemon) => {
			return {
				id: pokemon.id,
				name: pokemon.name,
				image: pokemon.image,
				type: pokemon.type,
				abilities: pokemon.abilities,
				height: pokemon.height,
				weight: pokemon.weight,
			};
		});
		return pokemons;
	}
}