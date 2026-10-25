//LOOKUP TABLE
// ── TYPE COLOURS ──
const TYPE_COLORS = {
  fire: "#ef4444",
  water: "#3b82f6",
  grass: "#22c55e",
  electric: "#eab308",
  psychic: "#ec4899",
  ice: "#67e8f9",
  dragon: "#7c3aed",
  dark: "#374151",
  fairy: "#f472b6",
  normal: "#9ca3af",
  fighting: "#dc2626",
  flying: "#818cf8",
  poison: "#a855f7",
  ground: "#d97706",
  rock: "#92400e",
  bug: "#65a30d",
  ghost: "#6366f1",
  steel: "#94a3b8",
};

//ARRAY
const POPULAR = [
  "Charizard",
  "Pikachu",
  "Mewtwo",
  "Bulbasaur",
  "Squirtle",
  "Greninja",
  "Typhlosion",
  "Eevee",
];

// ── LOCAL DATA (loaded once at startup) ──
let POKEDEX = null; //NULL there's nothhing there, but will be filled with data once loaded

async function loadPokedex() {
  if (POKEDEX) return; // already loaded, skip
  const res = await fetch("./pokedata/all_pokemon.json");
  POKEDEX = await res.json();
}

// ── INIT ──
let searchHistory = []; //CREATES AN EMPTY ARRAY TO STORE THE SEARCH HISTORY

document.getElementById("popularPills").innerHTML = POPULAR.map(
  //map displays each element in the array POPULAR one by one
  (n) =>
    `<span class="popular-pill" onclick="searchByName('${n.toLowerCase()}')">${n}</span>`,
).join("");

document.getElementById("pokemonName").addEventListener("keydown", (e) => {
  if (e.key === "Enter") fetchData();
});

const saved = localStorage.getItem("theme");
if (saved === "light") document.body.classList.add("light");

// ── THEME ──
function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light") ? "light" : "dark",
  );
  document.querySelector(".toggle-btn").textContent =
    document.body.classList.contains("light") ? "🌑" : "🌙";
}

// ── RANDOM ──
async function randomPokemon() {
  await loadPokedex();
  const id = Math.floor(Math.random() * 1025) + 1;
  const data = POKEDEX[String(id)];
  document.getElementById("pokemonName").value = data ? data.name : id; //ternary operator
  fetchData(); // used to display the data of the random pokemon after pressing the random button
}

// ── FETCH (fully offline — reads from local pokedata folder) ──
async function fetchData() {
  const raw = document.getElementById("pokemonName").value.trim().toLowerCase();
  if (!raw) return;

  const loader = document.getElementById("loader");
  const resultCard = document.getElementById("resultCard");
  const sprite = document.getElementById("pokemonSprite");
  const info = document.getElementById("pokemonInfo");

  loader.style.display = "block";
  resultCard.style.display = "none";
  sprite.style.display = "none";

  try {
    await loadPokedex();

    const data = POKEDEX[raw];
    if (!data)
      throw new Error("Pokémon not found — try another name or number.");

    // history
    searchHistory = [...new Set([data.name, ...searchHistory])].slice(0, 5);
    renderHistory();

    // sprite — local image file
    sprite.src = `./pokedata/images/${data.id}.png`;
    sprite.style.display = "block";

    // cry
    const cry = document.getElementById("cry");
    if (data.cry) {
      cry.src = data.cry;
      cry.play().catch(() => {});
    }

    // types
    const types = data.types;
    const typeBadges = types
      .map((t) => {
        const col = TYPE_COLORS[t] || "#555";
        return `<span class="type-badge" style="background:${col}">${t}</span>`;
      })
      .join("");

    const glowCol = TYPE_COLORS[types[0]] || "#4f8ef7";
    sprite.style.filter = `drop-shadow(0 8px 28px ${glowCol}90)`;

    const hp = data.stats["hp"] ?? "—";
    const atk = data.stats["attack"] ?? "—";
    const def = data.stats["defense"] ?? "—";
    const spd = data.stats["speed"] ?? "—";

    info.innerHTML = `
      <div class="poke-id">#${String(data.id).padStart(4, "0")}</div>
      <div class="poke-name">${data.name}</div>
      <div class="type-badges">${typeBadges}</div>
      <div class="stat-grid">
        <div class="stat-item"><div class="stat-label">HP</div><div class="stat-value">${hp}</div></div>
        <div class="stat-item"><div class="stat-label">Attack</div><div class="stat-value">${atk}</div></div>
        <div class="stat-item"><div class="stat-label">Defense</div><div class="stat-value">${def}</div></div>
        <div class="stat-item"><div class="stat-label">Speed</div><div class="stat-value">${spd}</div></div>
      </div>
    `;

    resultCard.style.display = "block";
  } catch (err) {
    alert(err.message);
  } finally {
    loader.style.display = "none";
  }
}

// ── HISTORY ──
function renderHistory() {
  if (!searchHistory.length) {
    document.getElementById("history").innerHTML = "";
    return;
  }
  document.getElementById("history").innerHTML = `
    <div class="history-wrap">
      <div class="history-title">Recent</div>
      <div class="history-pills">
        ${searchHistory.map((n) => `<span class="history-pill" onclick="searchByName('${n}')">${n}</span>`).join("")}
      </div>
    </div>`;
}

// ── EXPOSE FUNCTIONS TO GLOBAL SCOPE (fixes onclick in HTML)
function searchByName(name) {
  document.getElementById("pokemonName").value = name;
  fetchData();
}
window.searchByName = searchByName;
window.randomPokemon = randomPokemon;
window.toggleTheme = toggleTheme;
window.fetchData = fetchData;
