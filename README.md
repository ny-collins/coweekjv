# King James Version Bible Reader

A minimalist, high-performance Progressive Web Application (PWA) built with SvelteKit and Svelte 5 to read and navigate the King James Version of the Bible (including the Apocrypha).

A live preview is available at: https://kjv-bible-7mw.pages.dev/

---

## Features

* **Complete Canon Filtering**: Supports Protestant Canon, Catholic Canon, Orthodox Canon, and the Full Collection (All Books), updated dynamically on the client.
* **Responsive Sidebar & Navigation**: Features a dynamic layout that provides vertical chapter quick-navigation on mobile screens and a sticky sidebar on wider viewports.
* **Continuous Cross-Book Navigation**: Seamlessly transition from the last chapter of one book to the first chapter of the next book, or from the first chapter to the last chapter of the previous book.
* **Progressive Web App (PWA) Support**: 
  * Full offline capability powered by a custom Service Worker that pre-caches the client-side app shell, static assets, and dynamic book data chunks.
  * Adaptive design respecting device safe-area insets (notches).
  * Custom PWA installation prompt in the header controls.
  * Automated background updates with an on-screen toast reload notification.
* **Display Controls**: Dark mode preference toggle and font-size adjustments that persist in client localStorage.
* **Actionable Verses**: Provides options to copy formatted citation text to the clipboard and download individual chapters as structured JSON files.

---

## Project Structure

The project follows the standard SvelteKit routing conventions:

* `/src/routes/+layout.svelte`: Main layout file handling the global wrapper, header controls, footer layout, and service worker update notifications.
* `/src/routes/+page.svelte`: Home page displaying the canon catalog, search bar, sort filters, and testament book index.
* `/src/routes/book/[bookName]/+page.svelte`: Book chapter listing view.
* `/src/routes/book/[bookName]/[chapterNum]/+page.svelte`: Chapter reading interface with quick navigation and copy/download controls.
* `/src/routes/sitemap.xml/+server.js`: Dynamic XML sitemap generator.
* `/src/service-worker.js`: Custom service worker implementing Cache-First and Network-First caching logic.
* `/src/lib/data/`: JSON database files containing KJV Bible and Apocrypha text structure.

---

## Getting Started

### Prerequisites

Ensure you have Node.js (version 20 or higher) installed on your system.

### Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### Development

Run the local development server:

```bash
npm run dev
```

The application will be served locally at `http://localhost:5173`.

### Production Build

Build the static site output:

```bash
npm run build
```

This compiles the Svelte components, resolves prerendered static pages, registers the Service Worker, and outputs the production-ready static site files into the `build/` directory.

### Preview Build

Preview the built static files locally:

```bash
npm run preview
```
