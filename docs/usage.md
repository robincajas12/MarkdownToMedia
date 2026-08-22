# md2media (markdown-to-media) — Usage Guide

`md2media` turns a Markdown **script** (a dialogue between named characters) into a single **audio file** (WAV). Each line spoken by a character is converted to speech using a TTS service, and all the resulting clips are concatenated into one final track.



---

## 1. Requirements / dependencies

| Dependency | Needed for | Notes |
|------------|-----------|-------|
| **Node.js** (v18+) | Running the CLI | The project targets ES2023 / NodeNext |
| **ffmpeg** | Joining the per-line clips into the final file | Must be available in `PATH` |
| **wine** | Loquendo (optional) | Only if you use the `loquendo` service |
| **Loquendo TTS** | Loquendo (optional) | `TTSFileGenerator.exe`, e.g. under `.wine/drive_c/...` |
| **VOICEVOX** | Voicevox (optional) | A running instance of the VOICEVOX server (default `http://127.0.0.1:50021`) |

You don't need both TTS engines — configure at least one and point your characters at it.

---

## 2. Installation & build

```bash
npm install
npm run build        # compiles TypeScript into dist/
npm run build-cli    # bundles the CLI entrypoint (dist/transformer/cli.js)
npm link             # exposes `md2media` on your PATH
```

After that, verify it works:

```bash
md2media --help
```

---

## 3. CLI usage

```bash
md2media audio -f <path-to-markdown-file>    # generate audio only
md2media video -f <path-to-markdown-file>    # generate video (requires <image> blocks)
```

- `-f, --file <string>` — path to the Markdown script. Required.

Example:

```bash
md2media audio -f index.md
md2media video -f index.md
```

The command:
1. Reads the Markdown file.
2. Loads any external YAML config files referenced in the front matter (`use:`).
3. Generates one audio clip per dialogue line.
4. Concatenates the clips into the output file.

> Note: environment variables are read from a `.env` file in the **current working directory**, so run the command from the folder that contains your `.env`.

---

## 4. The Markdown script format

A script is a normal Markdown file with **two parts**:

1. A **YAML front matter** block at the top, wrapped in `---` lines.
2. The **dialogue**, written as `@CharacterName: text`.

### 4.1 Front matter

The front matter can hold **everything directly** — `characters`, `output_dir`, `output_file`, etc. — with no extra files:

```yaml
---
output_dir: ./cache
output_file: ./result.wav
characters:
  - name: Narrador
    voice: Jorge
    service: loquendo
---
```

The `use:` key is **optional**: it lists external YAML files to load and merge over the front matter (handy when several scripts share the same characters or settings). You can split the config into one, two or many files freely:

```yaml
---
use:
  - ./config.yml
  - ./characters.config.yml
---
```

