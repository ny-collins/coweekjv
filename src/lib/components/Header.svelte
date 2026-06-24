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
        <button onclick={installApp} class="install-btn" aria-label="Install KJV Reader App">Install App</button>
      {/if}
      <button onclick={toggleDarkMode} aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>{darkMode ? 'Light Mode' : 'Dark Mode'}</button>
      <button onclick={decreaseFontSize} aria-label="Decrease Font Size">A-</button>
      <button onclick={increaseFontSize} aria-label="Increase Font Size">A+</button>
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
</style>
