/*
 * Set webpack public path at runtime for GitHub Pages subpath hosting
 * Ensures dynamic chunks load from /<repo>/ rather than site root
 */
/* eslint-disable no-undef, no-global-assign */
(function setPublicPath() {
  try {
    if (typeof window !== 'undefined' && /github\.io$/.test(window.location.hostname)) {
      var seg = window.location.pathname.split('/').filter(Boolean)[0];
      var base = (typeof seg === 'string' && seg !== '') ? '/' + seg : '';
      __webpack_public_path__ = window.location.origin + base + '/';
    }
  } catch (e) {
    // no-op
  }
})();

