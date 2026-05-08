const { contextBridge } = require("electron");

const backendPort = Number(process.env.PORT || 5000);

// For LAN clients: VITE_API_URL should be set to server's LAN IP (e.g., http://192.168.1.100:5000/api)
// For standalone/server: defaults to localhost
const apiBaseUrl = process.env.VITE_API_URL || `http://127.0.0.1:${backendPort}/api`;

// Extract server host from apiBaseUrl for health checks
const serverHost = apiBaseUrl.replace(/\/api\/?$/, '').replace(/^https?:\/\//, '');

contextBridge.exposeInMainWorld("electron", {
  isElectron: true,
  backendPort,
  apiBaseUrl,
  serverHost,
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});
