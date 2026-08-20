# Setup: the `.env` file

`md2media` reads environment variables from a `.env` file located in the **current working directory** (i.e. where you run `md2media render`). The file is loaded automatically via `dotenv`.

## Minimal `.env`

```bash
LOQUENDO_PATH=/home/<user>/.wine/drive_c/Program Files (x86)/Loquendo/LTTS7/bin/TTSFileGenerator.exe
OS=LINUX
VOICEVOX_URL=http://127.0.0.1:50021
```

## Variables

| Variable | Used for | Default |
|----------|----------|---------|
| `LOQUENDO_PATH` | Absolute path to Loquendo's `TTSFileGenerator.exe` | empty |
| `OS` | `"LINUX"` is the only supported value — tells the tool to run Loquendo through `wine` | `"LINUX"` |
| `VOICEVOX_URL` | Base URL of a running VOICEVOX server | `http://127.0.0.1:50021` |

Only set the variables for the TTS engines you actually use:
- Using **Loquendo**? You need `LOQUENDO_PATH` and `OS`.
- Using **VOICEVOX**? You need `VOICEVOX_URL` (default is fine unless your server runs elsewhere).

## Steps

1. Copy the template:

   ```bash
   cp examples/.env.example .env
   ```

2. Edit `.env` and fill in your real paths.

3. Run `md2media` from the folder that contains `.env`:

   ```bash
   md2media render -f index.md
   ```

## Security

- The `.env` file contains local paths and possibly credentials. It is **gitignored** (`.env` and `.env.*`), so never commit it.
- The `examples/.env.example` is a safe template with no secrets.

## Related

- [Setting up VOICEVOX](voicevox.md)
- [Setting up Loquendo](loquendo.md)