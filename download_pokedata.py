import os, json, time, urllib.request

OUTPUT_DIR = "pokedata"
IMG_DIR    = os.path.join(OUTPUT_DIR, "images")
os.makedirs(IMG_DIR, exist_ok=True)

TOTAL = 1025

# ── FIX: Add browser-like headers so PokéAPI doesn't block us ──
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    "Accept": "application/json",
}

def fetch_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def fetch_image(url, path):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as r:
        with open(path, "wb") as f:
            f.write(r.read())

print(f"Downloading {TOTAL} Pokémon... this will take ~10–15 minutes\n")

all_pokemon = {}

for i in range(1, TOTAL + 1):
    try:
        data = fetch_json(f"https://pokeapi.co/api/v2/pokemon/{i}")
        name = data["name"]

        entry = {
            "id":    data["id"],
            "name":  name,
            "types": [t["type"]["name"] for t in data["types"]],
            "stats": {s["stat"]["name"]: s["base_stat"] for s in data["stats"]},
            "cry":   data.get("cries", {}).get("latest", ""),
        }

        all_pokemon[name]    = entry
        all_pokemon[str(i)]  = entry

        # Download image
        img_url  = (data["sprites"].get("other") or {}).get("official-artwork", {}).get("front_default")
        img_path = os.path.join(IMG_DIR, f"{i}.png")
        if img_url and not os.path.exists(img_path):
            fetch_image(img_url, img_path)

        print(f"  [{i}/{TOTAL}] {name} ✓")
        time.sleep(0.05)

    except Exception as e:
        print(f"  [{i}/{TOTAL}] ERROR: {e}")
        time.sleep(1)  # wait a bit longer after errors

# Save JSON
out_path = os.path.join(OUTPUT_DIR, "all_pokemon.json")
with open(out_path, "w") as f:
    json.dump(all_pokemon, f)

print(f"\n✅ Done! Saved to ./{OUTPUT_DIR}/")
print(f"   JSON : {out_path}")
print(f"   Images: {IMG_DIR}/1.png … {TOTAL}.png")