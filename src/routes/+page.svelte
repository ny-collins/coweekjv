<script>
  import { onMount } from 'svelte';

  let { data } = $props();
  let searchTerm = $state('');
  let sortOrder = $state('canonical');
  let selectedCanon = $state(data.canon);

  $effect(() => {
    selectedCanon = data.canon;
  });

  let availableBooks = $derived(
    data.collections[selectedCanon].books.map(name => data.books.find(b => b.name === name)).filter(Boolean)
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

  let structuredData = $derived({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "KJV Bible",
    "url": "https://kjv-bible-7mw.pages.dev/"
  });
</script>

<svelte:head>
  <title>KJV Bible</title>
  <meta name="description" content="Read the King James Version of the Bible online." />
  <script type="application/ld+json">
    {JSON.stringify(structuredData)}
  </script>
</svelte:head>

<div class="title-container">
  <h1 class="title">The Holy Bible</h1>
  <p class="subtitle">King James Version</p>
</div>

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
    <input type="text" id="book-search" placeholder="Search for a book..." aria-label="Search for a book" bind:value={searchTerm} />
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
              <a href="/book/{book.name}" class="book-link" data-sveltekit-preload-data="hover">{book.displayName}</a>
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
              <a href="/book/{book.name}" class="book-link" data-sveltekit-preload-data="hover">{book.displayName}</a>
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
              <a href="/book/{book.name}" class="book-link" data-sveltekit-preload-data="hover">{book.displayName}</a>
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
</style>
