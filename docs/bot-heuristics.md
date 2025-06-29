# Bot Heuristics

The current bots mostly make random moves. Here are some simple strategies that could improve play quality:

## Checkers
- Prioritize capturing moves whenever available.
- Avoid leaving pieces vulnerable to immediate capture.
- King pieces should move toward opponent pieces to maintain pressure.

## Battleship
- After a hit, target surrounding cells to sink the ship.
- Track previous misses to avoid firing at the same location twice.
- Prefer shots that maximize coverage of remaining spaces.

## Connect Four
- First look for winning drops for yourself, then block your opponent's winning moves.
- Favor center columns to create multiple connection opportunities.
- When forced to choose randomly, pick columns that keep options open rather than the edges.
