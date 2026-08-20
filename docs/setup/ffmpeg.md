# Setup: ffmpeg

`md2media` uses `ffmpeg` to **concatenate** all the per-line audio clips into the final output file. It must be available in your `PATH` as the `ffmpeg` command.

## Linux (Debian / Ubuntu)

```bash
sudo apt update
sudo apt install ffmpeg
```

## Linux (Fedora / RHEL)

```bash
sudo dnf install ffmpeg
```

## macOS

```bash
brew install ffmpeg
```

## Windows

- Download from https://ffmpeg.org/download.html or install via a package manager (e.g. `choco install ffmpeg` or `winget install ffmpeg`).
- Make sure the `ffmpeg.exe` directory is added to your `PATH`.

## Verify

```bash
ffmpeg -version
```

If it prints version info, ffmpeg is ready. `md2media` will call it automatically when joining audio. If ffmpeg is missing, the tool still generates the per-line clips in the cache directory, but the final joined file will not be produced.