| Key | Type | Description |
|-----|------|-------------|
| `use` | `string[]` | Paths to YAML config files to load and merge. See [Config YAML](#5-config-yaml). |
| `output_dir` | `string` | Directory where the per-line WAV clips are stored (default `./cache`). |
| `output_file` | `string` | Path of the final joined WAV (default `./result.wav`). |
| `characters` | `object[]` | List of characters. See [Characters](#52-characters). |
| `replacements` | `object` | Text replacements (see [Replacements](#54-replacements)). |

### 4.2 Dialogue

Each spoken line starts with `@Name:` followed by the text:

```
# Escena 1: Intro
@Narrador: Hola a todos y bienvenidos a un nuevo episodio.
@Carlos: Muy bien, con muchas ganas de hablar.
@Leonor: Claro que si. Y es que la noticia de hoy da para mucho.
```

Rules:

- The character **name must match exactly** a `name` defined in the `characters` config (case-sensitive). If it doesn't, that line is skipped and a warning is logged:
  ```
  character(<name>) not found in yml props, please verify
  ```
- Text after the first `@Name:` line is **appended** to the current character until the next `@Name:`, a blank line, or a heading. This lets you wrap long lines:

  ```
  @Carlos: Primera parte del dialogo.
  Segunda parte que se agrega a la misma linea hablada.
  ```
  Both lines are spoken as a single clip.

- `#` headings and blank lines are ignored (they just separate scenes and flush the current character).
- A `@Name:` with empty text is skipped.

Full example (`index.md`):

````markdown
---
use:
  - ./config.yml
  - ./characters.config.yml
---
# Escena 1: Intro
@Narrador: Hola a todos y bienvenidos a un nuevo episodio de nuestro podcast de tecnologia.
@Carlos: Muy bien, con muchas ganas de hablar.
@Leonor: Claro que si. Y es que la noticia de hoy da para mucho.
# Escena 2: Que ofrece
@Narrador: A ver, Leonor, que tiene de especial esta version?
@Leonor: Pues principalmente mas seguridad y controles parentales.
@Carlos: Eso me parece muy bien.
# Escena 3: Cierre
@Narrador: Chao chao!
````

---

## 5. Config YAML

External config files let you reuse character definitions across scripts. They are listed in the `use:` array of the front matter and **merged over the front matter** (each file in order wins over the previous one, and all of them win over the front matter).

### 5.1 Example config.yml

```yaml
output_dir: ./cache
output_file: ./result.wav

replacements:
  "ñ": "ni"
  "¡": ""
  "á": "a"
  "é": "e"
  "í": "i"
  "ó": "o"
  "ú": "u"
```

### 5.2 Example characters.config.yml

```yaml
characters:
  - name: Narrador
    voice: Jorge
    service: loquendo
  - name: Carlos
    voice: Carlos
    service: loquendo
  - name: Leonor
    voice: Leonor
    service: loquendo
  - name: Zundamon
    voice: 5
    service: voicevox
```

### 5.3 Characters

Each character is an object with:

| Key | Type | Description |
|-----|------|-------------|
| `name` | `string` | The name used in the script (`@name:`). Must match exactly. |
| `service` | `string` | `"loquendo"` or `"voicevox"`. Determines which TTS engine generates this character's voice. |
| `voice` | `string` | The voice to use — see per-service docs below. |

### 5.4 Replacements

The `replacements` key lets you do simple text substitutions before TTS generation. Each key is replaced with its value in all dialogue lines.

Example:

```yaml
replacements:
  "ñ": "ni"
  "¡": ""
  "á": "a"
  "é": "e"
  "í": "i"
  "ó": "o"
  "ú": "u"
```

> Note: replacements are simple string replacements, not regex patterns. Special regex characters (like `.`, `(`, `+`) are treated as literal strings.

---

## 6. Environment variables (`.env`)

The tool reads these from a `.env` file in the working directory (loaded with `dotenv`):

| Variable | Used for | Default |
|----------|----------|---------|
| `LOQUENDO_PATH` | Absolute path to `TTSFileGenerator.exe` | `""` (empty) |
| `OS` | `"LINUX"` is currently the only supported value; triggers `wine` | `"LINUX"` |
| `VOICEVOX_URL` | Base URL of a running VOICEVOX server | `http://127.0.0.1:50021` |

Example `.env`:

```bash
LOQUENDO_PATH=/home/<user>/.wine/drive_c/Program Files (x86)/Loquendo/LTTS7/bin/TTSFileGenerator.exe
OS=LINUX
VOICEVOX_URL=http://127.0.0.1:50021
```

---

## 7. TTS services

### 7.1 Loquendo (`service: loquendo`)

- Runs `TTSFileGenerator.exe` through **wine** on Linux.
- `voice` is the Loquendo voice name, e.g. `Jorge`, `Carlos`, `Leonor`.
- Requires `LOQUENDO_PATH` and `OS=LINUX` in your `.env`.
- Generated files use the `.wav001.wav` naming convention that the Loquendo generator produces.

Setup on Linux:
1. Install Loquendo TTS + wine.
2. Confirm the `.exe` path:
   ```
   /home/<user>/.wine/drive_c/Program Files (x86)/Loquendo/LTTS7/bin/TTSFileGenerator.exe
   ```
3. Set `LOQUENDO_PATH` to that path in your `.env`.

### 7.2 VOICEVOX (`service: voicevox`)

- Talks to a local VOICEVOX HTTP server (`/speakers`, `/audio_query`, `/synthesis`).
- `voice` can be:
  - a **numeric speaker/style id** (e.g. `5`), or
  - a **name** matching `Speaker (Style)` or `Speaker Style`, or just `Speaker`.
- Requires a running VOICEVOX instance. By default it expects `http://127.0.0.1:50021` (override with `VOICEVOX_URL`).

Setup:
```bash
# run VOICEVOX (its engine server listens on 127.0.0.1:50021)
./run.exe   # or your platform's binary
```
Then verify with `curl http://127.0.0.1:50021/speakers`.

---

## 8. How it works (pipeline)

For `md2media audio -f index.md`:

1. **Parse** — the Markdown file is split into YAML front matter (`parseMetadata`) and dialogue lines (`extractDialogue`).
2. **Load config** — every file listed in `use:` is read, YAML-parsed, and merged over the front matter.
3. **Prepare output** — `output_dir` (default `./cache`) is created.
4. **Generate voices** — for each dialogue line the matching character is looked up, then dispatched through a **handler chain**:
   - `LoquendoHandler` handles `service: loquendo`
   - `VoicevoxHandler` handles `service: voicevox`
   - Unknown services fall through and produce nothing.
5. **Cache check** — before generating, the tool computes an MD5 hash of `service:voice:text`. If the file already exists, the cached clip is reused (no regeneration).
6. **Join** — `ffmpeg` concatenates all clips in script order into `output_file` (default `./result.wav`).

### Caching

- Cache key: `md5("<service>:<voice>:<text>")`.
- Loquendo clips are stored as `<hash>.wav001.wav`; VOICEVOX clips as `<hash>.wav`.
- Rerunning the same script is fast because already-generated lines are skipped.

---

## 9. Step-by-step example

Given the folder from the examples:

```bash
ls
# characters.config.yml  config.yml  .env  index.md
```

1. Make sure your `.env` points at your TTS engines.
2. Make sure `ffmpeg` is installed (`ffmpeg -version`).
3. Run:

```bash
md2media audio -f index.md
```

Expected output:

```
Reading: /home/<user>/Downloads/example/index.md
/home/<user>/Downloads/example/config.yml
/home/<user>/Downloads/example/characters.config.yml
[Voicevox] Generando audio -> SpeakerId: ...
[Voicevox] Archivo de audio guardado en: ./cache/<hash>.wav
... (one line per character)
./guion_7w7.wav
```

Result:
- `./cache/` contains the per-line WAV clips.
- The final joined audio is written to `output_file` (e.g. `./guion_7w7.wav`).

---

## 10. Troubleshooting

| Problem | Likely cause / fix |
|---------|--------------------|
| `Error: make sure the file exists` | The path passed to `-f` doesn't exist. |
| `character(<name>) not found in yml props, please verify` | The `@name:` in your script doesn't match any `characters[].name` exactly. |
| Loquendo errors on Linux | Set `OS=LINUX`, `LOQUENDO_PATH`, and ensure `wine` + Loquendo are installed. |
| VOICEVOX errors / empty output | VOICEVOX server isn't running — start it and check `VOICEVOX_URL`. |
| No final `.wav` produced | Make sure `output_dir` is set in config and `ffmpeg` is in `PATH`. |
| Audio clips reused when text changed | The cache key is `service:voice:text`. Changing the text (or voice/service) creates a new file; deleting `cache/` forces regeneration. |
| `replacements` have no effect | Make sure the key names match exactly (case-sensitive). Replacements are simple string replacements, not regex.
