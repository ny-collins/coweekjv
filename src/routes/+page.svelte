<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { SITE_URL } from '$lib/site';

  let { data } = $props();
  const defaultCanon = 'protestant';
  let searchTerm = $state('');
  let sortOrder = $state('canonical');
  let selectedCanon = $state(defaultCanon);

  let recentlyRead = $state([]);
  let bookmarks = $state([]);

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlCanon = urlParams.get('canon');
    
    if (!urlCanon) {
      const savedCanon = localStorage.getItem('selectedCanon');
      if (savedCanon && data.collections[savedCanon]) {
        selectedCanon = savedCanon;
      }
    } else {
      localStorage.setItem('selectedCanon', urlCanon);
    }
    
    const savedSort = localStorage.getItem('selectedSort');
    if (savedSort && ['canonical', 'alphabetical', 'chronological'].includes(savedSort)) {
      sortOrder = savedSort;
    }

    // Load reading history
    try {
      const historyStr = localStorage.getItem('recentlyRead') || '[]';
      recentlyRead = JSON.parse(historyStr);
    } catch (e) {}

    // Load bookmarks
    try {
      const highlightsStr = localStorage.getItem('bible-highlights') || '{}';
      const highlights = JSON.parse(highlightsStr);
      const tempBookmarks = [];
      
      for (const [bookChapterKey, versesObj] of Object.entries(highlights)) {
        const dashIndex = bookChapterKey.lastIndexOf('-');
        if (dashIndex === -1) continue;
        const bookName = bookChapterKey.slice(0, dashIndex);
        const chapterNum = bookChapterKey.slice(dashIndex + 1);
        
        const book = data.books.find(b => b.name === bookName);
        const displayName = book ? book.displayName : bookName;
        
        for (const [verseNum, color] of Object.entries(versesObj)) {
          if (color) {
            tempBookmarks.push({
              bookName,
              displayName,
              chapterNum,
              verseNum,
              color
            });
          }
        }
      }
      bookmarks = tempBookmarks.slice(-5).reverse();
    } catch (e) {}
  });

  $effect(() => {
    if (!browser) return;
    localStorage.setItem('selectedCanon', selectedCanon);
  });

  $effect(() => {
    if (!browser) return;
    localStorage.setItem('selectedSort', sortOrder);
  });

  $effect(() => {
    selectedCanon = data.canon;
  });

  $effect(() => {
    if (!browser) return;

    const safeCanon = data.collections[selectedCanon] ? selectedCanon : defaultCanon;

    if (safeCanon !== selectedCanon) {
      selectedCanon = safeCanon;
      return;
    }

    const url = new URL(window.location.href);
    if (url.searchParams.get('canon') === safeCanon) return;

    url.searchParams.set('canon', safeCanon);
    const nextUrl = `${url.pathname}?${url.searchParams.toString()}${url.hash}`;
    history.replaceState(history.state, '', nextUrl);
  });

  let canonBooks = $derived((data.collections[selectedCanon] ?? data.collections[defaultCanon]).books);

  let availableBooks = $derived(
    canonBooks.map(name => data.books.find(b => b.name === name)).filter(Boolean)
  );

  let filteredBooks = $derived(availableBooks.filter(book =>
    book.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortOrder === 'alphabetical') return a.displayName.localeCompare(b.displayName);
    if (sortOrder === 'chronological') {
      const diff = a.chronologicalOrder - b.chronologicalOrder;
      return diff !== 0 ? diff : a.canonicalOrder - b.canonicalOrder;
    }
    return a.canonicalOrder - b.canonicalOrder;
  }));

  let searchInput = $state();

  function highlightMatch(displayName, search) {
    if (!search) return displayName;
    const index = displayName.toLowerCase().indexOf(search.toLowerCase());
    if (index === -1) return displayName;
    const start = displayName.slice(0, index);
    const match = displayName.slice(index, index + search.length);
    const end = displayName.slice(index + search.length);
    return `${start}<mark class="search-highlight">${match}</mark>${end}`;
  }

  function handleGlobalKeyDown(e) {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (searchInput) searchInput.focus();
    }
    if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchTerm = '';
      searchInput.blur();
    }
  }

  let structuredData = $derived({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "KJV Bible",
    "url": `${SITE_URL}/`
  });
</script>

<svelte:window onkeydown={handleGlobalKeyDown} />

<svelte:head>
  <title>KJV Bible</title>
  <meta name="description" content="Read the King James Version of the Bible online." />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="KJV Bible" />
  <meta property="og:description" content="Read the King James Version of the Bible online." />
  <meta property="og:url" content={`${SITE_URL}/`} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="KJV Bible" />
  <meta name="twitter:description" content="Read the King James Version of the Bible online." />
  <script type="application/ld+json">
    {JSON.stringify(structuredData)}
  </script>
