// Runs before first paint: theme (day/night), reduced motion, and the once-per-session plumb-line load (never on a phone, where it would
// cover the headline for the first second).
// Reduced motion follows the visitor's device setting only. There used to be an on-page "Calm" switch; it is gone, and a value it
// saved earlier ('ns2-calm') is deleted here so nobody stays stuck in a mode they can no longer turn off.
// Shared by the homepage layout and the inner-page shell so both behave the same.
export const NS2_INIT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('ns2-theme');if(!t){t='light'}d.setAttribute('data-ns-theme',t);try{localStorage.removeItem('ns2-calm')}catch(e){}var q=matchMedia('(prefers-reduced-motion: reduce)');var rm=q.matches;if(rm){d.setAttribute('data-reduce-motion','1')}if(q.addEventListener){q.addEventListener('change',function(e){if(e.matches){d.setAttribute('data-reduce-motion','1')}else{d.removeAttribute('data-reduce-motion')}})}if(rm||matchMedia('(max-width: 700px)').matches||sessionStorage.getItem('ns2-plumb')){d.setAttribute('data-plumb','skip')}else{sessionStorage.setItem('ns2-plumb','1')}}catch(e){}})();`
