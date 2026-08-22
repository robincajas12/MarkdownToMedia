# md2media — Manual

## Dependencies

| Dependency | Required for | Notes |
|------------|-------------|-------|
| **Node.js** (v18+) | Running the CLI | |
| **ffmpeg** | Joining audio/video clips | Must be in `PATH` |
| **wine** | Loquendo TTS (optional) | Linux only |
| **Loquendo TTS** | Loquendo voices (optional) | `TTSFileGenerator.exe` |
| **VOICEVOX** | Voicevox voices (optional) | Running server instance |

You only need one TTS engine (Loquendo or VOICEVOX), not both.

## CLI Commands

```bash
md2media init                    # Create new project files
md2media init --force            # Overwrite existing files
md2media audio -f <file.md>      # Generate audio from markdown
md2media video -f <file.md>      # Generate video from markdown
```

## Quick Start

```bash
npm install
npm run build
npm run build-cli
npm link

md2media init                    # Creates index.md, config.yml, .env.template
# Edit .env with your TTS paths
md2media audio -f index.md       # Generate audio
```

## See also

- [Usage guide](usage.md)
- [Setup: Node.js](setup/node.md)
- [Setup: ffmpeg](setup/ffmpeg.md)
- [Setup: .env](setup/env.md)
- [Setup: VOICEVOX](setup/voicevox.md)
- [Setup: Loquendo](setup/loquendo.md)
