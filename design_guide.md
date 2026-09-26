# Design Guide & reusable Prompt Template

Dieses Dokument fasst das Design-System (Obsidian & Emerald Glassmorphism) zusammen und stellt dir einen kopierfertigen Prompt für zukünftige Web-Projekte zur Verfügung.

---

## 🎨 Design-Spezifikationen

### 1. Farbpalette (Dark Mode & Non-AI Visuals)
- **Hintergrund (Dark Obsidian):** `#0f1115` (Tailwind: `bg-[#0f1115]`)
- **Karten & Panels (Surface):** `#1c1f26` mit Transparenz und Blur (`rgba(28, 31, 38, 0.7)`)
- **Haupt-Akzent (Smaragdgrün / Active):** `#10b981` (Tailwind: `text-emerald-500`, `bg-emerald-500`)
- **Zweit-Akzent (Bernstein / Warnung / Pause):** `#f59e0b` (Tailwind: `text-amber-500`)
- **Inaktive / Neutrale Elemente:** `#94a3b8` (Tailwind: `text-slate-400`)
- **Text-Hierarchie:**
  - Primär: `text-white/90`
  - Sekundär: `text-white/50`
  - Tertiär / Labels: `text-white/40`

### 2. Typografie
- **Font-Family:** `Outfit` (über Google Fonts eingebunden)
- **Stil:** Modern, geometrisch, gut lesbar in allen Größen

### 3. Schlüssel-Effekte & CSS-Klassen
- **Glassmorphism-Panel:**
  ```css
  background: linear-gradient(145deg, rgba(28, 31, 38, 0.7), rgba(28, 31, 38, 0.3));
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  ```
- **Text-Glow:** `text-shadow: 0 0 30px currentColor;`
- **Hintergrund-Glow (Ambient Background Light):**
  ```html
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>
  ```

---

## 📋 Kopierfertiger Prompt für neue Projekte

Du kannst den folgenden Text kopieren und direkt in deinen Prompt für ein neues Projekt einfügen:

```markdown
Erstelle die Anwendung im folgenden Design-Stil:

- **Aesthetic**: Modernes Obsidian Dark-Mode Glassmorphism-Design (vermeide blaue/violette Farben).
- **Farbschema**:
  - Hintergrund: Sehr dunkler Obsidian-Ton (`#0f1115`)
  - Cards & Modals: Glassmorphism (`rgba(28, 31, 38, 0.7)`, `backdrop-blur-xl`, dezentem Rahmen `border-white/10`)
  - Primäre Akzentfarbe: Smaragdgrün (`#10b981` / Emerald) für aktive Elemente, Glows & Highlights
  - Sekundäre Akzentfarbe: Warmes Bernstein/Orange (`#f59e0b` / Amber) für Status/Warnungen/Pausen
- **Typografie**: Google Font 'Outfit' (sans-serif) mit klarer Hierarchie und dezenten Opazitäten (`text-white/90`, `text-white/50`).
- **Details**:
  - Sanfter, animierter Hintergrund-Glow (Ambient Blur Light).
  - Subtle Micro-Interactions (Hover-Effekte, smooth Transitions).
  - Custom Dark-Scrollbars und angepasste Dark-Inputs.
```
