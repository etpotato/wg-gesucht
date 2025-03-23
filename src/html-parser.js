const { parse } = require('node-html-parser');

async function fetchNewAds(filterUrl) {
  const url = new URL(filterUrl);
  const response = await fetch(filterUrl);

  if (!response.ok) {
    throw new Error('Failed to fetch new ads');
  }

  const html = await response.text();
  const root = parse(html);
  const links = root.querySelectorAll('.detailansicht:not(.partners)');

  const ads = [...links].flatMap((node) => {
    const href = node.getAttribute('href');

    return href?.startsWith('/') && href?.endsWith('html') ? [`${url.origin}${href}`] : [];
  });
  const uniqueAds = [...new Set(ads)];

  return uniqueAds;
}

module.exports = {
  fetchNewAds,
};
