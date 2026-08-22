<div align="center">

# md2media

> Turn Markdown scripts into spoken audio or video — a dialogue-to-podcast and video generator.

**Write your podcast or video as a Markdown dialogue. Let TTS voices act it out. Get audio or video files.**

[Demo](#demo) • [Examples](#examples) • [Syntax](#syntax) • [Usage](#usage) • [Install](#install) • [Docs](#docs)

</div>

---

## Demo

The first line of [`examples/index.md`](examples/index.md), voiced by the Loquendo voice **Jorge**:

```markdown
# En el bar
@Narrador: ¿Y al final qué, fuisteis a la playa el domingo?
```

<audio controls src="examples/sample.wav">
  Your browser does not support the audio element.
  <a href="examples/sample.wav">Download the sample</a>.
</audio>

---

## Examples

Each example shows the script and the audio it generates.

### Conversation — Loquendo voices

Three friends, three voices (`Jorge`, `Carlos`, `Leonor`):

```markdown
---
use:
  - ./config.yml
  - ./characters.config.yml
---
# En el bar
@Narrador: ¿Y al final qué, fuisteis a la playa el domingo?
@Carlos: Ni de broma. Mira cómo está el cielo.
@Leonor: Yo os lo dije, mejor ver la peli en casa.
```

<audio controls src="examples/sample_podcast.wav">
  Your browser does not support the audio element.
  <a href="examples/sample_podcast.wav">Download the sample</a>.
</audio>

### Conversation with a Japanese friend — Loquendo + VOICEVOX

Just another chat between friends. Each character's `service` field routes its lines to the right engine:

```markdown
# En el bar
@Narrador: ¿Habéis visto la peli nueva del cine de abajo?
@Carlos: Sí, la vi ayer. Me gustó más de lo que esperaba.
@Zundamon: 私も見たよ！すごく面白かった！
```

<audio controls src="examples/sample_mix.wav">
  Your browser does not support the audio element.
  <a href="examples/sample_mix.wav">Download the sample</a>.
</audio>

### Video — Image + Audio

Create a video from images and narration. Each `<image>` block defines a segment with a background image and dialogue:

```markdown
---
use:
  - ./config.yml
---
<image source="./cat1.jpg">
  @Narrador: Los gatos duermen entre 12 y 16 horas al día.
</image>
<image source="./cat2.jpg">
  @Narrador: Pueden rotar sus orejas 180 grados.
</image>
```

---

## Syntax

A script is a Markdown file with a YAML **front matter** block and the **dialogue**.

**Everything in the front matter** — no extra files needed:

```markdown
---
output_dir: ./cache
output_file: ./guion.wav
characters:
  - name: Narrador
    voice: Jorge       # Loquendo speaker name
    service: loquendo
---

# En el bar
@Narrador: ¿Y al final qué, fuisteis a la playa el domingo?
@Carlos: Ni de broma. Mira cómo está el cielo.
@Leonor: Yo os lo dije, mejor ver la peli en casa.
```

**Or split it into files with `use:`** — optional, and handy when several scripts share the same voices or settings. Files listed in `use:` are merged over the front matter (later files win). There is no rule about how to split them: one file, several files, or just the front matter all work.

```markdown
---
use:
  - ./config.yml
---

# En el bar
@Narrador: ¿Y al final qué, fuisteis a la playa el domingo?
```

The `use` file can hold any of the same keys:

```yaml
output_dir: ./cache
output_file: ./guion.wav
characters:
  - name: Narrador
    voice: Jorge       # Loquendo speaker name
    service: loquendo
  - name: Zundamon
    voice: 5           # VOICEVOX speaker/style id, or a name
    service: voicevox
```

(The examples repo splits them into `config.yml` + `characters.config.yml` just for clarity — it's not required.)

**Dialogue rules**

- Every spoken line starts with `@Name:` — the name must **exactly match** a character in your config.
- Following lines without a new `@Name:` get appended to the current line (handy for long paragraphs).
- `#` headings and blank lines are ignored — use them to organize scenes.

---

## Usage

Create a new project (`.env.template`, `config.yml`, `index.md`):

```bash
md2media init
```

Then render a script:

```bash
md2media audio -f <script.md>    # generate audio only
md2media video -f <script.md>    # generate video (requires <image> blocks)
```

Example:

```bash
cp examples/.env.example .env   # then edit .env with your real paths
md2media audio -f examples/index.md
```

The output is written to `output_file` set in your config (default `./result.wav` for audio, `./result.mp4` for video), with per-line clips in `output_dir` (default `./cache`).

Per-line clips are cached by an MD5 of `service:voice:text`, so rerunning a script reuses the audio instead of re-synthesizing. Delete `cache/` to force regeneration.

---

## Install

Requirements: **Node.js 18+**, **ffmpeg**, and at least one TTS engine (see [setup guides](#docs)).

```bash
npm install
npm run build
npm run build-cli
npm link            # makes `md2media` available on your PATH
```

Verify it works:

```bash
md2media --help
```

---

## Docs

| Doc | Description |
|-----|-------------|
| [`docs/usage.md`](docs/usage.md) | Full usage guide: syntax, config, caching, troubleshooting |
| [`docs/setup/node.md`](docs/setup/node.md) | Install Node.js + the project |
| [`docs/setup/ffmpeg.md`](docs/setup/ffmpeg.md) | Install ffmpeg |
| [`docs/setup/env.md`](docs/setup/env.md) | Set up the `.env` file |
| [`docs/setup/voicevox.md`](docs/setup/voicevox.md) | Set up VOICEVOX |
| [`docs/setup/loquendo.md`](docs/setup/loquendo.md) | Set up Loquendo |
| [`docs/manual.md`](docs/manual.md) | Dependency overview |

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

Run the test suite with:

```bash
npm test
```

---

## License

[ISC](LICENSE)