# PokEnergy

Virtual Energy Deck for Pokemon TCG — track your energy cards digitally without needing a physical energy deck.

## What is this?

In Pokemon TCG, energy cards power your Pokemon's attacks. PokEnergy replaces your physical energy deck with a virtual one, so you only need to carry your Pokemon and Trainer cards. When you draw an energy, the app tells you to use a marker instead of a physical card.

## Features

- **Virtual energy deck** — configure deck size, total energies, and distribution by type
- **10 energy types** — Fire, Water, Grass, Lightning, Psychic, Fighting, Darkness, Metal, Fairy, Dragon
- **Draw simulation** — draws a card and tells you if it's energy (use marker) or not (draw physical card)
- **Hand tracking** — tracks energies in your hand with discard and recover actions
- **Shuffle hand into deck** — return hand energies to deck, shuffle, and draw new cards
- **Prize cards** — remove cards from the virtual deck to match your prize pile
- **Undo support** — undo up to 30 actions
- **Game history** — log of all actions taken during the game
- **Multiplayer** — create or join rooms via Firebase, play with turn-based flow
- **Share rooms via URL** — link with room code in the hash for easy sharing
- **Bilingual** — Portuguese and English
- **Dark/Light theme**
- **Mobile-friendly** — designed for use during tabletop play

## Tech Stack

- React 19 + TypeScript
- Vite
- Firebase (Firestore for multiplayer)

## Getting Started

```bash
# Install dependencies
npm install

# Copy env file and fill in your Firebase credentials
cp .env.example .env

# Start dev server
npm run dev
```

### Firebase Setup (for multiplayer)

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Authentication > Anonymous sign-in
4. Copy your web app credentials to `.env`

For solo play, Firebase is not required.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## How It Works

1. Configure your deck: set total cards, number of energies, and how they're distributed across types
2. Optionally set prize cards and initial hand size
3. Each turn, draw a card:
   - **Energy** — the app tells you the type; use a marker token instead of a physical card
   - **Not energy** — draw the physical card from your real deck
4. Manage your hand: discard energies, recover from discard pile, or shuffle hand back into the deck

## License

[GPL](LICENSE)
