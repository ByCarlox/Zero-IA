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
  if (analysisInProgress) return;
  const text = promptTextarea.value.trim();
  if (!text || text.length < 20) {
    alert("Introduce un texto con al menos 20 caracteres para auditar.");
    return;
  }

  analysisInProgress = true;
  const buttonContent = sendBtn.innerHTML;
  sendBtn.innerHTML = `<span style="font-size:0.8rem;">...</span>`;
  sendBtn.disabled = true;

  setTimeout(() => {
    try {
      const nextAnalysis = window.ZeroIADetector.analyzeDocument(text);
      if (nextAnalysis.error) throw new Error(nextAnalysis.error);
      currentRawText = text;
      renderResults(nextAnalysis);
      currentAnalysis = nextAnalysis;
      heroContainer.style.display = "none";
      resultsContainer.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("No se pudo completar el análisis:", err);
      alert("No se pudo completar el análisis. Tu texto se conserva; vuelve a intentarlo.\n" + err.message);
    } finally {
      sendBtn.innerHTML = buttonContent;
      sendBtn.disabled = promptTextarea.value.trim().length === 0;
      analysisInProgress = false;
    }
  }, 100);
}

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
      const title = (item.title && item.title.length) ? item.title[0] : 'Título no registrado';
      const container = (item['container-title'] && item['container-title'].length) ? item['container-title'][0] : (item.publisher || 'Publicación no especificada');
      const issued = (item.issued && item.issued['date-parts'] && item.issued['date-parts'][0]) ? item.issued['date-parts'][0][0] : 'Año N/D';
      const authors = (item.author || []).slice(0, 3).map(a => `${a.family || ''} ${a.given ? a.given[0] + '.' : ''}`.trim()).filter(Boolean).join(', ');

      resultEl.innerHTML = `
        <div class="doi-success-card">
          <div class="doi-status-tag tag-verified">✓ Referencia comprobada en Crossref</div>
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
  globalPercentageEl.innerText = `${analysis.globalPercentage}/100`;
  globalPercentageEl.style.color = analysis.verdictColor === "red" ? "var(--color-danger-border)" : analysis.verdictColor === "yellow" ? "var(--color-warning-border)" : "var(--color-success-border)";

  verdictBadgeEl.innerText = analysis.classification;
  verdictBadgeEl.className = `tag-badge badge-${analysis.verdictColor}`;

  meanPerplexityEl.innerText = analysis.meanPerplexity;
  burstinessScoreEl.innerText = analysis.burstiness;
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
    verdictTitle.innerText = "Resumen de estilo y patrones";
    verdictSubtitle.innerText = `Índice de patrones de IA: ${analysis.globalPercentage}/100 · ${analysis.totalWords} palabras evaluadas`;
    verdictPill.innerText = analysis.verdictBadge || (analysis.verdictColor === "red" ? "🔴 ALTA CONCENTRACIÓN" : analysis.verdictColor === "yellow" ? "🟡 CONCENTRACIÓN MEDIA" : "🟢 POCOS PATRONES");
    verdictPill.className = `tag-badge badge-${analysis.verdictColor}`;
    verdictBody.innerText = `${analysis.highRiskSentences} de ${analysis.totalSentences} frases presentan concentración de patrones sintéticos o fórmulas fijas. Selecciona una frase del manuscrito para consultar la observación y sus alternativas. Este índice orienta la revisión y no determina la autoría del texto.`;
    verdictIcon.innerText = analysis.verdictColor === "red" ? "!" : analysis.verdictColor === "yellow" ? "—" : "✓";
  }

  // 1.2 Escudo de Marcas de Agua Ocultas & Caracteres de Ancho Cero
  const wmShieldBox = document.getElementById("watermarkShieldBox");
  const wmShieldText = document.getElementById("watermarkShieldText");
  const wmIcon = document.getElementById("watermarkIcon");
  const btnStripWm = document.getElementById("btnStripWatermarks");

  const wm = analysis.watermark_analysis;
  if (wm && wm.hasWatermark) {
    wmShieldBox.className = `watermark-shield-box shield-${wm.status}`;
    if (wmIcon) wmIcon.innerText = "!";
    if (wmShieldText) {
      wmShieldText.innerHTML = `<strong>Revisar formato:</strong> Se detectaron ${wm.totalInvisibleChars} caracteres invisibles de ancho cero / formato. ${wm.message} <em>(Nota: pueden deberse a esteganografía, copiado web o conversión de PDF).</em>`;
    }
    if (btnStripWm) btnStripWm.style.display = "flex";
  } else {
    wmShieldBox.className = "watermark-shield-box shield-clean";
    if (wmIcon) wmIcon.innerText = "✓";
    if (wmShieldText) {
      wmShieldText.innerText = "No se detectaron caracteres invisibles de los tipos revisados.";
    }
    if (btnStripWm) btnStripWm.style.display = "none";
  }

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
    span.title = `Índice de estilo: ${Math.round(s.aiScore * 100)}/100 | Índice léxico: ${s.perplexity}`;

    span.tabIndex = 0;
    span.setAttribute("role", "button");
    span.setAttribute("aria-label", `Revisar frase ${idx + 1}: ${s.text}`);
    span.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectSentence(idx);
      }
    });
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
      <span class="tag-badge ${badgeClass}">${pct}/100 patrones · ${s.riskLevel === "high" ? "Prioridad alta" : s.riskLevel === "medium" ? "Prioridad media" : "Prioridad baja"}</span>
      <span style="font-size: 0.8rem; color: var(--text-secondary); margin-left: 8px;">Índice léxico: <b>${s.perplexity}</b></span>
    </div>
    <div style="font-size: 0.95rem; font-style: italic; color: var(--text-primary); margin-bottom: 12px; padding: 10px; background: var(--bg-surface-elevated); border-radius: 8px;">
      "${escapeHTML(s.text)}"
    </div>
    <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">Qué se observa</div>
  `;

  s.reasons.forEach(r => {
    html += `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">• ${escapeHTML(r)}</div>`;
  });

  if (s.tips.length > 0) {
    html += `<div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-top: 12px; margin-bottom: 6px;">Cómo mejorarlo</div>`;
    s.tips.forEach(t => {
      html += `<div style="font-size: 0.85rem; color: var(--text-primary); margin-bottom: 4px;">✓ ${escapeHTML(t)}</div>`;
    });
  }

  if (s.suggestedRewrite) {
    html += `
      <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-success-text); text-transform: uppercase; margin-top: 12px;">Alternativa de redacción</div>
      <div class="diff-box">"${escapeHTML(s.suggestedRewrite)}"</div>
      <button class="btn-primary" style="width: 100%; margin-top: 8px;" id="copySuggestionBtn">
        Copiar Sugerencia
      </button>
    `;
  }

  inspectorContent.innerHTML = html;
  const copyButton = document.getElementById("copySuggestionBtn");
  if (copyButton) copyButton.addEventListener("click", () => navigator.clipboard.writeText(s.suggestedRewrite));
}

