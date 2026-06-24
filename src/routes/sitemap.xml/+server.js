import booksWithMetadata from '$lib/data/BooksWithMetadata.json';

export const prerender = true;

export async function GET() {
  const headers = {
    'Cache-Control': 'max-age=0, s-maxage=3600',
    'Content-Type': 'application/xml'
  };

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  xml += `  <url>\n    <loc>https://kjv-bible-7mw.pages.dev/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  for (const book of booksWithMetadata) {
    if (!book.missing) {
      xml += `  <url>\n    <loc>https://kjv-bible-7mw.pages.dev/book/${book.name}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

      for (let i = 1; i <= book.chapterCount; i++) {
        xml += `  <url>\n    <loc>https://kjv-bible-7mw.pages.dev/book/${book.name}/${i}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
      }
    }
  }

  xml += `</urlset>`;

  return new Response(xml, { headers });
}
