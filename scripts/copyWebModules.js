const fs = require("fs");

const nodeModulePath = "./node_modules/bloom-player/dist";
const bloomPlayerAssetFolderPath = "./dist/bloom-player/";
const filesToNotCopy = [];

console.log(`Copying files from ${nodeModulePath} to ${bloomPlayerAssetFolderPath}`);

const moduleFiles = fs.readdirSync(nodeModulePath);
const moduleFilesToCopy = moduleFiles.filter(
    filename => !filesToNotCopy.includes(filename)
);

mkdirSafe(bloomPlayerAssetFolderPath);

// ENHANCE: It'd be better if bloomPlayerAssetFolderPath were cleaned up first.
moduleFilesToCopy.forEach(filename => {
    const fromFilename = filename;
    const toFilename = (filename.startsWith("bloomPlayer") && filename.endsWith(".js"))
        ? "bloomPlayer.jsAsset"
        : filename;

    fs.copyFileSync(
        `${nodeModulePath}/${fromFilename}`,
        `${bloomPlayerAssetFolderPath}/${toFilename}`
    )
});

function mkdirSafe(path) {
  if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
}
