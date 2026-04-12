const { withDangerousMod } = require('@expo/config-plugins')
const fs = require('fs')
const path = require('path')

const SOURCE_DIR = path.join(__dirname, 'android-res')

function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry))
    }
  } else {
    fs.copyFileSync(src, dest)
  }
}

/**
 * Copies custom Android res files from plugins/android-res/ into the generated
 * android/app/src/main/res/ folder after prebuild.
 */
const withAndroidCustomAssets = (config) =>
  withDangerousMod(config, [
    'android',
    (mod) => {
      const resDir = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res')
      copyRecursive(SOURCE_DIR, resDir)
      return mod
    }
  ])

module.exports = withAndroidCustomAssets
