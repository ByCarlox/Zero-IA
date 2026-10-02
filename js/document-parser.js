/* Local extraction with explicit coverage and warnings. No document upload. */
async function extractTextFromFile(file) {
  if(file.size>ZeroIARules.maxFileBytes) throw new Error('El límite de archivo es 20 MB. Divide el documento por capítulos.');
  const name=file.name.toLowerCase();
  const report={filename:file.name,format:name.split('.').pop(),warnings:[],pages:[],coverage:'La extracción puede omitir notas, imágenes, ecuaciones o estructura compleja. Revisa el texto extraído.'};
  let text='';
  if(name.endsWith('.docx')) {
    if(!window.mammoth)throw new Error('No se cargó el lector Word. Revisa tu conexión y recarga.');
    const buffer=await file.arrayBuffer();
    const result=await window.mammoth.extractRawText({arrayBuffer:buffer.slice(0)});text=result.value;
    report.warnings=(result.messages||[]).map(m=>m.message);
    report.structure={blocks:[],mapped:0,unmapped:0,source:'docx-html-to-raw-exact'};
    try {
      const html=await window.mammoth.convertToHtml({arrayBuffer:buffer.slice(0)});
      // Parse as an inert document; never insert imported HTML into the application.
      const dom=new DOMParser().parseFromString(html.value,'text/html');
      let cursor=0;
      for(const element of dom.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,td,th')) {
        if(element.matches('li') && element.querySelector('p')) continue;
        if(element.matches('td,th') && element.querySelector('p')) continue;
        const value=(element.textContent||'').trim();
        if(!value) continue;
        const start=text.indexOf(value,cursor);
        if(start<0) {report.structure.unmapped++;continue;}
        const end=start+value.length;cursor=end;
        let kind=/^H[1-6]$/.test(element.tagName)?'heading':element.closest('td,th')?'table':element.closest('li')?'list':'body';
        if(/(?:\.{3,}|\t+)\s*\d+\s*$/u.test(value)) kind='toc';
        // Retain only exact source spans, so highlights still address the original text.
        report.structure.blocks.push({kind,start,end,text:value,...(kind==='heading' ? {level:Number(element.tagName.slice(1))} : {})});report.structure.mapped++;
      }
      if(report.structure.unmapped) report.warnings.push(`Word: ${report.structure.unmapped} elementos de estructura no se pudieron vincular exactamente al texto; se usarán reglas de texto para ellos.`);
    } catch(error) {
      report.warnings.push('Word: no se pudo conservar la estructura; el texto sigue disponible y se revisa con reglas de texto.');
    }
    report.warnings.push('Word: no se garantiza la conservación de notas, cuadros de texto, imágenes ni maquetación.');
  } else if(name.endsWith('.pdf')) {
    if(!window.pdfjsLib)throw new Error('No se cargó el lector PDF. Revisa tu conexión y recarga.');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf=await window.pdfjsLib.getDocument({data:await file.arrayBuffer(),isEvalSupported:false}).promise;
    let cursor=0;const chunks=[];
    try {
      for(let number=1;number<=pdf.numPages;number++) {
        const page=await pdf.getPage(number),content=await page.getTextContent();
        const items = content.items || [];
        
        // 1. Reconstruir líneas respetando coordenadas espaciales
        const lines = [];
        let currentLine = [];
        let lastY = null;
        let lastX = null;
        let lastWidth = 0;
        
        for (const item of items) {
          if (!item.str && !item.hasEOL) continue;
          const tx = item.transform ? item.transform[4] : 0;
          const ty = item.transform ? item.transform[5] : 0;
          
          const isNewLine = item.hasEOL || (lastY !== null && Math.abs(ty - lastY) > 3.5);
          if (isNewLine && currentLine.length > 0) {
            const lineStr = currentLine.join('').trim();
            if (lineStr) lines.push({ text: lineStr, y: lastY, yDiff: lastY !== null ? Math.abs(ty - lastY) : 0 });
            currentLine = [];
            lastX = null;
          }
          
          if (lastX !== null && tx > lastX + lastWidth + 2.5 && currentLine.length > 0) {
            if (!currentLine[currentLine.length - 1].endsWith(' ') && !item.str.startsWith(' ')) {
              currentLine.push(' ');
            }
          }
          currentLine.push(item.str);
          lastY = ty;
          lastX = tx;
          lastWidth = item.width || 0;
        }
        if (currentLine.length > 0) {
          const lineStr = currentLine.join('').trim();
          if (lineStr) lines.push({ text: lineStr, y: lastY, yDiff: 0 });
        }
        
        // 2. Reconstruir párrafos: unir líneas del mismo párrafo y des-guionar (unhyphenate)
        const tocRegex = /(?:\.{2,}|\t+|\s{3,})\s*\d+\s*$/u;
        const pageParagraphs = [];
        let currentPara = '';
        
        for (let i = 0; i < lines.length; i++) {
          let line = lines[i].text;
          
          // Unir palabras partidas con guion al final de línea
          if (line.endsWith('-') && i + 1 < lines.length && /^[a-záéíóúüñ]/i.test(lines[i + 1].text)) {
            line = line.slice(0, -1);
            if (currentPara) currentPara += ' ' + line;
            else currentPara = line;
            continue;
          }
          
          const isTOC = tocRegex.test(line);
          const isHeading = /^(?:[0-9]+(?:\.[0-9]+)*\.?\s+[A-ZÁÉÍÓÚÑ]|#)/.test(line);
          const isStandaloneShort = /^(?:índice|resumen|abstract|bibliografía|anexos?)$/iu.test(line);
          
          if (isTOC || isHeading || isStandaloneShort) {
            if (currentPara) {
              pageParagraphs.push(currentPara);
              currentPara = '';
            }
            pageParagraphs.push(line);
          } else if (currentPara.length === 0) {
            currentPara = line;
          } else {
            const prevEndsSentence = /[.!?:]\s*$/.test(currentPara);
            const lineStartsCapital = /^[A-ZÁÉÍÓÚÑ]/.test(line);
            const largeYGap = lines[i].yDiff > 20;
            
            if (prevEndsSentence && (lineStartsCapital || largeYGap)) {
              pageParagraphs.push(currentPara);
              currentPara = line;
            } else {
              currentPara += ' ' + line;
            }
          }
        }
        if (currentPara) pageParagraphs.push(currentPara);
        
        const chunk = pageParagraphs.join('\n\n');
        chunks.push(chunk);
        report.pages.push({page:number,start:cursor,end:cursor+chunk.length,hasText:!!chunk.trim()});
        cursor += chunk.length + 2;
        if(!chunk.trim()) report.warnings.push(`Página ${number}: sin texto extraíble; puede requerir OCR.`);
        page.cleanup();
      }
    } finally {await pdf.destroy();}
    text = chunks.join('\n\n');
    report.warnings.push('PDF: texto normalizado con detección espacial de párrafos y unificación de prosa.');
  } else if(/\.(txt|md)$/.test(name)) {text=await file.text();report.coverage='Texto plano; idioma seleccionado: español.';}
  else throw new Error('Formato no compatible. Usa Word, PDF, TXT o Markdown.');
  if(!text.trim())throw new Error('No se extrajo texto. Si el documento está escaneado, necesita OCR.');
  if(text.length>ZeroIARules.maxCharacters)throw new Error('El documento supera 500.000 caracteres. Divide el archivo por capítulos.');
  return {text,extraction:report};
}
window.ZeroIAParser={extractTextFromFile};
