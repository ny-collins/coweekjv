import { error } from '@sveltejs/kit';
import booksWithMetadata from '$lib/data/BooksWithMetadata.json';

export const prerender = true;

export async function entries() {
  const modules = import.meta.glob('../../../lib/data/*.json');
  const validBookPaths = Object.keys(modules).map(path => path.split('/').pop().replace('.json', ''));
  const excluded = ['Books', 'BooksWithMetadata', 'collections'];

  return booksWithMetadata
    .filter(b => !excluded.includes(b.name) && validBookPaths.includes(b.name))
    .map(book => ({ bookName: book.name }));
}

export async function load({ params }) {
  const { bookName } = params;

  try {
    const bookModule = await import(`../../../lib/data/${bookName}.json`);
    const bookData = bookModule.default;
    const chapters = bookData.chapters.map(ch => ch.chapter);
    const book = booksWithMetadata.find(b => b.name === bookName);

    if (!book) {
      throw error(404, `Book not found: ${bookName}`);
    }

    return {
      bookName: bookName,
      displayName: book.displayName,
      chapters: chapters
    };
  } catch (err) {
    throw error(404, `Book not found: ${bookName}`);
  }
}
