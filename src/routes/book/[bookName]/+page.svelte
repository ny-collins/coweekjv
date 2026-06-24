<script>
  let { data } = $props();

  let structuredData = $derived({
    "@context": "https://schema.org",
    "@type": "Book",
    "name": data.displayName,
    "hasPart": (data.chapters || []).map(chapter => ({
      "@type": "CreativeWork",
      "name": `${data.displayName} ${chapter}`
    }))
  });
</script>

<svelte:head>
  <title>{data.displayName} | KJV Bible</title>
  <meta name="description" content={`Read the book of ${data.displayName} from the King James Version of the Bible.`} />
  {#if data.chapters}
    <script type="application/ld+json">
      {JSON.stringify(structuredData)}
    </script>
  {/if}
</svelte:head>

<div class="book-index-container">
  <a href="/" class="back-link" data-sveltekit-preload-data="hover">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
    Back to Books
  </a>

  <h1 class="title">{data.displayName}</h1>

  {#if data.chapters && data.chapters.length > 0}
    <div class="chapter-list">
      {#each data.chapters as chapter}
        <a href="/book/{data.bookName}/{chapter}" class="chapter-link" data-sveltekit-preload-data="hover">
          Chapter {chapter}
        </a>
      {/each}
    </div>
  {:else}
    <p class="empty-message">The text for this book is currently unavailable.</p>
  {/if}
</div>

<style>
  .book-index-container {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    box-shadow: var(--card-shadow);
    border-radius: 16px;
    padding: 2.25rem;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 2rem;
    color: var(--link-color);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95rem;
    transition: color 0.2s, transform 0.2s;
  }

  .back-link:hover {
    color: var(--accent-color);
    transform: translateX(-4px);
  }

  .title {
    text-align: center;
    font-size: 2.75rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-color);
    margin: 0 0 3rem 0;
    position: relative;
    padding-bottom: 0.75rem;
  }

  .title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 45px;
    height: 4px;
    background-color: var(--link-color);
    border-radius: 2px;
  }

  .chapter-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 1rem;
  }

  @media (min-width: 768px) {
    .chapter-list {
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 1.25rem;
    }
  }

  .chapter-link {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1.25rem 1rem;
    text-align: center;
    background-color: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    text-decoration: none;
    color: var(--text-color);
    font-weight: 500;
    font-size: 1.05rem;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .chapter-link:hover {
    background-color: var(--background-color);
    border-color: var(--link-color);
    color: var(--link-color);
    transform: translateY(-4px);
    box-shadow: 0 6px 20px var(--glow-color);
  }

  .empty-message {
    text-align: center;
    color: var(--text-color);
    opacity: 0.7;
    font-style: italic;
    margin: 2rem 0;
  }

  /* Responsive styling for Book Index Page */
  @media (max-width: 768px) {
    .book-index-container {
      padding: 1.5rem 1.25rem;
      border-radius: 12px;
    }

    .back-link {
      margin-bottom: 1.5rem;
    }

    .title {
      font-size: 2rem;
      margin-bottom: 2.25rem;
      padding-bottom: 0.6rem;
    }

    .chapter-list {
      grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
      gap: 0.75rem;
    }

    .chapter-link {
      padding: 1rem 0.5rem;
      font-size: 0.95rem;
      border-radius: 8px;
    }
  }
</style>
