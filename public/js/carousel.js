(() => {
  const track = document.querySelector('.mainCardImagens');
  const next = document.querySelector('.mainCardBotaoProximo');
  const previous = document.querySelector('.mainCardBotaoAnterior');
  if (!track || !next || !previous) return;
  const count = track.querySelectorAll('.mainCardImagensSlide').length;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let timer;
  const move = (delta) => {
    current = (current + delta + count) % count;
    track.style.transform = 'translateX(' + -current * 100 + '%)';
  };
  const banner = track.closest('.mainCard');
  const stop = () => {
    clearInterval(timer);
    timer = null;
  };
  const start = () => {
    stop();
    if (
      count > 1 &&
      !document.hidden &&
      !reducedMotion.matches &&
      !banner.matches(':hover') &&
      !banner.contains(document.activeElement)
    )
      timer = setInterval(() => move(1), 5000);
  };
  next.addEventListener('click', () => {
    move(1);
    start();
  });
  previous.addEventListener('click', () => {
    move(-1);
    start();
  });
  banner.addEventListener('mouseenter', stop);
  banner.addEventListener('mouseleave', start);
  banner.addEventListener('focusin', stop);
  banner.addEventListener('focusout', () => setTimeout(start, 0));
  document.addEventListener('visibilitychange', start);
  reducedMotion.addEventListener('change', start);
  start();
})();
