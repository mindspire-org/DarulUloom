const { app, BrowserWindow, shell, dialog, Menu } = require("electron");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { pathToFileURL } = require("url");
const crypto = require("crypto");

const isDev = !app.isPackaged;
const devServerUrl = process.env.ELECTRON_RENDERER_URL || "http://localhost:8080";
const backendPort = Number(process.env.PORT || 5000);

// API URL for LAN clients: set VITE_API_URL to server's LAN IP (e.g., http://192.168.1.100:5000/api)
const apiUrl = process.env.VITE_API_URL || `http://127.0.0.1:${backendPort}/api`;
const serverHost = apiUrl.replace(/\/api\/?$/, '').replace(/^https?:\/\//, '');

// --- LOAD ENVIRONMENT CONFIG ---
const userDataDir = app.getPath("userData");
const userEnvLocal = path.join(userDataDir, ".env.local");
const userEnv = path.join(userDataDir, ".env");
const candidates = [
  userEnvLocal,
  userEnv,
  path.join(process.resourcesPath, ".env.local"),
  path.join(process.resourcesPath, ".env"),
  path.join(process.resourcesPath, "app.asar", ".env.local"),
  path.join(process.resourcesPath, "app.asar", ".env"),
];

const picked = candidates.find((p) => fs.existsSync(p));
if (picked) {
  try {
    const envContent = fs.readFileSync(picked, "utf8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value;
      }
    });
    process.env.DOTENV_CONFIG_PATH = picked;
  } catch (e) {
    console.error("Failed to load .env file:", e);
  }
}

// Determine if we should start the local backend
// LAN clients connecting to a remote server should NOT start their own backend
const isRemoteClient = apiUrl.includes("192.168.") || apiUrl.includes("10.") || /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./.test(apiUrl);

let mainWindow;
let backendStarted = false;
let backendEntryUsed = null;
let backendEntryCandidates = null;
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

async function startBackendIfNeeded() {
  if (backendStarted || isRemoteClient) return;

  // In dev we already run the backend via npm scripts.
  if (isDev) {
    backendStarted = true;
    return;
  }

  // In production, start the bundled Express server in-process.
  // Ensure dotenv finds the packaged .env by setting a stable working directory.
  // In production `__dirname` points inside app.asar, and `app.asar` is a file (not a directory),
  // so we must not chdir to it.
  process.chdir(process.resourcesPath);

  // First-run experience: if no userData .env exists, create one with a safe default.
  // This avoids shipping a LAN-IP MONGO_URI that breaks on other PCs.
  try {
    const hasUserEnv = fs.existsSync(userEnvLocal) || fs.existsSync(userEnv);
    if (!hasUserEnv) {
      const jwt = crypto.randomBytes(32).toString("hex");
      const defaultEnv = [
        `# --- JAMIA ADMISSION SYSTEM CONFIG (STANDALONE MODE) ---`,
        `# This app expects MongoDB to be installed and running on THIS PC.`,
        `PORT=${backendPort}`,
        `MONGO_URI=mongodb://localhost:27017/madrasa_admission`,
        `JWT_SECRET=${jwt}`,
        `NODE_ENV=production`,
        `AUTO_SEED_ADMIN=true`,
        `AUTO_SEED_GRADES=true`,
        `# -------------------------------------------------------`,
      ].join("\n");
      fs.writeFileSync(userEnv, defaultEnv, "utf8");
    }
  } catch {
    // ignore (app can still fall back to resources env)
  }

  // Ensure the backend uses the same port we probe for readiness.
  if (!process.env.PORT) {
    process.env.PORT = String(backendPort);
  }

  const unpackedServerEntry = path.join(process.resourcesPath, "app.asar.unpacked", "server", "server.js");
  const asarServerEntry = path.join(__dirname, "..", "server", "server.js");

  backendEntryCandidates = { unpackedServerEntry, asarServerEntry };

  // IMPORTANT: In production, dependencies live under app.asar/node_modules.
  // If we run the server from app.asar.unpacked without also unpacking node_modules,
  // ESM imports like "express" will fail to resolve. Therefore, always run from app.asar.
  const serverEntry = asarServerEntry;
  backendEntryUsed = serverEntry;

  await import(pathToFileURL(serverEntry).href);
  backendStarted = true;
}

