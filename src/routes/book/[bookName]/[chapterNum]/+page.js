import { error } from '@sveltejs/kit';
import booksWithMetadata from '$lib/data/BooksWithMetadata.json';

export const prerender = true;

export async function entries() {
  const allEntries = [];

  for (const book of booksWithMetadata) {
    if (!book.missing) {
      for (let i = 1; i <= book.chapterCount; i++) {
        allEntries.push({ bookName: book.name, chapterNum: i.toString() });
      }
    }
  }
  return allEntries;
}

export async function load({ params }) {
  const { bookName } = params;
  const chapterNum = parseInt(params.chapterNum, 10);

  try {
    const bookModule = await import(`../../../../lib/data/${bookName}.json`);
    const bookData = bookModule.default;
    const chapterData = bookData.chapters[chapterNum - 1];
    const totalChapters = bookData.chapters.length;
    const book = booksWithMetadata.find(b => b.name === bookName);

    if (!book) {
      throw error(404, `Book not found: ${bookName}`);
    }

    if (!chapterData || parseInt(chapterData.chapter, 10) !== chapterNum) {
      throw error(404, `Chapter not found: ${book.displayName} ${chapterNum}`);
    }

    const activeBooks = booksWithMetadata
      .filter(b => !b.missing)
      .sort((a, b) => a.canonicalOrder - b.canonicalOrder);

    const currentBookIndex = activeBooks.findIndex(b => b.name === bookName);

    let prevUrl = null;
    let nextUrl = null;

    if (currentBookIndex !== -1) {
      if (chapterNum > 1) {
        prevUrl = `/book/${bookName}/${chapterNum - 1}`;
      } else if (currentBookIndex > 0) {
        const prevBook = activeBooks[currentBookIndex - 1];
        prevUrl = `/book/${prevBook.name}/${prevBook.chapterCount}`;
      }

      if (chapterNum < totalChapters) {
        nextUrl = `/book/${bookName}/${chapterNum + 1}`;
      } else if (currentBookIndex < activeBooks.length - 1) {
        const nextBook = activeBooks[currentBookIndex + 1];
        nextUrl = `/book/${nextBook.name}/1`;
      }
    }

    return {
      bookName,
      displayName: book.displayName,
      chapterNum,
      totalChapters,
      verses: chapterData.verses || [],
      prevUrl,
      nextUrl
    };
  } catch (err) {
    throw error(404, `Book or chapter not found: ${bookName} ${chapterNum}`);
  }
}
