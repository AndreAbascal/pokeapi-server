# 🧠 PokeAPI Server RN

Node.js server providing Pokémon universe data from a local SQLite database (`pokeapi.db`), originally scraped from the official [PokeAPI](https://pokeapi.co). This API is used as a backend for the PokeAPI React Native app.

---

## 🚀 Features

- Serves Pokémon data such as pokemons, types, abilities, and stats.
- Local SQLite database (`pokeapi.db`) bundled in the project.
- Express-based API.
- HTTPS or HTTP, depending on usage, with HTTPS being used in local environment with [mkcert](https://github.com/FiloSottile/mkcert) SSL certificates.

---

## 🛠 Technologies

- Node.js installed
- [Express](https://www.npmjs.com/package/express)
- [SQLite3](https://www.npmjs.com/package/sqlite3)
- HTTPS

---

## ⚙️ Requirements

- Node.js v22.12.0 (recommended), but should also work with other versions. You may use `nvm` to manage Node.js versions for a better experience.
- Port `3000` must be available. Otherwise, choose another port in the `server.js` file.
- Firewall should be either:
  - Disabled, or
  - Allowing traffic on port `3000`, or
  - Configured to bypass for local API development.
- Ensure the file `pokeapi.db` is in the root directory.
- File /etc/hosts or respective hosts file should have domain set for local development
- It's easier to use physical device for local development server.

---

## 📦 Installation

```bash
npm install
