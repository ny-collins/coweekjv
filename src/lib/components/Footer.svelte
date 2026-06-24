<script>
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>

<footer>
  <button onclick={scrollToTop}>Scroll to Top</button>
  <p>
    Powered by <a href="https://svelte.dev/">SvelteKit</a>
  </p>
</footer>

<style>
  footer {
    background-color: var(--background-color);
    border-top: 1px solid var(--border-color);
    padding: 2rem 1rem;
    text-align: center;
  }

  button {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    color: var(--text-color);
    cursor: pointer;
    padding: 0.55rem 1rem;
    border-radius: 8px;
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    margin-bottom: 1rem;
    box-shadow: var(--card-shadow);
  }

  button:hover {
    border-color: var(--link-color);
    color: var(--link-color);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--glow-color);
  }

  p {
    color: var(--text-color);
    font-size: 0.9rem;
    opacity: 0.8;
    margin: 0.5rem 0 0 0;
  }

  a {
    color: var(--link-color);
    font-weight: 600;
  }
</style>