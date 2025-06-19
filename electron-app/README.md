# Bibneat Electron App

This is a simple Electron application with a React (Vite) frontend. It provides a graphical interface for the bibneat C++/WASM library to manage and clean BibTeX files.

## Features
- View and highlight bibliography files (non-ASCII highlighting)
- Add entries (direct text, arXiv, DOI)
- Actions panel for bibneat CLI features
- Export current bibliography

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the React frontend (for development):
   ```bash
   npm run dev
   ```
3. (To be added) Start the Electron main process.

## Project Structure
- `main.js` — Electron main process (to be created)
- `src/` — React frontend
- `public/` — Static assets
- `wasm/` — (To be linked) bibneat WASM files

## Next Steps
- Implement Electron main process
- Integrate WASM bindings
- Build out the UI as described in the project plan
