# PokEnergy

Virtual Energy Deck for Pokemon TCG — track your energy cards digitally without needing a physical energy deck.

## What is this?

In Pokemon TCG, energy cards power your Pokemon's attacks. PokEnergy replaces your physical energy deck with a virtual one, so you only need to carry your Pokemon and Trainer cards. When you draw an energy, the app tells you to use a marker instead of a physical card.

## Features

- **Virtual energy deck** — configure deck size, total energies, and distribution by type
- **Hand tracking** — tracks energies in your hand with discard and recover actions
- **Hand to play** — move energy from hand to the table (attach to a Pokemon)
- **Search deck** — find a specific energy in the deck and send it to hand or straight to play
- **Discard from play** — send energies from the table to the discard pile (knockout, attack cost, etc.)
- **Recover to deck** — return energies from the discard pile back to the deck
- **Shuffle hand into deck** — return hand energies to deck, shuffle, and draw new cards
- **Coin flip** — virtual coin flip with heads/tails result visible to all players
- **Undo support** — undo up to 30 actions with confirmation
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
5. Move energies from hand to play when attaching to a Pokemon
6. Search your deck for a specific energy type when a Trainer card allows it
7. Discard energies from play when a Pokemon is knocked out or pays an attack cost
8. Flip a coin when game mechanics require it

## License

[GPL](LICENSE)
