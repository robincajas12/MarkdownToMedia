# Setup: Node.js + project installation

`md2media` is a Node.js CLI. You need **Node.js 18 or newer** (the project targets ES2023/NodeNext) plus `npm`.

## 1. Install Node.js

- **Recommended:** install via [nvm](https://github.com/nvm-sh/nvm):

  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  nvm install node
  node -v   # should print v18 or higher
  ```

- Or download the installer from https://nodejs.org

## 2. Install the project dependencies

From the project root:

```bash
npm install
```

## 3. Build the CLI

```bash
npm run build       # compiles TypeScript into dist/
npm run build-cli   # bundles the CLI entrypoint (dist/transformer/cli.js)
```

## 4. Make `md2media` available on your PATH

```bash
npm link
```

This creates the `md2media` command globally. Verify:

```bash
md2media --help
md2media audio --help
md2media video --help
```

## 5. What's next

- [Setting up the `.env` file](env.md)
- [Setting up VOICEVOX](voicevox.md)
- [Setting up Loquendo](loquendo.md)
- [Setting up ffmpeg](ffmpeg.md)