/**
 * Zero-IA: Extractor de texto en el navegador (Client-side)
 * Soporta archivos Word (.docx), PDF (.pdf) y texto plano (.txt/.md)
 */

async function parseWordDocument(file) {
  const arrayBuffer = await file.arrayBuffer();
  if (window.mammoth) {
    const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
  }
  throw new Error("Librería Mammoth no disponible.");
}

async function parsePdfDocument(file) {
  const arrayBuffer = await file.arrayBuffer();
  if (!window.pdfjsLib) {
    throw new Error("Librería PDF.js no disponible.");
  }
  
  // Configurar worker de PDF.js si no está configurado
  if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pageTexts = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageStrings = textContent.items.map(item => item.str);
    pageTexts.push(pageStrings.join(" "));
  }

  return pageTexts.join("\n\n");
}

async function parseTextDocument(file) {
  return await file.text();
}

async function extractTextFromFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".docx")) {
    return await parseWordDocument(file);
  } else if (name.endsWith(".pdf")) {
    return await parsePdfDocument(file);
  } else if (name.endsWith(".txt") || name.endsWith(".md")) {
    return await parseTextDocument(file);
  } else {
    throw new Error("Formato no compatible. Por favor sube un archivo .docx, .pdf o .txt");
  }
}

window.ZeroIAParser = {
  extractTextFromFile
};
