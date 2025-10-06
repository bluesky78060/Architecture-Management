/*
 * Set webpack public path at runtime for GitHub Pages subpath hosting
 * Ensures dynamic chunks load from /<repo>/ rather than site root
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
declare let __webpack_public_path__: any;

(function setPublicPath() {
  try {
    if (typeof window !== 'undefined' && /github\.io$/.test(window.location.hostname)) {
      const seg = window.location.pathname.split('/').filter(Boolean)[0];
      const base = (typeof seg === 'string' && seg !== '') ? `/${seg}` : '';
      __webpack_public_path__ = `${window.location.origin}${base}/`;
      // Mark as used to satisfy linters
      void __webpack_public_path__;
    }
  } catch {
    // no-op
  }
})();

export {};