</svelte:head>

<div class="title-container">
  <h1 class="title">The Holy Bible</h1>
  <p class="subtitle">King James Version</p>
</div>

{#if recentlyRead.length > 0 || bookmarks.length > 0}
  <div class="dashboard-container">
    {#if recentlyRead.length > 0}
      <div class="dashboard-section">
        <h3>Recently Read</h3>
        <div class="history-pills">
          {#each recentlyRead as item}
            <a href="/book/{item.bookName}/{item.chapterNum}" class="history-pill" data-sveltekit-preload-data="hover">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              {item.displayName} {item.chapterNum}
            </a>
          {/each}
        </div>
      </div>
    {/if}

    {#if bookmarks.length > 0}
      <div class="dashboard-section">
        <h3>My Bookmarks</h3>
        <div class="bookmark-links">
          {#each bookmarks as bm}
            <a href="/book/{bm.bookName}/{bm.chapterNum}#v{bm.verseNum}" class="bookmark-link-pill highlight-{bm.color}" data-sveltekit-preload-data="hover">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
              {bm.displayName} {bm.chapterNum}:{bm.verseNum}
            </a>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}

<div class="controls-container">
  <div class="canon-container">
    <label for="canon-select">Canon:</label>
    <select id="canon-select" bind:value={selectedCanon}>
      {#each Object.entries(data.collections) as [key, { name }]}
        <option value={key}>{name}</option>
      {/each}
    </select>
  </div>

  <div class="search-container">
    <input type="text" id="book-search" placeholder="Search for a book... (Press '/' to focus)" aria-label="Search for a book" bind:value={searchTerm} bind:this={searchInput} />
  </div>

  <div class="sort-container">
    <label for="sort-order">Sort by:</label>
    <select id="sort-order" bind:value={sortOrder}>
      <option value="canonical">Canonical</option>
      <option value="alphabetical">Alphabetical</option>
      <option value="chronological">Chronological</option>
    </select>
  </div>
</div>

{#if filteredBooks.length > 0}
  <div class="book-list">
    {#if filteredBooks.some(b => b.testament === 'Old')}
      <div class="testament-group">
        <h2 class="testament-title">Old Testament</h2>
        <div class="books">
          {#each filteredBooks.filter(b => b.testament === 'Old') as book}
            {#if book.missing}
              <span class="book-link disabled" title="Text currently unavailable">{book.displayName}</span>
            {:else}
              <a href="/book/{book.name}" class="book-link" data-sveltekit-preload-data="hover">{@html highlightMatch(book.displayName, searchTerm)}</a>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    {#if filteredBooks.some(b => b.testament === 'New')}
      <div class="testament-group">
        <h2 class="testament-title">New Testament</h2>
        <div class="books">
          {#each filteredBooks.filter(b => b.testament === 'New') as book}
            {#if book.missing}
              <span class="book-link disabled" title="Text currently unavailable">{book.displayName}</span>
            {:else}
              <a href="/book/{book.name}" class="book-link" data-sveltekit-preload-data="hover">{@html highlightMatch(book.displayName, searchTerm)}</a>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    {#if filteredBooks.some(b => b.testament === 'Apocrypha')}
      <div class="testament-group">
        <h2 class="testament-title">Apocrypha</h2>
        <div class="books">
          {#each filteredBooks.filter(b => b.testament === 'Apocrypha') as book}
            {#if book.missing}
              <span class="book-link disabled" title="Text currently unavailable">{book.displayName}</span>
            {:else}
              <a href="/book/{book.name}" class="book-link" data-sveltekit-preload-data="hover">{@html highlightMatch(book.displayName, searchTerm)}</a>
            {/if}
          {/each}
        </div>
      </div>
    {/if}
  </div>
{:else}
  <div class="no-results">
    <p>No books found matching "{searchTerm}"</p>
  </div>
{/if}

<style>
  .title-container {
    text-align: center;
    margin-bottom: 3.5rem;
    padding-top: 1rem;
  }

  .title {
    font-size: 3.5rem;
    font-weight: 800;
    color: var(--text-color);
    margin: 0;
    letter-spacing: -0.03em;
  }

  .subtitle {
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--link-color);
    margin: 0.75rem 0 0 0;
    opacity: 0.9;
  }

  .controls-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    box-shadow: var(--card-shadow);
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 3rem;
    gap: 1.5em;
  }

  .search-container {
    flex-grow: 1;
    min-width: 250px;
  }

  input[type="text"] {
    width: 100%;
    padding: 0.75em 1.25em;
    font-size: 1rem;
    font-family: var(--font-ui);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background-color: var(--background-color);
    color: var(--text-color);
    transition: all 0.2s ease;
  }

  input[type="text"]:focus {
    outline: none;
    border-color: var(--link-color);
    box-shadow: 0 0 0 3px var(--glow-color);
  }

  .sort-container, .canon-container {
    display: flex;
    align-items: center;
    gap: 0.75em;
  }

  .sort-container label, .canon-container label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-color);
    opacity: 0.8;
  }

  select {
    padding: 0.75em 2em 0.75em 1em;
    font-size: 0.95rem;
    font-family: var(--font-ui);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background-color: var(--background-color);
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  select:focus {
    outline: none;
    border-color: var(--link-color);
    box-shadow: 0 0 0 3px var(--glow-color);
  }

  .book-list {
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .testament-group {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    box-shadow: var(--card-shadow);
    border-radius: 16px;
    padding: 2.25rem;
  }

  .testament-title {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0 0 2rem 0;
    text-align: center;
    position: relative;
    padding-bottom: 0.5rem;
  }

  .testament-title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 30px;
    height: 3px;
    background-color: var(--link-color);
    border-radius: 2px;
  }

  .books {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1.25rem;
  }

  @media (min-width: 1200px) {
    .books {
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    }
  }

  .book-link {
    display: block;
    padding: 1.25rem 1rem;
    text-align: center;
    background-color: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    text-decoration: none;
    color: var(--text-color);
    font-weight: 500;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .book-link:hover {
    background-color: var(--background-color);
    border-color: var(--link-color);
    color: var(--link-color);
    transform: translateY(-4px);
    box-shadow: 0 6px 20px var(--glow-color);
  }

  .no-results {
    text-align: center;
    padding: 4rem 2rem;
    border: 2px dashed var(--border-color);
    border-radius: 16px;
    color: var(--text-color);
    font-size: 1.2rem;
    background-color: var(--card-bg);
    box-shadow: var(--card-shadow);
  }

  .book-link.disabled {
    background-color: var(--background-color);
    color: var(--text-color);
    opacity: 0.35;
    cursor: not-allowed;
    border: 1px dashed var(--border-color);
    font-style: italic;
  }

  .book-link.disabled:hover {
    transform: none;
    box-shadow: none;
    border-color: var(--border-color);
  }

  /* Responsive Adjustments for Mobile Devices */
  @media (max-width: 768px) {
    .title-container {
      margin-bottom: 2.25rem;
      padding-top: 0.5rem;
    }

    .title {
      font-size: 2.5rem;
    }

    .subtitle {
      font-size: 0.85rem;
      letter-spacing: 0.2em;
    }

    .controls-container {
      flex-direction: column;
      align-items: stretch;
      gap: 1.25rem;
      padding: 1.25rem 1rem;
      margin-bottom: 2rem;
    }

    .search-container {
      min-width: 100%;
      order: -1; /* Display search input at the top */
    }

    .canon-container, .sort-container {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 0.4rem;
    }

    .canon-container label, .sort-container label {
      font-size: 0.85rem;
    }

    select {
      width: 100%;
      padding: 0.75em 1em;
    }

    .book-list {
      gap: 2rem;
    }

    .testament-group {
      padding: 1.5rem 1.25rem;
      border-radius: 12px;
    }

    .testament-title {
      font-size: 1.35rem;
      margin-bottom: 1.5rem;
    }
  }

  @media (max-width: 480px) {
    .title {
      font-size: 2.1rem;
    }

    .books {
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 0.85rem;
    }

    .book-link {
      padding: 1rem 0.75rem;
      font-size: 0.95rem;
      border-radius: 8px;
    }
  }

  .dashboard-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    box-shadow: var(--card-shadow);
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 2rem;
  }

  @media (min-width: 768px) {
    .dashboard-container {
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
  }

  .dashboard-section {
    display: flex;
    flex-direction: column;
  }

  .dashboard-section h3 {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
    color: var(--text-color);
    opacity: 0.65;
  }

  .history-pills, .bookmark-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .history-pill, .bookmark-link-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.85rem;
    font-size: 0.85rem;
    font-weight: 600;
    border-radius: 20px;
    background-color: var(--background-color);
    border: 1px solid var(--border-color);
    color: var(--text-color);
    transition: all 0.2s ease;
    text-decoration: none;
  }

  .history-pill:hover, .bookmark-link-pill:hover {
    border-color: var(--link-color);
    color: var(--link-color);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--glow-color);
  }

  .bookmark-link-pill.highlight-yellow { border-left: 3px solid #eab308; }
  .bookmark-link-pill.highlight-green { border-left: 3px solid #22c55e; }
  .bookmark-link-pill.highlight-blue { border-left: 3px solid #3b82f6; }
  .bookmark-link-pill.highlight-pink { border-left: 3px solid #ec4899; }
</style>
