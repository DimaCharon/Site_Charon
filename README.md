# Charon — Personal Digital Identity

Premium responsive personal website built with React, TypeScript, Vite, Three.js and React Three Fiber.

## Local setup

```bash
npm install
npm run dev
```

## Original mascot asset

Place the original `Charon_Mascot_Core_Keeper.glb` file at `public/models/charon-mascot.glb`. The app loads the provided GLB directly with `useGLTF`; it does not regenerate or replace the geometry. Preserve the source PBR materials and mesh parts.

## Profile settings

Edit `PROFILE` in `src/App.tsx` to add the owner's display name and contact links. Placeholder links are intentionally not fabricated.

## Deploy

The project includes a GitHub Actions workflow for GitHub Pages. Set Pages source to GitHub Actions in repository settings.
