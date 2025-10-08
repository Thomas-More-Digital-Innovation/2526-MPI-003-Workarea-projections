# Work Area Projection

A Next.js application with Electron integration for desktop deployment.

## Project Overview

This project combines Next.js for the web application and Electron for desktop deployment, providing a cross-platform desktop application experience.

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd work-area-projection
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

### Development

#### Web Development (Next.js only)
Run the development server for web-only development:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

#### Electron Development
Run the application in Electron development mode:

```bash
npm run electron-dev
```

This command will:
- Start the Next.js development server
- Wait for the server to be ready
- Launch the Electron application
- The app will connect to `http://localhost:3000` in development mode

**Development Shortcuts:**
- `Ctrl+Shift+I` (or `Cmd+Shift+I` on Mac) - Toggle Developer Tools

### Building the Application

#### Build for Production

1. Build the Next.js application:
```bash
npm run build
```

2. Run the built application in Electron:
```bash
npm run electron-build
```

#### Building Desktop Distributables

To create distributable packages for different platforms:

1. First, ensure you have the necessary build tools installed:
```bash
npm install -g electron-builder
```

2. Add build scripts to package.json (if not already present):
```json
{
  "scripts": {
    "dist": "electron-builder",
    "dist:win": "electron-builder --win",
    "dist:mac": "electron-builder --mac",
    "dist:linux": "electron-builder --linux"
  }
}
```

3. Build distribution packages:
```bash
npm run dist
```

## Project Structure

```
work-area-projection/
├── electron/              # Electron main process files
│   └── main.js           # Electron entry point
├── src/                  # Next.js application source
│   ├── app/             # App router directory
│   │   ├── layout.tsx   # Root layout
│   │   ├── page.tsx     # Home page
│   │   └── globals.css  # Global styles
├── public/              # Static assets
├── package.json         # Project dependencies and scripts
├── next.config.ts       # Next.js configuration
└── tsconfig.json        # TypeScript configuration
```

## Key Features

- **Next.js 15** with App Router
- **React 19** with latest features
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Electron** for desktop deployment
- **ESLint** for code quality

## Development Workflow

### Web-Only Development
1. Run `npm run dev`
2. Edit files in `src/app/`
3. Changes will hot-reload in the browser

### Electron Development
1. Run `npm run electron-dev`
2. Edit files in `src/app/` and `electron/`
3. Changes to Next.js files will hot-reload
4. Changes to Electron files require restart

### Production Build
1. Run `npm run build` to build Next.js
2. Run `npm run electron-build` to test production build
3. Use `npm run dist` to create distributables

## Configuration

### Next.js Configuration
- Located in `next.config.ts`
- Supports TypeScript out of the box
- Optimized for Electron deployment

### Electron Configuration
- Main process: `electron/main.js`
- Window settings: 1920x1080 resolution, starts maximized
- Security: Context isolation enabled, node integration disabled

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   - Kill the process using port 3000 or use a different port

2. **Electron won't start**
   - Ensure all dependencies are installed with `npm install`
   - Check that the Next.js dev server is running

3. **Build failures**
   - Clear Next.js cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Electron Documentation](https://www.electronjs.org/docs) - learn about Electron features
- [React Documentation](https://react.dev) - learn about React
- [TypeScript Documentation](https://www.typescriptlang.org/docs) - learn about TypeScript

## Deployment

### Web Deployment
The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Desktop Deployment
Use Electron Builder to create distributable packages for Windows, macOS, and Linux.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both web and Electron modes
5. Submit a pull request

## License

This project is licensed under the MIT License.
