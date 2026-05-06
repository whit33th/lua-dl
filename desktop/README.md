# lua-dl Desktop

Electron + Next.js shell for the existing Go CLI. The Go source is not modified; Electron launches `lua-dl.exe` through a pseudo-terminal and streams the original output into the UI.

## Commands

Development with hot reload:

```powershell
npm run dev
```

This starts Next.js on `http://localhost:3000` and opens Electron against that dev server. UI and CSS changes hot reload without rebuilding the installer.

```powershell
npm install
npm run build:go
npm run build:next
npm run build:electron
npm start
```

Package for Windows:

```powershell
npm run dist
```

`npm run build:go` writes `resources/bin/lua-dl.exe`. In packaged builds, `electron-builder` copies that file into the app resources under `bin/lua-dl.exe`.

## Runtime Model

- Next.js uses `output: "export"` and produces the `out/` folder.
- Electron production loads `out/index.html` with `BrowserWindow.loadFile`.
- The renderer never gets Node access. It talks to the main process through the typed preload bridge.
- `node-pty` is used so the Go process sees a real TTY and keeps stdin/stdout behavior intact.
