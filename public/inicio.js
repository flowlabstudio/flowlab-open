/* FlowLab · el logo y el título llevan al inicio (Cabina, arriba de todo). */
(function () {
  'use strict';
  function init() {
    const brand = document.querySelector('.topbar .brand'); if (!brand) return;
    brand.setAttribute('role', 'link'); brand.setAttribute('tabindex', '0'); brand.setAttribute('aria-label', 'Ir al inicio de FlowLab Studio'); brand.title = 'Ir al inicio';
    const go = () => {
      const tab = document.querySelector('[data-mode-tab="cabina"]'); if (tab) tab.click();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    brand.addEventListener('click', go);
    brand.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
