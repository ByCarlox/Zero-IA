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
let externalReport = null;
let currentPreflight = null;

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
  let savedTheme = "dark";
  try {
    const stored = localStorage.getItem("kriterion_theme") || localStorage.getItem("zeroia_theme");
    if (stored === "light") savedTheme = "light";
  } catch (_) {}
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem("kriterion_theme", next);
    localStorage.setItem("zeroia_theme", next);
  } catch (_) {}
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
    const result = await window.ZeroIAAnalysisClient.analyze(text, { extraction, stage: document.getElementById("deliveryStage").value, rubric: document.getElementById("deliveryRubric").value }, message => status.textContent = message);
    if (result.error) throw new Error(result.error);
    result.sourceSHA256 = await window.ZeroIAPreflight.hash(text);
    if (options.recordHistory && previous) reviewHistory.push(previous);
    if (reviewHistory.length > 20) reviewHistory.shift();
    if (!initialText) initialText = text;
    currentRawText = text;
    currentAnalysis = result;
    promptTextarea.value = text;
    renderResults(result);
    saveReviewMetadata();
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
    globalPercentageEl.innerHTML = `${analysis.validationScore}<span style="font-size: 0.55em; color: var(--text-secondary); font-weight: normal; margin-left: 3px;">/ 100</span>`;
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
    verdictTitle.innerText = "Resumen editorial";
    verdictSubtitle.innerText = `Motor ${analysis.version} · ${analysis.totalSentences} frases · Idioma de revisión: español`;
    verdictPill.innerText = analysis.verdictBadge || (analysis.verdictColor === "red" ? "🔴 ALTA CONCENTRACIÓN" : analysis.verdictColor === "yellow" ? "🟡 CONCENTRACIÓN MEDIA" : "🟢 POCOS PATRONES");
    verdictPill.className = `tag-badge badge-${analysis.verdictColor}`;
    verdictBody.innerText = analysis.verdictSummary;
    verdictIcon.innerText = analysis.verdictColor === "red" ? "!" : analysis.verdictColor === "yellow" ? "—" : "✓";
  }

  // 1.2 Escudo Forense de Marcas de Agua Ocultas & Caracteres de Ancho Cero
  const wmShieldBox = document.getElementById("watermarkShieldBox");
  const wmShieldText = document.getElementById("watermarkShieldText");
  const wmIcon = document.getElementById("watermarkIcon");
  const btnStripWm = document.getElementById("btnStripWatermarks");
  const wmScorePill = document.getElementById("watermarkScorePill");

  const wm = analysis.watermark_analysis;
  if (wm && wm.hasWatermark) {
    wmShieldBox.className = "watermark-shield-box shield-alert";
    if (wmIcon) wmIcon.innerText = "🚨";
    if (wmShieldText) {
      wmShieldText.innerHTML = `<strong>Marcas de agua de IA detectadas (${wm.covertWatermarksCount} señal${wm.covertWatermarksCount > 1 ? 'es' : ''} forense${wm.covertWatermarksCount > 1 ? 's' : ''}).</strong> ${wm.message}`;
    }
    if (wmScorePill) {
      wmScorePill.style.display = "inline-block";
      wmScorePill.className = "tag-badge badge-red";
      wmScorePill.textContent = `+${wm.watermarkScoreContribution}% al índice IA`;
    }
    if (btnStripWm) {
      btnStripWm.style.display = "flex";
      btnStripWm.textContent = `Desinfectar ${wm.covertWatermarksCount} marca(s) de IA`;
    }
  } else if (wm && wm.hasFormatting) {
    wmShieldBox.className = "watermark-shield-box shield-info";
    if (wmIcon) wmIcon.innerText = "ℹ️";
    if (wmShieldText) {
      wmShieldText.textContent = wm.message;
    }
    if (wmScorePill) {
      wmScorePill.style.display = "inline-block";
      wmScorePill.className = "tag-badge badge-green";
      wmScorePill.textContent = "0% IA (Formato estándar)";
    }
    if (btnStripWm) {
      btnStripWm.style.display = wm.positions.some(p => p.removable) ? "flex" : "none";
      btnStripWm.textContent = "Retirar BOM inicial";
    }
  } else {
    wmShieldBox.className = "watermark-shield-box shield-clean";
    if (wmIcon) wmIcon.innerText = "✓";
    if (wmShieldText) {
      wmShieldText.innerText = "Integridad limpia: No se detectaron marcas de agua ni caracteres esteganográficos.";
    }
    if (wmScorePill) {
      wmScorePill.style.display = "none";
    }
    if (btnStripWm) btnStripWm.style.display = "none";
  }

  const unicodeLines = [];
  if (wm && wm.positions.length) {
    unicodeLines.push("=== DIAGNÓSTICO FORENSE DE MARCAS DE AGUA & CODIFICACIÓN UNICODE ===");
    unicodeLines.push(`• Total caracteres de formato/invisibles: ${wm.totalInvisibleChars}`);
    unicodeLines.push(`• Marcas de agua de IA confirmadas: ${wm.covertWatermarksCount}`);
    unicodeLines.push(`• Densidad de marcas: ${wm.watermarkDensityPer1k} por 1,000 caracteres`);
    unicodeLines.push(`• Confianza forense de firma: ${wm.watermarkConfidence}%`);
    unicodeLines.push(`• Aporte porcentual al score de IA: +${wm.watermarkScoreContribution}%`);
    if (wm.vendorSignatures && wm.vendorSignatures.length) {
      unicodeLines.push(`• Firmas de IA detectadas: ${wm.vendorSignatures.join(', ')}`);
    }
    unicodeLines.push("\n--- POSICIONES Y CONTEXTO EN EL DOCUMENTO ---");
    for (const p of wm.positions.slice(0, 100)) {
      const tag = p.isCovert ? "[🚨 MARCA IA / ESTEGANOGRAFÍA]" : "[ℹ️ FORMATO ESTÁNDAR]";
      unicodeLines.push(`${p.hex} · Posición ${p.start} · ${p.name} ${tag}`);
      unicodeLines.push(`   Riesgo: ${p.risk} | Proveedor: ${p.vendor || 'N/A'}`);
      unicodeLines.push(`   Contexto: "${p.context}"\n`);
    }
    if (wm.positions.length > 100) {
      unicodeLines.push(`\n... y ${wm.positions.length - 100} posiciones más en el manuscrito.`);
    }
  } else {
    unicodeLines.push("Texto limpio. No contiene caracteres invisibles ni marcas esteganográficas.");
  }
  document.getElementById("unicodeDetails").textContent = unicodeLines.join('\n');
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
  renderPreflight();
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
  currentAnalysis = null; currentRawText = ""; initialText = ""; reviewHistory = []; extractionInfo = null; externalReport = null; currentPreflight = null;
  document.getElementById("externalReportForm").reset();
  document.getElementById("externalAI").required = true;
  document.getElementById("externalAI").disabled = false;
  recordStatus("");
  document.getElementById("analysisStatus").textContent = "";
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

  if (liveEditorText.value !== currentRawText) { recordStatus("Recalcula los cambios antes de descargar el informe."); return; }
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
    if (liveEditorText.value !== currentRawText) { recordStatus("Recalcula los cambios antes de imprimir."); return; }
    while (!document.getElementById("loadMoreBtn").hidden) document.getElementById("loadMoreBtn").click();
    const closedFindings = [...document.querySelectorAll("#preflightFindings details:not([open])")];
    closedFindings.forEach(detail => detail.open = true);
    window.addEventListener("afterprint", () => closedFindings.forEach(detail => detail.open = false), {once:true});
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

