const fs = require("fs");
const path = require("path");
const pngToIco = require("png-to-ico");

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const srcLogoJpg = path.join(repoRoot, "dist", "qq.jpg");
  const srcLogoJfif = path.join(repoRoot, "dist", "qq.jfif");
  const distBrandPng = path.join(repoRoot, "dist", "brand-logo.png");
  const publicBrandPng = path.join(repoRoot, "public", "brand-logo.png");
  const publicBrandJpg = path.join(repoRoot, "public", "brand-logo.jpg");

  const outIco1 = path.join(repoRoot, "public", "app.ico");
  const outIco2 = path.join(repoRoot, "public", "favicon.ico");
  const outBrandPng = path.join(repoRoot, "public", "brand-logo.png");

  let sharp = null;
  try {
    // eslint-disable-next-line global-require
    sharp = require("sharp");
  } catch {
    sharp = null;
  }

  let brandPngBuf = null;

  const srcLogo = fs.existsSync(srcLogoJpg) ? srcLogoJpg : srcLogoJfif;

  if (sharp && fs.existsSync(srcLogo)) {
    brandPngBuf = await sharp(srcLogo)
      .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    fs.writeFileSync(outBrandPng, brandPngBuf);
  } else if (fs.existsSync(publicBrandPng)) {
    brandPngBuf = fs.readFileSync(publicBrandPng);
  } else if (fs.existsSync(distBrandPng)) {
    brandPngBuf = fs.readFileSync(distBrandPng);
    fs.writeFileSync(outBrandPng, brandPngBuf);
  } else {
    if (fs.existsSync(srcLogoJpg)) {
      fs.copyFileSync(srcLogoJpg, publicBrandJpg);
      process.stdout.write(
        `Generated logo (JPG fallback):\n- ${publicBrandJpg}\n\nNote: Install 'sharp' (npm install) to also generate PNG + ICOs for Windows/Electron packaging.\n`
      );
      return;
    }

    const missing = sharp
      ? `Icon source not found: ${srcLogoJpg} (or ${srcLogoJfif})`
      : "Optional dependency 'sharp' is not installed and no fallback PNG was found.";
    throw new Error(
      `${missing}\n\nFix:\n- Run: npm install\n- Ensure dist/qq.jpg exists (canonical logo source)\n`
    );
  }

  const icoBuf = await pngToIco(brandPngBuf);

  fs.writeFileSync(outIco1, icoBuf);
  fs.writeFileSync(outIco2, icoBuf);

  if (!fs.existsSync(publicBrandJpg) && fs.existsSync(srcLogoJpg)) {
    fs.copyFileSync(srcLogoJpg, publicBrandJpg);
  }

  process.stdout.write(
    `Generated icons:\n- ${outBrandPng}\n- ${outIco1}\n- ${outIco2}\n- ${publicBrandJpg}\n`
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
