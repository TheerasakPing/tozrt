# NexTorrent

A modern, feature-rich BitTorrent client built with **Tauri v2**, **React**, and **TypeScript**. Features a beautiful cyberpunk UI with real-time download statistics.

![NexTorrent Screenshot](https://github.com/your-username/tozrt/assets/screenshots/main.png)

## Features

- 🚀 **Lightning Fast** — Built with Rust for maximum performance
- 📊 **Real-time Stats** — Live bandwidth graphs and peer tracking
- 🎨 **Cyberpunk UI** — Beautiful neon-themed interface
- 📁 **Resume Downloads** — Automatically restore torrents on restart
- 🏷️ **Categories** — Organize torrents by type (Movies, Music, Games, etc.)
- 🔍 **Search & Filter** — Find torrents quickly with search and sorting
- ⚡ **Queue Management** — Sequential or parallel download modes
- 🔔 **Notifications** — Get notified when downloads complete
- 🔄 **Duplicate Detection** — Prevent adding duplicate torrents
- ⚙️ **Smart Port Selection** — Auto-random best BitTorrent port
- 💾 **Persistent Settings** — All settings saved locally

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Tauri v2 (Rust) |
| Frontend | React 19, TypeScript, Vite |
| State | Zustand + Immer |
| Icons | Lucide React |

## Installation

### From Release

Download the latest release from the [Releases page](https://github.com/your-username/tozrt/releases).

### From Source

**Prerequisites:**
- [Rust](https://rustup.rs/)
- [Node.js](https://nodejs.org/) (v18+)
- [Bun](https://bun.sh/) (optional, npm works too)

```bash
# Clone the repository
git clone https://github.com/your-username/tozrt.git
cd tozrt

# Install dependencies
bun install

# Run in development mode
bun run tauri dev

# Build for production
bun run tauri build
```

## Building for Different Platforms

### macOS
```bash
bun run tauri build --target universal-apple-darwin
```

### Windows
```bash
bun run tauri build --target x86_64-pc-windows-msvc
```

### Linux
```bash
bun run tauri build --target x86_64-unknown-linux-gnu
```

## Configuration

All settings are stored locally in `~/.tozrt/` (or equivalent on your OS).

### Network Settings
- **Listen Port**: Default 6881, use "Best Port" for auto-selection
- **DHT**: Distributed Hash Table for peer discovery
- **PEX**: Peer Exchange for sharing peer lists
- **Max Connections**: Default 200

### Download Settings
- **Save Path**: Default download directory
- **Speed Limits**: Download/upload limits (0 = unlimited)
- **Queue Mode**: Sequential or Parallel
- **Max Active Downloads**: Concurrent download limit

## Development

### Project Structure
```
tozrt/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/              # Custom hooks
│   ├── store/              # Zustand stores
│   ├── types/              # TypeScript types
│   └── utils/              # Utilities
├── src-tauri/              # Rust backend
│   └── src/
│       ├── commands.rs     # Tauri commands
│       ├── torrent.rs      # Torrent logic
│       └── lib.rs          # Library
├── package.json
└── Cargo.toml
```

### Available Scripts
```bash
bun run dev          # Start Vite dev server
bun run build        # Build frontend
bun run tauri dev    # Start Tauri dev mode
bun run tauri build  # Build production app
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Tauri](https://tauri.app/) — Desktop app framework
- [React](https://react.dev/) — UI library
- [Zustand](https://github.com/pmndrs/zustand) — State management
- [Lucide](https://lucide.dev/) — Icons

---

Built with ❤️ using Tauri v2 + React + TypeScript
