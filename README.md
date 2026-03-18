# PokEnergy

Virtual energy deck for Pokemon TCG.

Bought some boosters but don't have enough energy cards to play? PokEnergy solves that. It simulates your energy deck on your phone — just bring your Pokemon and Trainer cards. When you draw an energy, use a marker (die, token, coin) instead of a physical card.

Works solo or multiplayer. Bilingual (PT/EN). Light and dark theme.

## How it works

1. Set up your deck: size, energy count and distribution by type
2. Set prize cards and initial hand size
3. Each turn, draw a card:
   - **Energy** — the app shows the type, use a marker on the table
   - **Not energy** — draw the physical card from your real deck
4. Manage energies: discard, recover, shuffle hand, search deck, move between hand/play/discard
5. Flip the coin when needed

## Features

**Deck & hand**
- Full deck configuration (size, energies, distribution, prizes, initial hand)
- Draw confirmation on second draw per turn
- Deck search with destination (hand or straight to play)
- Shuffle hand into deck and draw new cards
- Undo up to 30 actions

**Energies in play**
- Move energy from hand to play (attach to a Pokemon)
- Discard from play (knockout, attack cost)
- Recover from discard to hand or deck
- Panel showing energies in play, in deck and in discard

**Multiplayer**
- Rooms via Firebase with turn-based flow
- Share room by URL
- Action history visible between players
- Coin flip result visible to all
- Old rooms auto-deleted when host creates a new one

**General**
- Virtual coin flip (heads/tails)
- Full action history
- In-app help explaining all mechanics
- Portuguese and English
- Light/dark theme
- Mobile-first

## Stack

- React 19 + TypeScript
- Vite
- Firebase (Firestore + Anonymous Auth)

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

### Firebase (for multiplayer)

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Authentication > Anonymous sign-in
4. Copy your web app credentials to `.env`
5. Deploy rules: `firebase deploy --only firestore:rules`

Solo mode doesn't need Firebase.

### Security

- Anonymous auth required for all Firestore operations
- Security rules enforce field immutability, player limits, role-based access and valid status transitions
- Old rooms from the same host are auto-deleted when creating a new room
- Optional TTL (requires Blaze plan): configure a policy on the `expireAt` field for automatic cleanup of abandoned rooms

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Type-check + build |
| `npm run preview` | Preview build |
| `npm run lint` | ESLint |

## License

[GPL](LICENSE)
