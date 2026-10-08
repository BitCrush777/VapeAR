# 🌬️ VapeAR

**VapeAR** is an interactive browser-based augmented reality experience powered by **React 19**, **Three.js**, **Google MediaPipe Vision**, and **TypeScript**.

Control the virtual pipe with your real hands, bring it to your lips to take a sip, exhale realistic volumetric smoke clouds that curl naturally around your face, and sculpt the vapour using interactive hand gestures in the **Smoke Ritual**!

---

## ✨ Features

- 🏺 **Photorealistic 3D Model**: Custom-modeled multi-section ornate metallic stem, spherical decorated base flask with physical water refraction, wide charcoal tray, and dynamic cubic Bezier flexible braided hose using Three.js PBR materials.
- 🌌 **Premium Virtual Lounge Environment**: Physically grounded Nero Marquina dark marble table, brass filigree candle lantern with dynamic warm flame flicker, Moroccan tea glass with mint leaves, and soft contact ambient occlusion.
- 🖐️ **AI-Powered Hand Tracking**: Grasp and hold the mouthpiece naturally using your fist or pinch gesture tracked in real-time via Google MediaPipe HandLandmarker with predictive One Euro velocity filtering.
- 👄 **Smart Sip & Exhale Detection**: Real-time facial landmark tracking detects when the mouthpiece approaches your lips, registers a sip when your mouth opens, and triggers immediate vapour exhale.
- 💨 **Atmospheric Volumetric Smoke**: Multi-tiered particle system that produces translucent billowing clouds with instant response, curling and scattering around your face, cheeks, and shoulders.
- 🔮 **Signature Smoke Ritual (Phase 8)**:
  - **Hand Steering**: Move your hand to guide and push smoke along your movement trajectory.
  - **Pinch Attraction**: Pinch your fingers to gently condense smoke toward your palm.
  - **Open Hand Repulsion**: Open your palm wide to push and disperse smoke outward.
  - **Swirl Vortex & Smoke Ring**: Swirl your hand in a circular motion ($\ge 270^\circ$) to trigger a rotating vortex and an expanding toroidal smoke ring.
- 🎨 **Visual Customization & Skins (Phase 7)**:
  - **VapeAR Skins**: Royal Gold, Obsidian Luxury, Cyber Neon, Deep Ocean, Desert Amber.
  - **Environment Presets**: Midnight Lounge, Royal Lounge, Cyber Lounge.
  - Dynamic in-place material mutation with zero scene recreation and `localStorage` persistence.
- 🎵 **Procedural Web Audio System (Phase 6)**:
  - 100% synthesized audio via Web Audio API: water bubbling, charcoal ember crackles, inhale feedback, vapour whoosh, and ritual chimes.
  - Zero external MP3/WAV dependencies, zero 404s, mobile autoplay policy compliant.
- ⚡ **Zero Backend / 100% Client-Side**: Runs entirely in the client's browser with WebGL hardware acceleration and webcam feed privacy.

---

## 🎮 How to Interact

| Step | Action | Gesture |
|------|--------|---------|
| **1. Grab Hose** | Reach out towards the golden mouthpiece | **Close your fist** or pinch fingers near the pipe tip |
| **2. Bring to Mouth** | Move your hand towards your face | Move the pipe within proximity of your lips |
| **3. Take a Sip** | Inhale from the mouthpiece | Open mouth slightly while pipe is at lips (water bubbles & embers glow) |
| **4. Exhale Vapour** | Move pipe away and exhale | Dense atmospheric smoke plume billows out |
| **5. Smoke Ritual** | Guide & shape the smoke cloud | Move hand through smoke, pinch to attract, open palm to repel |
| **6. Smoke Ring** | Swirl hand in a circle | Circular motion triggers vortex and expanding toroidal smoke ring |

---

## 🛠️ Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 8](https://vitejs.dev/)
- **3D Graphics & Rendering**: [Three.js](https://threejs.org/) (PBR Shaders, Dynamic Tube Geometry)
- **Computer Vision & AI**: [@mediapipe/tasks-vision](https://ai.google.dev/edge/mediapipe/solutions/vision) (FaceLandmarker & HandLandmarker)
- **Audio Synthesis**: Web Audio API Procedural Synthesizer
- **UI Components**: Magic UI, Lucide Icons, Glassmorphism CSS

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- A working webcam

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/BitCrush777/VapeAR.git
   cd VapeAR
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```
   *(Grant camera permissions when prompted)*

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🌐 Production Deployment

Because this project is a pure client-side static web application (SPA), it can be deployed on any modern static hosting provider with **HTTPS** support.

> [!IMPORTANT]
> **HTTPS is strictly required** by modern browsers (Chrome, Safari, Edge, Firefox) for webcam access. Insecure HTTP origins (other than `localhost`) will block camera streams.

### Vercel / Netlify / Cloudflare Pages / Static S3

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x or 20.x+

---

## 🔒 Privacy & Permissions

- The camera feed is processed **strictly in-memory** on your local device.
- No video, webcam frames, or landmark data is ever stored, uploaded, or transmitted to any server.

---

## 👤 Creator

**Created by Saidarshan.K**

---

## 📄 License

MIT License © 2026 Saidarshan.K
