<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { fly } from 'svelte/transition';

  let showSettings = $state(false);
  let isHeaderHidden = $state(false);
  let showInstallButton = $state(false);
  let deferredPrompt = $state(null);

  // Reader Settings States
  let activeTheme = $state('light');
  let activeFont = $state('serif');
  let activeWidth = $state('medium');
  let fontSize = $state(16);

  const widthValues = {
    narrow: '650px',
    medium: '850px',
    wide: '1200px'
  };

  const themeColors = {
    light: '#fcfaf6',
    sepia: '#f4ecd8',
    slate: '#0f172a',
    dark: '#0c0e14'
  };

  let lastScrollY = 0;
  let scrollProgress = $state(0);
  let drawnPart = $derived(848 + (283 * (scrollProgress / 100)));

  onMount(() => {
    // 1. Initial State Loading
    const savedTheme = localStorage.getItem('selectedTheme');
    const oldDarkMode = localStorage.getItem('darkMode');
    
    if (savedTheme) {
      activeTheme = savedTheme;
    } else if (oldDarkMode === 'true') {
      activeTheme = 'dark';
    } else {
      activeTheme = 'light';
    }

    const savedFont = localStorage.getItem('selectedFont');
    if (savedFont) activeFont = savedFont;

    const savedWidth = localStorage.getItem('selectedWidth');
    if (savedWidth) activeWidth = savedWidth;

    const savedSize = localStorage.getItem('fontSize');
    if (savedSize) fontSize = parseInt(savedSize, 10);

    // Apply styles to documentElement
    applyTheme(activeTheme);
    applyFont(activeFont);
    applyWidth(activeWidth);
    applyFontSize(fontSize);

    // 2. Event Listeners
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Calculate scroll progress percentage (only dynamic if document is scrollable)
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        scrollProgress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
      } else {
        scrollProgress = 0;
      }

      // Close dropdown on scroll
      if (Math.abs(scrollY - lastScrollY) > 20) {
        showSettings = false;
      }

      // Keep header visible always because it hosts the progress monogram logo
      isHeaderHidden = false;
      lastScrollY = scrollY;
    };

    const handleDocumentClick = (e) => {
      if (showSettings) {
        const target = e.target;
        if (target && !target.closest('.settings-wrapper')) {
          showSettings = false;
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showSettings) {
        showSettings = false;
        e.stopPropagation();
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('click', handleDocumentClick);
    window.addEventListener('keydown', handleKeyDown);

    // PWA Install handlers
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallButton = true;
    });

    window.addEventListener('appinstalled', () => {
      showInstallButton = false;
      deferredPrompt = null;
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleDocumentClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  // Settings Apply Handlers
  function applyTheme(theme) {
    if (!browser) return;
    document.documentElement.classList.remove('dark-mode', 'sepia-mode', 'slate-mode');
    if (theme !== 'light') {
      document.documentElement.classList.add(`${theme}-mode`);
      if (theme === 'dark') {
        // Backwards compatibility for old scripts
        document.documentElement.classList.add('dark-mode');
      }
    }
    
    // Write meta tag theme color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', themeColors[theme] || '#fcfaf6');
    }
  }

  function applyFont(font) {
    if (!browser) return;
    document.documentElement.classList.remove('font-serif-reading', 'font-sans-reading', 'font-dyslexic-reading');
    document.documentElement.classList.add(`font-${font}-reading`);
  }

  function applyWidth(width) {
    if (!browser) return;
    document.documentElement.style.setProperty('--reading-width', widthValues[width]);
  }

  function applyFontSize(size) {
    if (!browser) return;
    document.documentElement.style.setProperty('--font-size', `${size}px`);
  }

  // Set Choice Triggers
  function selectTheme(theme) {
    activeTheme = theme;
    localStorage.setItem('selectedTheme', theme);
    // Backwards compatibility for app.html blocking script
    localStorage.setItem('darkMode', theme === 'dark' ? 'true' : 'false');
    applyTheme(theme);
  }

  function selectFont(font) {
    activeFont = font;
    localStorage.setItem('selectedFont', font);
    applyFont(font);
  }

  function selectWidth(width) {
    activeWidth = width;
    localStorage.setItem('selectedWidth', width);
    applyWidth(width);
  }

  function changeFontSize(amount) {
    fontSize = Math.min(Math.max(fontSize + amount, 12), 28);
    localStorage.setItem('fontSize', fontSize);
    applyFontSize(fontSize);
  }

  async function installApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt = null;
      showInstallButton = false;
    }
  }

  function toggleSettings() {
    showSettings = !showSettings;
  }
</script>

