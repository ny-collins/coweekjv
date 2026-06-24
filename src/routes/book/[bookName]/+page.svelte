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

<a href="/" class="back-link" data-sveltekit-preload-data="hover">← Back to Books</a>
<h1 class="title">{data.displayName}</h1>

{#if data.chapters && data.chapters.length > 0}
  <div class="chapter-list">
    {#each data.chapters as chapter}
      <a href="/book/{data.bookName}/{chapter}" class="chapter-link" data-sveltekit-preload-data="hover">Chapter {chapter}</a>
    {/each}
  </div>
{:else}
  <p style="text-align: center; color: var(--text-color);">The text for this book is currently unavailable.</p>
{/if}

<style>
  .back-link {
    display: block;
    margin-bottom: 2rem;
    color: var(--link-color);
    text-decoration: none;
  }

  .title {
    text-align: center;
    font-size: 2.5rem;
    color: var(--text-color);
    margin-bottom: 2rem;
  }

  .chapter-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1em;
  }

  @media (min-width: 1200px) {
    .chapter-list {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
  }

  .chapter-link {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1.5em 1em;
    text-align: center;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    text-decoration: none;
    color: var(--text-color);
    transition: background-color 0.2s, color 0.2s;
    font-size: 1.1rem;
  }

  .chapter-link:hover {
    background-color: var(--text-color);
    color: var(--background-color);
  }
</style>
