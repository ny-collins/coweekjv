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
    background-color: var(--background-color);
    border-bottom: 1px solid var(--border-color);
    padding: 1em 2em;
    padding-top: calc(1em + env(safe-area-inset-top));
  }

  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
    text-decoration: none;
  }

  .controls {
    display: flex;
    gap: 1em;
  }

  button {
    background-color: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-color);
    cursor: pointer;
    padding: 0.5em 1em;
    border-radius: 4px;
  }

  .install-btn {
    background-color: var(--text-color);
    color: var(--background-color);
    border: 1px solid var(--text-color);
    font-weight: 600;
  }
</style>
