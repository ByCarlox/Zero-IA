/**
 * Zero-IA: Controlador de Interfaz de Usuario estilo Gemini & ChatGPT
 */

let currentAnalysis = null;
let currentRawText = "";
let selectedSentenceIdx = null;

// Elementos DOM
const promptTextarea = document.getElementById("promptTextarea");
const fileInput = document.getElementById("fileInput");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const filePill = document.getElementById("filePill");
const fileNameSpan = document.getElementById("fileNameSpan");
const removeFileBtn = document.getElementById("removeFileBtn");
const heroContainer = document.getElementById("heroContainer");
const resultsContainer = document.getElementById("resultsContainer");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const sampleBtn = document.getElementById("sampleBtn");

// Contenedores de resultados
const globalPercentageEl = document.getElementById("globalPercentage");
const verdictBadgeEl = document.getElementById("verdictBadge");
const meanPerplexityEl = document.getElementById("meanPerplexity");
const burstinessScoreEl = document.getElementById("burstinessScore");
const highRiskCountEl = document.getElementById("highRiskCount");
const totalSentencesCountEl = document.getElementById("totalSentencesCount");
const manuscriptViewer = document.getElementById("manuscriptViewer");
const inspectorContent = document.getElementById("inspectorContent");
const tabSuggestions = document.getElementById("tabSuggestions");
const tabEditor = document.getElementById("tabEditor");
const liveEditorText = document.getElementById("liveEditorText");
const recalculateBtn = document.getElementById("recalculateBtn");
const newAnalysisBtn = document.getElementById("newAnalysisBtn");
const downloadReportBtn = document.getElementById("downloadReportBtn");

