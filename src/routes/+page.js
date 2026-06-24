import booksWithMetadata from '$lib/data/BooksWithMetadata.json';
import collections from '$lib/data/collections.json';

/** @type {import('./$types').PageLoad} */
export function load({ url }) {
  const canon = url.searchParams.get('canon') || 'protestant';

  return {
    books: booksWithMetadata,
    collections,
    canon
  };
}