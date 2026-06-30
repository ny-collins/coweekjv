# Cowee KJV Bible Reader

A high-performance, minimalist, and offline-capable Progressive Web Application (PWA) built with SvelteKit and Svelte 5 to read and navigate the King James Version of the Bible, including the Apocrypha.

Live Deployment: https://coweekjv.pages.dev/

---

## Key Features

* **Progressive Web App (PWA)**: Installable on iOS, Android, and desktop. Safe-area margins accommodate modern device viewports and notches.
* **Offline Caching**: Built with a custom Service Worker that pre-caches the client-side app shell, dynamic data chunks, and static assets. Bypasses 404 installation issues and cleans headers automatically to prevent Firefox load errors.
* **Dynamic Update Alerts**: Instantly alerts the user with an on-screen toast reload button when a new build is deployed, facilitating seamless cache invalidation.
* **Flexible Canon Filters**: Dynamically switch the active view between the Protestant Canon, Catholic Canon, Orthodox Canon, or all books (including the Apocrypha).
* **Continuous Book Navigation**: Fluidly navigate from the last chapter of a book to the first chapter of the next canonical book, preserving URL-state parameters.
* **Aesthetics and Customization**: Curated color themes (Light, Sepia, Dark, and Slate) with a custom progress monogram logo, adjustable font sizes, reading widths, and typography options (including OpenDyslexic support).
* **Academic Citation and Sharing**: Copy formatted biblical citations to the clipboard instantly, share specific highlighted verses via deep-linked fragment hashes (e.g. #v1,2,3), or download chapter text as structured JSON files.

---

## Technical Architecture

The application is built on SvelteKit using static pre-rendering to produce a fast, static website optimized for hosting on Cloudflare Pages.

### Core Technologies
* **Framework**: SvelteKit (v2) with Svelte 5 ($state, $derived, and $effect runes)
* **Vite**: Hot Module Replacement (HMR) and static code compilation
* **Adapter**: @sveltejs/adapter-static for compiling the site into a fully pre-rendered static folder
* **Styling**: Vanilla CSS with custom properties for instant theme application
* **Database**: Decentralized local JSON database split by book (located in src/lib/data/)

---

## Project Structure

```
coweekjv/
├── src/
│   ├── lib/
│   │   ├── components/       # Reusable layout UI components (Header, Footer)
│   │   ├── data/             # Static Bible text JSON database & canonical metadata
│   │   └── site.js           # Production URL configurations
│   ├── routes/
│   │   ├── book/[bookName]/  # Book chapter index route
│   │   │   └── [chapterNum]/ # Primary reading screen with verse actions
│   │   ├── +layout.svelte    # Global app shell (PWA handlers, splash manager, update toast)
│   │   ├── +page.svelte      # Homepage (filter, search, and dynamic books grid)
│   │   └── sitemap.xml/      # Dynamic sitemap.xml generator for search engines
│   ├── app.html              # Core HTML structure and instant theme preloader
│   ├── app.css               # Global stylesheets & color palette configurations
│   └── service-worker.js     # Custom background asset caching and sync manager
├── static/                   # Static public assets (Favicon pack, PWA manifests, robots.txt)
├── svelte.config.js          # Svelte configuration
├── vite.config.js            # Vite bundler configurations
└── package.json              # Package manifest and dependencies
```

---

## Getting Started

### Prerequisites
* Node.js (v20.19+ or v22.12+)
* npm (Node Package Manager)

### Installation
Clone the repository and install the project dependencies:
```bash
git clone https://github.com/ny-collins/kjv-bible.git
cd kjv-bible
npm install
```

### Development
Launch the local development server with Hot Module Replacement:
```bash
npm run dev
```
Open http://localhost:5173 in your web browser.

### Production Build and Local Preview
1. Compile the Svelte components and pre-render all static HTML routes:
   ```bash
   npm run build
   ```
   This generates the fully compiled static assets in the `build/` directory.
2. Preview the compiled production build locally to test service workers and offline behaviors:
   ```bash
   npm run preview
   ```

---

## Deployment

The project is pre-configured to build and deploy to Cloudflare Pages as a static project.

When setting up your build commands on Cloudflare Pages:
* **Framework preset**: SvelteKit
* **Build command**: npm run build
* **Build output directory**: build
* **Environment variables** (Optional):
  * `PUBLIC_SITE_URL` = https://coweekjv.pages.dev