<header class:header-hidden={isHeaderHidden}>
  <nav>
    <a href="/" class="logo" onclick={() => showSettings = false}>
      <svg class="header-logo" viewBox="0 0 512 512" aria-hidden="true">
        <defs>
          <linearGradient id="header-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24" />
            <stop offset="50%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#b45309" />
          </linearGradient>
        </defs>
        
        <!-- Dynamic Progress Monogram Circle (starts at 75% for "C", grows to 100%) -->
        <circle cx="256" cy="256" r="180" fill="none" stroke="url(#header-gold-grad)" stroke-width="32" stroke-linecap="round" transform="rotate(-225 256 256)" stroke-dasharray="{drawnPart} 1131" />
        
        <!-- Open Book Pages (Translucent background) -->
        <path d="M 256 190 Q 210 160 160 180 L 160 315 Q 210 295 256 325 Z" fill="url(#header-gold-grad)" opacity="0.15" />
        <path d="M 256 190 Q 210 160 160 180 L 160 315 Q 210 295 256 325" stroke="url(#header-gold-grad)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <path d="M 256 190 Q 302 160 352 180 L 352 315 Q 302 295 256 325 Z" fill="url(#header-gold-grad)" opacity="0.15" />
        <path d="M 256 190 Q 302 160 352 180 L 352 315 Q 302 295 256 325" stroke="url(#header-gold-grad)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        
        <!-- Spine -->
        <line x1="256" y1="190" x2="256" y2="325" stroke="url(#header-gold-grad)" stroke-width="14" stroke-linecap="round" />
        
        <!-- Nested Page details -->
        <path d="M 256 220 Q 220 195 180 210" stroke="url(#header-gold-grad)" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.75" />
        <path d="M 256 220 Q 292 195 332 210" stroke="url(#header-gold-grad)" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.75" />
        <path d="M 256 250 Q 220 225 180 240" stroke="url(#header-gold-grad)" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.75" />
        <path d="M 256 250 Q 292 225 332 240" stroke="url(#header-gold-grad)" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.75" />
        <path d="M 256 280 Q 220 255 180 270" stroke="url(#header-gold-grad)" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.75" />
        <path d="M 256 280 Q 292 255 332 270" stroke="url(#header-gold-grad)" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.75" />
      </svg>
      <span>Cowee KJV</span>
    </a>
    <div class="controls">
      {#if showInstallButton}
        <button onclick={installApp} class="install-btn" aria-label="Install Cowee KJV App">
          <span class="install-text-long">Install App</span>
          <span class="install-text-short">Install</span>
        </button>
      {/if}
      
      <div class="settings-wrapper">
        <button onclick={toggleSettings} class="settings-btn" aria-label="Reader Settings" aria-expanded={showSettings}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 7 4 4 20 4 20 7"></polyline>
            <line x1="9" y1="20" x2="15" y2="20"></line>
            <line x1="12" y1="4" x2="12" y2="20"></line>
          </svg>
          <span class="btn-label">Settings</span>
        </button>

        {#if showSettings}
          <div class="settings-dropdown" transition:fly={{ y: 10, duration: 150 }} role="dialog" aria-label="Reader settings">
            <!-- Theme select -->
            <div class="settings-section">
              <span class="section-label">Theme</span>
              <div class="theme-options">
                <button onclick={() => selectTheme('light')} class="theme-circle light" class:active={activeTheme === 'light'} aria-label="Light theme" title="Light Theme"></button>
                <button onclick={() => selectTheme('sepia')} class="theme-circle sepia" class:active={activeTheme === 'sepia'} aria-label="Sepia theme" title="Sepia Theme"></button>
                <button onclick={() => selectTheme('slate')} class="theme-circle slate" class:active={activeTheme === 'slate'} aria-label="Slate theme" title="Slate Theme"></button>
                <button onclick={() => selectTheme('dark')} class="theme-circle dark" class:active={activeTheme === 'dark'} aria-label="Dark theme" title="Dark Theme"></button>
              </div>
            </div>

            <!-- Font Size controls -->
            <div class="settings-section">
              <span class="section-label">Text Size</span>
              <div class="font-size-controls">
                <button onclick={() => changeFontSize(-2)} class="control-btn" aria-label="Decrease font size">A-</button>
                <span class="size-display">{fontSize}px</span>
                <button onclick={() => changeFontSize(2)} class="control-btn" aria-label="Increase font size">A+</button>
              </div>
            </div>

            <!-- Font Family selection -->
            <div class="settings-section">
              <span class="section-label">Font Family</span>
              <div class="font-options">
                <button onclick={() => selectFont('serif')} class="font-btn select-serif" class:active={activeFont === 'serif'}>Serif</button>
                <button onclick={() => selectFont('sans')} class="font-btn select-sans" class:active={activeFont === 'sans'}>Sans</button>
                <button onclick={() => selectFont('dyslexic')} class="font-btn select-dyslexic" class:active={activeFont === 'dyslexic'}>Dyslexic</button>
              </div>
            </div>

            <!-- Page reading width -->
            <div class="settings-section">
              <span class="section-label">Reading Width</span>
              <div class="width-options">
                <button onclick={() => selectWidth('narrow')} class="width-btn" class:active={activeWidth === 'narrow'}>Narrow</button>
                <button onclick={() => selectWidth('medium')} class="width-btn" class:active={activeWidth === 'medium'}>Medium</button>
                <button onclick={() => selectWidth('wide')} class="width-btn" class:active={activeWidth === 'wide'}>Wide</button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </nav>
</header>

<style>
  header {
    background-color: var(--card-bg);
    border-bottom: 1px solid var(--border-color);
    padding: 1rem 2rem;
    padding-top: calc(1rem + env(safe-area-inset-top));
    box-shadow: var(--card-shadow);
  }

  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1400px;
    margin: 0 auto;
  }

  .logo {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--text-color);
    text-decoration: none;
    transition: color 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .logo:hover {
    color: var(--link-color);
  }

  .header-logo {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    display: inline-block;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .controls {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .settings-wrapper {
    position: relative;
    display: inline-block;
  }

  button {
    background-color: var(--background-color);
    border: 1px solid var(--border-color);
    color: var(--text-color);
    cursor: pointer;
    padding: 0.55rem 1rem;
    border-radius: 8px;
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  button:hover {
    border-color: var(--link-color);
    color: var(--link-color);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--glow-color);
  }

  .install-btn {
    background-color: var(--link-color);
    color: #fff;
    border-color: var(--link-color);
  }

  .install-btn:hover {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
    color: #fff;
  }

  .install-text-short {
    display: none;
  }

  /* Dropdown panel container */
  .settings-dropdown {
    position: absolute;
    top: calc(100% + 0.65rem);
    right: 0;
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: var(--card-shadow), 0 10px 30px rgba(0, 0, 0, 0.15);
    width: 280px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
    z-index: 200;
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
    color: var(--text-color);
    opacity: 0.65;
  }

  /* Themes selector */
  .theme-options {
    display: flex;
    gap: 0.75rem;
  }

  .theme-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    padding: 0;
    border: 2px solid transparent;
    cursor: pointer;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
    position: relative;
  }

  .theme-circle.active {
    border-color: var(--link-color);
    transform: scale(1.1);
  }

  .theme-circle.light { background-color: #fcfaf6; border-color: #e6e0d5; }
  .theme-circle.sepia { background-color: #f4ecd8; border-color: #e4d8be; }
  .theme-circle.slate { background-color: #1e293b; border-color: #334155; }
  .theme-circle.dark { background-color: #0c0e14; border-color: #1e293b; }

  .theme-circle.light.active { border-color: #8b1e0f; }
  .theme-circle.sepia.active { border-color: #8b1e0f; }
  .theme-circle.slate.active { border-color: #38bdf8; }
  .theme-circle.dark.active { border-color: #e2b13c; }

  /* Font size panel */
  .font-size-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.25rem;
  }

  .font-size-controls .control-btn {
    border: none;
    background-color: transparent;
    padding: 0.4rem 0.8rem;
    box-shadow: none;
    font-size: 0.95rem;
  }

  .font-size-controls .control-btn:hover {
    transform: none;
    background-color: var(--card-bg);
  }

  .size-display {
    font-weight: 700;
    font-size: 0.95rem;
    font-family: var(--font-ui);
  }

  /* Fonts family list */
  .font-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;
  }

  .font-options .font-btn {
    justify-content: center;
    padding: 0.45rem 0.25rem;
    font-size: 0.8rem;
    border-radius: 6px;
  }

  .font-options .font-btn.active {
    background-color: var(--link-color);
    color: #fff;
    border-color: var(--link-color);
  }

  .select-serif { font-family: var(--font-serif); font-weight: 500; }
  .select-sans { font-family: var(--font-ui); font-weight: 500; }
  .select-dyslexic { font-family: 'OpenDyslexic', 'Comic Neue', sans-serif; font-weight: bold; }

  /* Read width list */
  .width-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;
  }

  .width-options .width-btn {
    justify-content: center;
    padding: 0.45rem 0.25rem;
    font-size: 0.8rem;
    border-radius: 6px;
  }

  .width-options .width-btn.active {
    background-color: var(--link-color);
    color: #fff;
    border-color: var(--link-color);
  }

  /* Responsive styling updates */
  @media (max-width: 600px) {
    header {
      padding: 0.75rem 1rem;
      padding-top: calc(0.75rem + env(safe-area-inset-top));
    }

    .logo {
      font-size: 1.25rem;
    }

    .controls {
      gap: 0.5rem;
    }

    button {
      padding: 0.5rem 0.65rem;
      font-size: 0.85rem;
      border-radius: 6px;
    }

    .btn-label, .install-text-long {
      display: none;
    }

    .install-text-short {
      display: inline;
    }

    .settings-dropdown {
      width: 250px;
      right: 0px;
    }
  }
</style>
