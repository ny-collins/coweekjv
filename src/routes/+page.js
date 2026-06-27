import booksWithMetadata from '$lib/data/BooksWithMetadata.json';
import collections from '$lib/data/collections.json';

/** @type {import('./$types').PageLoad} */
export function load({ url }) {
  const defaultCanon = 'protestant';
  const requestedCanon = url.searchParams.get('canon');
  const canon = requestedCanon && requestedCanon in collections ? requestedCanon : defaultCanon;

  return {
    books: booksWithMetadata,
    collections,
    canon
  };
}