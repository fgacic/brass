# Brass: Birmingham Online

Online multiplayer implementation of the board game Brass: Birmingham for 2-4 players.

## Tech Stack

- **Next.js 15** - App Router, React 19
- **Socket.IO** - Real-time multiplayer communication
- **Zustand** - Client-side state management
- **Tailwind CSS** - Styling (warm brass / industrial palette; **DM Sans** body + **Lora** display via `next/font` in `layout.js`)
- **Motion** (`motion` package) - Game UI transitions (hand list, board tiles/links, mat rows, turn bar, money pulse, action error shake). Wrapped in `LazyMotion` + `domMax` (layout + gestures + animations) via `src/components/game/motionConfig.js`; heavy sequences respect `useReducedMotion()`. The top **turn bar** (`TurnInfo.js`) uses a shallow layout: small avatars with order badges, names and VP/£ on one column beside each avatar, horizontal scroll on narrow viewports. During **canal era**, a **Rail era** panel on the far right shows how many **full table rounds** remain using `ROUNDS_PER_ERA` from `constants.js` (10 / 9 / 8 for 2–4 players, matching the rulebook); the engine still flips to rail when the draw pile and all hands are empty at end of a round.
- **Howler** (`howler`) - Chime when it becomes your turn (`useMyTurnSound`, driven by `useGameStateFx`’s `myTurnFlash`); wind-up sting when the **Turn** counter advances (`gameState.round`, `RoundAdvanceOverlay` + `useRoundAdvanceOverlay`, `public/sounds/round-windup.wav`, `node scripts/generate-round-windup.cjs`). Turn clip: `public/sounds/your-turn.wav` (`node scripts/generate-turn-chime.cjs`). Playback skips under `prefers-reduced-motion: reduce`. If audio is still locked, the first successful play may follow a `pointerdown` on the page.

## Architecture

Server-authoritative model: the server owns all game state, validates every action, and broadcasts filtered updates to each player. Clients render state and send action intents.

**Sidebar supply:** Under the player mat, **`BoardResourceSummary`** (`BoardResourceSummary.js`) shows **iron** as one number: cubes on unflipped **iron works** on the board only (`board-resource-summary.js`; iron demand track remains in **Markets** / `MarketTrack.js`). **Coal** lists each **location** that has coal on a mine with remaining cubes, per-location counts, and **total** coal on mines only.

**Client action UI:** On your turn, `GameView` lays out **`ActionPanel`** (left, fixed max width, scrolls if tall) and **`Hand`** (right, flexes, horizontal card scroll) in one bar with shared height (`embedded` props). **Build**, **Network**, and **Loan** share one full-width row (larger chips); **Develop**, **Sell**, **Scout**, and **Pass** wrap on the row below (`ActionPanel.js`, `PRIMARY_CHOOSER_ORDER` + `primary` on `ACTIONS`). Other players see only the hand strip. `gameStore` exposes `actionSubmitting` (set around `game:action` emit/ack) and `actionErrorTick` (increments on each error) for the action panel spinner. After each new `game:log` entry, `useGameStateFx` diffs board/tiles and exposes short-lived FX keys (`tilePopId`, `linkDrawId`, `tileFlipIds`, `handFlash`, etc.); game components read those props and run **Motion** animations (`Hand`, `Board`, `PlayerMat`, `TurnInfo`, `ActionPanel`). Build uses optional shared `layoutId` `brass-build-pending` on the selected hand card and the new tile when `tilePopId` matches (best-effort overlap with server updates).

**Board map:** Buildable locations (cities, towns, farm breweries) use a **slot grid** in `Board.js` with layout from `boardSlotGrid.js`. Wheel / trackpad zoom uses `deltaY`-scaled steps (`WHEEL_ZOOM_*` in `Board.js`) so macOS trackpads do not compound a fixed 12% on every tick; square cells show industry icons when empty; when built, the cell fills with industry color, owner outline, and tile level (plus resource count when relevant). The location name sits under the grid. Merchant cities keep the circular node and foreign-market demand badges. **Map legends** (link styles top-left, industries top-right, build costs bottom-left in `Board.js`) share the same interaction: **hold the pointer ~1s** to enlarge (scale 1.5, spring + shadow); each uses its corner as `transformOrigin`. Reduced motion keeps scale at 1. Build costs list tile levels with £ and coal/iron/beer from `industryDefinitions` in `industries.js`. **Dual-industry** empty slots (split cell) get an animated **cyan outline on the matching half** when a build industry is chosen, so pairing matches the hand/action-panel sky highlights; single-industry empty slots get a full-cell cyan ring in the same case (`renderSlotGridEmptyCell`, `buildPairingIndustry`).

```
src/
  game/           # Pure game logic (runs on server)
    data/         # Static game data (locations, industries, cards, markets, merchants)
    engine/       # Game engine (state, actions, resources, scoring, pathfinding)
    constants.js           # Enums and configuration
    board-resource-summary.js  # Read-only aggregates for sidebar iron/coal counts
  server/         # Server layer (rooms, game manager, socket handlers)
  app/            # Next.js pages
  components/     # React components (lobby, game board, UI; `boardTheme.js`, `boardSlotGrid.js` slot layout for Board)
  store/          # Zustand stores
  hooks/          # React hooks (socket, game actions, `useGameStateFx`, `useMyTurnSound`, `useRoundAdvanceOverlay`)
  lib/            # Socket.IO client singleton
```

## Setup

```bash
yarn install
yarn dev
```

Dependencies are managed with **Yarn** (`yarn.lock`). Open `http://localhost:3000` in your browser.

