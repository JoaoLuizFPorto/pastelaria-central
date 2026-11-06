// Comportamento do cabeçalho, busca, menu da conta e aviso de cookies.

(() => {
  const accountToggle = document.querySelector('.accountToggle');
  const siteHeader = document.querySelector('.header');
  const siteNav = document.querySelector('.headerNav');
  if (siteHeader && siteNav) {
    const updateHeaderSize = () => {
      const style = window.getComputedStyle(siteHeader);
      const expandedPadding = parseFloat(style.getPropertyValue('--header-padding-y')) || 10;
      const expandedHeight =
        siteHeader.getBoundingClientRect().height +
        2 * expandedPadding -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
      document.documentElement.style.setProperty(
        '--site-header-height',
        `${siteHeader.getBoundingClientRect().height}px`
      );
      document.documentElement.style.setProperty(
        '--site-header-space',
        `${Math.round(expandedHeight)}px`
      );
      document.documentElement.style.setProperty('--site-nav-height', `${siteNav.offsetHeight}px`);
    };
    updateHeaderSize();
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(updateHeaderSize);
      observer.observe(siteHeader);
      observer.observe(siteNav);
    } else window.addEventListener('resize', updateHeaderSize);
    let previousScroll = Math.max(0, window.scrollY);
    let scheduled = false;
    const setCollapsed = (collapsed) => {
      siteNav.classList.toggle('navCollapsed', collapsed);
      siteHeader.classList.toggle('headerCompact', collapsed);
    };
    const showNav = () => setCollapsed(false);
    const updateNav = () => {
      scheduled = false;
      const currentScroll = Math.max(
        0,
        Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight)
      );
      const expandedHeight =
        parseFloat(document.documentElement.style.getPropertyValue('--site-header-space')) ||
        siteHeader.offsetHeight;
      if (
        currentScroll <= expandedHeight + siteNav.offsetHeight ||
        siteNav.contains(document.activeElement)
      ) {
        showNav();
        previousScroll = currentScroll;
      } else if (Math.abs(currentScroll - previousScroll) >= 8) {
        setCollapsed(currentScroll > previousScroll);
        previousScroll = currentScroll;
      }
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!scheduled) {
          scheduled = true;
          window.requestAnimationFrame(updateNav);
        }
      },
      { passive: true }
    );
    siteHeader.addEventListener('focusin', showNav);
    siteNav.addEventListener('focusin', showNav);
  }

  const accountDropdown = document.querySelector('.accountDropdown');
  if (accountToggle && accountDropdown) {
    function closeAccountMenu() {
      accountDropdown.hidden = true;
      accountToggle.setAttribute('aria-expanded', 'false');
    }
    accountToggle.addEventListener('click', () => {
      accountDropdown.hidden = !accountDropdown.hidden;
      accountToggle.setAttribute('aria-expanded', String(!accountDropdown.hidden));
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.accountMenu')) closeAccountMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !accountDropdown.hidden) {
        closeAccountMenu();
        accountToggle.focus();
      }
    });
    document.addEventListener('focusin', (event) => {
      if (!event.target.closest('.accountMenu')) closeAccountMenu();
    });
  }

  for (const form of document.querySelectorAll('form.searchBar')) {
    form.addEventListener('submit', (event) => {
      const input = form.elements.q;
      if (!input.value.trim()) {
        event.preventDefault();
        input.focus();
      }
    });
  }

  const cookieNotice = document.getElementById('cookieNotice');
  if (cookieNotice) {
    if (document.cookie.split(';').some((part) => part.trim() === 'pc_cookie_notice=1'))
      cookieNotice.hidden = true;
    for (const button of cookieNotice.querySelectorAll('[data-dismiss-cookie-notice]')) {
      button.addEventListener('click', () => {
        document.cookie =
          'pc_cookie_notice=1; Max-Age=15552000; Path=/; SameSite=Lax' +
          (location.protocol === 'https:' ? '; Secure' : '');
        cookieNotice.hidden = true;
      });
    }
  }
})();
