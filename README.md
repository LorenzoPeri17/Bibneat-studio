# Bibneat Studio

Making your BibTeX files neat, tidy, and beautiful—**without ever touching a terminal!** 🎉

## What is Bibneat Studio?

**Bibneat Studio** is the friendly, graphical sibling of [`bibneat`](./bibneat/README.md)—for everyone who:

- Would rather click than type
- Gets hives at the thought of compiling C++ from source
- Just wants their `.bib` files to behave, with zero command-line drama

With Bibneat Studio, you get all the BibTeX-wrangling power of `bibneat`—but in a shiny, cross-platform desktop app. No more dependency headaches, no more cryptic build errors, no more "wait, what is vcpkg?" Just download, open, and start cleaning up your bibliographies like a pro.

## Features

- 📚 **View and Highlight**: Instantly see your `.bib` file, with all those sneaky non-ASCII characters highlighted (so BibTeX won’t throw a fit).
- ➕ **Add Entries**: Paste BibTeX, fetch from arXiv or DOI—no more copy-paste gymnastics.
- 🛠️ **Actions Panel**: All the `bibneat` magic—merge, clean, normalize, filter, check, and more—just a click away.
- 💾 **Export**: Save your beautifully cleaned bibliography, ready for LaTeX glory.
- ⚡ **Powered by WASM**: All the C++/WASM wizardry of `bibneat`, running right inside the app.

## Why Bibneat Studio?

Because not everyone dreams in terminal green.  
Because sometimes you just want to drag, drop, and click your way to a perfect bibliography.  
Because life’s too short to debug CMake errors.

## Getting Started

1. **Download** the latest release for your platform (macOS, Windows, Linux).
2. **Extract** and run the app—no installation, no fuss.
3. **Open your `.bib` file** and let Bibneat Studio work its magic!

> **Pro tip:** You don’t need to install `bibneat` or any C++ dependencies. Bibneat Studio bundles everything you need.

## For the Curious

- Built with [Electron](https://www.electronjs.org/) + [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- Uses the same C++/WASM core as the original [`bibneat`](./bibneat/README.md)
- Cross-platform: macOS (Apple Silicon), Windows x64, Linux x64
- Open source, because bibliographies should be free (and so should you)

## Want to Hack On It?

1. Clone this repo and `cd electron-app`
2. `npm install`
3. `npm run electron:dev`
4. The WASM magic happens automatically—no need to compile C++ yourself!
---

✨ Happy (Bib)TeXing—now with 100% less terminal! ✨