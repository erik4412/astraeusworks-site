const header = document.querySelector('[data-header]');
const nav = document.querySelector('[data-nav]');
const navToggle = document.querySelector('[data-nav-toggle]');

const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

navToggle?.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') !== 'true';
  navToggle.setAttribute('aria-expanded', String(open));
  nav?.classList.toggle('is-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navToggle?.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    document.body.style.overflow = '';
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
document.querySelectorAll('[data-year]').forEach((element) => { element.textContent = new Date().getFullYear(); });

const canvas = document.querySelector('[data-terrain]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas) {
  const context = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let pointerX = 0;
  let pointerY = 0;
  let animationFrame;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (reducedMotion) draw(0);
  };

  const terrainHeight = (x, z, time) => {
    const ridge = Math.sin(x * .006 + time * .00006) * 48;
    const detail = Math.sin((x + z) * .014) * 15 + Math.cos(z * .01 - time * .00004) * 22;
    const peakA = 170 * Math.exp(-((x - width * .67) ** 2 + (z - height * .30) ** 2) / 90000);
    const peakB = 90 * Math.exp(-((x - width * .84) ** 2 + (z - height * .58) ** 2) / 65000);
    return ridge + detail + peakA + peakB;
  };

  const draw = (time) => {
    context.clearRect(0, 0, width, height);
    const horizon = height * .32;
    const rows = 28;
    const columns = 36;
    const stepX = width / (columns - 1);
    const stepZ = height * .68 / (rows - 1);
    const driftX = pointerX * 12;
    const driftY = pointerY * 7;

    for (let row = 0; row < rows; row += 1) {
      const depth = row / (rows - 1);
      context.beginPath();
      for (let column = 0; column < columns; column += 1) {
        const x = column * stepX;
        const z = row * stepZ;
        const perspective = .46 + depth * .84;
        const screenX = width / 2 + (x - width / 2) * perspective + driftX * depth;
        const elevation = terrainHeight(x, z, time || 0);
        const screenY = horizon + z * .72 - elevation * (.18 + depth * .32) + driftY * depth;
        if (column === 0) context.moveTo(screenX, screenY);
        else context.lineTo(screenX, screenY);
      }
      context.strokeStyle = `rgba(185,255,98,${.055 + depth * .13})`;
      context.lineWidth = depth > .7 ? 1 : .65;
      context.stroke();
    }

    for (let column = 0; column < columns; column += 2) {
      context.beginPath();
      for (let row = 0; row < rows; row += 1) {
        const depth = row / (rows - 1);
        const x = column * stepX;
        const z = row * stepZ;
        const perspective = .46 + depth * .84;
        const screenX = width / 2 + (x - width / 2) * perspective + driftX * depth;
        const elevation = terrainHeight(x, z, time || 0);
        const screenY = horizon + z * .72 - elevation * (.18 + depth * .32) + driftY * depth;
        if (row === 0) context.moveTo(screenX, screenY);
        else context.lineTo(screenX, screenY);
      }
      context.strokeStyle = 'rgba(126,210,157,.055)';
      context.lineWidth = .6;
      context.stroke();
    }

    if (!reducedMotion) animationFrame = requestAnimationFrame(draw);
  };

  window.addEventListener('pointermove', (event) => {
    pointerX = event.clientX / Math.max(window.innerWidth, 1) - .5;
    pointerY = event.clientY / Math.max(window.innerHeight, 1) - .5;
  }, { passive: true });
  window.addEventListener('resize', resize);
  resize();
  if (!reducedMotion) animationFrame = requestAnimationFrame(draw);
  window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame));
}

