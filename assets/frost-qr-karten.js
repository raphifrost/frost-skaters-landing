(()=>{
'use strict';
// These exact QR matrices were generated for the permanent site URLs.
// Including static QR data means printable cards work without a third-party QR API.
const data={
signup:{size:49,bits:"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP5v5o+/gEFG5tVQQC60hn0roBdOMKEl0AumjTnS6AQRpkUtBAP6qqqq/gAAlEZ5AAB2PKE+gwAa51FX9cAO7oTaisANq1ldVBABMEiWcWAGy+5YZzwD/UvbbI4AC6lJVUgAZsNbU4gABjTyzGgAHOchHqIAFIsBP9rQB6rb5pbwAetl2E/sAK7cl5P8ATmPUrXxAN+2rnUTAFoUmV3TQDyAIjv7YAI8UfI5oAh4/te92ACIulRksALJ5rfrsABIBh1MTwB7Zkcu+gAAVSqHRsA/mNxo64AQVKtekRALpjqwj+AF1pvG5GAC6oiqol4BBQwoVZIA/nCswqEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",url:"https://raphifrost.github.io/frost-skaters-landing/anmelden.html"},
home:{size:45,bits:"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+zZrL+AQRzOKQQC6IIy66AXTE5OXQC6rhEC6AQXf+TQQD+qqqr+AACBf1AAB/PyqBiAeuSGvJgD6xpDi+ASs7vlcAA/XXHn+ALGS8trABeafKd2AYvYAQAABfF7b+qAXhMIFBACqcLWeOAUhqHmYgB3Y0NjqAInvQsKADfBQp2eAcjQXIowBaPVCi6AXIakyIACHZ6bbWATPeLxkgCXjEJv8AAFOmhEgD+ptQq2AQW83VEAC6qVR/uAXUlVQegC65fYtKAQWNeT8QD+TZLluAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",url:"https://raphifrost.github.io/frost-skaters-landing/"}
};
function drawMatrix(target,record){
 const bin=atob(record.bits),size=record.size;
 if(bin.length!==Math.ceil(size*size/8))throw Error('QR-Daten unvollständig');
 let rectangles='';
 for(let y=0;y<size;y++){
  let x=0;
  while(x<size){
   const i=y*size+x;
   const on=(bin.charCodeAt(i>>>3)>>(7-(i&7)))&1;
   if(!on){x++;continue;}
   const left=x;
   while(x<size){
    const j=y*size+x;
    if(!((bin.charCodeAt(j>>>3)>>(7-(j&7)))&1))break;
    x++;
   }
   rectangles+='M'+left+' '+y+'h'+(x-left)+'v1h-'+(x-left)+'z';
  }
 }
 const ns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 '+size+' '+size);
 svg.setAttribute('xmlns',ns);
 svg.setAttribute('role','img');
 svg.setAttribute('aria-label','QR-Code für '+record.url);
 const white=document.createElementNS(ns,'rect');
 white.setAttribute('width',size);white.setAttribute('height',size);white.setAttribute('fill','#fff');
 const black=document.createElementNS(ns,'path');
 black.setAttribute('d',rectangles);black.setAttribute('fill','#080b11');
 svg.append(white,black);
 target.replaceChildren(svg);
}
try{
 drawMatrix(document.getElementById('signupQr'),data.signup);
 drawMatrix(document.getElementById('homeQr'),data.home);
 document.getElementById('qrStatus').textContent='✅ Beide QR-Codes sind druckbereit.';
}catch(e){
 console.error(e);
 document.getElementById('qrStatus').textContent='Die QR-Grafik konnte nicht erzeugt werden. Bitte nutze die Links unter den Karten.';
}
document.getElementById('printBoth').addEventListener('click',()=>window.print());
})();