// Delivery review: external measurements stay separate from editorial rules.
function renderPreflight() {
  if (!currentAnalysis) return;
  currentPreflight = window.ZeroIAPreflight.evaluate(currentAnalysis, {
    stage: document.getElementById("deliveryStage").value,
    rubric: document.getElementById("deliveryRubric").value,
    externalReport
  });
  currentAnalysis.deliveryReview = currentPreflight;
  const editorDirty = liveEditorText.value !== currentRawText;
  const ai = currentPreflight.authorship;
  const aiPercentageEl = document.getElementById("aiPercentage");
  const aiVerdictBadgeEl = document.getElementById("aiVerdictBadge");
  const aiExplanationEl = document.getElementById("aiResultExplanation");
  const aiProvenanceEl = document.getElementById("aiResultProvenance");

  // Metrics elements
  const aiProbMetrics = currentAnalysis.ai_probability?.metrics || {};
  if (document.getElementById("aiPredictability")) {
    document.getElementById("aiPredictability").textContent = aiProbMetrics.predictabilityScore != null ? `${aiProbMetrics.predictabilityScore}%` : "--";
  }
  if (document.getElementById("aiBurstiness")) {
    document.getElementById("aiBurstiness").textContent = aiProbMetrics.burstiness != null ? `${aiProbMetrics.burstiness}` : "--";
  }
  if (document.getElementById("aiEntropy")) {
    document.getElementById("aiEntropy").textContent = aiProbMetrics.entropy != null ? `${aiProbMetrics.entropy}` : "--";
  }
  if (document.getElementById("aiHighRiskSentences")) {
    document.getElementById("aiHighRiskSentences").textContent = aiProbMetrics.highRiskSentences != null ? `${aiProbMetrics.highRiskSentences} de ${aiProbMetrics.totalSentences || 0}` : "--";
  }

  aiPercentageEl.className = "ai-percentage";
  if (editorDirty) {
    aiPercentageEl.textContent = "Cambios sin revisar";
    aiExplanationEl.textContent = "Recalcula el manuscrito para actualizar la probabilidad científica de IA.";
    if (aiVerdictBadgeEl) {
      aiVerdictBadgeEl.hidden = true;
      aiVerdictBadgeEl.style.display = "none";
      aiVerdictBadgeEl.textContent = "";
    }
  } else if (ai.percentage !== null && ai.percentage !== undefined) {
    aiPercentageEl.textContent = `${ai.percentage}%`;
    const colorClass = ai.color === "red" ? "ai-percentage-red" : ai.color === "yellow" ? "ai-percentage-yellow" : "ai-percentage-green";
    aiPercentageEl.classList.add(colorClass);
    if (aiVerdictBadgeEl) {
      aiVerdictBadgeEl.textContent = ai.badge || ai.classification || "";
      aiVerdictBadgeEl.className = `tag-badge badge-${ai.color || 'yellow'}`;
      aiVerdictBadgeEl.hidden = false;
      aiVerdictBadgeEl.style.display = "";
    }
    aiExplanationEl.textContent = ai.notice || ai.summary || "";
    aiProvenanceEl.textContent = ai.provenance === "computed_internal"
      ? `🔬 Detección estadística interna: Predictibilidad ${aiProbMetrics.predictabilityScore || 0}% · Cadencia CV ${aiProbMetrics.burstiness || 0} · ${aiProbMetrics.highRiskSentences || 0} frases sintéticas críticas.` + (aiProbMetrics.watermarkSignals ? ` · 🚨 Marcas de agua IA: ${aiProbMetrics.watermarkSignals} señal(es) (+${aiProbMetrics.watermarkContribution}% al índice)` : '')
      : (ai.provenance === "manual" ? `Informe externo declarado (${ai.provider || 'Turnitin'})` : `Informe externo importado (${ai.provider || 'Turnitin'})`);
  } else {
    aiPercentageEl.textContent = "--%";
    aiExplanationEl.textContent = "Texto sin señales sintéticas detectadas o sin muestra suficiente.";
    if (aiVerdictBadgeEl) {
      aiVerdictBadgeEl.hidden = true;
      aiVerdictBadgeEl.style.display = "none";
      aiVerdictBadgeEl.textContent = "";
    }
  }

  const btnToggleAIHighlight = document.getElementById("btnToggleAIHighlight");
  if (btnToggleAIHighlight && !btnToggleAIHighlight.dataset.bound) {
    btnToggleAIHighlight.dataset.bound = "true";
    let isHighlighting = false;
    btnToggleAIHighlight.addEventListener("click", () => {
      isHighlighting = !isHighlighting;
      btnToggleAIHighlight.classList.toggle("btn-primary", isHighlighting);
      btnToggleAIHighlight.classList.toggle("btn-secondary", !isHighlighting);
      const spans = manuscriptViewer.querySelectorAll(".manuscript-sentence");
      spans.forEach(span => {
        const idx = Number(span.dataset.index);
        const s = currentAnalysis?.sentences?.[idx];
        if (isHighlighting) {
          if (s?.aiRisk === 'high' || (s?.aiProbability && s.aiProbability >= 55)) {
            span.classList.add("sentence-ai-flagged");
          } else {
            span.classList.add("dimmed-sentence");
          }
        } else {
          span.classList.remove("sentence-ai-flagged");
          span.classList.remove("dimmed-sentence");
        }
      });
      btnToggleAIHighlight.querySelector("span").textContent = isHighlighting
        ? "Quitar resaltado de IA"
        : "Ver frases críticas de IA en el manuscrito";
    });
  }
  // Preflight findings con categorización y agrupación inteligente
  const findings = [...(currentPreflight.findings || [])].sort((a,b) => ({critical:0,high:0,warning:1,medium:1,low:2,info:2}[a.severity] ?? 3) - ({critical:0,high:0,warning:1,medium:1,low:2,info:2}[b.severity] ?? 3));
  
  function getCategory(f) {
    const text = ((f.title || '') + ' ' + (f.message || '')).toLowerCase();
    if (f.severity === 'high' || f.severity === 'critical') return 'high';
    if (text.includes('bibliograf') || text.includes('referencia') || text.includes('cita') || text.includes('fuente') || text.includes('doi')) return 'bib';
    if (text.includes('sección') || text.includes('estructura') || text.includes('desarrollo') || text.includes('capítulo') || text.includes('metodolog') || text.includes('título')) return 'struct';
    return 'general';
  }

  const groups = new Map();
  for (const f of findings) {
    const key = (f.title || f.message || "Observación editorial").trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  }

  const highCount = findings.filter(f => f.severity === 'high' || f.severity === 'critical').length;
  const bibCount = findings.filter(f => getCategory(f) === 'bib').length;
  const structCount = findings.filter(f => getCategory(f) === 'struct').length;

  document.getElementById("preflightSummary").innerHTML = findings.length ? `
    <div class="preflight-summary-badge-bar">
      <span class="preflight-count-pill">${findings.length} pendientes detectados</span>
      ${highCount > 0 ? `<span class="preflight-count-pill pill-danger">${highCount} de prioridad alta</span>` : ''}
      ${bibCount > 0 ? `<span class="preflight-count-pill pill-warning">${bibCount} citas y referencias</span>` : ''}
      ${structCount > 0 ? `<span class="preflight-count-pill pill-info">${structCount} de estructura</span>` : ''}
    </div>
    <div class="preflight-toolbar">
      <div class="preflight-filters" id="preflightFilterChips">
        <button type="button" class="filter-chip active" data-filter-cat="all">Todos (${findings.length})</button>
        ${highCount > 0 ? `<button type="button" class="filter-chip" data-filter-cat="high">🔴 Prioridad alta (${highCount})</button>` : ''}
        ${bibCount > 0 ? `<button type="button" class="filter-chip" data-filter-cat="bib">📚 Bibliografía (${bibCount})</button>` : ''}
        ${structCount > 0 ? `<button type="button" class="filter-chip" data-filter-cat="struct">📑 Estructura (${structCount})</button>` : ''}
      </div>
      <button type="button" class="btn-toggle-all-preflight" id="btnToggleAllPreflight" title="Abrir o cerrar todos los acordeones">
        <span>Expandir todos</span>
      </button>
    </div>
  ` : "Sin pendientes detectados por las comprobaciones disponibles. No certifica aceptación.";

  const cardsHtml = Array.from(groups.entries()).map(([title, items]) => {
    const first = items[0];
    const category = getCategory(first);
    const severityClass = ({high:"badge-red", critical:"badge-red", warning:"badge-amber", medium:"badge-amber", info:"badge-blue", low:"badge-blue"})[first.severity] || "badge-amber";
    const severityLabel = ({high:"Prioridad alta", critical:"Prioridad alta", warning:"Revisar", medium:"Revisar", info:"Comprobar", low:"Comprobar"})[first.severity] || "Revisar";
    
    if (items.length > 1) {
      return `
        <details class="preflight-finding preflight-grouped-card" data-category="${category}" data-severity="${first.severity}">
          <summary>
            <div class="finding-summary-main">
              <span class="tag-badge ${severityClass}">${escapeHTML(severityLabel)} (${items.length})</span>
              <span class="finding-title">${escapeHTML(title)} <span class="finding-grouped-counter">${items.length} incidencias</span></span>
            </div>
            <span class="chevron-icon-box" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </span>
          </summary>
          <div class="finding-card-content">
            <p class="finding-desc">${escapeHTML(first.message || "Se detectaron múltiples ocurrencias que requieren verificación:")}</p>
            <div class="grouped-evidence-container">
              <div class="grouped-evidence-header">Desglose de fragmentos y evidencias (${items.length}):</div>
              <div class="grouped-evidence-grid">
                ${items.map((it, idx) => {
                  const ev = typeof it.evidence === "string" ? it.evidence : it.evidence ? JSON.stringify(it.evidence) : "";
                  const shortEv = ev.length > 180 ? ev.slice(0, 180) + "…" : ev;
                  return `
                    <div class="grouped-evidence-item">
                      <span class="evidence-pill-num">#${idx + 1}</span>
                      <code class="evidence-pill-code">${escapeHTML(shortEv || it.message || "Sin fragmento textual")}</code>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
            ${first.action ? `<div class="finding-action-row"><strong>Siguiente paso recomendado:</strong> <span>${escapeHTML(first.action)}</span></div>` : ""}
          </div>
        </details>
      `;
    } else {
      const evidence = typeof first.evidence === "string" ? first.evidence : first.evidence ? JSON.stringify(first.evidence) : "";
      const excerpt = evidence.length > 280 ? evidence.slice(0, 280) + "…" : evidence;
      return `
        <details class="preflight-finding" data-category="${category}" data-severity="${first.severity}">
          <summary>
            <div class="finding-summary-main">
              <span class="tag-badge ${severityClass}">${escapeHTML(severityLabel)}</span>
              <span class="finding-title">${escapeHTML(title)}</span>
            </div>
            <span class="chevron-icon-box" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </span>
          </summary>
          <div class="finding-card-content">
            <p class="finding-desc">${escapeHTML(first.message || "")}</p>
            ${excerpt ? `<blockquote class="finding-quote">${escapeHTML(excerpt)}</blockquote>` : ""}
            ${evidence.length > 280 ? `<details class="finding-evidence"><summary>Ver evidencia completa</summary><blockquote>${escapeHTML(evidence)}</blockquote></details>` : ""}
            ${first.action ? `<div class="finding-action-row"><strong>Siguiente paso:</strong> <span>${escapeHTML(first.action)}</span></div>` : ""}
          </div>
        </details>
      `;
    }
  }).join("");

  document.getElementById("preflightFindings").innerHTML = cardsHtml || '<p class="empty-findings-msg">No se detectaron incidencias en estas comprobaciones automáticas. Revisa también la rúbrica y las fuentes.</p>';

  const filterBtns = document.querySelectorAll("#preflightFilterChips [data-filter-cat]");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.filterCat;
      const cards = document.querySelectorAll("#preflightFindings .preflight-finding");
      cards.forEach(card => {
        if (cat === "all" || card.dataset.category === cat) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });
    });
  });

  const toggleAllBtn = document.getElementById("btnToggleAllPreflight");
  if (toggleAllBtn) {
    let allOpen = false;
    toggleAllBtn.addEventListener("click", () => {
      allOpen = !allOpen;
      document.querySelectorAll("#preflightFindings details.preflight-finding").forEach(d => d.open = allOpen);
      toggleAllBtn.querySelector("span").textContent = allOpen ? "Colapsar todos" : "Expandir todos";
    });
  }
  if (editorDirty) {
    document.getElementById("aiPercentage").textContent = "Cambios sin revisar";
    document.getElementById("aiResultExplanation").textContent = "Recalcula el manuscrito. El resultado externo pertenece a la versión registrada.";
    const b = document.getElementById("aiVerdictBadge");
    if (b) { b.hidden = true; b.style.display = "none"; b.textContent = ""; }
  }
  const rubric = document.getElementById("deliveryRubric").value.trim().split(/\n/).filter(Boolean);
  document.getElementById("rubricChecklist").innerHTML = rubric.length ? `<h3>Comprobación manual de tus requisitos</h3>${rubric.map(line => `<label class="checkbox-label"><input type="checkbox">${escapeHTML(line)}</label>`).join("")}` : "<p>No has añadido requisitos del profesor. La revisión no puede confirmar que cumple la consigna.</p>";
}
function recordStatus(message) { document.getElementById("reviewRecordStatus").textContent = message; }
document.getElementById("externalAIStatus").addEventListener("change", event => { const field = document.getElementById("externalAI"); field.required = event.target.value === "reported"; field.disabled = !field.required; });
document.getElementById("externalReportForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!currentAnalysis || liveEditorText.value !== currentRawText) { recordStatus("Recalcula los cambios del manuscrito antes de registrar el resultado."); return; }
  try {
    externalReport = window.ZeroIAPreflight.createExternal({provider:document.getElementById("externalProvider").value, aiStatus:document.getElementById("externalAIStatus").value, aiPercentage:document.getElementById("externalAIStatus").value === "reported" ? Number(document.getElementById("externalAI").value) : null, similarityPercentage:document.getElementById("externalSimilarity").value === "" ? null : Number(document.getElementById("externalSimilarity").value), date:document.getElementById("externalDate").value, sourceNote:document.getElementById("externalProvenance").value.trim()}, currentAnalysis.sourceSHA256);
    document.getElementById("externalVersionConfirm").checked = false;
    renderPreflight(); saveReviewMetadata(); recordStatus("Resultado externo registrado para esta versión. No se ha verificado con el detector.");
  } catch (error) { recordStatus(error.message); }
});
document.getElementById("removeExternalReport").addEventListener("click", () => { externalReport = null; renderPreflight(); recordStatus("Resultado externo eliminado de esta revisión."); });
function downloadJSON(value, name) { const url = URL.createObjectURL(new Blob([value],{type:"application/json"})); const link = document.createElement("a"); link.href=url; link.download=name; link.click(); URL.revokeObjectURL(url); }
document.getElementById("exportReviewJSON").addEventListener("click", () => {
  if (!currentAnalysis) return;
  if (liveEditorText.value !== currentRawText) {recordStatus("Recalcula los cambios antes de exportar."); return;}
  downloadJSON(JSON.stringify({schemaVersion:1,kind:"zeroia-review",createdAt:new Date().toISOString(),sourceSHA256:currentAnalysis.sourceSHA256,stage:document.getElementById("deliveryStage").value,editorialScore:currentAnalysis.validationScore,externalReport,preflight:currentPreflight},null,2), `ZeroIA_revision_${Date.now()}.json`);
});
document.getElementById("importReviewJSON").addEventListener("click", () => document.getElementById("reviewJSONFile").click());
document.getElementById("reviewJSONFile").addEventListener("change", async event => {
  const file = event.target.files[0]; if (!file) return;
  if (liveEditorText.value !== currentRawText) {recordStatus("Recalcula los cambios antes de importar un resultado.");event.target.value="";return;}
  try {
    if (file.size > 2000000) throw new Error("El archivo supera el límite de 2 MB.");
    const parsed = JSON.parse(await file.text());
    externalReport = window.ZeroIAPreflight.importExternal(JSON.stringify(parsed.kind === "zeroia-review" ? parsed.externalReport : parsed));
    renderPreflight(); recordStatus("Resultado externo importado. Comprueba su procedencia y correspondencia con el documento.");
  } catch (error) { recordStatus(`No se importó el resultado: ${error.message}`); }
  event.target.value = "";
});
const reviewMetadataKey = "zeroia_review_metadata_v1";
function loadReviewMetadata() { try { const value = JSON.parse(localStorage.getItem(reviewMetadataKey) || "[]"); return Array.isArray(value) ? value.slice(-30) : []; } catch (_) {return [];} }
function showReviewMetadata() {
  const items = loadReviewMetadata();
  document.getElementById("localReviewHistory").innerHTML = items.length ? `<ul>${items.slice().reverse().map(item => `<li>${escapeHTML(item.date)} · Editorial: ${escapeHTML(item.score ?? "N/D")}/100 · IA registrada: ${escapeHTML(item.ai ?? "No determinada")} · Versión ${escapeHTML(String(item.hash || "").slice(7,19))}</li>`).join("")}</ul>` : "<p>Sin revisiones guardadas.</p>";
}
function saveReviewMetadata() {
  if (!currentAnalysis || !document.getElementById("historyConsent").checked) return;
  try {
    const rows=loadReviewMetadata(); const row={date:new Date().toISOString(),hash:currentAnalysis.sourceSHA256,score:currentAnalysis.validationScore,ai:currentPreflight?.authorship?.status === "reported" ? `${currentPreflight.authorship.percentage}%` : null};
    const previous=rows.findIndex(item=>item.hash===row.hash); if(previous>=0) rows.splice(previous,1); rows.push(row);
    localStorage.setItem(reviewMetadataKey,JSON.stringify(rows.slice(-30))); showReviewMetadata();
  } catch (_) {recordStatus("El navegador no permitió guardar el historial.");}
}
document.getElementById("historyConsent").addEventListener("change", () => {saveReviewMetadata();});
document.getElementById("clearReviewHistory").addEventListener("click", () => {try {localStorage.removeItem(reviewMetadataKey);document.getElementById("historyConsent").checked=false;showReviewMetadata();recordStatus("Historial local borrado.");} catch (_) {recordStatus("No se pudo acceder al almacenamiento local.");}});
for (const id of ["deliveryStage","deliveryRubric"]) document.getElementById(id).addEventListener("change", () => {if(currentAnalysis) {renderPreflight();liveEditorText.dispatchEvent(new Event("input"));}});
liveEditorText.addEventListener("input", () => {
  if (liveEditorText.value !== currentRawText) {
    document.getElementById("aiPercentage").textContent = "Cambios sin revisar";
    document.getElementById("aiResultExplanation").textContent = "Recalcula el texto. Cualquier resultado externo pertenece a la versión registrada y no se traslada a los cambios.";
    const b = document.getElementById("aiVerdictBadge");
    if (b) { b.hidden = true; b.style.display = "none"; b.textContent = ""; }
  } else renderPreflight();
});
showReviewMetadata();

// ============================================================================
// Modales de Gobernanza, Legal y Metodología (Kriterion Modals)
// ============================================================================
function openKriterionModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.setAttribute("open", "");
  }
}

function closeKriterionModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  if (typeof modal.close === "function") {
    modal.close();
  } else {
    modal.removeAttribute("open");
  }
}

const modalBindings = [
  { triggers: ["openTermsBtn", "footerTermsBtn"], modal: "termsModal", closers: ["closeTermsModal", "acceptTermsModal"] },
  { triggers: ["openPrivacyBtn", "footerPrivacyBtn"], modal: "privacyModal", closers: ["closePrivacyModal", "acceptPrivacyModal"] },
  { triggers: ["openMethodologyBtn", "footerMethodologyBtn"], modal: "methodologyModal", closers: ["closeMethodologyModal", "acceptMethodologyModal"] }
];

modalBindings.forEach(({ triggers, modal, closers }) => {
  triggers.forEach(tId => {
    const el = document.getElementById(tId);
    if (el) el.addEventListener("click", () => openKriterionModal(modal));
  });
  closers.forEach(cId => {
    const el = document.getElementById(cId);
    if (el) el.addEventListener("click", () => closeKriterionModal(modal));
  });
  const m = document.getElementById(modal);
  if (m) {
    m.addEventListener("click", (e) => {
      if (e.target === m) closeKriterionModal(modal);
    });
  }
});

// Soporte Visual Drag & Drop para documentos
const promptBox = document.querySelector(".gemini-prompt-box");
if (promptBox) {
  ["dragenter", "dragover"].forEach(evtName => {
    promptBox.addEventListener(evtName, (e) => {
      e.preventDefault();
      promptBox.classList.add("drag-over");
    });
  });
  ["dragleave", "drop"].forEach(evtName => {
    promptBox.addEventListener(evtName, (e) => {
      e.preventDefault();
      promptBox.classList.remove("drag-over");
    });
  });
  promptBox.addEventListener("drop", (e) => {
    const files = e.dataTransfer && e.dataTransfer.files;
    if (files && files.length > 0 && typeof DataTransfer !== "undefined") {
      const file = files[0];
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event("change"));
    }
  });
}
