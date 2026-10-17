# Zungga Story Studio

Turn a story idea into a 3D animated, voiced, vertical video for Zungga — all on one Mac, with open-source AI and no cloud services.

**Idea → Story → Build → Studio → Generate**

1. **Idea** — type what the story is about. A local story AI (Qwen 2.5, via MLX) writes the scenes.
2. **Story** — accept it, redo it, redo one scene, edit, add, delete, reorder (drag), or lock scenes you like.
3. **Build** — everything is staged automatically from the asset library: who stands where, actions and expressions on the right words, props, camera shots, money counters, rain for sad moments, and the end card. If something isn't in the library, you choose: build it (request), use a substitute, or skip. Then the voice is made (cloned voices, Qwen3-TTS) and every word is timed (Whisper).
4. **Studio** — change anything: camera (free view, set start / set end), characters (position, facing, actions, expressions, walk paths, outfits and colours), props, lighting & look, text, sound, effects. There's a timeline (scenes, words, camera, actions, expressions, voice, sound FX, music, text), undo/redo, autosave, version history, and keyboard shortcuts. Everything starts on **Auto**; anything you change becomes **Manual**, with **Reset to auto** always available.
5. **Generate** — render a frame-exact MP4 in any size (1080×1920, 720×1280, 1920×1080, 1080×1080 or custom) at 24/30/60 fps, as a draft or final, for all scenes or a range. Videos are kept in a gallery.

---

## Set up on a new Mac

You need an **Apple Silicon Mac** (M1 or newer; 16 GB+ memory recommended, 24 GB is comfortable), macOS 14+, about **12 GB free disk**, and internet for the first setup.

```bash
git clone https://github.com/Zungga/zungga-story-studio.git
cd zungga-story-studio
./setup.sh          # installs everything + downloads the AI models (~9 GB). Safe to re-run; downloads resume.
./start.sh          # opens http://localhost:8790/studio/app.html
```

`setup.sh` does all of this for you:

| Step | What | Where it goes |
|---|---|---|
| Tools | Homebrew (if missing), Node 20+, Python 3.11–3.14, ffmpeg | Homebrew |
| Python env | `.venv` with pinned libraries from `requirements.txt` (mlx, mlx-audio 0.5.8, mlx-lm, transformers…) | `./.venv` |
| Node | Playwright + headless Chromium (used to render videos) | `./node_modules`, `~/Library/Caches/ms-playwright` |
| AI models | Story AI `Qwen2.5-7B-Instruct-4bit` (~4 GB) · voice `Qwen3-TTS-12Hz-1.7B-Base-8bit` (~2.5 GB) · Whisper `base.en` | `~/.cache/huggingface` |
| Voices | checks each `selected-voices/<name>/reference.wav` | see **Voices** below |

Then run `./doctor.sh` — it checks everything and prints the fix for anything missing. (The same check is in the studio under **Settings → Health check**.)

### Voices (one manual step)

The voice recordings (`selected-voices/<name>/reference.wav`) are **not in git** — they are people's voices and stay private. On a new Mac, copy them from your private backup (cloud drive / USB) into the same folders:

```
selected-voices/boy-calm/reference.wav
selected-voices/boy-deep/reference.wav
selected-voices/girl/reference.wav
selected-voices/narrator/reference.wav
```

