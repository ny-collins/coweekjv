import booksWithMetadata from '$lib/data/BooksWithMetadata.json';
import collections from '$lib/data/collections.json';

/** @type {import('./$types').PageLoad} */
export function load() {
  // url.searchParams cannot be accessed during compile-time prerendering.
  // The client-side component (+page.svelte) resolves actual parameters onMount.
  return {
    books: booksWithMetadata,
    collections,
    canon: 'protestant'
  };
}