window.copySuggestion = function(encodedText) {
  const text = decodeURIComponent(encodedText);
  navigator.clipboard.writeText(text).then(() => {
    alert("¡Sugerencia copiada al portapapeles!");
  });
};

// Exponer selectSentence globalmente para eventos onclick
window.selectSentence = selectSentence;

function renderInspectorList(sentences) {
  const flagged = sentences.filter(s => s.riskLevel !== "low");
  if (flagged.length === 0) {
    inspectorContent.innerHTML = `
      <div style="text-align: center; padding: 24px 12px; color: var(--color-success-text);">
        <div class="empty-state-mark">✓</div>
        <div style="font-weight: 600;">Sin observaciones prioritarias</div>
        <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">Puedes seleccionar cualquier frase para revisar sus indicadores. Este resultado no determina su autoría.</div>
      </div>
    `;
    return;
  }

  let html = `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">Haz clic en cualquier frase del documento para inspeccionarla o revisa ${flagged.length === 1 ? "la oración señalada" : `las ${flagged.length} oraciones señaladas`}:</div>`;

  flagged.forEach((s) => {
    const badgeClass = s.riskLevel === "high" ? "badge-red" : "badge-yellow";
    html += `
      <button type="button" class="humanize-card" data-sentence-index="${s.globalIdx}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span class="tag-badge ${badgeClass}">${Math.round(s.aiScore * 100)}/100 · patrones</span>
          <span style="font-size: 0.75rem; color: var(--text-secondary);">Índice léxico: ${s.perplexity}</span>
        </div>
        <div style="font-size: 0.88rem; color: var(--text-primary); line-height: 1.4;">"${escapeHTML(s.text.slice(0, 90))}${s.text.length > 90 ? "…" : ""}"</div>
      </button>
    `;
  });

  inspectorContent.innerHTML = html;
  inspectorContent.querySelectorAll("[data-sentence-index]").forEach(button => {
    button.addEventListener("click", () => selectSentence(Number(button.dataset.sentenceIndex)));
  });
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

  const nextAnalysis = window.ZeroIADetector.analyzeDocument(updatedText);
  if (nextAnalysis.error) { alert(nextAnalysis.error); return; }
  currentRawText = updatedText;
  currentAnalysis = nextAnalysis;
  renderResults(currentAnalysis);
});

