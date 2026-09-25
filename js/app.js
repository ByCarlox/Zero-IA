function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/**
 * Zero-IA: Controlador de Interfaz de Usuario estilo Gemini & ChatGPT
 */

let currentAnalysis = null;
let currentRawText = "";
let selectedSentenceIdx = null;
let analysisInProgress = false;
let extractionInfo = null;
let reviewHistory = [];
let initialText = "";

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
const btnToggleGuide = document.getElementById("btnToggleGuide");
const btnCloseGuide = document.getElementById("btnCloseGuide");
const metricsGuideSection = document.getElementById("metricsGuideSection");

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
  extractionInfo = null;
  sendBtn.disabled = analysisInProgress || promptTextarea.value.trim().length === 0;
});

// Manejo de archivos (Word / PDF / Txt)
attachBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    attachBtn.innerText = "Leyendo archivo...";
    attachBtn.disabled = true;
    sendBtn.disabled = true; sampleBtn.disabled = true;

    const parsed = await window.ZeroIAParser.extractTextFromFile(file);
    const extractedText = parsed.text;
    extractionInfo = parsed.extraction;
    if (!extractedText.trim()) throw new Error("No se extrajo texto. Un PDF escaneado necesita OCR previo.");
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
    attachBtn.disabled = false; sampleBtn.disabled = false; sendBtn.disabled = !promptTextarea.value.trim();
  }
});

