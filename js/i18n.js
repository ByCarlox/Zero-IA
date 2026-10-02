/**
 * Kriterion - Sistema de Internacionalización (i18n)
 * Auto-detección del idioma del navegador (ES, EN, PT) con persistencia local
 */
(function(root) {
  'use strict';

  const translations = {
    es: {
      brand_tag: "Academic Preflight Suite",
      hero_badge: "Kriterion Suite · El escudo ético del investigador y estudiante",
      hero_eyebrow: "ACADEMIC PREFLIGHT & INTEGRITY SUITE · 100% LOCAL",
      hero_title: 'Del borrador a la defensa<br><span class="hero-title-gradient">con rigor absoluto.</span>',
      hero_subtitle: "Audita la pulcritud de tu prosa, correspondencia bibliográfica, estructura y probabilidad de IA sin suscripciones abusivas ni servidores oscuros. Procesamiento 100% privado en tu navegador.",
      prompt_label: "Texto del documento",
      prompt_placeholder: "Pega aquí el texto de tu tesis o capítulo...",
      attach_btn: "Adjuntar Word o PDF",
      sample_btn: "Ver un ejemplo",
      analyze_btn: "Analizar",
      input_note: "Word, PDF o texto · Procesamiento en tu navegador · Sin registro",
      trust_privacy_title: "100% Local & Privado",
      trust_privacy_desc: "Tus manuscritos nunca salen de tu navegador ni entrenan IA",
      trust_instant_title: "Paridad Word & PDF",
      trust_instant_desc: "Extracción espacial sin sesgos de portada ni índices",
      trust_rigor_title: "Rigor y Preflight",
      trust_rigor_desc: "Citas, marcas invisibles y diagnóstico probabilístico",
      sponsor_btn: "Sponsor",
      sponsor_footer_badge: "PROYECTO INDEPENDIENTE Y ÉTICO",
      sponsor_footer_heading: "Kriterion: El proyecto Robinhood para la integridad académica",
      sponsor_footer_desc: "Sin muros de pago de $30/mes ni venta de humanizadores oscuros. Mantén esta plataforma libre, transparente y 100% confidencial para estudiantes de todo el mundo apoyando el desarrollo en GitHub Sponsors.",
      sponsor_footer_action: "Apoyar en GitHub Sponsors",
      report_title: "Tu revisión antes de entregar.",
      report_desc: "IA, requisitos académicos y redacción: cada resultado con su alcance y evidencia.",
      btn_new_audit: "Nueva auditoría",
      btn_what_means: "¿Qué significa cada métrica?",
      report_status_done: "Análisis completado",
      ai_eyebrow: "DETECCIÓN CIENTÍFICA Y PROBABILIDAD DE AUTORÍA",
      ai_title: "Probabilidad de Generación por IA",
      ai_predictability: "Predictibilidad Léxica",
      ai_burstiness: "Cadencia / Ráfaga (CV)",
      ai_entropy: "Entropía Léxica",
      ai_sentences: "Frases Sintéticas",
      ai_explanation: "Estimación científica probabilística basada en predictibilidad léxica, perplejidad inversa, cadencia de ráfaga (burstiness) y densidad de fórmulas sintéticas de LLM en español.",
      btn_highlight_ai: "Ver frases críticas de IA en el manuscrito",
      stat_cleanliness: "Índice de Pulcritud Editorial",
      stat_words_per_sentence: "Palabras por frase",
      stat_coverage: "Cobertura del texto",
      stat_priority_sentences: "Frases prioritarias",
      stat_cleanliness_desc: "100% texto sin incidencias",
      stat_words_desc: "Promedio en la prosa revisada",
      stat_coverage_desc: "Palabras revisadas / extraídas",
      verdict_analyzing: "Analizando",
      tab_suggestions: "Sugerencias de Estilo",
      tab_editor: "Editor de Manuscrito en Vivo",
      footer_philosophy: "Procesamiento 100% local en cliente. No almacenamos tus documentos ni entrenamos modelos."
    },
    en: {
      brand_tag: "Academic Preflight Suite",
      hero_badge: "Kriterion Suite · The ethical shield for researchers & students",
      hero_eyebrow: "ACADEMIC PREFLIGHT & INTEGRITY SUITE · 100% LOCAL",
      hero_title: 'From draft to defense<br><span class="hero-title-gradient">with absolute rigor.</span>',
      hero_subtitle: "Audit prose clarity, reference alignment, structure, and AI probability without predatory paywalls or opaque servers. 100% private in-browser processing.",
      prompt_label: "Document text",
      prompt_placeholder: "Paste your thesis, paper or chapter text here...",
      attach_btn: "Attach Word or PDF",
      sample_btn: "Try an example",
      analyze_btn: "Analyze",
      input_note: "Word, PDF or plain text · Client-side processing · No sign-up required",
      trust_privacy_title: "100% Local & Private",
      trust_privacy_desc: "Your research never leaves your browser nor trains third-party AI",
      trust_instant_title: "Word & PDF Parity",
      trust_instant_desc: "Spatial extraction without frontmatter or table of contents bias",
      trust_rigor_title: "Rigor & Preflight",
      trust_rigor_desc: "Citations, invisible watermarks & probabilistic diagnostics",
      sponsor_btn: "Sponsor",
      sponsor_footer_badge: "INDEPENDENT & ETHICAL PROJECT",
      sponsor_footer_heading: "Kriterion: The Robinhood Project for Academic Integrity",
      sponsor_footer_desc: "No $30/month paywalls. No shady humanizer spinners. Keep this platform free, transparent, and strictly confidential for students worldwide by supporting on GitHub Sponsors.",
      sponsor_footer_action: "Support on GitHub Sponsors",
      report_title: "Your preflight review before submission.",
      report_desc: "AI probability, citations, and prose clarity: each finding with scope and proof.",
      btn_new_audit: "New audit",
      btn_what_means: "What does each metric mean?",
      report_status_done: "Analysis completed",
      ai_eyebrow: "SCIENTIFIC DETECTION & AUTHORSHIP PROBABILITY",
      ai_title: "AI Generation Probability",
      ai_predictability: "Lexical Predictability",
      ai_burstiness: "Burstiness / Cadence (CV)",
      ai_entropy: "Lexical Entropy",
      ai_sentences: "Synthetic Sentences",
      ai_explanation: "Scientific probabilistic assessment based on lexical predictability, perplexity dynamics, burstiness cadence, and synthetic formula density.",
      btn_highlight_ai: "Inspect high-probability AI sentences in manuscript",
      stat_cleanliness: "Editorial Cleanliness Index",
      stat_words_per_sentence: "Words per sentence",
      stat_coverage: "Text coverage",
      stat_priority_sentences: "Priority sentences",
      stat_cleanliness_desc: "Clean prose without flags",
      stat_words_desc: "Average across evaluated body",
      stat_coverage_desc: "Analyzed words / extracted words",
      verdict_analyzing: "Analyzing",
      tab_suggestions: "Style Suggestions",
      tab_editor: "Live Manuscript Editor",
      footer_philosophy: "100% Client-side local processing. Your research is never uploaded or used for model training."
    },
    pt: {
      brand_tag: "Suíte de Preflight Acadêmico",
      hero_badge: "Kriterion Suite · O escudo ético de pesquisadores e estudantes",
      hero_eyebrow: "SUÍTE DE PREFLIGHT E INTEGRIDADE ACADÊMICA · 100% LOCAL",
      hero_title: 'Do rascunho à defesa<br><span class="hero-title-gradient">com rigor absoluto.</span>',
      hero_subtitle: "Audite a clareza da prosa, referências bibliográficas, estrutura e probabilidade de IA sem assinaturas abusivas nem servidores opacos. Processamento 100% privado no seu navegador.",
      prompt_label: "Texto do documento",
      prompt_placeholder: "Cole aqui o texto da sua tese, dissertação ou capítulo...",
      attach_btn: "Anexar Word ou PDF",
      sample_btn: "Ver um exemplo",
      analyze_btn: "Analisar",
      input_note: "Word, PDF ou texto · Processamento no seu navegador · Sem cadastro",
      trust_privacy_title: "100% Local & Privado",
      trust_privacy_desc: "Seus textos nunca saem do seu navegador nem treinam IA",
      trust_instant_title: "Paridade Word e PDF",
      trust_instant_desc: "Extração espacial sem distorções de capa ou sumário",
      trust_rigor_title: "Rigor e Preflight",
      trust_rigor_desc: "Citações, marcas invisíveis e diagnóstico probabilístico",
      sponsor_btn: "Apoiar",
      sponsor_footer_badge: "PROJETO INDEPENDENTE E ÉTICO",
      sponsor_footer_heading: "Kriterion: O projeto Robinhood para a integridade acadêmica",
      sponsor_footer_desc: "Sem muros de pagamento de $30/mês nem venda de humanizadores obscuros. Mantenha esta plataforma livre, ética e confidencial apoiando o criador no GitHub Sponsors.",
      sponsor_footer_action: "Apoiar no GitHub Sponsors",
      report_title: "Sua revisão antes de submeter.",
      report_desc: "IA, requisitos acadêmicos e redação: cada resultado com escopo e evidência.",
      btn_new_audit: "Nova auditoria",
      btn_what_means: "O que significa cada métrica?",
      report_status_done: "Análise concluída",
      ai_eyebrow: "DETECÇÃO CIENTÍFICA E PROBABILIDADE DE AUTORIA",
      ai_title: "Probabilidade de Geração por IA",
      ai_predictability: "Previsibilidade Léxica",
      ai_burstiness: "Cadência / Rajada (CV)",
      ai_entropy: "Entropia Léxica",
      ai_sentences: "Frases Sintéticas",
      ai_explanation: "Estimativa científica probabilística baseada em previsibilidade léxica, perplexidade inversa, cadência de rajada (burstiness) e densidade de fórmulas sintéticas.",
      btn_highlight_ai: "Ver frases críticas de IA no manuscrito",
      stat_cleanliness: "Índice de Pulcritude Editorial",
      stat_words_per_sentence: "Palavras por frase",
      stat_coverage: "Cobertura do texto",
      stat_priority_sentences: "Frases prioritárias",
      stat_cleanliness_desc: "Texto sem incidências",
      stat_words_desc: "Média na prosa revisada",
      stat_coverage_desc: "Palavras revisadas / extraídas",
      verdict_analyzing: "Analisando",
      tab_suggestions: "Sugestões de Estilo",
      tab_editor: "Editor de Manuscrito em Tempo Real",
      footer_philosophy: "Processamento 100% local no cliente. Não armazenamos seus documentos nem treinamos modelos."
    }
  };

  function detectPreferredLanguage() {
    try {
      const stored = localStorage.getItem("kriterion_lang");
      if (stored && translations[stored]) return stored;
    } catch (_) {}

    const browserLangs = navigator.languages || [navigator.language || 'es'];
    for (const l of browserLangs) {
      const code = String(l).toLowerCase().split('-')[0];
      if (translations[code]) return code;
    }
    return 'es';
  }

  let currentLang = 'es';

  function applyLanguage(lang) {
    if (!translations[lang]) lang = 'es';
    currentLang = lang;
    try {
      localStorage.setItem("kriterion_lang", lang);
    } catch (_) {}

    document.documentElement.setAttribute("lang", lang);

    // Actualizar elementos con data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (translations[lang][key]) {
        el.innerHTML = translations[lang][key];
      }
    });

    // Actualizar placeholders con data-i18n-placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (translations[lang][key]) {
        el.placeholder = translations[lang][key];
      }
    });

    // Actualizar botones de selector de idioma
    document.querySelectorAll(".lang-btn").forEach(btn => {
      if (btn.getAttribute("data-lang") === lang) {
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.classList.remove("active");
        btn.setAttribute("aria-pressed", "false");
      }
    });
  }

  function initI18n() {
    const lang = detectPreferredLanguage();
    applyLanguage(lang);

    // Event listeners para botones de selección manual
    document.querySelectorAll(".lang-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const selected = btn.getAttribute("data-lang");
        if (selected) applyLanguage(selected);
      });
    });
  }

  root.ZeroIA_i18n = {
    translations,
    applyLanguage,
    detectPreferredLanguage,
    initI18n,
    getCurrentLang: () => currentLang
  };

  // Inicializar automáticamente cuando el DOM esté listo
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener("DOMContentLoaded", initI18n);
    } else {
      initI18n();
    }
  }
})(typeof window === 'undefined' ? globalThis : window);
