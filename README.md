# Floor Plan Designer App

This is a simple React Native (Expo) app for designing floor plans by placing, moving, rotating, and deleting furniture on a grid. The app is designed for clarity and ease of use, with a minimal, robust codebase.

## Features
- Vertical left-side furniture panel
- Click a furniture item to add it to the floor plan
- Move furniture after placement
- Delete furniture
- SVG-based grid and room rendering

## How to Run
1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the Expo development server:
   ```sh
   npm start
   ```
3. Use the Expo Go app or an emulator to view the app.

## Project Structure
- `components/` — UI components (FurniturePanel, DraggableFurniture, FloorPlanSVG)
- `constants/` — Furniture catalog and theme
- `App.js` — Main entry point
- `lib/`, `assets/`, `test/` — Standard Expo folders

## Development Notes
- All drag/ghost/preview logic has been removed for simplicity
- Only click-to-add and move/delete are supported
- Unused dependencies and components have been cleaned up

## License
MIT
