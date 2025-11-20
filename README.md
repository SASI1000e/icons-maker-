
# Iconic Design Studio 🎨

**Iconic Design Studio** is a modern, AI-powered web application designed for creating professional icons, logos, and realistic product mockups instantly. Built with **React 18**, **TypeScript**, and **Google Gemini 2.5 Flash**, it offers a seamless experience for designers and brand managers.

## 🚀 Features

### 1. AI Icon Editor
- **Text-to-Image**: Generate high-quality icons using natural language prompts.
- **Style Reference**: Upload reference images to guide the AI's style (Multimodal input).
- **Variations**: Generate 1, 2, or 3 variations at once.
- **Stroke Control**: Pre-define line weight (Thin, Medium, Thick).

### 2. Mockup Studio
- **Instant Visualization**: Apply your generated logo onto real-world objects.
- **Presets**: Includes T-Shirts, Mugs, Hoodies, Caps, Signs, Vans, and more.
- **Custom Mockups**: Describe any object (e.g., "A vintage leather backpack") and the AI will place your logo on it.

### 3. Gallery & Persistence
- **Local History**: All generated designs are saved automatically to the browser's LocalStorage.
- **Lightbox**: Full-screen view for high-resolution inspection.
- **Download**: One-click download for generated assets.
- **Label Editing**: Rename or add notes to any generated result.

### 4. System Admin Panel (Hidden) 🛡️
A password-protected dashboard to fully customize the application without touching code.
- **Access**: Double-click the **App Logo** in the header to open.
- **Default PIN**: `admin`
- **Capabilities**:
  - **API Key Management**: Enter your Gemini API Key securely.
  - **Branding**: Change App Name, Subtitle, and Upload a custom Logo.
  - **Prompts**: Add/Remove quick prompt suggestions.
  - **Mockups**: Create and edit custom mockup presets.

---

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Model**: Google Gemini 2.5 Flash Image (`@google/genai`)
- **Icons**: Lucide React
- **Deployment**: Static Site (Netlify / Firebase / Vercel)

---

## 📦 Installation & Setup

1. **Clone or Download** the repository.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run Locally**:
   ```bash
   npm run dev
   ```
4. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🔑 Configuration (Important)

To generate images, the application requires a **Google Gemini API Key**.

1. Get your key from [Google AI Studio](https://aistudio.google.com/).
2. Run the app locally.
3. **Double-click the logo** in the top-left corner.
4. Enter PIN: `admin`.
5. Go to **Settings** and paste your key in the **Gemini API Key** field.
6. Click **Save Changes**.

---

## 📂 Project Structure

```
/src
  ├── components/       # UI Components (Header, ImageUpload, AdminPanel, etc.)
  ├── contexts/         # State Management (ConfigContext - handles settings)
  ├── services/         # API Logic (Gemini interaction)
  ├── types.ts          # TypeScript Interfaces
  ├── constants.ts      # Default presets and prompts
  ├── App.tsx           # Main Application Logic
  └── main.tsx          # Entry Point
```

## 🌍 Deployment

This project is a **Static Web Application**. 
- It does **not** require a backend server (Node/PHP/Python).
- It can be deployed directly to **Netlify**, **Vercel**, or **GitHub Pages**.

**Deploy to Netlify:**
1. Drag and drop the `dist` folder (created after `npm run build`) to Netlify.
2. Or connect your GitHub repository to Netlify for auto-deployment.

---

*Development by Sasinio Digital Marketing*
