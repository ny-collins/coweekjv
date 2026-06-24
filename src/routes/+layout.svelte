<script>
  import { onMount } from 'svelte';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import '../app.css';

  let { children } = $props();
  let showUpdateToast = $state(false);

  onMount(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        showUpdateToast = true;
      });
    }
  });

  function reloadPage() {
    window.location.reload();
  }
</script>

<a href="#main-content" class="skip-link">Skip to main content</a>

<Header />

<main id="main-content">
  {@render children()}
</main>

<Footer />

{#if showUpdateToast}
  <div class="update-toast" role="alert">
    <span>A new version is available!</span>
    <button onclick={reloadPage} aria-label="Reload page to update">Reload</button>
  </div>
{/if}

<style>
  :global(.skip-link) {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    z-index: 100;
  }

  :global(.skip-link:focus) {
    top: 0;
  }

  .update-toast {
    position: fixed;
    bottom: 2em;
    right: 2em;
    background-color: var(--text-color);
    color: var(--background-color);
    padding: 1em 1.5em;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 1em;
    z-index: 1000;
    font-weight: 500;
  }

  .update-toast button {
    background-color: var(--background-color);
    color: var(--text-color);
    border: 1px solid var(--background-color);
    cursor: pointer;
    padding: 0.5em 1em;
    border-radius: 4px;
    font-weight: 600;
    transition: opacity 0.2s;
  }

  .update-toast button:hover {
    opacity: 0.9;
  }
</style>
