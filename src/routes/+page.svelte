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
    margin-bottom: 2rem;
  }

  .title {
    font-size: 3rem;
    color: var(--text-color);
    margin: 0;
  }

  .subtitle {
    font-size: 1.5rem;
    color: var(--text-color);
    margin: 0;
  }

  .controls-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1em;
  }

  .search-container {
    flex-grow: 1;
  }

  input[type="text"] {
    width: 100%;
    padding: 0.5em;
    font-size: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--background-color);
    color: var(--text-color);
  }

  .sort-container, .canon-container {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }

  select {
    padding: 0.5em;
    font-size: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--background-color);
    color: var(--text-color);
  }

  .book-list {
    display: flex;
    flex-direction: column;
    gap: 2em;
  }

  .testament-group {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1em;
  }

  .testament-title {
    font-size: 1.5rem;
    color: var(--text-color);
    margin: 0 0 1em 0;
    text-align: center;
  }

  .books {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1em;
  }

  @media (min-width: 1200px) {
    .books {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
  }

  .book-link {
    display: block;
    padding: 1em;
    text-align: center;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    text-decoration: none;
    color: var(--text-color);
    transition: background-color 0.2s, color 0.2s;
  }

  .book-link:hover {
    background-color: var(--text-color);
    color: var(--background-color);
  }

  .no-results {
    text-align: center;
    padding: 3em;
    border: 1px dashed var(--border-color);
    border-radius: 8px;
    color: var(--text-color);
    font-size: 1.2rem;
  }

  .book-link.disabled {
    background-color: var(--border-color);
    color: #999;
    cursor: not-allowed;
    opacity: 0.6;
    border: 1px dashed var(--border-color);
  }
</style>
