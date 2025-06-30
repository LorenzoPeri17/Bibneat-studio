const { VitePlugin } = require('@electron-forge/plugin-vite');

// This config uses CommonJS format which is more reliable with Electron Forge
module.exports = {
  packagerConfig: {
    name: "Bibneat Studio",
    executableName: "bibneat-studio",
    appBundleId: "com.bibneat.studio",
    icon: './assets/icons/icon', // Icon path without extension
    asar: false, // Disable asar for easier debugging
    extraResource: [
      './wasm'
    ],
    quiet: false, // Show verbose output
    debug: true,
    overwrite: true,
    prune: false, // Don't prune for now
    // Remove platform and arch restrictions to allow cross-compilation where possible
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32', 'linux'],
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        icon: './assets/icons/mac/bibneat-studio.icns'
      },
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'bibneat-studio',
        iconUrl: 'https://raw.githubusercontent.com/LorenzoPeri17/Bibneat-studio/main/electron-app/assets/icons/icon.ico',
        setupIcon: './assets/icons/icon.ico',
        // Explicitly target x64 for Windows
        arch: 'x64'
      },
      platforms: ['win32'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: './assets/icons/png/512x512.png',
          categories: ['Utility', 'Science'],
          maintainer: 'Lorenzo Peri',
          homepage: 'https://github.com/LorenzoPeri17/Bibneat-studio'
        },
      },
      platforms: ['linux'],
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: './assets/icons/png/512x512.png',
          categories: ['Utility', 'Science'],
          homepage: 'https://github.com/LorenzoPeri17/Bibneat-studio'
        },
      },
      platforms: ['linux'],
    },
    {
      name: '@electron-forge/maker-flatpak',
      config: {
        options: {
          id: 'com.bibneat.studio',
          productName: 'Bibneat Studio',
          genericName: 'Bibliography Manager',
          description: 'GUI for the bibneat C++/WASM library for managing BibTeX files',
          categories: ['Office', 'Science'],
          icon: './assets/icons/png/512x512.png',
          maintainer: 'Lorenzo Peri',
          homepage: 'https://github.com/LorenzoPeri17/Bibneat-studio',
          repository: 'https://github.com/LorenzoPeri17/Bibneat-studio',
          // Use modern Flatpak runtime versions
          runtime: 'org.freedesktop.Platform',
          runtimeVersion: '23.08',
          sdk: 'org.freedesktop.Sdk',
          base: 'org.electronjs.Electron2.BaseApp',
          baseVersion: '23.08'
        }
      },
      platforms: ['linux'],
    },
  ],
  plugins: [
    new VitePlugin({
      // Main process configuration
      build: [
        {
          // Main process entry point
          entry: 'main.js',
          config: 'vite.main.config.js',
        },
        {
          // Preload script configuration
          entry: 'preload.cjs',
          config: 'vite.preload.config.js',
        },
      ],
      // Renderer process configuration
      renderer: [
        {
          name: 'main_window',
          config: 'vite.config.js',
        },
      ],
    }),
  ],
};
