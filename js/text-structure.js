/* Lossless source spans. All offsets are UTF-16 code units, including the Node API. */
(function(root) {
  'use strict';
  const words = text => text.normalize('NFC').toLowerCase().match(/\p{L}[\p{L}\p{M}]*|\d+(?:[.,]\d+)*/gu) || [];
  const bibliographyHeading = /^\s*(?:#{1,6}\s*)?(?:\d+(?:\.\d+)*\.?\s+)?(?:referencias(?: bibliográficas)?|bibliografía|references|bibliography)\s*:?\s*$/iu;
  const sectionHeading = /^\s*(?:#{1,6}\s*)?(?:\d+(?:\.\d+)*\.?\s+)?(?:anexos?|apéndices?|appendix|appendices|introducción|resumen|abstract|conclusiones?|discusión|resultados|metodología|métodos?|índice|tabla de contenidos?|contenido|prólogo|agradecimientos?|dedicatoria)\s*:?\s*$/iu;
  const standalonePage = /^\s*(?:p[aá]g\.?|p\.|p[aá]gina)?\s*\d{1,4}\s*$/iu;
  const standaloneDate = /^\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\s*$/u;
  const tocLine = /(?:\.{2,}|\t+|\s{3,})\s*\d+\s*$/u;
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
  function blocks(text, structure) {
    const out=[]; let inBibliography=false;
    const hasFrontmatter = /(?:\.{2,}|\t+|\s{3,})\s*\d+\s*$/mu.test(text) && /^\s*(?:\d+(?:\.\d+)*\.?\s+)?(?:introducción|resumen|abstract|conclusiones?|metodología|índice)\b/imu.test(text);
    let inFrontmatter=hasFrontmatter;
    let nonFrontmatterStarted=!hasFrontmatter;
    const metadata = (Array.isArray(structure) ? structure : structure?.blocks || []).filter(b =>
      b && Number.isInteger(b.start) && Number.isInteger(b.end) && b.start >= 0 && b.end > b.start && b.end <= text.length &&
      typeof b.text === 'string' && text.slice(b.start,b.end) === b.text);
    for(const match of text.matchAll(/[^\r\n]+/g)) {
      const line=match[0]; if(!line.trim()) continue;
      const trimmed=line.trim().normalize('NFC');
      let kind='body';
      if(bibliographyHeading.test(trimmed)) {kind='heading';inBibliography=true;inFrontmatter=false;nonFrontmatterStarted=true;}
      else if(sectionHeading.test(trimmed) || /^#{1,6}\s/u.test(trimmed)) {
        kind='heading';
        inBibliography=false;
        if(!/^(?:índice|tabla de contenidos?|contenido)$/iu.test(trimmed)) {
          inFrontmatter=false;
          nonFrontmatterStarted=true;
        }
      }
      else if(inBibliography) kind='bibliography';
      else if(tocLine.test(line)) kind='toc';
      else if(standalonePage.test(trimmed)) kind='toc';
      else if(standaloneDate.test(trimmed)) kind='heading';
      else if(/\t|\|/u.test(line)) kind='table';
      else if(/^\s*(?:[-*•]|\d+[.)])\s/u.test(line)) kind='list';
      else if(inFrontmatter && !nonFrontmatterStarted) {
        if(out.filter(b=>b.kind==='heading').length === 0) kind='heading';
        else if(trimmed.length < 90 && !/[.!?]$/.test(trimmed)) kind='heading';
      }
      const native = metadata.find(b=>b.start<=match.index+line.indexOf(line.trim()) && b.end>=match.index+line.trimEnd().length && ['heading','table','list','toc'].includes(b.kind));
      if(native && !bibliographyHeading.test(trimmed)) {
        if(native.kind==='heading') {kind='heading';inBibliography=false;}
        else if(!inBibliography) kind=native.kind;
      }
      const markdownLevel=(trimmed.match(/^(#{1,6})\s/u)||[])[1]?.length;
      const numberedLevel=(trimmed.match(/^(\d+(?:\.\d+)*)\.?\s/u)||[])[1]?.split('.').length;
      const level=kind==='heading' ? (Number.isInteger(native?.level) && native.level>=1 && native.level<=6 ? native.level : markdownLevel || numberedLevel || 1) : undefined;
      out.push({id:out.length,kind,start:match.index,end:match.index+line.length,text:line,...(level ? {level} : {})});
    }
    return out;
  }
  function splitBibliography(text, structure) {
    const parts=blocks(text, structure);
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
