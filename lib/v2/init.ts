// Runs before first paint: theme (day/night), Calm, and the once-per-session plumb-line load (never on a phone, where it would cover the
// headline for the first second).
// Shared by the homepage layout and the inner-page shell so both behave the same.
export const NS2_INIT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('ns2-theme');if(!t){t='light'}d.setAttribute('data-ns-theme',t);var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;var c=localStorage.getItem('ns2-calm');if(c==='1'||(c===null&&rm)){d.setAttribute('data-calm','1')}if(rm||c==='1'||matchMedia('(max-width: 700px)').matches||sessionStorage.getItem('ns2-plumb')){d.setAttribute('data-plumb','skip')}else{sessionStorage.setItem('ns2-plumb','1')}}catch(e){}})();`
