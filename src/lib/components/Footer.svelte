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
    padding: 2em;
    text-align: center;
  }

  button {
    background-color: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-color);
    cursor: pointer;
    padding: 0.5em 1em;
    border-radius: 4px;
    margin-bottom: 1em;
  }

  p {
    color: var(--text-color);
  }

  a {
    color: var(--link-color);
  }
</style>