// Tema Oscuro / Claro
function initTheme() {
  const savedTheme = localStorage.getItem("zeroia_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("zeroia_theme", next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  themeToggleBtn.innerHTML = theme === "dark"
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

themeToggleBtn.addEventListener("click", toggleTheme);

// Auto-expandir textarea
promptTextarea.addEventListener("input", () => {
  promptTextarea.style.height = "auto";
  promptTextarea.style.height = Math.min(promptTextarea.scrollHeight, 260) + "px";
  sendBtn.disabled = promptTextarea.value.trim().length === 0;
});

// Manejo de archivos (Word / PDF / Txt)
attachBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    attachBtn.innerText = "Leyendo archivo...";
    attachBtn.disabled = true;

    const extractedText = await window.ZeroIAParser.extractTextFromFile(file);
    promptTextarea.value = extractedText;
    currentRawText = extractedText;

    fileNameSpan.innerText = file.name;
    filePill.style.display = "inline-flex";
    sendBtn.disabled = false;
    promptTextarea.style.height = "140px";
  } catch (err) {
    alert("Error al extraer texto: " + err.message);
  } finally {
    attachBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> Adjuntar Word o PDF`;
    attachBtn.disabled = false;
  }
});

removeFileBtn.addEventListener("click", () => {
  fileInput.value = "";
  filePill.style.display = "none";
});

// Botón de ejemplo
sampleBtn.addEventListener("click", () => {
  promptTextarea.value =
    "En el ámbito de la inteligencia artificial, es importante destacar que los modelos de lenguaje desempeñan un papel crucial. " +
    "En el panorama actual, estas tecnologías transforman la investigación de manera holística, eficiente y escalable. " +
    "Durante los ensayos realizados en el laboratorio en octubre de 2023, observamos ciertas variaciones imprevistas en los datos. " +
    "En conclusión, el desarrollo tecnológico constituye una piedra angular para las futuras generaciones académicas.";
  promptTextarea.dispatchEvent(new Event("input"));
  startAnalysis();
});

// Ejecución del Análisis
sendBtn.addEventListener("click", startAnalysis);

function startAnalysis() {
  const text = promptTextarea.value.trim();
  if (!text || text.length < 20) {
    alert("Introduce un texto con al menos 20 caracteres para auditar.");
    return;
  }

  currentRawText = text;
  sendBtn.innerHTML = `<span style="font-size:0.8rem;">...</span>`;
  sendBtn.disabled = true;

  setTimeout(() => {
    currentAnalysis = window.ZeroIADetector.analyzeDocument(currentRawText);
    renderResults(currentAnalysis);

    heroContainer.style.display = "none";
    resultsContainer.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });

    sendBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
    sendBtn.disabled = false;
  }, 100);
}

// Renderizado de Resultados
function renderResults(analysis) {
  // 1. Métricas Principales
  globalPercentageEl.innerText = `${analysis.globalPercentage}%`;
  globalPercentageEl.style.color = analysis.verdictColor === "red" ? "var(--color-danger-border)" : analysis.verdictColor === "yellow" ? "var(--color-warning-border)" : "var(--color-success-border)";

  verdictBadgeEl.innerText = analysis.classification;
  verdictBadgeEl.className = `tag-badge badge-${analysis.verdictColor}`;

  meanPerplexityEl.innerText = analysis.meanPerplexity;
  burstinessScoreEl.innerText = analysis.burstiness;
  highRiskCountEl.innerText = analysis.highRiskSentences;
  totalSentencesCountEl.innerText = `de ${analysis.totalSentences} frases`;

  // 2. Renderizar Manuscrito con Oraciones Interactivas
  manuscriptViewer.innerHTML = "";
  let currentP = -1;
  let pEl = null;

  analysis.sentences.forEach((s, idx) => {
    if (s.paragraphIdx !== currentP) {
      currentP = s.paragraphIdx;
      pEl = document.createElement("p");
      pEl.style.marginBottom = "1.3rem";
      manuscriptViewer.appendChild(pEl);
    }

    const span = document.createElement("span");
    span.className = `manuscript-sentence sentence-${s.riskLevel}`;
    span.dataset.index = idx;
    span.innerText = s.text + " ";
    span.title = `Riesgo: ${Math.round(s.aiScore * 100)}% IA | PPL: ${s.perplexity}`;

    span.addEventListener("click", () => selectSentence(idx));
    pEl.appendChild(span);
  });

  // 3. Renderizar Panel Lateral con la lista de huellas
  renderInspectorList(analysis.sentences);

  // 4. Cargar texto en editor en vivo
  liveEditorText.value = currentRawText;
}

// Selección de oración individual
function selectSentence(idx) {
  selectedSentenceIdx = idx;
  const spans = manuscriptViewer.querySelectorAll(".manuscript-sentence");
  spans.forEach(sp => sp.classList.remove("sentence-selected"));

  const targetSpan = manuscriptViewer.querySelector(`[data-index="${idx}"]`);
  if (targetSpan) {
    targetSpan.classList.add("sentence-selected");
    targetSpan.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const s = currentAnalysis.sentences[idx];
  showSentenceDetail(s);
}

function showSentenceDetail(s) {
  const badgeClass = s.riskLevel === "high" ? "badge-red" : s.riskLevel === "medium" ? "badge-yellow" : "badge-green";
  const pct = Math.round(s.aiScore * 100);

  let html = `
    <div style="margin-bottom: 14px;">
      <span class="tag-badge ${badgeClass}">${pct}% IA · ${s.riskLevel.toUpperCase()}</span>
      <span style="font-size: 0.8rem; color: var(--text-secondary); margin-left: 8px;">Perplejidad: <b>${s.perplexity}</b></span>
    </div>
    <div style="font-size: 0.95rem; font-style: italic; color: var(--text-primary); margin-bottom: 12px; padding: 10px; background: var(--bg-surface-elevated); border-radius: 8px;">
      "${s.text}"
    </div>
    <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">Diagnóstico Forense:</div>
  `;

  s.reasons.forEach(r => {
    html += `<div style="font-size: 0.85rem; color: var(--color-danger-text); margin-bottom: 4px;">• ${r}</div>`;
  });

  if (s.tips.length > 0) {
    html += `<div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-top: 12px; margin-bottom: 6px;">Cómo Eliminar la Huella:</div>`;
    s.tips.forEach(t => {
      html += `<div style="font-size: 0.85rem; color: var(--text-primary); margin-bottom: 4px;">✓ ${t}</div>`;
    });
  }

  if (s.suggestedRewrite) {
    html += `
      <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-success-text); text-transform: uppercase; margin-top: 12px;">Sugerencia de Reescritura Humana:</div>
      <div class="diff-box">"${s.suggestedRewrite}"</div>
      <button class="btn-primary" style="width: 100%; margin-top: 8px;" onclick="copySuggestion('${encodeURIComponent(s.suggestedRewrite)}')">
        Copiar Sugerencia
      </button>
    `;
  }

  inspectorContent.innerHTML = html;
}

