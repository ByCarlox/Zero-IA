/* Metadata comparison is not verification of the claims supported by a source. */
(function(root){
  const norm=s=>String(s||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
  function compare(reference,item) {
    const text=norm(reference),title=(item.title||[])[0]||'',year=item.issued?.['date-parts']?.[0]?.[0];
    const authors=(item.author||[]).map(a=>a.family).filter(Boolean);
    const titleWords=norm(title).match(/\p{L}{4,}/gu)||[];
    const titleMatch=titleWords.length?titleWords.filter(w=>text.includes(w)).length/titleWords.length:null;
    const checks={year:year?text.includes(String(year)):null,author:authors.length?authors.some(a=>text.includes(norm(a))):null,title:titleMatch===null?null:titleMatch>=.7};
    return {status:Object.values(checks).some(v=>v===false)?'possible_mismatch':'manual_review',checks,title,year:year||null,authors,
      message:Object.values(checks).some(v=>v===false)?'Posible discrepancia de título, autor o año. Compara la referencia con el registro.':'DOI resuelto; metadatos compatibles o incompletos. Requiere revisión manual.',sourceSupportVerified:false};
  }
  root.ZeroIAReferenceCheck={compare};
})(globalThis);
