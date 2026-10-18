(function(){
  // A page reached by clicking a link opens at the top, with no visible jump. Runs before the page renders and
  // pins scroll to 0 until the visitor scrolls. Links with a #section keep their target; back/forward and
  // reload keep the browser's own position.
  var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
  if (location.hash || (nav.type && nav.type !== 'navigate')) return;
  var de = document.documentElement, done = false;
  de.style.scrollBehavior = 'auto';
  function snap(){ if (!done && (window.scrollY || de.scrollTop)) scrollTo(0, 0); }
  function finish(){ if (done) return; done = true; removeEventListener('scroll', snap); de.style.scrollBehavior = ''; }
  scrollTo(0, 0);
  addEventListener('scroll', snap, {passive: true});
  addEventListener('pageshow', function(e){ if (!e.persisted) snap(); });
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function(n){ addEventListener(n, finish, {once: true, passive: true}); });
  setTimeout(finish, 1500);
})();