**Dev quick lobby (optional, local testing):** run `yarn dev:lobby` (or `chmod +x scripts/dev-lobby.sh && ./scripts/dev-lobby.sh`) instead of `yarn dev`. That sets `BRASS_DEV_LOBBY=1` and `NEXT_PUBLIC_BRASS_DEV_LOBBY=1`. The home page shows **Quick join dev room** — no room code; the first connection creates a shared waiting room (default code `DEVLO`), later tabs join it. Host starts the game as usual. The server rejects `room:devJoin` unless `BRASS_DEV_LOBBY=1` and `NODE_ENV` is not `production`. Override the code with `BRASS_DEV_ROOM_CODE` (five alphanumeric characters after normalization). For `yarn dev:ngrok`, export the same variables before starting if you need the dev UI over the tunnel.

**Ngrok (optional):** run `npx ngrok config add-authtoken YOUR_TOKEN` once (token from [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)), or set `NGROK_AUTHTOKEN` in `.env.local` (gitignored). Then `yarn dev:ngrok` or `yarn start:ngrok`. Do not commit secrets.

**Hand cards:** each card can show the **next tile on your mat** cost line (`Hand.js`): **£, coal, and iron** for build context (beer on tile defs is for **sell**/flip, not build, so it is omitted unless **Sell** is selected). Location / wild location cards show the same once **Build** is active and an industry is chosen in the action panel (`buildIndustry` in `gameStore`). Choosing a **location** (town/city) card while **Build** + location targeting is active sets that location as the map target and pans the SVG view to center it (`setLocationTarget` in `gameStore.js`, effect in `Board.js`). **Cross-highlights:** sky ring on hand cards that match the current build industry / map location / develop mat picks / sell tile industries; rose ring + “With scout” on the two auto-discarded companions when a scout card is chosen (`Hand.js`). **Action panel** uses a sky ring on build / develop / sell controls that match the selected industry card (`ActionPanel.js`). **Board** narrows buildable cities from `buildIndustry` when no card is selected yet, or with wild cards (`buildValidLocationSet` + `buildIndustry` in `Board.js`). Develop / sell working state lives in `gameStore` (`developIndustries`, `sellTiles`) so the hand can read it.

## How to Play

1. Create or join a game room
2. Wait for 2-4 players
3. Host starts the game
4. Each turn: select a card, choose an action, pick targets, confirm
5. Play through Canal Era and Rail Era
6. Player with most VP wins

## Game Actions

- **Build** - Place an industry tile on the board. The server picks the first empty slot that allows that industry, but **single-industry slots are filled before mixed slots** (e.g. coal-only before coal/manufacturer); see `validateBuild` in `src/game/engine/actions/build.js`.
- **Network** - Place canal/rail links between locations. After you have any industry or link on the board, new links must **touch a valid hub**: your industries plus endpoints of **your** links, except a city where **only** an opponent has industry (shared junction — you cannot branch further from that endpoint). With **no** tiles and **no** links yet, only the **first** segment of an action may be placed freely; double-rail’s second segment must still chain from hubs gained after the first (`getLinkHubNetwork` / `validateNewLinksTouchPlayerNetwork` in `pathfinding.js`, used from `network.js`).
- **Develop** - Remove tiles from your player mat to access higher levels
- **Sell** - Flip cotton/manufacturer/pottery tiles at a merchant that demands that good, with a **built link path** from the tile’s city to that merchant (`areConnected` in `validateSell`). The client picks the alphabetically first such merchant via `pickMerchantLocationForSell` in `merchantSell.js` (the old UI picked any demanding merchant and often failed validation). All **six** non-empty demand strips from the fixed deck are always in play (see `merchants.js`). **Coal** from a newly built coal mine goes to the coal demand track only if your industry is **linked to any in-play merchant** and the track has empty slots; otherwise cubes **stay on the tile**. **Iron** from a new iron works sells into the iron market whenever there is space (no merchant link required).
- **Loan** - Take £30, reduce income by 3 levels
- **Scout** - Discard 3 cards, gain 1 wild location + 1 wild industry card
- **Pass** - Skip the action (still discards a card)

## Game Data

All game data (locations, connections, industry tiles, cards, markets, merchants) is defined in `src/game/data/`. The game engine in `src/game/engine/` operates purely on this data with no side effects.

`board-location-positions.js` holds SVG `x`/`y` coordinates for each location on the client board map; ids must match `locations.js`. Merchant demand is drawn as orbit icons: single-industry discs or a triple C/M/P pie; **one gold beer dot sits under each strip’s icon** (filled while that strip still has merchant beer, hollow after use), matching one beer per strip (`Board.js` `renderMerchantDemandBadges`).

The second farm brewery (`farmBrewery2`) is not separate buildable links to Kidderminster/Worcester: it is on the `kidderminster-worcester` trunk (`TRUNK_ATTACHED_FARM` in `board-connections.js`). Pathfinding and player network treat the farm as reachable only when that trunk link exists; the map draws a T-stem from the trunk midpoint to the farm node.

`merchants.js` defines a **fixed deck of nine** cards (2× manufacturer-only, 1× pottery, 2× cotton, 1× all three, 3× empty). Only the **six non-empty** cards are used: they are shuffled and **all six** are placed on the active merchant cities (Shrewsbury → Gloucester → Oxford → Warrington → Nottingham at 4 players). With fewer than six merchants, some cities hold **two demand strips** so every strip is always on the board; the three empty cards are never placed. **Shrewsbury** never has more than **one** strip; if the triple card is assigned there, one industry is chosen at random. **Merchant beer:** one barrel per strip; the **all-three** card is one strip (one barrel). Beer refills per strip at the start of the rail era. Buying coal from the market still requires a link to any in-play merchant city.
