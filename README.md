<p align="center">
  <img src="public/favicon.svg" alt="Termicolor Logo" width="80" height="80">
</p>

<h1 align="center">Termicolor</h1>

<p align="center">
  Create beautiful terminal color schemes from any image.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178c6" alt="TypeScript 5.6">
  <img src="https://img.shields.io/badge/React-18-61dafb" alt="React 18">
  <img src="https://img.shields.io/badge/Vite-6-646cff" alt="Vite 6">
  <a href="https://www.rugvin.be"><img src="https://img.shields.io/badge/made%20by-rugvin-8b5cf6" alt="Made by rugvin"></a>
</p>

## Features

- **Image-based color extraction** - Drop any image and get a complete terminal color palette
- **Smart color mapping** - Automatically maps extracted colors to ANSI slots based on hue proximity
- **Grayscale detection** - Generates appropriate grayscale palettes for black & white images
- **Background detection** - Samples image corners to capture background colors that might be missed
- **Live terminal preview** - See your theme in action with realistic bash, code, and swatch views
- **Dark/Light mode** - Toggle between dark and light terminal themes
- **Readability analysis** - WCAG contrast checking with auto-fix options
- **Multiple export formats**:
  - iTerm2 (.itermcolors)
  - Alacritty (.toml)
  - Kitty (.conf)
  - Windows Terminal (.json)
  - Hyper (.js)
  - Terminal.app (.terminal) - experimental
- **Import support** - Load existing .itermcolors files
- **Profile management** - Save and manage your favorite color schemes locally

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Usage

1. **Upload an image** - Drag & drop or click to select an image
2. **Preview your theme** - See the generated colors in the terminal preview
3. **Adjust colors** - Click any color swatch to fine-tune with the color picker
4. **Fix contrast issues** - Use the magic wand to auto-fix readability problems
5. **Export** - Download your theme in your preferred terminal format

## Tech Stack

- React + TypeScript
- Vite
- Mantine UI
- ColorThief for color extraction

## License

MIT
