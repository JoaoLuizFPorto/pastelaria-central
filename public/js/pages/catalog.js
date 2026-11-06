// Filtros do cardápio e tratamento de imagens indisponíveis.

(() => {
  const productFilters = [...document.querySelectorAll('[data-product-filter]')];
  const subcategoryFilters = [...document.querySelectorAll('[data-subcategory-filter]')];
  for (const parent of productFilters) {
    parent.indeterminate = parent.dataset.partial === 'true';
    parent.addEventListener('change', () => {
      for (const child of parent
        .closest('.filtro-grupo')
        .querySelectorAll('[data-subcategory-filter]'))
        child.checked = parent.checked;
      parent.indeterminate = false;
      parent.form.requestSubmit();
    });
  }
  for (const input of subcategoryFilters)
    input.addEventListener('change', () => {
      const group = input.closest('.filtro-grupo');
      const parent = group.querySelector('[data-product-filter]');
      const children = [...group.querySelectorAll('[data-subcategory-filter]')];
      const checked = children.filter((child) => child.checked).length;
      parent.checked = checked === children.length;
      parent.indeterminate = checked > 0 && checked < children.length;
      input.form.requestSubmit();
    });

  const catalogFilterToggle = document.querySelector('.catalogFilterToggle');
  if (catalogFilterToggle) {
    const filterOptions = document.getElementById(
      catalogFilterToggle.getAttribute('aria-controls')
    );
    const smallerScreen = window.matchMedia('(max-width: 1023px)');
    const params = new URLSearchParams(location.search);
    let expanded = params.has('category') || params.has('subcategory');
    const updateFilters = () => {
      catalogFilterToggle.hidden = !smallerScreen.matches;
      filterOptions.hidden = smallerScreen.matches && !expanded;
      catalogFilterToggle.setAttribute('aria-expanded', String(!filterOptions.hidden));
    };
    catalogFilterToggle.addEventListener('click', () => {
      expanded = !expanded;
      updateFilters();
    });
    smallerScreen.addEventListener('change', updateFilters);
    updateFilters();
  }

  for (const image of document.querySelectorAll('[data-product-image]')) {
    const fallback = new URL('/images/placeholders/product-unavailable.svg', location.origin).href;
    const showFallback = () => {
      if (image.src !== fallback) {
        image.removeAttribute('srcset');
        image.src = fallback;
      }
    };
    image.addEventListener('error', showFallback);
    if (image.complete && image.naturalWidth === 0) showFallback();
  }
})();
