# 🎣 Reel Frenzy

A cozy browser-based fishing game inspired by [Fishing Frenzy](https://fishingfrenzy.co/).
Cast your line, hook your catch, reel it in, then upgrade your gear and explore deeper waters.

**Play it:** open `index.html` in any modern browser, or visit the GitHub Pages deployment.

## Gameplay Loop

1. **Cast** — Hold the action button to charge a power meter. Release near the white line for max distance.
2. **Wait** — Watch the bobber. When you see the **!** indicator, a fish is biting.
3. **Hook** — Tap quickly within the bite window to set the hook.
4. **Reel** — Hold the action button to pull the catch zone up, release to drop. Keep the fish inside the green zone until the progress bar fills.

## Features

- 🐟 **17 fish species** across 6 rarity tiers (Common → Mythic)
- 🌊 **5 fishing zones** with distinct palettes and rarity boosts (Pond, Lake, Reef, Trench, Abyss)
- 🎣 **6 fishing rods** to upgrade — each improves power, energy, reel speed, and the size of the catch zone
- ⚡ **Energy system** — different zones cost more energy. Energy fully refills once per day at midnight (local time).
- 🎒 **Inventory & bulk-sell bonus** — collect species and cash out with a 10% bonus
- 💾 **Auto-save** — progress persists in `localStorage`
- 🎵 **Procedural audio** via WebAudio API (no asset downloads)
- 📱 **Touch + keyboard** — works on mobile, desktop, tablet. Spacebar = action button.

## Controls

| Action       | Mouse / Touch              | Keyboard      |
|--------------|----------------------------|---------------|
| Cast / Hook  | Tap action button          | Space (tap)   |
| Reel pull    | Hold action button         | Space (hold)  |
| Open menus   | Tap top-right icons        | —             |

## Tech

Pure HTML + CSS + JavaScript. No build step, no dependencies. Single `index.html` file.