function waitForBackendReady({ timeoutMs = 20000, intervalMs = 500 } = {}) {
  const deadline = Date.now() + timeoutMs;
  const healthUrl = `http://${serverHost}/api/health`;

  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(healthUrl, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          res.resume();
          return resolve(true);
        }
        res.resume();
        if (Date.now() > deadline) {
          return reject(new Error(`Backend not ready (status ${res.statusCode})`));
        }
        setTimeout(tick, intervalMs);
      });

      req.on("error", () => {
        if (Date.now() > deadline) {
          return reject(new Error(`Backend not reachable on ${healthUrl}`));
        }
        setTimeout(tick, intervalMs);
      });
    };

    tick();
  });
}

function createWindow() {
  const icoPath = path.join(__dirname, "..", "public", "app.ico");
  const jpgPath = path.join(__dirname, "..", "public", "brand-logo.jpg");
  const windowIconPath = fs.existsSync(icoPath)
    ? icoPath
    : fs.existsSync(jpgPath)
      ? jpgPath
      : undefined;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    autoHideMenuBar: false,
    ...(windowIconPath ? { icon: windowIconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://www.wifaqulmadaris.org")) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Security: Handle X-Frame-Options and Content-Security-Policy to allow Wafaq website
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    
    // Check if it's the Wafaq website
    if (details.url.includes("wifaqulmadaris.org")) {
      // Remove headers that prevent iframe loading
      delete responseHeaders['x-frame-options'];
      delete responseHeaders['X-Frame-Options'];
      delete responseHeaders['content-security-policy'];
      delete responseHeaders['Content-Security-Policy'];
    }

    callback({
      cancel: false,
      responseHeaders
    });
  });

  if (isDev) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

function setupAppMenu() {
  const template = [
    {
      label: "File",
      submenu: [{ role: "quit" }],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            await shell.openExternal("https://www.electronjs.org");
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(async () => {
  try {
    await startBackendIfNeeded();
    if (!isDev) {
      await waitForBackendReady();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to start backend:", err);
    let diagnostics = "";
    try {
      const unpackedServerDir = path.join(process.resourcesPath, "app.asar.unpacked", "server");
      const unpackedPkg = path.join(unpackedServerDir, "package.json");
      const unpackedExists = fs.existsSync(unpackedServerDir);
      const unpackedPkgExists = fs.existsSync(unpackedPkg);
      let unpackedPkgText = "";
      if (unpackedPkgExists) {
        unpackedPkgText = fs.readFileSync(unpackedPkg, "utf8");
      }
      diagnostics = [
        `backendEntryUsed: ${backendEntryUsed || "(unknown)"}`,
        backendEntryCandidates
          ? `backendEntryCandidates: ${JSON.stringify(backendEntryCandidates)}`
          : "",
        `unpackedServerDir: ${unpackedServerDir}`,
        `unpackedServerDirExists: ${unpackedExists}`,
        `unpackedPackageJsonExists: ${unpackedPkgExists}`,
        unpackedPkgText ? `unpackedPackageJson: ${unpackedPkgText}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    } catch (e) {
      diagnostics = `diagnosticsError: ${e?.message || e}`;
    }

    dialog.showErrorBox(
      "Backend not started",
      `App backend failed to start.\n\n${err?.message || err}\n\n${diagnostics}\n\nDOTENV_CONFIG_PATH: ${process.env.DOTENV_CONFIG_PATH || "(not set)"}\nresourcesPath: ${process.resourcesPath}\nuserData: ${app.getPath(
        "userData",
      )}\n\nFix:\n1) Ensure MongoDB is installed and running on THIS computer (default expects localhost:27017).\n2) Edit this file and set correct MONGO_URI then restart the app:\n   ${path.join(app.getPath("userData"), ".env")}\n\nNote: On first run the app auto-creates userData .env with a safe localhost default. If you want to use a remote/LAN MongoDB, update MONGO_URI in that userData .env.`
    );
  }

  setupAppMenu();

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("second-instance", () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
