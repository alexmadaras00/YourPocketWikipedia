# Your PocketWikipedia — GitHub Pages Website

The exact same landing page UI as [pocket-pedia-tours--alexandrumadar1.replit.app](https://pocket-pedia-tours--alexandrumadar1.replit.app/) built 100% into a clean, modern, single-page responsive static site ready to host on **GitHub Pages** with zero setup.

## 🌟 Live Demo / Hosting on GitHub Pages

This project is fully static and pre-packaged with all asset images stored locally. To host it:
1. Push this folder to a GitHub repository (e.g. `your-username/yourpocketwikipedia`).
2. Go to your repo's **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch** and set the branch to `main` (or `master`) and the folder to `/` (root).
4. Save, and within a minute your site will be live at `https://your-username.github.io/your-repo-name/`!

---

## 🛠️ Tech Stack & Features

- **Tailwind CSS (via CDN):** Complete customized design system matching the original color theme.
- **Lucide Icons (via CDN):** Elegant vector icons throughout the page.
- **Warm HSL Color Palette:**
  - Background: `hsl(34 30% 95%)` (Warm beige)
  - Foreground: `hsl(27 14% 15%)` (Dark brown/grey)
  - Primary: `hsl(11 60% 55%)` (Terracotta)
  - Secondary: `hsl(148 27% 24%)` (Deep forest green)
  - Accent: `hsl(35 83% 58%)` (Warm gold)
- **Responsive Mobile Side-Drawer Menu:** Slide-down menu with fully interactive toggle.
- **Premium Waitlist Modal:** Visually stunning and fully interactive email waitlist popup for "Experience the city like a puzzle." with validation and inline success/confirmation state.
- **Local Assets / Offline Resilience:** All images are hosted locally inside the `/images` folder, ensuring the site never breaks due to external hotlink changes.
- **Zero Build Step:** 100% vanilla, lightweight, lightning-fast loading, and zero deployment overhead.

---

## 📁 Project Structure

```
yourpocketwikipedia/
├── index.html            ← Main landing page (visually identical to Replit site)
├── images/               ← Locally hosted high-quality images
│   ├── pocketpedia-logo.jpg
│   ├── hero-map.jpg
│   ├── guide-portrait.jpg
│   ├── scavenger-hunt.jpg
│   ├── pocketpedia-1.jpg
│   ├── pocketpedia-2.jpg
│   └── pocketpedia-3.jpg
├── tour.html             ← Original tour detail page (retained)
├── app.js                ← Original tours loader script (retained)
├── styles.css            ← Original styles (retained)
└── README.md             ← This file
```

---

## 🚀 Local Development

To run and test the website locally, use any static file server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node (npm)
npx serve .
```

Then open `http://localhost:8000` in your browser.
