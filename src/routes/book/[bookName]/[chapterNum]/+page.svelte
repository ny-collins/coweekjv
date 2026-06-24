<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  let { data } = $props();

  // Selected verses state
  let highlightedVerses = $state(new Set());
  let scrollPercent = $state(0);

  // Toast notification state
  let toastMessage = $state('');
  let showToast = $state(false);
  let toastTimeout;

  function showToastMessage(msg) {
    toastMessage = msg;
    showToast = true;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      showToast = false;
    }, 3000);
  }

  // Toggle verse selection
  function toggleVerseHighlight(verseNum) {
    if (highlightedVerses.has(verseNum)) {
      highlightedVerses.delete(verseNum);
    } else {
      highlightedVerses.add(verseNum);
    }
    highlightedVerses = new Set(highlightedVerses); // trigger reactivity
  }

  // Handle verse keyboard interactions for accessibility
  function handleVerseKeyDown(event, verseNum) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleVerseHighlight(verseNum);
    }
  }

  // Clear selection
  function clearSelection() {
    highlightedVerses = new Set();
  }

  // Standard chapter citation
  function cite() {
    const citation = `${data.displayName} ${data.chapterNum}, King James Version.`;
    navigator.clipboard.writeText(citation);
    showToastMessage('Chapter citation copied to clipboard!');
  }

  // Copy selected verses formatted
  function copySelectedVerses() {
    if (highlightedVerses.size === 0) return;
    const sortedSelected = Array.from(highlightedVerses).sort((a, b) => a - b);
    
    // Group contiguous verses into ranges
    let ranges = [];
    let start = sortedSelected[0];
    let prev = sortedSelected[0];
    for (let i = 1; i <= sortedSelected.length; i++) {
      const current = sortedSelected[i];
      if (current === prev + 1) {
        prev = current;
      } else {
        if (start === prev) {
          ranges.push(`${start}`);
        } else {
          ranges.push(`${start}-${prev}`);
        }
        start = current;
        prev = current;
      }
    }
    
    const citationRef = `${data.displayName} ${data.chapterNum}:${ranges.join(', ')} (KJV)`;
    
    const selectedTexts = sortedSelected.map(num => {
      const verseObj = data.verses.find(v => v.verse === num);
      return `${num} ${verseObj ? verseObj.text : ''}`;
    }).join('\n');
    
    const fullText = `"${selectedTexts}"\n\n— ${citationRef}`;
    navigator.clipboard.writeText(fullText);
    showToastMessage('Selected verses copied to clipboard!');
  }

  // Generate share link with hash fragment
  function shareSelectedVerses() {
    if (highlightedVerses.size === 0) return;
    const sortedSelected = Array.from(highlightedVerses).sort((a, b) => a - b);
    const hash = `v${sortedSelected.join(',')}`;
    const shareUrl = `${window.location.origin}${window.location.pathname}#${hash}`;
    navigator.clipboard.writeText(shareUrl);
    showToastMessage('Shareable link copied to clipboard!');
  }

  // Download chapter JSON
  function download() {
    const json = JSON.stringify(data.verses, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.bookName}-${data.chapterNum}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToastMessage('Chapter downloaded successfully.');
  }

  // Scroll progress listener and initial hash parsing
  $effect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        scrollPercent = (scrollTop / docHeight) * 100;
      } else {
        scrollPercent = 0;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  onMount(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#v')) {
      const verseNums = hash.substring(2).split(',').map(n => parseInt(n)).filter(n => !isNaN(n));
      verseNums.forEach(num => highlightedVerses.add(num));
      highlightedVerses = new Set(highlightedVerses);
      
      if (verseNums.length > 0) {
        setTimeout(() => {
          const el = document.getElementById(`v-${verseNums[0]}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 400);
      }
    }
  });

  let structuredData = $derived({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": `${data.displayName} ${data.chapterNum}`,
    "isPartOf": {
      "@type": "Book",
      "name": data.displayName
    },
    "text": data.verses ? data.verses.map(v => v.text).join(' ') : ''
  });
</script>

<svelte:head>
  <title>{data.displayName} {data.chapterNum} | KJV Bible</title>
  <meta name="description" content={`Read ${data.displayName} chapter ${data.chapterNum} from the King James Version of the Bible.`} />
  <script type="application/ld+json">
    {JSON.stringify(structuredData)}
  </script>
</svelte:head>

<nav class="chapter-sticky-header">
  <div class="nav-left">
    <a href="/book/{data.bookName}" class="back-link" data-sveltekit-preload-data="hover">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      <span class="back-text">{data.displayName}</span>
    </a>
  </div>

  <div class="chapter-nav">
    {#if data.prevUrl}
      <a href={data.prevUrl} class="nav-link" data-sveltekit-preload-data="hover">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        <span class="nav-text">Prev</span>
      </a>
    {:else}
      <span class="nav-link disabled">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        <span class="nav-text">Prev</span>
      </span>
    {/if}

    <h1 class="title-heading">
      <a href="/book/{data.bookName}" class="title-link">{data.displayName} {data.chapterNum}</a>
    </h1>

    {#if data.nextUrl}
      <a href={data.nextUrl} class="nav-link" data-sveltekit-preload-data="hover">
        <span class="nav-text">Next</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </a>
    {:else}
      <span class="nav-link disabled">
        <span class="nav-text">Next</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </span>
    {/if}
  </div>

  <div class="scroll-progress-container">
    <div class="scroll-progress-bar" style="width: {scrollPercent}%"></div>
  </div>
</nav>

<div class="actions">
  <button onclick={cite}>
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
    Cite Chapter
  </button>
  <button onclick={download}>
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
    Download JSON
  </button>
</div>

<div class="chapter-container">
  <article class="scripture-card">
    {#each data.verses as verse}
      <div 
        id="v-{verse.verse}" 
        class="verse"
        class:highlighted={highlightedVerses.has(verse.verse)}
        onclick={() => toggleVerseHighlight(verse.verse)}
        onkeydown={(e) => handleVerseKeyDown(e, verse.verse)}
        role="button"
        tabindex="0"
      >
        <span class="verse-num">{verse.verse}</span>
        {verse.text}
      </div>
    {/each}
  </article>

  <aside class="quick-nav-card">
    <div class="quick-nav">
      <h3>Quick Navigation</h3>
      <div class="chapter-list">
        {#each Array(data.totalChapters) as _, i}
          <a 
            href="/book/{data.bookName}/{i + 1}" 
            class:current={i + 1 === data.chapterNum}
            data-sveltekit-preload-data="hover"
          >
            {i + 1}
          </a>
        {/each}
      </div>
    </div>
  </aside>
</div>

{#if highlightedVerses.size > 0}
  <div class="floating-toolbar" transition:fly={{ y: 50, duration: 250 }}>
    <span class="selection-count">
      {highlightedVerses.size} {highlightedVerses.size === 1 ? 'verse' : 'verses'} selected
    </span>
    <div class="toolbar-divider"></div>
    <button onclick={copySelectedVerses} class="toolbar-btn" aria-label="Copy selected verses">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
      <span class="btn-text">Copy Text</span>
    </button>
    <button onclick={shareSelectedVerses} class="toolbar-btn" aria-label="Copy link to selected verses">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
      <span class="btn-text">Share Link</span>
    </button>
    <button onclick={clearSelection} class="toolbar-btn clear-btn" aria-label="Clear selection">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  </div>
{/if}

{#if showToast}
  <div class="page-toast" transition:fly={{ y: 20, duration: 200 }}>
    {toastMessage}
  </div>
{/if}

<style>
  .chapter-sticky-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background-color: var(--card-bg);
    box-shadow: var(--card-shadow);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    position: sticky;
    top: calc(0.5rem + env(safe-area-inset-top));
    z-index: 100;
    margin-bottom: 2rem;
    gap: 1rem;
  }

  .nav-left {
    display: flex;
    align-items: center;
  }

  .back-link {
    text-decoration: none;
    color: var(--link-color);
    font-weight: 600;
    font-size: 0.95rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    transition: color 0.2s, transform 0.2s;
  }

  .back-link:hover {
    color: var(--accent-color);
    transform: translateX(-2px);
  }

  .chapter-nav {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
  }

  .title-heading {
    font-size: inherit;
    margin: 0;
    padding: 0;
    font-weight: inherit;
    display: inline-block;
  }

  .title-link {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-color);
    text-decoration: none;
    transition: color 0.2s;
  }

  .title-link:hover {
    color: var(--link-color);
  }

  .nav-link {
    text-decoration: none;
    color: var(--link-color);
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    transition: background-color 0.2s, color 0.2s;
  }

  .nav-link:hover {
    background-color: var(--background-color);
  }

  .nav-link.disabled {
    color: var(--text-color);
    opacity: 0.3;
    pointer-events: none;
  }

  .scroll-progress-container {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: transparent;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
    overflow: hidden;
  }

  .scroll-progress-bar {
    height: 100%;
    background-color: var(--link-color);
    width: 0%;
    transition: width 0.1s ease-out;
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: 1.25rem;
    margin: 2rem 0;
  }

  .actions button {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    color: var(--text-color);
    cursor: pointer;
    padding: 0.65rem 1.25rem;
    border-radius: 8px;
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 0.95rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    transition: all 0.2s ease;
    box-shadow: var(--card-shadow);
  }

  .actions button:hover {
    border-color: var(--link-color);
    color: var(--link-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--glow-color);
  }

  .actions button svg {
    opacity: 0.8;
  }

  .chapter-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .scripture-card {
    flex: 3;
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    box-shadow: var(--card-shadow);
    border-radius: 16px;
    padding: 2.25rem;
  }

  .quick-nav-card {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    box-shadow: var(--card-shadow);
    border-radius: 16px;
    padding: 1.75rem;
    margin-top: 1rem;
  }

  @media (min-width: 1200px) {
    .chapter-container {
      flex-direction: row;
      align-items: flex-start;
    }

    .quick-nav-card {
      margin-top: 0;
      flex: 1;
      position: sticky;
      top: 100px;
    }
  }

  .quick-nav h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0 0 1.25rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .chapter-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
    gap: 0.5rem;
  }

  .chapter-list a {
    display: flex;
    justify-content: center;
    align-items: center;
    aspect-ratio: 1;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    text-decoration: none;
    color: var(--text-color);
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }

  .chapter-list a:hover {
    border-color: var(--link-color);
    color: var(--link-color);
    background-color: var(--background-color);
  }

  .chapter-list a.current {
    background-color: var(--link-color);
    color: #fff;
    border-color: var(--link-color);
  }

  .verse {
    font-family: var(--font-serif);
    font-size: 1.2rem;
    line-height: 2.1;
    margin-bottom: 0.5rem;
    position: relative;
    padding: 0.5rem 1rem 0.5rem 2.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.15s ease;
    outline: none; /* remove default blue focus outline for custom aesthetic */
  }

  .verse:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }

  :global(.dark-mode) .verse:hover {
    background-color: rgba(255, 255, 255, 0.02);
  }

  /* Focus indicator for keyboard navigation */
  .verse:focus-visible {
    background-color: rgba(0, 0, 0, 0.03);
    box-shadow: inset 2px 0 0 var(--accent-color);
  }

  :global(.dark-mode) .verse:focus-visible {
    background-color: rgba(255, 255, 255, 0.03);
    box-shadow: inset 2px 0 0 var(--accent-color);
  }

  .verse.highlighted {
    background-color: var(--glow-color);
    box-shadow: inset 4px 0 0 var(--accent-color);
  }

  .verse-num {
    position: absolute;
    left: 0.75rem;
    top: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--link-color);
    opacity: 0.75;
    font-family: var(--font-ui);
    user-select: none;
  }

  /* Floating micro-actions toolbar styles */
  .floating-toolbar {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    box-shadow: var(--card-shadow), 0 12px 40px rgba(0, 0, 0, 0.18);
    border-radius: 9999px;
    padding: 0.5rem 0.75rem 0.5rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 1000;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .selection-count {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-color);
    font-family: var(--font-ui);
    white-space: nowrap;
  }

  .toolbar-divider {
    width: 1px;
    height: 20px;
    background-color: var(--border-color);
  }

  .toolbar-btn {
    background-color: transparent;
    border: none;
    color: var(--text-color);
    font-family: var(--font-ui);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.5rem 0.85rem;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .toolbar-btn:hover {
    background-color: var(--background-color);
    color: var(--link-color);
  }

  .toolbar-btn svg {
    opacity: 0.8;
  }

  .clear-btn {
    padding: 0.5rem;
    color: var(--text-color);
    opacity: 0.6;
    border-radius: 50%;
  }

  .clear-btn:hover {
    opacity: 1;
    color: #e11d48;
    background-color: rgba(225, 29, 72, 0.1);
  }

  .page-toast {
    position: fixed;
    bottom: 6.5rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--text-color);
    color: var(--background-color);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    font-weight: 600;
    font-family: var(--font-ui);
    font-size: 0.95rem;
    pointer-events: none;
  }

  /* Responsive styles for Chapter Page */
  @media (max-width: 768px) {
    .chapter-sticky-header {
      padding: 0.6rem 1rem;
      top: calc(0.25rem + env(safe-area-inset-top));
      border-radius: 10px;
      margin-bottom: 1.5rem;
    }

    .back-text {
      display: none; /* Hide back book name to prevent overlap */
    }

    .nav-text {
      display: none; /* Hide Prev/Next text, showing only icons */
    }

    .nav-link {
      padding: 0.4rem;
    }

    .title-link {
      font-size: 1.05rem;
    }

    .actions {
      margin: 1.5rem 0;
      gap: 0.75rem;
    }

    .scripture-card {
      padding: 1.5rem 1.25rem;
      border-radius: 12px;
    }

    .quick-nav-card {
      padding: 1.25rem;
      border-radius: 12px;
    }
  }

  @media (max-width: 600px) {
    .verse {
      font-size: 1.1rem;
      line-height: 1.95;
      padding: 0.4rem 0.5rem 0.4rem 2rem;
    }

    .verse-num {
      left: 0.4rem;
      top: 0.4rem;
      font-size: 0.8rem;
    }

    .floating-toolbar {
      width: calc(100% - 1.5rem);
      max-width: 320px;
      justify-content: space-between;
      padding: 0.4rem 0.6rem 0.4rem 1rem;
      bottom: 1rem;
      gap: 0.5rem;
    }

    .btn-text {
      display: none; /* Hide button labels, showing icons only */
    }

    .toolbar-btn {
      padding: 0.5rem;
    }
    
    .page-toast {
      bottom: 5.5rem;
      padding: 0.6rem 1.2rem;
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    .actions {
      flex-direction: column;
      gap: 0.6rem;
      width: 100%;
    }

    .actions button {
      width: 100%;
      justify-content: center;
      padding: 0.6rem 1rem;
    }
  }
</style>