# Setup: VOICEVOX

[VOICEVOX](https://voicevox.hiroshiba.jp/) is a free, open-source Japanese text-to-speech engine that runs **locally** and exposes an HTTP API. `md2media` uses its `/speakers`, `/audio_query` and `/synthesis` endpoints.

## 1. Install VOICEVOX

**Option A — VOICEVOX Editor (easiest)**

Download the app for your OS from https://voicevox.hiroshiba.jp/ and run it. The Editor bundles the engine and starts it automatically.

**Option B — VOICEVOX Engine (standalone)**

- Download the latest engine release from https://github.com/VOICEVOX/voicevox_engine/releases/latest
- Run it (it listens on port `50021` by default).
- Or use Docker:

  ```bash
  docker pull voicevox/voicevox_engine:cpu-latest
  docker run --rm -p '127.0.0.1:50021:50021' voicevox/voicevox_engine:cpu-latest
  ```

## 2. Verify the server is running

```bash
curl http://127.0.0.1:50021/speakers
```

A JSON array of speakers means it's working. The interactive API docs live at `http://127.0.0.1:50021/docs`.

## 3. Configure `.env`

Add the URL to your `.env` (or rely on the default):

```bash
VOICEVOX_URL=http://127.0.0.1:50021
```

## 4. Find a voice id

List the available speakers and their style ids:

```bash
curl -s http://127.0.0.1:50021/speakers | python3 -m json.tool
```

VOICEVOX voices are Japanese; the classic character **Zundamon** (`id 5`) is a common choice.

## 5. Use it in your script

```yaml
characters:
  - name: Zundamon
    voice: 5        # numeric speaker/style id
    service: voicevox
```

`voice` accepts:
- a **numeric id** (e.g. `5`), or
- a **name** matching `Speaker (Style)`, `Speaker Style`, or just `Speaker`.

## Related

- [Setting up the `.env` file](env.md)
- [Setting up Loquendo](loquendo.md)