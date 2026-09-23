# aa
A remake of the game 'aa' from scratch

Open `index.html` in a browser. No build step, no server, no dependencies.

## How to play
Shoot every circle in your stack onto the rotating web. A circle that lands on a blank circle, or on one you already placed, fails the level. Clear the stack and the next level loads.

## Controls
| Key / touch | Action |
| --- | --- |
| `Space`, click, or tap | Shoot the next circle |
| `R` | Restart the current level |
| `L`, or tap the `levels` word in the corner | Open the level select |
| Arrow keys + `Enter`, or tap a level | Pick a level (levels unlock as you reach them) |
| `Esc` or `L` | Close the level select |

## Features
- 32 levels (0–31). Later levels change speed mid-level, reverse direction, run on a timer, breathe in and out, stop and lurch, burst-fire, speed up with every landing, and pick speeds at random.
- Progress and best level are saved in `localStorage` (when the browser allows it), so the game resumes where you left off.
- Level select screen with locked/unlocked levels.
- A ripple, a pop, and a hub pulse when a circle lands; a shake and flash on failure.
- The canvas scales to fit any window or phone screen, keeps its 3:4 aspect ratio, and renders at the device pixel ratio so lines stay crisp.

## Making levels
See the comment at the top of `scripts/levels.js` for the level API (`web.numBlanks`, `web.rspeed`, `web.reversed`, `web.failTimer`, `web.hideCount`, `addCircles(n)`, `internalUpdate`, `toggle`). Set `startLevel` there to jump straight to a level while testing.