window.copySuggestion = function(encodedText) {
  const text = decodeURIComponent(encodedText);
  navigator.clipboard.writeText(text).then(() => {
    alert("¡Sugerencia copiada al portapapeles!");
  });
};

function renderInspectorList(sentences) {
  const flagged = sentences.filter(s => s.riskLevel !== "low");
  if (flagged.length === 0) {
    inspectorContent.innerHTML = `
      <div style="text-align: center; padding: 24px 12px; color: var(--color-success-text);">
        <div style="font-size: 1.8rem; margin-bottom: 8px;">✨</div>
        <div style="font-weight: 600;">Estilo Orgánico & Humano</div>
        <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">No se identificaron oraciones con patrones típicos de LLMs.</div>
      </div>
    `;
    return;
  }

  let html = `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">Haz clic en cualquier frase del documento para inspeccionarla o revisa las ${flagged.length} oraciones señaladas:</div>`;

  flagged.forEach((s) => {
    const badgeClass = s.riskLevel === "high" ? "badge-red" : "badge-yellow";
    html += `
      <div class="humanize-card" onclick="selectSentence(${s.sentenceIdx})" style="cursor: pointer;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span class="tag-badge ${badgeClass}">${Math.round(s.aiScore * 100)}% IA</span>
          <span style="font-size: 0.75rem; color: var(--text-secondary);">PPL: ${s.perplexity}</span>
        </div>
        <div style="font-size: 0.88rem; color: var(--text-primary); line-height: 1.4;">"${s.text.slice(0, 90)}..."</div>
      </div>
    `;
  });

  inspectorContent.innerHTML = html;
}

// Tabs del panel lateral
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.dataset.tab;
    if (tab === "suggestions") {
      tabSuggestions.style.display = "block";
      tabEditor.style.display = "none";
    } else {
      tabSuggestions.style.display = "none";
      tabEditor.style.display = "block";
    }
  });
});

// Recálculo desde el Editor en Vivo
recalculateBtn.addEventListener("click", () => {
  const updatedText = liveEditorText.value.trim();
  if (!updatedText) return;

  currentRawText = updatedText;
  currentAnalysis = window.ZeroIADetector.analyzeDocument(currentRawText);
  renderResults(currentAnalysis);
});

// Volver a inicio / Nueva Auditoría
newAnalysisBtn.addEventListener("click", () => {
  resultsContainer.style.display = "none";
  heroContainer.style.display = "flex";
  promptTextarea.value = "";
  fileInput.value = "";
  filePill.style.display = "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Descargar Reporte en Markdown
downloadReportBtn.addEventListener("click", () => {
  if (!currentAnalysis) return;

  let report = `# Auditoría de Huellas de IA - Zero-IA\n\n`;
  report += `- **Probabilidad Global de IA:** ${currentAnalysis.globalPercentage}%\n`;
  report += `- **Veredicto:** ${currentAnalysis.classification}\n`;
  report += `- **Perplejidad Media:** ${currentAnalysis.meanPerplexity}\n`;
  report += `- **Ráfaga (Burstiness):** ${currentAnalysis.burstiness}\n`;
  report += `- **Palabras:** ${currentAnalysis.totalWords} | **Oraciones:** ${currentAnalysis.totalSentences}\n\n`;
  report += `## Detalle de Oraciones Señaladas\n\n`;

  currentAnalysis.sentences.forEach(s => {
    if (s.riskLevel !== "low") {
      report += `### [${s.riskLevel.toUpperCase()}] "${s.text}"\n`;
      report += `- **IA:** ${Math.round(s.aiScore * 100)}% | **Perplejidad:** ${s.perplexity}\n`;
      s.reasons.forEach(r => { report += `- Diagnóstico: ${r}\n`; });
      if (s.suggestedRewrite) {
        report += `- Propuesta de reescritura: "${s.suggestedRewrite}"\n`;
      }
      report += `\n`;
    }
  });

  const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Auditoria_ZeroIA_${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
});

// Inicializar al cargar
initTheme();
