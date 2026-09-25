/* Lossless source spans. All offsets are UTF-16 code units, including the Node API. */
(function(root) {
  'use strict';
  const words = text => text.normalize('NFC').toLowerCase().match(/\p{L}[\p{L}\p{M}]*|\d+(?:[.,]\d+)*/gu) || [];
  const bibliographyHeading = /^\s*(?:#{1,6}\s*)?(?:\d+(?:\.\d+)*\.?\s+)?(?:referencias(?: bibliográficas)?|bibliografía|references|bibliography)\s*:?\s*$/iu;
  const sectionHeading = /^\s*(?:#{1,6}\s*)?(?:\d+(?:\.\d+)*\.?\s+)?(?:anexos?|apéndices?|appendix|appendices|introducción|resumen|abstract|conclusiones?|discusión|resultados|metodología|métodos?)\s*:?\s*$/iu;
  function sentenceSpans(text, offset=0) {
    const spans=[];
    let start=0;
    const push=end=>{
      let a=start,b=end;
      while(a<b && /\s/u.test(text[a])) a++;
      while(b>a && /\s/u.test(text[b-1])) b--;
      if(b>a) spans.push({start:offset+a,end:offset+b,text:text.slice(a,b)});
      start=end;
    };
    const abbreviations = root.ZeroIARules.abbreviations;
    for(let i=0;i<text.length;i++) {
      if(!'.!?…'.includes(text[i])) continue;
      if(text[i]==='.') {
        if(/\d/.test(text[i-1]||'') && /\d/.test(text[i+1]||'')) continue;
        const prefix=text.slice(Math.max(0,i-16),i).normalize('NFC');
        const word=(prefix.match(/[\p{L}.]+$/u)||[''])[0];
        if(abbreviations.includes(word.toLowerCase()) || /^\p{Lu}$/u.test(word)) continue;
      }
      let end=i+1;
      while(end<text.length && '.!?…"\'»”’)]'.includes(text[end])) end++;
      if(end===text.length || /\s/u.test(text[end])) { push(end); i=end-1; }
    }
    push(text.length);
    return spans;
  }
  function blocks(text) {
    const out=[]; let inBibliography=false;
    for(const match of text.matchAll(/[^\r\n]+/g)) {
      const line=match[0]; if(!line.trim()) continue;
      const trimmed=line.trim().normalize('NFC');
      let kind='body';
      if(bibliographyHeading.test(trimmed)) {kind='heading';inBibliography=true;}
      else if(sectionHeading.test(trimmed) || /^#{1,6}\s/u.test(trimmed)) {kind='heading';inBibliography=false;}
      else if(inBibliography) kind='bibliography';
      else if(/\t|\|/u.test(line)) kind='table';
      else if(/^\s*(?:[-*•]|\d+[.)])\s/u.test(line)) kind='list';
      out.push({id:out.length,kind,start:match.index,end:match.index+line.length,text:line});
    }
    return out;
  }
  function splitBibliography(text) {
    const parts=blocks(text);
    const found=parts.some(b=>bibliographyHeading.test(b.text.normalize('NFC')));
    return {body:parts.filter(b=>b.kind!=='bibliography'&&!bibliographyHeading.test(b.text.normalize('NFC'))).map(b=>b.text).join('\n'),
      bibliography:parts.filter(b=>b.kind==='bibliography').map(b=>b.text).join('\n'), hasBibliography:found};
  }
  function maskProtected(text) {
    // Preserve raw UTF-16 length, including supplementary code points.
    return text.replace(/«[^»]*»|“[^”]*”|"[^"]*"|'[^'\n]+'|https?:\/\/\S+|\[[^\]]*\]|\([^)]*(?:\d{4}|s\.\s*f\.)[^)]*\)/gu,m=>' '.repeat(m.length));
  }
  root.ZeroIAStructure={words,sentenceSpans,blocks,splitBibliography,maskProtected};
})(globalThis);
