# Dye Dodge

Slide a chameleon onto its matching paint tile before the drone scans. Match the color and printed symbol. Drag across the deck, tap a tile, or use the arrow keys. You can start by dragging directly on the deck.

Four labs contain 26 scans. The drone speeds up as you progress. Matching scans build a streak, and three misses end the run. Each cleared lab awards one star per life remaining. Your next scan, records and settings are saved locally. Escape or leaving the tab pauses the run.

Open the root `index.html` or `standalone.html` to play. Each bundles the game code, art, soundtrack and the local MIT-licensed Three.js renderer. WebGL presents the 3D scene. A Canvas fallback preserves the rules and controls when WebGL is unavailable. The original electronic track runs at 164–176 BPM and starts after a player gesture. The top-right sound button controls the track and sound effects together.

Source builds with `node build.cjs`. All models, effects and sounds were created for this game. The paint interaction in Ting Arcade's [Chameleon Hide & Seek 3D](https://combos.game/zh-CN/play/803b20f8db8aaaac96bf0d5c8a91a36a) inspired the camouflage mechanic. [Skydiving](https://game-wave.ai/s/xnluFN1z) and [River Mill](https://game-wave.ai/s/DQI63RoG) were visual and interface references.