Without them everything still works except making *new* voice lines. You can also add a new voice in **Library → Voices → Add a voice** (10–20 s of clear speech; only with the speaker's permission).

> ⚠ The **narrator** voice was cloned from a downloaded clip. Publishing videos with it needs the speaker's permission.

---

## Everyday use

```bash
./start.sh                 # start the studio (keep the terminal open; Ctrl+C stops it)
PORT=9000 ./start.sh       # on another port
./doctor.sh                # health check
```

- Projects live in `projects/<name>/` (story, voice clips, videos, version history). They are **not** in git — back that folder up.
- Finished videos: `projects/<name>/exports/*.mp4` (or **Generate → Open the exports folder**).
- Deleted projects go to `projects/_trash/`.
- Settings (models, defaults, brand rules) are saved in `settings.local.json` (not in git).

### Background music

**Studio → Sound → Find free music** searches free music online (Openverse: Jamendo, Freesound, Wikimedia — no account needed). Only licences that allow commercial videos and cutting the music are shown: CC0, public domain and CC BY. Listen, press **Use**, then drag the purple window over the waveform to choose **which part** plays — its length always matches the story, so you only pick the start (or drag the Music bar on the timeline). Fade in/out and volume are adjustable.

Downloaded tracks are kept in `studio/assets/music/` (not in git) with a `.json` credit next to each. CC BY music needs a credit line: it's shown in Generate and saved as `<video>.credits.txt` next to every video — paste it into the post description.

### Studio shortcuts

| Key | Does |
|---|---|
| Space | Play / pause |
| ← / → | One frame back / forward (⇧ = one second) |
| ↑ / ↓ | Previous / next scene |
| ⌘Z / ⇧⌘Z | Undo / redo |
| Delete | Delete the selected timeline clip |
| S | Split the camera shot at the playhead |
| F | Free view (drag to orbit, scroll to zoom, ⇧-drag to pan) |
| M | Move tool (drag the selected character / prop on the floor) |
| G / L | Thirds grid / loop the scene |
| ? | All shortcuts |

### Brand rules the studio follows

Narration subtitles at the bottom; counters and captions small at the top; no top-down camera; close-ups on objects and money exactly when they're said; quiet rain + thunder for sad outdoor scenes; Zungga logo end card; no school uniforms; in the cartoon world the box kid is the main character, the yellow cat helps with physical things and the flying planet with ideas.

---

## Command-line tools (the studio uses these too)

```bash
node tools/render_video.mjs pocket-money                       # stories/pocket-money → exports/pocket-money.mp4
node tools/render_video.mjs x --dir projects/my-story --w 1080 --h 1080 --fps 30 --quality draft --from 2 --to 4
.venv/bin/python tools/make_voice.py stories/pocket-money        # voice clips (3 takes each, best kept) + word timing
.venv/bin/python tools/make_voice.py stories/pocket-money --force 3   # remake scene 3
.venv/bin/python tools/align_words.py stories/pocket-money       # word timing only
.venv/bin/python tools/make_sfx.py                               # re-bake rain / thunder sounds
echo '{"prompt":"…","scenes":6}' | .venv/bin/python tools/story_ai.py   # story AI on its own
```

## How it's built

```
studio/app.html, studio/app/      the studio app (plain JS modules, no build step)
studio/js/story-engine.js         the 3D engine: plays a story.json (Three.js), word-timed, deterministic
studio/js/stage.js                auto-staging + checker: plain draft → full story.json (no AI needed)
studio/js/camera-moves.js         camera moves (push in, pull back, pan, orbit, hold, low angle, dolly)
studio/characters/                people (person.js) and the cartoon cast (toons.js)
studio/assets/                    props and sets, all drawn in code (+ catalog.json), sounds, brand
tools/server.mjs                  local app server: projects, jobs queue, live progress, health
tools/story_ai.py                 story AI (mlx-lm)        tools/make_voice.py  voice (Qwen3-TTS)
tools/align_words.py              word timing (Whisper)    tools/render_video.mjs  MP4 (headless Chrome + ffmpeg)
stories/                          finished stories (open a copy from Home → Templates)
selected-voices/                  saved voices (voice.json in git, reference.wav private)
```

The older viewers still work: `studio/player.html?story=pocket-money`, `studio/toons.html`, `studio/people.html`, `studio/particles.html`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `./setup.sh` stops while downloading a model | Run it again — downloads resume. Slow network? `./setup.sh --no-models` and let models download on first use. |
| "Studio server is not running" banner | Start it: `./start.sh` (keep that terminal open). |
| Port already in use | `PORT=9000 ./start.sh`, or stop the other one: `lsof -iTCP:8790 -sTCP:LISTEN`, then `kill <pid>`. |
| Voice job fails with "reference.wav" | Copy that voice's recording (see **Voices**). |
| Voice job fails with an MLX / import error | `.venv/bin/pip install -r requirements.txt` (or delete `.venv` and run `./setup.sh`). |
| Story AI is slow or runs out of memory | Settings → Story writer → the 7B model (default). Close other big apps. The 14B model needs ~16 GB free. |
| Render fails: "Executable doesn't exist" | `npx playwright install chromium` |
| Render fails: ffmpeg not found | `brew install ffmpeg` |
| Preview is choppy | Studio → quality → "Half quality (smooth)" or "Fast preview". The final render is always full quality. |
| Words on the timeline look "estimated" | The voice isn't made yet (or the line changed) — Build → Make the voice, or Sound → Remake this voice line. |
| Something looks wrong after editing | ⌘Z, or the timeline's clock icon → Version history → Restore. |
| Anything else | `./doctor.sh`, then check the terminal where `./start.sh` runs. |

### Other computers

Voice and story AI use Apple's MLX, so they need an Apple Silicon Mac. On Intel Macs, Windows or Linux, the studio, editor and video renders work (`npm install`, `npx playwright install chromium`, `node tools/server.mjs`), but making new voice lines and stories doesn't — those would need a different engine (e.g. PyTorch builds of the same models). Not supported yet.

---

> No API keys are needed. If a cloud voice (e.g. ElevenLabs) is ever added, its key is never stored in this repository or in page code.
