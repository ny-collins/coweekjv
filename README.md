# King James Version Bible Reader

A high-performance, minimalist, and offline-capable Progressive Web Application (PWA) built with SvelteKit and Svelte 5 to read and navigate the King James Version of the Bible, including the Apocrypha.

A live deployment of the application is available at: https://kjv-bible-7mw.pages.dev/

---

## Features

### Comprehensive Canon Filtering
* **Dynamic Canon Support**: Users can filter books dynamically by Protestant Canon, Catholic Canon, Orthodox Canon, or view the Full Collection (All Books).
* **Graceful Missing Book Handling**: Works that are listed in historical canons but do not have digitised text (such as 3 Maccabees in the Apocrypha) are rendered as disabled cards to preserve structural completeness without introducing dead links.

### Advanced Navigation
* **Continuous Cross-Book Navigation**: Allows readers to navigate seamlessly from the last chapter of a book to the first chapter of the next canonical book, or from the first chapter of a book to the last chapter of the preceding one.
* **Dual Layout Quick Navigation**: Features a dynamic layout that provides vertical chapter quick-navigation on mobile screens and a sticky sidebar on wider viewports.

### Robust Progressive Web App (PWA) Integration
* **Offline Functionality**: Backed by a custom Service Worker that pre-caches the client-side app shell, dynamic data chunks, and static assets.
* **Self-Contained Pre-caching**: Resolves common pre-cache validation issues on static hosting environments by bypassing explicit 404 pages in the installer cache.
* **Dynamic Update Alerts**: Notifies users with an on-screen toast reload button when a new version of the application is available, triggering automatic cache invalidation and hot-reloading.
* **Notch and Safe-Area Support**: Fully accommodates modern mobile viewports using device safe-area CSS layout offsets.

### Reader Preferences and Actions
* **Persistent Display Configuration**: Options to toggle dark mode and adjust scripture font sizes. Settings are stored locally in the client's web storage (`localStorage`).
* **Academic Citation**: Fast, one-click copying of standard bibliographical references to the clipboard (e.g., "Genesis 1:1, King James Version.").
* **Structured Data Export**: Allows downloading individual chapters as formatted JSON documents containing structured verse metadata.

---

## Technical Architecture

The application is built on top of SvelteKit using the static adapter to produce a fully pre-rendered site, facilitating instant load times and compatibility with static hosting providers (such as Cloudflare Pages or GitHub Pages).

### File Structure
* `src/routes/+layout.svelte`: Core wrapper containing persistent header controls (Theme selector, font-size controls, installation button) and service worker state management.
* `src/routes/+page.svelte`: Home page. Contains the primary search query logic, sorting options (canonical or chronological order), canon filter, and the responsive grid of books.
* `src/routes/book/[bookName]/+page.svelte`: Mid-level index page displaying the available chapters for a selected book.
* `src/routes/book/[bookName]/[chapterNum]/+page.svelte`: Primary reading layout displaying the chapter scriptures, navigation buttons, and verse actions.
* `src/routes/sitemap.xml/+server.js`: Automatically generates a search engine indexable XML sitemap listing all book and chapter URLs dynamically.
* `src/service-worker.js`: Handles network proxy caching, static file indexing, and updates cache structures when new builds are deployed.
* `src/lib/data/`: Houses the text of the Bible parsed into isolated book JSON chunks, alongside canonical mappings and metadata in `BooksWithMetadata.json`.

### Static Pre-rendering Optimization
To avoid runtime overhead and network delays, SvelteKit pre-renders all routes at build time. The `entries()` API resolves the list of all valid books and chapters in `O(1)` time by reading from a unified static metadata structure (`BooksWithMetadata.json`), eliminating filesystem globs or dynamic disk reads during the compiler step.

### Chronological Sorting Order
When sorting chronologically, the application resolves composition timeline boundaries using composition estimates. If two books share the same approximate chronological era, a stable canonical sorting fallback is applied:
```javascript
const difference = a.chronologicalOrder - b.chronologicalOrder;
return difference !== 0 ? difference : a.canonicalOrder - b.canonicalOrder;
```

---

## Getting Started

### Prerequisites
* Node.js (version 20 or higher)
* npm (Node Package Manager)

### Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/ny-collins/kjv-bible.git
cd kjv-bible
npm install
```

### Local Development
To run the project locally with hot module replacement (HMR):
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173`.

### Production Build and Deployment
Build the static site output:
```bash
npm run build
```
This command compiles Svelte components, resolves prerendered static pages, registers the Service Worker, and saves the output directory as `build/`.

To preview the built static output locally:
```bash
npm run preview
```
This launches a local web server serving files directly from the `build/` directory, mimicking a production deployment environment.
