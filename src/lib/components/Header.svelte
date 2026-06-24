<script>
  import { onMount } from 'svelte';

  let darkMode = $state(false);
  let fontSize = $state(16);
  let deferredPrompt = $state(null);
  let showInstallButton = $state(false);

  onMount(() => {
    if (localStorage.getItem('darkMode') === 'true') {
      darkMode = true;
      document.documentElement.classList.add('dark-mode');
    }

    if (localStorage.getItem('fontSize')) {
      fontSize = parseInt(localStorage.getItem('fontSize'));
      document.documentElement.style.setProperty('--font-size', `${fontSize}px`);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallButton = true;
    });

    window.addEventListener('appinstalled', () => {
      showInstallButton = false;
      deferredPrompt = null;
    });
  });

  function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    document.documentElement.classList.toggle('dark-mode');
  }

  function increaseFontSize() {
    fontSize += 2;
    localStorage.setItem('fontSize', fontSize);
    document.documentElement.style.setProperty('--font-size', `${fontSize}px`);
  }

  function decreaseFontSize() {
    fontSize -= 2;
    localStorage.setItem('fontSize', fontSize);
    document.documentElement.style.setProperty('--font-size', `${fontSize}px`);
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
</script>

<header>
  <nav>
    <a href="/" class="logo">KJV Bible</a>
    <div class="controls">
      {#if showInstallButton}
        <button onclick={installApp} class="install-btn" aria-label="Install KJV Reader App">
          <span class="install-text-long">Install App</span>
          <span class="install-text-short">Install</span>
        </button>
      {/if}
      <button onclick={toggleDarkMode} class="theme-btn" aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
        {#if darkMode}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        {/if}
        <span class="theme-text">{darkMode ? 'Light' : 'Dark'}</span>
      </button>
      <button onclick={decreaseFontSize} aria-label="Decrease Font Size" class="font-btn">A-</button>
      <button onclick={increaseFontSize} aria-label="Increase Font Size" class="font-btn">A+</button>
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
  }

  .logo:hover {
    color: var(--link-color);
  }

  .controls {
    display: flex;
    gap: 0.75rem;
    align-items: center;
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

  .theme-btn svg {
    opacity: 0.8;
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

  /* Responsive Adjustments for Mobile Header */
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

    .theme-text, .install-text-long {
      display: none; /* Hide descriptive text on phone screens */
    }

    .install-text-short {
      display: inline;
    }
  }
</style>
