const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

function loadEnvFile(p) {
  if (!fs.existsSync(p)) return null;
  const result = dotenv.config({ path: p });
  if (result.error) {
    throw result.error;
  }
  return result.parsed || {};
}

function main() {
  const repoRoot = path.resolve(__dirname, "..");

  const envLocalPath = path.join(repoRoot, ".env.local");
  const envPath = path.join(repoRoot, ".env");

  const parsedLocal = loadEnvFile(envLocalPath);
  const parsed = loadEnvFile(envPath);

  const mongoUri =
    process.env.MONGO_URI ||
    (parsedLocal && parsedLocal.MONGO_URI) ||
    (parsed && parsed.MONGO_URI);

  if (!mongoUri || typeof mongoUri !== "string") {
    process.stderr.write(
      "WARNING: Missing MONGO_URI in build environment.\n" +
        "- Build will continue.\n" +
        "- In the packaged Electron app, a safe default .env will be auto-created on first run at userData/.env\n" +
        "  (defaults to mongodb://localhost:27017/madrasa_admission).\n\n" +
        "If you want to bake a specific MongoDB connection for testing, create .env.local or .env at repo root and set:\n" +
        "MONGO_URI=your-mongodb-connection-string\n\n"
    );
    process.stdout.write("Environment validation skipped (MONGO_URI not provided).\n");
    return;
  }

  process.stdout.write("Environment validation OK (MONGO_URI found).\n");
}

main();
