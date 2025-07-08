# Childress Digital Studio Portfolio & 3D F-1 Demo

This repository hosts the website for **Childress Digital Studio**, featuring a showcase of projects alongside an interactive first-person 3D Formula 1 "track" where each trackside billboard displays a live preview of a project.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Running the Development Server](#running-the-development-server)
- [Building for Production](#building-for-production)
- [Next Steps](#next-steps)

## Features

- **Dynamic Project Previews**: In-site `iframe` or screenshot previews of your projects.
- **First-Person 3D Experience**: Drive a Formula 1 car around a track in first-person view.
- **Billboard Signs**: Interactive trackside signs that pop up project details when approached.
- **Next.js App Router + TypeScript**: Modern React framework with full TypeScript support.
- **Tailwind CSS**: Utility-first styling for rapid UI development.
- **react-three-fiber**: 3D scene rendering with React and Three.js.
- **@react-three/cannon**: Basic physics integration for driving mechanics.

## Prerequisites

- **Node.js** v18+  
- **npm** v8+ (or **yarn** v1.22+)  
- **Git** for version control

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/childress-digital-studio.git
   cd childress-digital-studio
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   No additional environment variables are required for the initial setup.

## Project Structure

```
.
├─ public/
│  ├─ favicon.ico
│  ├─ models/           # 3D assets (.gltf/.glb) placed here
│  └─ screenshots/      # Project preview images
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx     # Root layout and metadata
│  │  ├─ globals.css    # Tailwind CSS directives & global styles
│  │  ├─ page.tsx       # Home / landing page
│  │  └─ projects/
│  │     └─ [slug]/
│  │        └─ page.tsx # Dynamic project detail & preview page
│  ├─ components/       # React components (GameScene, Car, ProjectSign, etc.)
│  └─ data/
│     └─ projects.ts    # Project metadata and positions for billboards
├─ tailwind.config.js   # Tailwind CSS configuration
├─ next.config.js       # Next.js configuration
├─ tsconfig.json        # TypeScript configuration
├─ package.json         # npm scripts & dependencies
└─ README.md            # This file
```

## Running the Development Server

Start the Next.js dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the site. Changes will hot-reload as you work.

## Building for Production

Generate an optimized production build:

```bash
npm run build
npm run start
```

## Next Steps

- Implement the **GameScene** component with `react-three-fiber` and pointer-lock controls.
- Add the **Car** physics body using `@react-three/cannon`.
- Map over `projects` in the 3D scene to render `ProjectSign` billboards.
- Create a custom **HUD** overlay for speedometer and lap info.
- Deploy to Vercel or Netlify and configure your custom domain.

---
