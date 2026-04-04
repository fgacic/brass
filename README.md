# Brass: Birmingham Online

Online multiplayer implementation of the board game Brass: Birmingham for 2-4 players.

## Tech Stack

- **Next.js 15** - App Router, React 19
- **Socket.IO** - Real-time multiplayer communication
- **Zustand** - Client-side state management
- **Tailwind CSS** - Styling (warm brass / industrial palette; **DM Sans** body + **Lora** display via `next/font` in `layout.js`)

## Architecture

Server-authoritative model: the server owns all game state, validates every action, and broadcasts filtered updates to each player. Clients render state and send action intents.

```
src/
  game/           # Pure game logic (runs on server)
    data/         # Static game data (locations, industries, cards, markets, merchants)
    engine/       # Game engine (state, actions, resources, scoring, pathfinding)
    constants.js  # Enums and configuration
  server/         # Server layer (rooms, game manager, socket handlers)
  app/            # Next.js pages
  components/     # React components (lobby, game board, UI; `boardTheme.js` = player/industry colors for Board + TurnInfo)
  store/          # Zustand stores
  hooks/          # React hooks (socket, game actions)
  lib/            # Socket.IO client singleton
```

## Setup

```bash
yarn install
yarn dev
```

Dependencies are managed with **Yarn** (`yarn.lock`). Open `http://localhost:3000` in your browser.

## How to Play

1. Create or join a game room
2. Wait for 2-4 players
3. Host starts the game
4. Each turn: select a card, choose an action, pick targets, confirm
5. Play through Canal Era and Rail Era
6. Player with most VP wins

## Game Actions

- **Build** - Place an industry tile on the board
- **Network** - Place canal/rail links between locations
- **Develop** - Remove tiles from your player mat to access higher levels
- **Sell** - Flip cotton/manufacturer/pottery tiles at a merchant that demands that good, with a link to that merchant; all **six** non-empty demand strips from the fixed deck are always in play (see `merchants.js`). Coal can be sold to the coal market without a merchant link; iron uses the iron market the same way.
- **Loan** - Take £30, reduce income by 3 levels
- **Scout** - Discard 3 cards, gain 1 wild location + 1 wild industry card
- **Pass** - Skip the action (still discards a card)

## Game Data

All game data (locations, connections, industry tiles, cards, markets, merchants) is defined in `src/game/data/`. The game engine in `src/game/engine/` operates purely on this data with no side effects.

`board-location-positions.js` holds SVG `x`/`y` coordinates for each location on the client board map; ids must match `locations.js`. On the board, a merchant strip that accepts all three sellable industries is drawn as a three-sector C/M/P pie with an SVG `title` tooltip (`Board.js`).

The second farm brewery (`farmBrewery2`) is not separate buildable links to Kidderminster/Worcester: it is on the `kidderminster-worcester` trunk (`TRUNK_ATTACHED_FARM` in `board-connections.js`). Pathfinding and player network treat the farm as reachable only when that trunk link exists; the map draws a T-stem from the trunk midpoint to the farm node.

`merchants.js` defines a **fixed deck of nine** cards (2× manufacturer-only, 1× pottery, 2× cotton, 1× all three, 3× empty). Only the **six non-empty** cards are used: they are shuffled and **all six** are placed on the active merchant cities (Shrewsbury → Gloucester → Oxford → Warrington → Nottingham at 4 players). With fewer than six merchants, some cities hold **two demand strips** so every strip is always on the board; the three empty cards are never placed. **Shrewsbury** never has more than **one** strip; if the triple card is assigned there, one industry is chosen at random. **Merchant beer:** one barrel per strip; the **all-three** card is one strip (one barrel). Beer refills per strip at the start of the rail era. Buying coal from the market still requires a link to any in-play merchant city.
