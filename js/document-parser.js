/* Local extraction with explicit coverage and warnings. No document upload. */
async function extractTextFromFile(file) {
  if(file.size>ZeroIARules.maxFileBytes) throw new Error('El límite de archivo es 20 MB. Divide el documento por capítulos.');
  const name=file.name.toLowerCase();
  const report={filename:file.name,format:name.split('.').pop(),warnings:[],pages:[],coverage:'La extracción puede omitir notas, imágenes, ecuaciones o estructura compleja. Revisa el texto extraído.'};
  let text='';
  if(name.endsWith('.docx')) {
    if(!window.mammoth)throw new Error('No se cargó el lector Word. Revisa tu conexión y recarga.');
    const result=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});text=result.value;
    report.warnings=(result.messages||[]).map(m=>m.message);
    report.warnings.push('Word: no se garantiza la conservación de notas, cuadros de texto, imágenes ni maquetación.');
  } else if(name.endsWith('.pdf')) {
    if(!window.pdfjsLib)throw new Error('No se cargó el lector PDF. Revisa tu conexión y recarga.');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf=await window.pdfjsLib.getDocument({data:await file.arrayBuffer(),isEvalSupported:false}).promise;
    let cursor=0;const chunks=[];
    try {
      for(let number=1;number<=pdf.numPages;number++) {
        const page=await pdf.getPage(number),content=await page.getTextContent();
        const chunk=content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join('');
        chunks.push(chunk);report.pages.push({page:number,start:cursor,end:cursor+chunk.length,hasText:!!chunk.trim()});cursor+=chunk.length+2;
        if(!chunk.trim())report.warnings.push(`Página ${number}: sin texto extraíble; puede requerir OCR.`);
        page.cleanup();
      }
    } finally {await pdf.destroy();}
    text=chunks.join('\n\n');report.warnings.push('PDF: revisa orden de columnas, tablas, guiones y notas antes de interpretar el informe.');
  } else if(/\.(txt|md)$/.test(name)) {text=await file.text();report.coverage='Texto plano; idioma seleccionado: español.';}
  else throw new Error('Formato no compatible. Usa Word, PDF, TXT o Markdown.');
  if(!text.trim())throw new Error('No se extrajo texto. Si el documento está escaneado, necesita OCR.');
  if(text.length>ZeroIARules.maxCharacters)throw new Error('El documento supera 500.000 caracteres. Divide el archivo por capítulos.');
  return {text,extraction:report};
}
window.ZeroIAParser={extractTextFromFile};
