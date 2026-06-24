export async function getBookData(bookName) {
  const modules = import.meta.glob('./data/*.json');
  const targetPath = `./data/${bookName}.json`;

  if (modules[targetPath]) {
    const module = await modules[targetPath]();
    return module.default;
  }

  return null;
}