// Volver a inicio / Nueva Auditoría
newAnalysisBtn.addEventListener("click", () => {
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

  let report = `# Auditoría de Patrones de IA y Redacción - Zero-IA\n\n`;
  report += `- **Índice Global de Patrones de IA:** ${currentAnalysis.globalPercentage}/100\n`;
  report += `- **Veredicto:** ${currentAnalysis.classification}\n`;
  report += `- **Aviso Metodológico:** Este índice describe heurísticas superficiales de estilo y no constituye un dictamen concluyente de autoría.\n`;
  if (currentAnalysis.verdictSummary) {
    report += `- **Dictamen:** ${currentAnalysis.verdictSummary}\n`;
  }
  report += `- **Perplejidad Media:** ${currentAnalysis.meanPerplexity}\n`;
  report += `- **Ráfaga (Burstiness):** ${currentAnalysis.burstiness}\n`;
  report += `- **Palabras:** ${currentAnalysis.totalWords} | **Oraciones:** ${currentAnalysis.totalSentences}\n`;

  const wm = currentAnalysis.watermark_analysis;
  if (wm && wm.hasWatermark) {
    report += `- **Marcas Ocultas Unicode:** ${wm.totalInvisibleChars} caracteres detectados (${wm.message})\n`;
  } else {
    report += `- **Marcas Ocultas:** Limpio (0 caracteres invisibles de ancho cero)\n`;
  }
  report += `\n`;
  report += window.ZeroIAAcademic.summary(currentAnalysis.academic_review) + "\n\n";
  report += `## Detalle de Oraciones Señaladas\n\n`;

  currentAnalysis.sentences.forEach(s => {
    if (s.riskLevel !== "low") {
      report += `### [${s.riskLevel.toUpperCase()}] "${escapeHTML(s.text)}"\n`;
      report += `- **Índice de Estilo:** ${Math.round(s.aiScore * 100)}/100 | **Índice léxico:** ${s.perplexity}\n`;
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

// Botón de Purga de Marcas Invisibles / Caracteres de Ancho Cero
const btnStripWatermarks = document.getElementById("btnStripWatermarks");
if (btnStripWatermarks) {
  btnStripWatermarks.addEventListener("click", () => {
    if (!currentRawText) return;
    const clean = window.ZeroIADetector.stripInvisibleCharacters(currentRawText);
    const diff = currentRawText.length - clean.length;
    currentRawText = clean;
    promptTextarea.value = clean;
    alert(`✨ Se eliminaron ${diff} caracteres invisibles / marcas de agua Unicode de ancho cero. Re-analizando documento limpio...`);
    runAnalysis();
  });
}

// Botón Imprimir / Guardar en PDF
const printReportBtn = document.getElementById("printReportBtn");
if (printReportBtn) {
  printReportBtn.addEventListener("click", () => {
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

// Botón de Limpieza Automática de Clichés
const autoCleanBtn = document.getElementById("autoCleanBtn");
if (autoCleanBtn) {
  autoCleanBtn.addEventListener("click", () => {
    let text = liveEditorText.value;
    if (!text || text.trim().length === 0) return;

    let count = 0;
    // Aplicar reemplazos conocidos
    const REPLACEMENTS_MAP = {
      "en el ámbito de": "En",
      "en el panorama actual": "Hoy en día",
      "en la era digital": "En los últimos años",
      "es importante destacar que": "Conviene notar que",
      "es fundamental señalar que": "Debe considerarse que",
      "cabe destacar que": "Específicamente,",
      "cabe mencionar que": "Asimismo,",
      "en conclusión": "Por consiguiente,",
      "en resumen": "En síntesis,",
      "juega un papel fundamental": "influye decisivamente",
      "desempeña un papel crucial": "es determinante",
      "es un testimonio de": "demuestra",
      "un tapiz de": "una combinación de",
      "una piedra angular": "un pilar esencial",
      "delve into": "examine",
      "a testament to": "evidence of",
      "rich tapestry": "diverse set",
      "plays a pivotal role": "is essential"
    };

    Object.keys(REPLACEMENTS_MAP).forEach(cliche => {
      const reg = new RegExp(cliche, "gi");
      if (reg.test(text)) {
        text = text.replace(reg, (match, offset) => offset === 0 ? REPLACEMENTS_MAP[cliche] : REPLACEMENTS_MAP[cliche].toLowerCase());
        count++;
      }
    });

    liveEditorText.value = text.replace(/,\s*,/g, ",");
    if (count > 0) {
      alert(`✨ Se sustituyeron ${count} muletillas de IA por alternativas académicas. Pulsa "Recalcular estilo" para ver el nuevo resultado.`);
    } else {
      alert("No se encontraron muletillas automáticas directas. Prueba a reescribir manualmente las frases marcadas.");
    }
  });
}

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
