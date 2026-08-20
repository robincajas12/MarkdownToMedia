# Setup: Loquendo

[Loquendo TTS](https://en.wikipedia.org/wiki/Loquendo) is a legacy (discontinued) text-to-speech product. On Linux, `md2media` drives it through **wine** using the command-line tool `TTSFileGenerator.exe`. It is well known for its natural **Spanish** voices (e.g. Jorge, Carlos, Leonor).

> Note: Loquendo is abandoned software. Installers and voice packs are no longer sold by Nuance; they are typically obtained from archived copies. Use at your own risk.

## 1. Install wine

```bash
# Debian / Ubuntu
sudo apt install wine

# Fedora
sudo dnf install wine
```

## 2. Install Loquendo TTS 7 under wine

1. Run the Loquendo installer with wine:
   ```bash
   wine loquendo_tts_setup.exe
   ```
2. Follow the installer. The default install path is:
   ```
   ~/.wine/drive_c/Program Files (x86)/Loquendo/LTTS7/
   ```
3. Install the **voice packs** you want (e.g. the Spanish voices `Jorge`, `Carlos`, `Leonor`). Voices are separate installers (`loquendo_voice_jorge.exe`, etc.).
4. Make sure `TTSFileGenerator.exe` exists:
   ```bash
   ls ~/.wine/drive_c/Program\ Files\ \(x86\)/Loquendo/LTTS7/bin/TTSFileGenerator.exe
   ```

## 3. Test the generator manually

```bash
wine "$HOME/.wine/drive_c/Program Files (x86)/Loquendo/LTTS7/bin/TTSFileGenerator.exe" \
  -v Jorge -o /tmp/test.wav -e wav <<< "Hola mundo"
ls /tmp/test.wav*
# expected: /tmp/test.wav001.wav
```

The tool appends a progressive counter + extension to the `-o` prefix, producing files like `test.wav001.wav`. This is why `md2media` looks for `.wav001.wav` files.

## 4. Configure `.env`

```bash
LOQUENDO_PATH=/home/<user>/.wine/drive_c/Program Files (x86)/Loquendo/LTTS7/bin/TTSFileGenerator.exe
OS=LINUX
```

## 5. Use it in your script

```yaml
characters:
  - name: Narrador
    voice: Jorge      # Loquendo speaker name, must be installed
    service: loquendo
```

`voice` must be the exact name of an installed Loquendo speaker (e.g. `Jorge`, `Carlos`, `Leonor`).

## Troubleshooting

- `wine` errors about missing audio libs — install wine's audio dependencies for your distro (e.g. `winealsa`/`winepulse`).
- "Speaker not found" — the voice pack for that speaker isn't installed; install it or use an installed one.

## Related

- [Setting up the `.env` file](env.md)
- [Setting up VOICEVOX](voicevox.md)