<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { SITE_URL } from '$lib/site';
  import { browser } from '$app/environment';
  import booksWithMetadata from '$lib/data/BooksWithMetadata.json';
  import collections from '$lib/data/collections.json';

  let { data } = $props();

  let activeCanon = $state('protestant');
  let activeSort = $state('canonical');
  let chapterHighlights = $state({});

  $effect(() => {
    // Triggers whenever data changes on navigation
    const bookName = data.bookName;
    const chapterNum = data.chapterNum;
    const displayName = data.displayName;

    if (!browser) return;

    const urlParams = new URLSearchParams(window.location.search);
    const paramCanon = urlParams.get('canon');
    const paramSort = urlParams.get('sort');

    if (paramCanon && collections[paramCanon]) {
      localStorage.setItem('selectedCanon', paramCanon);
    }
    if (paramSort && ['canonical', 'alphabetical', 'chronological'].includes(paramSort)) {
      localStorage.setItem('selectedSort', paramSort);
    }

    activeCanon = localStorage.getItem('selectedCanon') || 'protestant';
    activeSort = localStorage.getItem('selectedSort') || 'canonical';

    // Add to Recently Read list
    try {
      const historyStr = localStorage.getItem('recentlyRead') || '[]';
      let history = JSON.parse(historyStr);
      history = history.filter(item => !(item.bookName === bookName && item.chapterNum === chapterNum));
      history.unshift({
        bookName,
        displayName,
        chapterNum,
        timestamp: Date.now()
      });
      history = history.slice(0, 5);
      localStorage.setItem('recentlyRead', JSON.stringify(history));
    } catch (e) {
      console.warn('Could not update history:', e);
    }

    // Load active chapter highlights
    try {
      const highlightsStr = localStorage.getItem('bible-highlights') || '{}';
      const highlights = JSON.parse(highlightsStr);
      const chapterKey = `${bookName}-${chapterNum}`;
      chapterHighlights = highlights[chapterKey] || {};
    } catch (e) {
      chapterHighlights = {};
    }
  });

  let resolvedUrls = $derived.by(() => {
    const defaultResult = { prev: data.prevUrl, next: data.nextUrl };

    if (!browser) return defaultResult;

    const canonBooks = (collections[activeCanon] || collections['protestant']).books;

    let targetCanon = activeCanon;
    let targetBooks = canonBooks;
    if (!canonBooks.includes(data.bookName)) {
      targetCanon = 'all';
      targetBooks = collections['all'].books;
    }

    const availableBooks = targetBooks
      .map(name => booksWithMetadata.find(b => b.name === name))
      .filter(Boolean);

    availableBooks.sort((a, b) => {
      if (activeSort === 'alphabetical') {
        return a.displayName.localeCompare(b.displayName);
      }
      if (activeSort === 'chronological') {
        const diff = a.chronologicalOrder - b.chronologicalOrder;
        return diff !== 0 ? diff : a.canonicalOrder - b.canonicalOrder;
      }
      return a.canonicalOrder - b.canonicalOrder;
    });

    const currentIndex = availableBooks.findIndex(b => b.name === data.bookName);
    if (currentIndex === -1) return defaultResult;

    let prev = null;
    let next = null;

    if (data.chapterNum > 1) {
      prev = `/book/${data.bookName}/${data.chapterNum - 1}`;
    } else if (currentIndex > 0) {
      const prevBook = availableBooks[currentIndex - 1];
      prev = `/book/${prevBook.name}/${prevBook.chapterCount}`;
    }

    if (data.chapterNum < data.totalChapters) {
      next = `/book/${data.bookName}/${data.chapterNum + 1}`;
    } else if (currentIndex < availableBooks.length - 1) {
      const nextBook = availableBooks[currentIndex + 1];
      next = `/book/${nextBook.name}/1`;
    }

    const suffix = `?canon=${targetCanon}&sort=${activeSort}`;
    return {
      prev: prev ? `${prev}${suffix}` : null,
      next: next ? `${next}${suffix}` : null
    };
  });

  // Selected verses state
  let highlightedVerses = $state(new Set());
  let scrollPercent = $state(0);
  let drawnPart = $derived(848 + (283 * (scrollPercent / 100)));

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

  function fallbackCopy(text) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    } catch {
      return false;
    }
  }

  async function copyToClipboard(text, successMessage) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (!fallbackCopy(text)) {
        throw new Error('Clipboard API unavailable');
      }
      showToastMessage(successMessage);
      return true;
    } catch {
      showToastMessage('Could not copy automatically. Please copy manually.');
      return false;
    }
  }

  // Toggle verse selection
  function toggleVerseHighlight(verseNum) {
    // Prevent toggling the verse highlight if the user is drag-selecting text to copy
    if (browser) {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== '') {
        return;
      }
    }

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
  async function cite() {
    const citation = `${data.displayName} ${data.chapterNum}, King James Version.`;
    await copyToClipboard(citation, 'Chapter citation copied to clipboard!');
  }

  // Copy selected verses formatted
  async function copySelectedVerses() {
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
    await copyToClipboard(fullText, 'Selected verses copied to clipboard!');
  }

  // Generate share link with hash fragment
  async function shareSelectedVerses() {
    if (highlightedVerses.size === 0) return;
    const sortedSelected = Array.from(highlightedVerses).sort((a, b) => a - b);
    const hash = `v${sortedSelected.join(',')}`;
    const shareUrl = `${SITE_URL}/book/${data.bookName}/${data.chapterNum}#${hash}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.displayName} ${data.chapterNum} (KJV)`,
          text: `Read selected verses in ${data.displayName} ${data.chapterNum}.`,
          url: shareUrl
        });
        showToastMessage('Share dialog opened.');
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }

    await copyToClipboard(shareUrl, 'Shareable link copied to clipboard!');
  }

  // Download chapter JSON
  function download() {
    try {
      const json = JSON.stringify(data.verses, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.bookName}-${data.chapterNum}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToastMessage('Chapter downloaded successfully.');
    } catch {
      showToastMessage('Could not download chapter JSON.');
    }
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

  function highlightSelected(color) {
    if (highlightedVerses.size === 0) return;
    const bookName = data.bookName;
    const chapterNum = data.chapterNum;
    const chapterKey = `${bookName}-${chapterNum}`;

    try {
      const highlightsStr = localStorage.getItem('bible-highlights') || '{}';
      const highlights = JSON.parse(highlightsStr);
      
      if (!highlights[chapterKey]) {
        highlights[chapterKey] = {};
      }
      
      highlightedVerses.forEach(verseNum => {
        if (color) {
          highlights[chapterKey][verseNum] = color;
          chapterHighlights[verseNum] = color;
        } else {
          delete highlights[chapterKey][verseNum];
          delete chapterHighlights[verseNum];
        }
      });

      if (Object.keys(highlights[chapterKey]).length === 0) {
        delete highlights[chapterKey];
      }

      localStorage.setItem('bible-highlights', JSON.stringify(highlights));
      chapterHighlights = { ...chapterHighlights }; // trigger reactivity
      
      showToastMessage(color ? 'Selected verses highlighted!' : 'Selected highlights removed.');
      clearSelection();
    } catch (e) {
      console.warn('Could not save highlights:', e);
    }
  }

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

  let breadcrumbData = $derived({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": `${SITE_URL}/`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": data.displayName,
        "item": `${SITE_URL}/book/${data.bookName}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `Chapter ${data.chapterNum}`,
        "item": `${SITE_URL}/book/${data.bookName}/${data.chapterNum}`
      }
    ]
  });

  function handleGlobalKeyDown(e) {
    if (e.key === 'Escape' && highlightedVerses.size > 0) {
      clearSelection();
      e.stopPropagation();
    }
  }
</script>

<svelte:window onkeydown={handleGlobalKeyDown} />

<svelte:head>
  <title>{data.displayName} {data.chapterNum} | Cowee KJV</title>
  <meta name="description" content={`Read ${data.displayName} chapter ${data.chapterNum} from the King James Version of the Bible.`} />
  <meta property="og:type" content="article" />
  <meta property="og:title" content={`${data.displayName} ${data.chapterNum} | Cowee KJV`} />
  <meta property="og:description" content={`Read ${data.displayName} chapter ${data.chapterNum} from the King James Version of the Bible.`} />
  <meta property="og:url" content={`${SITE_URL}/book/${data.bookName}/${data.chapterNum}`} />
  <meta property="og:image" content={`${SITE_URL}/favicon/web-app-manifest-512x512.png`} />
  <link rel="canonical" href={`${SITE_URL}/book/${data.bookName}/${data.chapterNum}`} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={`${data.displayName} ${data.chapterNum} | Cowee KJV`} />
  <meta name="twitter:description" content={`Read ${data.displayName} chapter ${data.chapterNum} from the King James Version of the Bible.`} />
  <meta name="twitter:image" content={`${SITE_URL}/favicon/web-app-manifest-512x512.png`} />
  {@html `<script type="application/ld+json">${JSON.stringify(structuredData)}<\/script>`}
  {@html `<script type="application/ld+json">${JSON.stringify(breadcrumbData)}<\/script>`}
</svelte:head>

<nav class="chapter-sticky-header">
  <div class="nav-left">
    <a href="/book/{data.bookName}" class="back-link" data-sveltekit-preload-data="hover">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      <span class="back-text">{data.displayName}</span>
    </a>
  </div>

  <div class="chapter-nav">
    {#if resolvedUrls.prev}
      <a href={resolvedUrls.prev} class="nav-link" data-sveltekit-preload-data="hover">
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
      <svg class="sub-header-logo" viewBox="0 0 512 512" aria-hidden="true">
        <defs>
          <linearGradient id="subheader-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24" />
            <stop offset="50%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#b45309" />
          </linearGradient>
        </defs>
        
        <!-- Dynamic Progress Monogram Circle (starts at 75% for "C", grows to 100%) -->
        <circle cx="256" cy="256" r="180" fill="none" stroke="url(#subheader-gold-grad)" stroke-width="32" stroke-linecap="round" transform="rotate(-225 256 256)" stroke-dasharray="{drawnPart} 1131" />
        
        <!-- Open Book Pages (Translucent background) -->
        <path d="M 256 190 Q 210 160 160 180 L 160 315 Q 210 295 256 325 Z" fill="url(#subheader-gold-grad)" opacity="0.15" />
        <path d="M 256 190 Q 210 160 160 180 L 160 315 Q 210 295 256 325" stroke="url(#subheader-gold-grad)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <path d="M 256 190 Q 302 160 352 180 L 352 315 Q 302 295 256 325 Z" fill="url(#subheader-gold-grad)" opacity="0.15" />
        <path d="M 256 190 Q 302 160 352 180 L 352 315 Q 302 295 256 325" stroke="url(#subheader-gold-grad)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        
        <!-- Spine -->
        <line x1="256" y1="190" x2="256" y2="325" stroke="url(#subheader-gold-grad)" stroke-width="14" stroke-linecap="round" />
        
        <!-- Page details -->
        <path d="M 256 220 Q 220 195 180 210" stroke="url(#subheader-gold-grad)" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.75" />
        <path d="M 256 220 Q 292 195 332 210" stroke="url(#subheader-gold-grad)" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.75" />
        <path d="M 256 250 Q 220 225 180 240" stroke="url(#subheader-gold-grad)" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.75" />
        <path d="M 256 250 Q 292 225 332 240" stroke="url(#subheader-gold-grad)" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.75" />
        <path d="M 256 280 Q 220 255 180 270" stroke="url(#subheader-gold-grad)" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.75" />
        <path d="M 256 280 Q 292 255 332 270" stroke="url(#subheader-gold-grad)" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.75" />
      </svg>
      <a href="/book/{data.bookName}" class="title-link">{data.displayName} {data.chapterNum}</a>
    </h1>

    {#if resolvedUrls.next}
      <a href={resolvedUrls.next} class="nav-link" data-sveltekit-preload-data="hover">
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
        class:highlight-yellow={chapterHighlights[verse.verse] === 'yellow'}
        class:highlight-green={chapterHighlights[verse.verse] === 'green'}
        class:highlight-blue={chapterHighlights[verse.verse] === 'blue'}
        class:highlight-pink={chapterHighlights[verse.verse] === 'pink'}
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

    <div class="toolbar-highlight-colors">
      <button onclick={() => highlightSelected('yellow')} class="color-dot yellow" aria-label="Highlight in yellow" title="Highlight Yellow"></button>
      <button onclick={() => highlightSelected('green')} class="color-dot green" aria-label="Highlight in green" title="Highlight Green"></button>
      <button onclick={() => highlightSelected('blue')} class="color-dot blue" aria-label="Highlight in blue" title="Highlight Blue"></button>
      <button onclick={() => highlightSelected('pink')} class="color-dot pink" aria-label="Highlight in pink" title="Highlight Pink"></button>
      <button onclick={() => highlightSelected(null)} class="color-dot clear" aria-label="Clear highlight" title="Clear Highlights">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>

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
    top: calc(5rem + env(safe-area-inset-top));
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
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sub-header-logo {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: inline-block;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
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
      top: calc(4.25rem + env(safe-area-inset-top));
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

  .toolbar-highlight-colors {
    display: flex;
    gap: 0.45rem;
    align-items: center;
  }

  .color-dot {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    padding: 0;
    border: 1.5px solid var(--border-color);
    cursor: pointer;
    transition: transform 0.15s ease, border-color 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
  }

  .color-dot:hover {
    transform: scale(1.2);
    border-color: var(--text-color);
  }

  .color-dot.yellow { background-color: #fef08a; }
  .color-dot.green { background-color: #bbf7d0; }
  .color-dot.blue { background-color: #bfdbfe; }
  .color-dot.pink { background-color: #fbcfe8; }
  .color-dot.clear { 
    background-color: var(--background-color); 
    color: var(--text-color);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
</style>