removeFileBtn.addEventListener("click", () => {
  fileInput.value = "";
  extractionInfo = null;
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
  return runReview(promptTextarea.value, { extraction: extractionInfo });
}

async function runReview(text, options = {}) {
  if (analysisInProgress) return false;
  if (!text.trim()) { alert("Introduce el texto que deseas revisar."); return false; }
  analysisInProgress = true;
  const status = document.getElementById("analysisStatus");
  const cancel = document.getElementById("cancelAnalysisBtn");
  status.textContent = "Preparando revisión…";
  cancel.hidden = false;
  const previous = currentAnalysis ? { text: currentRawText, analysis: currentAnalysis } : null;
  [sendBtn, recalculateBtn, sampleBtn, attachBtn].forEach(button => button.disabled = true);
  try {
    const extraction = options.extraction || (previous ? {...previous.analysis.extraction, warnings:[...previous.analysis.extraction.warnings.filter(w=>!w.startsWith("Texto editado")), "Texto editado: comprueba su correspondencia con el archivo original."]} : undefined);
    const result = await window.ZeroIAAnalysisClient.analyze(text, { extraction }, message => status.textContent = message);
    if (result.error) throw new Error(result.error);
    if (options.recordHistory && previous) reviewHistory.push(previous);
    if (reviewHistory.length > 20) reviewHistory.shift();
    if (!initialText) initialText = text;
    currentRawText = text;
    currentAnalysis = result;
    promptTextarea.value = text;
    renderResults(result);
    heroContainer.style.display = "none";
    resultsContainer.style.display = "block";
    status.textContent = "Validación completada. Autoría no determinada.";
    document.getElementById("undoReviewBtn").disabled = reviewHistory.length === 0;
    if (!options.keepScroll) window.scrollTo({top:0,behavior:"smooth"});
    return true;
  } catch (error) {
    status.textContent = error.name === "AbortError" ? error.message : "No se pudo completar la revisión: " + error.message;
    return false;
  } finally {
    analysisInProgress = false;
    cancel.hidden = true;
    [recalculateBtn, sampleBtn, attachBtn].forEach(button => button.disabled = false);
    sendBtn.disabled = !promptTextarea.value.trim();
  }
}
document.getElementById("cancelAnalysisBtn").addEventListener("click", () => window.ZeroIAAnalysisClient.cancel());
document.getElementById("undoReviewBtn").addEventListener("click", () => {
  if (analysisInProgress || !reviewHistory.length) return;
  const previous = reviewHistory.pop();
  currentRawText = previous.text; currentAnalysis = previous.analysis;
  promptTextarea.value = currentRawText;
  renderResults(currentAnalysis);
  document.getElementById("undoReviewBtn").disabled = reviewHistory.length === 0;
});

function extractDOI(text) {
  if (!text) return null;
  const m = text.match(/(?:doi\s*:\s*|https?:\/\/(?:dx\.)?doi\.org\/|(?:^|[\s(]))(10\.\d{4,9}\/[^\s,;"'<>)]+)/i);
  if (m) {
    return m[1].replace(/[.,;)]+$/, '');
  }
  return null;
}

function getFindingBadge(code) {
  switch (code) {
    case 'missing_reference':
      return 'Cita sin bibliografía';
    case 'not_cited':
      return 'Entrada no citada en cuerpo';
    case 'unparsed_reference':
      return 'Formato atípico';
    case 'future_year':
      return 'Año posterior al actual';
    case 'invalid_doi':
      return 'Sintaxis DOI atípica';
    case 'ambiguous_reference':
      return 'Cita ambigua (múltiples entradas)';
    case 'unsupported_range':
      return 'Rango numérico no interpretable';
    default:
      return `⚠️ ${code}`;
  }
}

async function verifyDOIWithCrossref(doi, resultEl, buttonEl) {
  const reviewedReport = currentAnalysis;
  const referenceText = reviewedReport.academic_review.citations.references.find(r=>extractDOI(r.text)===doi)?.text || "";
  buttonEl.disabled = true;
  resultEl.innerHTML = `<span style="font-size: 0.76rem; color: var(--text-secondary);">⏳ Consultando registro en api.crossref.org...</span>`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7500);
    const resp = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (resp.status === 200) {
      const data = await resp.json();
      const item = data.message || {};
      const comparison = window.ZeroIAReferenceCheck.compare(referenceText, item);
      reviewedReport.externalChecks.push({doi, checkedAt:new Date().toISOString(), ...comparison});
      const title = (item.title && item.title.length) ? item.title[0] : 'Título no registrado';
      const container = (item['container-title'] && item['container-title'].length) ? item['container-title'][0] : (item.publisher || 'Publicación no especificada');
      const issued = (item.issued && item.issued['date-parts'] && item.issued['date-parts'][0]) ? item.issued['date-parts'][0][0] : 'Año N/D';
      const authors = (item.author || []).slice(0, 3).map(a => `${a.family || ''} ${a.given ? a.given[0] + '.' : ''}`.trim()).filter(Boolean).join(', ');

      resultEl.innerHTML = `
        <div class="doi-success-card">
          <div class="doi-status-tag tag-verified">${escapeHTML(comparison.message)}</div>
          <div style="font-weight: 600; color: var(--text-primary); font-size: 0.8rem;">${escapeHTML(title)}</div>
          <div style="color: var(--text-secondary); font-size: 0.75rem;">${escapeHTML(authors || 'Autores N/D')} · <em>${escapeHTML(container)}</em> (${issued})</div>
          <div class="doi-meta-notice">Nota metodológica: La existencia de la fuente no demuestra que respalde la afirmación del autor; se requiere leer el documento original.</div>
        </div>
      `;
    } else if (resp.status === 404) {
      resultEl.innerHTML = `
        <div class="doi-warning-card">
          <div class="doi-status-tag tag-notfound">✕ No encontrado en Crossref (404)</div>
          <div style="color: var(--text-secondary); font-size: 0.75rem;">El identificador no figura en el catálogo central de Crossref. Verifique la sintaxis o si pertenece a otro repositorio (DataCite, PubMed).</div>
        </div>
      `;
    } else {
      resultEl.innerHTML = `
        <div class="doi-warning-card">
          <div class="doi-status-tag tag-warning">⚠️ Respuesta externa inesperada (HTTP ${resp.status})</div>
          <div style="color: var(--text-secondary); font-size: 0.75rem;">El servicio de Crossref no devolvió un registro válido en este momento.</div>
        </div>
      `;
    }
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    resultEl.innerHTML = `
      <div class="doi-warning-card">
        <div class="doi-status-tag tag-warning">⚠️ ${isTimeout ? 'Tiempo de espera agotado' : 'Error de conexión externa'}</div>
        <div style="color: var(--text-secondary); font-size: 0.75rem;">No se pudo conectar con api.crossref.org (${escapeHTML(err.message || 'Restricción de red')}). Puede abrir el enlace DOI directamente.</div>
      </div>
    `;
  } finally {
    buttonEl.disabled = false;
  }
}

function renderAcademicReview(review) {
  const container = document.getElementById("academicReview");
  if (!container) return;
  if (!review) {
    container.innerHTML = `<div style="color: var(--text-tertiary); font-size: 0.85rem; padding: 1rem;">No se generó reporte académico.</div>`;
    return;
  }

  const r = review.readability || {};
  const c = review.citations || { references: [], citations: [], findings: [] };

  let rBadgeClass = "badge-blue";
  if (r.score !== null) {
    if (r.score >= 65) rBadgeClass = "badge-green";
    else if (r.score >= 50) rBadgeClass = "badge-blue";
    else if (r.score >= 40) rBadgeClass = "badge-amber";
    else rBadgeClass = "badge-purple";
  }

  const refsWithDoi = [];
  (c.references || []).forEach((ref, idx) => {
    const doi = extractDOI(ref.text);
    if (doi) {
      refsWithDoi.push({ index: idx, text: ref.text, doi: doi });
    }
  });

  const avgWordsPerSentence = (r.words && r.sentences) ? (r.words / r.sentences).toFixed(1) : "0.0";
  const scorePercent = r.score !== null ? Math.min(100, Math.max(0, r.score)) : 0;

  const html = `
    <div class="academic-cards-container">
      <!-- Tarjeta 1: Legibilidad -->
      <div class="academic-card">
        <div class="academic-card-header">
          <div class="academic-card-title">
            <span class="academic-icon">01</span>
            <strong>Legibilidad</strong>
          </div>
          <span class="inflesz-badge ${rBadgeClass}">${r.label || 'No evaluable'}</span>
        </div>

        <div class="readability-score-row">
          <div class="readability-hero-num">${r.score !== null ? r.score : 'N/D'}</div>
          <div class="readability-desc">
            <div class="readability-range-bar">
              <div class="readability-range-fill" style="width: ${scorePercent}%;"></div>
            </div>
            <div class="readability-scale-legend">&lt;40: Muy difícil · 55-65: Estándar · &gt;80: Muy fácil</div>
          </div>
        </div>

        <div class="academic-metrics-grid">
          <div class="academic-metric-item">
            <span class="metric-val">${r.words || 0}</span>
            <span class="metric-lbl">Palabras analizadas</span>
          </div>
          <div class="academic-metric-item">
            <span class="metric-val">${r.sentences || 0}</span>
            <span class="metric-lbl">Oraciones evaluadas</span>
          </div>
          <div class="academic-metric-item">
            <span class="metric-val">${avgWordsPerSentence}</span>
            <span class="metric-lbl">Palabras por oración</span>
          </div>
          <div class="academic-metric-item">
            <span class="metric-val">${r.syllables || 0}</span>
            <span class="metric-lbl">Sílabas estimadas</span>
          </div>
        </div>

        ${r.short_sample ? `
          <div class="academic-alert alert-warning">
            Muestra breve (&lt;100 palabras): las métricas estadísticas de estilo presentan alta variabilidad.
          </div>
        ` : ''}

        <div class="academic-caption">
          Escala INFLESZ adaptada a español (Szigriszt-Pazos). Describe la dificultad sintáctica del texto; no evalúa la calidad del contenido ni la autoría.
        </div>
      </div>

      <!-- Tarjeta 2: Citas y bibliografía -->
      <div class="academic-card">
        <div class="academic-card-header">
          <div class="academic-card-title">
            <span class="academic-icon">02</span>
            <strong>Citas y bibliografía</strong>
          </div>
          <span class="inflesz-badge ${c.has_bibliography ? 'badge-green' : 'badge-amber'}">
            ${c.has_bibliography ? 'Sección detectada' : 'Sin bibliografía'}
          </span>
        </div>

        <div class="citations-summary-stats">
          <div class="citation-stat-badge"><strong>${(c.citations || []).length}</strong> Citas en cuerpo</div>
          <div class="citation-stat-badge"><strong>${(c.references || []).length}</strong> Referencias</div>
          <div class="citation-stat-badge ${(c.findings || []).length > 0 ? 'stat-warning' : 'stat-success'}">
            <strong>${(c.findings || []).length}</strong> Observaciones
          </div>
        </div>

        ${!c.has_bibliography ? `
          <div class="academic-alert alert-info">
            No se detectó un encabezado de bibliografía (ej. <em>"Referencias"</em> o <em>"Bibliografía"</em>). Para cotejar la correspondencia de citas, incluya la sección correspondiente.
          </div>
        ` : ''}

        ${(c.findings && c.findings.length > 0) ? `
          <div class="findings-list">
            <div class="findings-title">Observaciones para revisar</div>
            ${c.findings.map(f => `
              <div class="finding-item finding-${f.code}">
                <div class="finding-code-badge">${getFindingBadge(f.code)}</div>
                <div class="finding-msg">${escapeHTML(f.message)}</div>
                <div class="finding-evidence"><code>${escapeHTML(f.evidence)}</code></div>
              </div>
            `).join('')}
          </div>
        ` : (c.has_bibliography ? `
          <div class="academic-alert alert-success">
            ✓ Todas las citas autor-año y numéricas tienen correspondencia interna en la lista bibliográfica.
          </div>
        ` : '')}

        <!-- Verificación de DOIs externos -->
        ${refsWithDoi.length > 0 ? `
          <div class="doi-section-block">
            <div class="doi-section-header">
              <span>Identificadores DOI detectados (${refsWithDoi.length})</span>
              <span style="font-size: 0.72rem; color: var(--text-tertiary);">Consulta externa opcional</span>
            </div>
            ${refsWithDoi.map(item => `
              <div class="doi-item-card" data-doi-item="${item.index}">
                <div class="doi-item-top">
                  <a href="https://doi.org/${encodeURIComponent(item.doi)}" target="_blank" rel="noopener noreferrer" class="doi-link" title="Abrir página oficial del editor">
                    doi.org/${escapeHTML(item.doi)} ↗
                  </a>
                  <button type="button" class="btn-verify-doi" data-doi="${escapeHTML(item.doi)}" data-target="doi-res-${item.index}">
                    Resolver en Crossref
                  </button>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3;">
                  ${escapeHTML(item.text.length > 140 ? item.text.slice(0, 140) + '...' : item.text)}
                </div>
                <div class="doi-res-box" id="doi-res-${item.index}"></div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="academic-caption">
          Revisión heurística (APA/Harvard e IEEE). La existencia de una fuente o correspondencia interna no demuestra que respalde la afirmación del autor.
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Enlazar eventos a los botones de verificación Crossref
  container.querySelectorAll(".btn-verify-doi").forEach(btn => {
    btn.addEventListener("click", () => {
      const doi = btn.getAttribute("data-doi");
      const targetId = btn.getAttribute("data-target");
      const resEl = document.getElementById(targetId);
      if (doi && resEl) {
        verifyDOIWithCrossref(doi, resEl, btn);
      }
    });
  });
}

// Renderizado de Resultados
function renderResults(analysis) {
  if (analysis.error) { alert(analysis.error); return; }
  renderAcademicReview(analysis.academic_review);

  // 1. Métricas Principales
  if (analysis.validationScore !== null && analysis.validationScore !== undefined) {
    globalPercentageEl.innerText = `${analysis.validationScore}%`;
  } else {
    globalPercentageEl.innerText = "N/D";
  }
  globalPercentageEl.style.color = analysis.verdictColor === "red" ? "var(--color-danger-border)" : analysis.verdictColor === "yellow" ? "var(--color-warning-border)" : "var(--color-success-border, var(--text-primary))";

  verdictBadgeEl.innerText = analysis.classification;
  verdictBadgeEl.className = `tag-badge badge-${analysis.verdictColor}`;

  const cleanLabelEl = document.getElementById("cleanPercentageLabel");
  if (cleanLabelEl) {
    cleanLabelEl.textContent = (analysis.cleanPercentage !== null && analysis.cleanPercentage !== undefined)
      ? `${analysis.cleanPercentage}% texto sin incidencias`
      : "No evaluable";
  }

  meanPerplexityEl.innerText = analysis.metrics.meanSentenceWords.toLocaleString("es", {maximumFractionDigits:1});
  burstinessScoreEl.innerText = `${analysis.coverage.analyzedWords} / ${analysis.coverage.totalWords}`;
  highRiskCountEl.innerText = analysis.highRiskSentences;
  totalSentencesCountEl.innerText = `de ${analysis.totalSentences} frases`;

  // 1.1 Veredicto General Ejecutivo
  const verdictCard = document.getElementById("executiveVerdictCard");
  const verdictTitle = document.getElementById("executiveVerdictTitle");
  const verdictSubtitle = document.getElementById("executiveVerdictSubtitle");
  const verdictPill = document.getElementById("executiveVerdictPill");
  const verdictBody = document.getElementById("executiveVerdictBody");
  const verdictIcon = document.getElementById("verdictIconContainer");

  if (verdictCard) {
    verdictCard.className = `executive-verdict-card verdict-${analysis.verdictColor}`;
    verdictTitle.innerText = "Dictamen de validación";
    verdictSubtitle.innerText = `Motor ${analysis.version} · ${analysis.totalSentences} frases · Idioma de revisión: español`;
    verdictPill.innerText = analysis.verdictBadge || (analysis.verdictColor === "red" ? "🔴 ALTA CONCENTRACIÓN" : analysis.verdictColor === "yellow" ? "🟡 CONCENTRACIÓN MEDIA" : "🟢 POCOS PATRONES");
    verdictPill.className = `tag-badge badge-${analysis.verdictColor}`;
    verdictBody.innerText = analysis.verdictSummary;
    verdictIcon.innerText = analysis.verdictColor === "red" ? "!" : analysis.verdictColor === "yellow" ? "—" : "✓";
  }

  // 1.2 Escudo de Marcas de Agua Ocultas & Caracteres de Ancho Cero
  const wmShieldBox = document.getElementById("watermarkShieldBox");
  const wmShieldText = document.getElementById("watermarkShieldText");
  const wmIcon = document.getElementById("watermarkIcon");
  const btnStripWm = document.getElementById("btnStripWatermarks");

  const wm = analysis.watermark_analysis;
  if (wm && wm.hasFormatting) {
    wmShieldBox.className = `watermark-shield-box shield-${wm.status}`;
    if (wmIcon) wmIcon.innerText = "!";
    if (wmShieldText) {
      wmShieldText.textContent = wm.message;
    }
    if (btnStripWm) btnStripWm.style.display = wm.positions.some(p => p.removable) ? "flex" : "none";
  } else {
    wmShieldBox.className = "watermark-shield-box shield-clean";
    if (wmIcon) wmIcon.innerText = "✓";
    if (wmShieldText) {
      wmShieldText.innerText = "No se detectaron caracteres invisibles de los tipos revisados.";
    }
    if (btnStripWm) btnStripWm.style.display = "none";
  }

  document.getElementById("unicodeDetails").textContent = wm.positions.slice(0,100).map(p=>`${p.hex} · posición ${p.start} · ${p.name}: ${p.context}`).join("\n") + (wm.positions.length>100 ? "\nMás posiciones en el informe." : "");
  document.getElementById("coverageDetails").textContent = `${analysis.coverage.excludedWords} palabras excluidas del análisis de estilo (títulos, bibliografía, listas o tablas, o idioma no compatible). ${analysis.extraction.coverage || ""}`;
  document.getElementById("extractionWarnings").textContent = (analysis.extraction.warnings || []).join(" ");
  document.getElementById("dimensionSummary").innerHTML = analysis.dimensions.map(d => `<span class="citation-stat-badge"><strong>${d.count}</strong>${({repetition:"Repetición",structure:"Estructura",specificity:"Precisión",clarity:"Claridad"})[d.id]}</span>`).join("");
  // Preserve every source character and original whitespace. Render 100 spans at a time.
  manuscriptViewer.textContent = "";
  let cursor = 0, rendered = 0;
  const appendBatch = () => {
    const batch = analysis.sentences.slice(rendered, rendered + 100);
    for (const sentence of batch) {
      manuscriptViewer.appendChild(document.createTextNode(analysis.sourceText.slice(cursor, sentence.start)));
      const span = document.createElement("span");
      span.className = `manuscript-sentence sentence-${sentence.riskLevel}`;
      span.dataset.index = sentence.globalIdx;
      span.textContent = sentence.text;
      span.title = `${sentence.findings.length} observaciones · ${sentence.kind === "body" ? "Prosa" : "Bloque excluido"}`;
      span.tabIndex = 0; span.setAttribute("role", "button");
      span.setAttribute("aria-label", `Revisar fragmento ${sentence.globalIdx + 1}: ${sentence.text}`);
      span.addEventListener("click", () => selectSentence(sentence.globalIdx));
      span.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectSentence(sentence.globalIdx); } });
      manuscriptViewer.appendChild(span); cursor = sentence.end;
    }
    rendered += batch.length;
    if (rendered >= analysis.sentences.length) manuscriptViewer.appendChild(document.createTextNode(analysis.sourceText.slice(cursor)));
    document.getElementById("loadMoreBtn").hidden = rendered >= analysis.sentences.length;
  };
  document.getElementById("loadMoreBtn").onclick = appendBatch;
  appendBatch();

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

  document.querySelector('.tab-btn[data-tab="suggestions"]').click();
  const s = currentAnalysis.sentences[idx];
  showSentenceDetail(s);
}

function showSentenceDetail(s) {
  let html = `<p class="academic-caption">Fragmento ${s.globalIdx + 1} · ${s.wordCount} palabras · ${s.kind === "body" ? "Prosa analizada" : "Excluido de estilo"}</p><blockquote class="diff-box">${escapeHTML(s.text)}</blockquote>`;
  const findings = currentAnalysis.findings.filter(f => s.findings.includes(f.id));
  html += findings.map(f => `<section class="finding-item"><strong>${escapeHTML(f.message)}</strong><p>${escapeHTML(f.advice)}</p><small>Regla: ${escapeHTML(f.rule)} · ${f.severity === "info" ? "Informativa" : f.severity === "high" ? "Prioridad alta" : "Prioridad media"}</small>${f.excerpt ? `<blockquote>${escapeHTML(f.excerpt)}</blockquote>` : ""}${f.sentenceIds.length > 1 ? `<p>También aparece en los fragmentos ${f.sentenceIds.filter(id => id !== s.globalIdx).slice(0,20).map(id => id + 1).join(", ")}${f.sentenceIds.length > 21 ? "…" : ""}.</p>` : ""}</section>`).join("");
  if (!findings.length) html += `<p>${escapeHTML(s.reasons[0])}</p>`;
  if (s.suggestion) {
    html += `<h3 class="panel-title">Propuesta para revisar</h3><p class="academic-caption">${escapeHTML(s.suggestion.reason)}</p><div class="diff-box"><del>${escapeHTML(s.suggestion.original)}</del><br><ins>${escapeHTML(s.suggestedRewrite)}</ins></div><button class="btn-primary" id="applySuggestionBtn">Aceptar este cambio</button><button class="btn-secondary" id="copySuggestionBtn">Copiar alternativa</button>`;
  }
  inspectorContent.innerHTML = html;
  const apply = document.getElementById("applySuggestionBtn");
  if (apply) apply.addEventListener("click", () => {
    try {
      const revised = window.ZeroIADetector.applySuggestion(liveEditorText.value, currentAnalysis, s.globalIdx);
      runReview(revised, {recordHistory:true,keepScroll:true});
    } catch (error) {document.getElementById("analysisStatus").textContent = error.message;}
  });
  const copy = document.getElementById("copySuggestionBtn");
  if (copy) copy.addEventListener("click", async () => {try {await navigator.clipboard.writeText(s.suggestedRewrite);copy.textContent="Copiado";} catch {copy.textContent="Selecciona y copia la alternativa";}});
}
function renderInspectorList(sentences) {
  const flagged = sentences.filter(s => s.findings.length || s.suggestion);
  inspectorContent.innerHTML = flagged.length ? `<p class="academic-caption">${flagged.length} fragmentos con observaciones o propuestas. Las observaciones informativas no son errores ni pruebas de IA.</p>` + flagged.slice(0,100).map(s => `<button type="button" class="humanize-card" data-sentence-index="${s.globalIdx}"><strong>Fragmento ${s.globalIdx+1} · ${s.findings.length} observaciones</strong><p>${escapeHTML(s.text.slice(0,130))}${s.text.length>130?"…":""}</p></button>`).join("") + (flagged.length>100?'<p>Se muestran los primeros 100. El informe descargado incluye todas las observaciones.</p>':'') : '<p>Sin incidencias detectadas con estas reglas. La autoría, la exactitud factual y el respaldo de las afirmaciones no están determinados.</p>';
  inspectorContent.querySelectorAll("[data-sentence-index]").forEach(button => button.addEventListener("click", () => selectSentence(Number(button.dataset.sentenceIndex))));
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
recalculateBtn.addEventListener("click", () => runReview(liveEditorText.value, {recordHistory:true,keepScroll:true}));

// Volver a inicio / Nueva Auditoría
newAnalysisBtn.addEventListener("click", () => {
  if (analysisInProgress) return;
  currentAnalysis = null; currentRawText = ""; initialText = ""; reviewHistory = []; extractionInfo = null;
  resultsContainer.style.display = "none";
  heroContainer.style.display = "flex";
  promptTextarea.value = "";
  sendBtn.disabled = true;
  fileInput.value = "";
  filePill.style.display = "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Descargar Reporte en Markdown
downloadReportBtn.addEventListener("click", () => {
  if (!currentAnalysis) return;

  const report = window.ZeroIADetector.summary(currentAnalysis);

  const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Auditoria_ZeroIA_${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
});

// Only an initial BOM is removable. Other Unicode formatting is preserved.
const btnStripWatermarks = document.getElementById("btnStripWatermarks");
btnStripWatermarks.addEventListener("click", () => {
  if (!currentAnalysis || liveEditorText.value !== currentRawText) {document.getElementById("analysisStatus").textContent="Recalcula los cambios del editor antes de limpiar el formato.";return;}
  const cleaned = window.ZeroIADetector.stripInvisibleCharacters(currentRawText);
  if (cleaned !== currentRawText) runReview(cleaned,{recordHistory:true,keepScroll:true});
});

// Botón Imprimir / Guardar en PDF
const printReportBtn = document.getElementById("printReportBtn");
if (printReportBtn) {
  printReportBtn.addEventListener("click", () => {
    while (!document.getElementById("loadMoreBtn").hidden) document.getElementById("loadMoreBtn").click();
    window.print();
  });
}

// Guía Desplegable de Interpretación de Métricas
if (btnToggleGuide && metricsGuideSection) {
  btnToggleGuide.addEventListener("click", () => {
    const isHidden = metricsGuideSection.style.display === "none";
    metricsGuideSection.style.display = isHidden ? "block" : "none";
    btnToggleGuide.setAttribute("aria-expanded", isHidden ? "true" : "false");
    if (isHidden) {
      metricsGuideSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
}

if (btnCloseGuide && metricsGuideSection) {
  btnCloseGuide.addEventListener("click", () => {
    metricsGuideSection.style.display = "none";
    if (btnToggleGuide) btnToggleGuide.setAttribute("aria-expanded", "false");
  });
}

document.querySelectorAll(".stat-info-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (metricsGuideSection) {
      metricsGuideSection.style.display = "block";
      if (btnToggleGuide) btnToggleGuide.setAttribute("aria-expanded", "true");
      const targetId = btn.getAttribute("data-guide-target");
      if (targetId) {
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
          targetEl.style.borderColor = "var(--accent-blue)";
          targetEl.style.boxShadow = "0 0 0 2px var(--accent-blue)";
          setTimeout(() => {
            targetEl.style.borderColor = "";
            targetEl.style.boxShadow = "";
          }, 2000);
        }
      }
    }
  });
});

// Proposals never rewrite the whole manuscript automatically.
const autoCleanBtn = document.getElementById("autoCleanBtn");
autoCleanBtn.addEventListener("click", async () => {
  if (liveEditorText.value !== currentRawText && !await runReview(liveEditorText.value,{recordHistory:true,keepScroll:true})) return;
  const next = currentAnalysis?.sentences.find(s => s.suggestion);
  if (next) {tabSuggestions.style.display="block";tabEditor.style.display="none";document.querySelectorAll(".tab-btn").forEach(b=>b.classList.toggle("active",b.dataset.tab==="suggestions"));selectSentence(next.globalIdx);}
  else document.getElementById("analysisStatus").textContent="No hay cambios automáticos conservadores disponibles. Revisa las observaciones en su contexto.";
});

// Filtros de visualización en el Manuscrito
const filterChips = document.querySelectorAll(".filter-chip");
filterChips.forEach(chip => {
  chip.addEventListener("click", () => {
    filterChips.forEach(c => c.classList.remove("active"));
    chip.classList.add("active");

    const mode = chip.dataset.filter;
    const sentences = manuscriptViewer.querySelectorAll(".manuscript-sentence");

    sentences.forEach(s => {
      s.classList.remove("dimmed-sentence");
      if (mode === "high" && !s.classList.contains("sentence-high")) {
        s.classList.add("dimmed-sentence");
      } else if (mode === "medium" && !s.classList.contains("sentence-medium")) {
        s.classList.add("dimmed-sentence");
      }
    });
  });
});

// Inicializar al cargar
initTheme();

function downloadText(text, name) {
  const url = URL.createObjectURL(new Blob([text], {type:"text/plain;charset=utf-8"}));
  const link = document.createElement("a"); link.href=url; link.download=name; link.click(); URL.revokeObjectURL(url);
}
document.getElementById("downloadOriginalBtn").addEventListener("click",()=>downloadText(initialText,"original.txt"));
document.getElementById("downloadCurrentBtn").addEventListener("click",()=>downloadText(liveEditorText.value,"revisado.txt"));

liveEditorText.addEventListener("input",()=>{document.getElementById("analysisStatus").textContent=liveEditorText.value===currentRawText?"Texto igual a la última revisión.":"Cambios sin revisar. Recalcula para actualizar las observaciones y el informe.";});
