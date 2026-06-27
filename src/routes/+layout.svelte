<script>
  import { dev } from '$app/environment';
  import { onMount } from 'svelte';
  import { SITE_URL } from '$lib/site';
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import '../app.css';

  function handleGlobalKeyDown(event) {
    if (event.key === 'Escape') {
      const splash = document.getElementById('app-splash-screen');
      if (!splash && $page.url.pathname !== '/') {
        event.preventDefault();
        goto('/');
      }
    }
  }

  let { children } = $props();
  let showUpdateToast = $state(false);
  let registration = null;

  onMount(() => {
    // 0. Fade out and remove the instant PWA splash screen
    const splash = document.getElementById('app-splash-screen');
    if (splash) {
      const minDuration = 2500; // Enforce a 2.5s minimum display time for visual branding presence
      const elapsedTime = Date.now() - (window.appStartTime || Date.now());
      const delay = Math.max(0, minDuration - elapsedTime);

      setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => {
          splash.style.visibility = 'hidden';
          splash.remove();
        }, 300); // Wait for transition fade-out to finish
      }, delay);
    }

    // 1. Recover gracefully if a dynamic chunk preloading fails (common during deployments)
    const handlePreloadError = () => {
      console.warn('Chunk loading failed, reloading page to fetch latest build...');
      window.location.reload();
    };
    window.addEventListener('vite:preloadError', handlePreloadError);

    // 2. Service Worker Registration Lifecycle
    if (!('serviceWorker' in navigator) || dev) return;

    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => {
        registration = reg;

        // Check if there is already a service worker waiting in the background
        if (registration.waiting) {
          showUpdateToast = true;
        }

        // Listen for new service workers installing
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New worker is installed and waiting to take over
                showUpdateToast = true;
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[ServiceWorker] Registration failed:', err);
      });

    // When the new worker takes control, trigger page reload to fetch latest assets
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    return () => {
      window.removeEventListener('vite:preloadError', handlePreloadError);
    };
  });

  function reloadPage() {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }
</script>

<svelte:head>
  <meta property="og:url" content={`${SITE_URL}/`} />
</svelte:head>

<svelte:window onkeydown={handleGlobalKeyDown} />

<a href="#main-content" class="skip-link">Skip to main content</a>

<Header />

<main id="main-content">
  {#key $page.url.pathname}
    <div in:fade={{ duration: 150, delay: 150 }} out:fade={{ duration: 150 }}>
      {@render children()}
    </div>
  {/key}
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
