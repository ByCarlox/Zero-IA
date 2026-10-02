/* Zero-IA 2: evidence-based editorial review. One engine for browser and Python. */
(function(root) {
  'use strict';
  const R=root.ZeroIARules, S=root.ZeroIAStructure;
  const severityRank={info:0,medium:1,high:2};
  const sum=a=>a.reduce((x,y)=>x+y,0);
  const round=n=>Math.round((n+Number.EPSILON)*1000)/1000;
  const avg=a=>a.length?sum(a)/a.length:0;
  const std=a=>Math.sqrt(avg(a.map(n=>(n-avg(a))**2)));
  function fingerprint(text) {
    let hash=2166136261;
    for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
    return 'fnv1a32:'+ (hash>>>0).toString(16).padStart(8,'0');
  }
  const normalize=text=>S.words(text).join(' ');
  const INVISIBLE_CODEPOINTS_REGISTRY = new Map([
    // Zero-width & format joiners (Layer A steganography)
    [0x200B, { name: 'Espacio de ancho cero (ZWSP)', category: 'zero_width', risk: 'critical', vendor: 'Claude / Anthropic / GenAI ZWSP' }],
    [0x200C, { name: 'Separador de no unión (ZWNJ)', category: 'zero_width', risk: 'high', vendor: 'Separación esteganográfica / Ortografía persa' }],
    [0x200D, { name: 'Unión de caracteres de ancho cero (ZWJ)', category: 'zero_width', risk: 'medium', vendor: 'Esteganografía / Pegamento de emojis' }],
    [0x2060, { name: 'Unión de palabras (WJ)', category: 'zero_width', risk: 'critical', vendor: 'Word Joiner encubierto' }],
    [0xFEFF, { name: 'Marca de orden de bytes / ZWNBSP', category: 'zero_width', risk: 'low', vendor: 'Unicode BOM / ZWNBSP' }],
    [0x00AD, { name: 'Guion discrecional (Soft Hyphen)', category: 'soft_hyphen', risk: 'low', vendor: 'Maquetación tipográfica' }],
    [0x034F, { name: 'Unión de grafemas combinables (CGJ)', category: 'zero_width', risk: 'high', vendor: 'Separador de grafema encubierto' }],

    // Bidi format controls (directional overrides & steganography)
    [0x061C, { name: 'Marca de letra árabe (ALM)', category: 'bidi_control', risk: 'low', vendor: 'Dirección bidi' }],
    [0x200E, { name: 'Marca izquierda a derecha (LRM)', category: 'bidi_control', risk: 'low', vendor: 'Dirección bidi' }],
    [0x200F, { name: 'Marca derecha a izquierda (RLM)', category: 'bidi_control', risk: 'low', vendor: 'Dirección bidi' }],
    [0x202A, { name: 'Incrustación izquierda a derecha (LRE)', category: 'bidi_override', risk: 'critical', vendor: 'Reordenamiento de texto bidi' }],
    [0x202B, { name: 'Incrustación derecha a izquierda (RLE)', category: 'bidi_override', risk: 'critical', vendor: 'Reordenamiento de texto bidi' }],
    [0x202C, { name: 'Fin de formato direccional (PDF)', category: 'bidi_override', risk: 'medium', vendor: 'Terminador bidi' }],
    [0x202D, { name: 'Sobrescritura izquierda a derecha (LRO)', category: 'bidi_override', risk: 'critical', vendor: 'Sobrescritura forzada bidi' }],
    [0x202E, { name: 'Sobrescritura derecha a izquierda (RLO)', category: 'bidi_override', risk: 'critical', vendor: 'Sobrescritura forzada bidi' }],
    [0x2066, { name: 'Aislamiento izquierda a derecha (LRI)', category: 'bidi_control', risk: 'high', vendor: 'Aislamiento bidi' }],
    [0x2067, { name: 'Aislamiento derecha a izquierda (RLI)', category: 'bidi_control', risk: 'high', vendor: 'Aislamiento bidi' }],
    [0x2068, { name: 'Aislamiento de primer fuerte (FSI)', category: 'bidi_control', risk: 'high', vendor: 'Aislamiento bidi' }],
    [0x2069, { name: 'Fin de aislamiento direccional (PDI)', category: 'bidi_control', risk: 'high', vendor: 'Aislamiento bidi' }],

    // Steganographic invisible function characters
    [0x2061, { name: 'Aplicación de función invisible', category: 'invisible_math', risk: 'critical', vendor: 'Marcador encubierto de función' }],
    [0x2062, { name: 'Multiplicación invisible', category: 'invisible_math', risk: 'critical', vendor: 'Marcador encubierto matemático' }],
    [0x2063, { name: 'Separador invisible', category: 'invisible_math', risk: 'critical', vendor: 'Separador encubierto de texto' }],
    [0x2064, { name: 'Suma invisible', category: 'invisible_math', risk: 'critical', vendor: 'Marcador aritmético encubierto' }],
    [0x2065, { name: 'Punto ignorable reservado (U+2065)', category: 'reserved_ignorable', risk: 'critical', vendor: 'Portador encubierto no asignado' }],

    // Fillers & selectors
    [0x115F, { name: 'Hangul choseong filler', category: 'filler', risk: 'critical', vendor: 'Relleno de compatibilidad en blanco' }],
    [0x1160, { name: 'Hangul jungseong filler', category: 'filler', risk: 'critical', vendor: 'Relleno de compatibilidad en blanco' }],
    [0x3164, { name: 'Hangul filler (U+3164)', category: 'filler', risk: 'critical', vendor: 'Espacio steganográfico Hangul' }],
    [0xFFA0, { name: 'Halfwidth Hangul filler', category: 'filler', risk: 'critical', vendor: 'Espacio steganográfico de ancho medio' }],
    [0x180E, { name: 'Separador de vocal mongola', category: 'filler', risk: 'medium', vendor: 'Separador de formato' }]
  ]);

  function isEmojiBase(cp) {
    if (!cp) return false;
    if (cp >= 0x1F000 && cp <= 0x1FAFF) return true;
    if (cp >= 0x2190 && cp <= 0x25FF) return true;
    if (cp >= 0x2600 && cp <= 0x27BF) return true;
    if (cp >= 0x2B00 && cp <= 0x2BFF) return true;
    if (cp >= 0x1F3FB && cp <= 0x1F3FF) return true; // skin tone modifiers
    if (cp === 0xFE0E || cp === 0xFE0F || cp === 0x200D) return true; // emoji glue
    if (cp === 0x203C || cp === 0x2049 || cp === 0x2139 || cp === 0x2934 || cp === 0x2935) return true;
    if (cp === 0x00A9 || cp === 0x00AE || cp === 0x2122 || cp === 0x3030 || cp === 0x303D || cp === 0x3297 || cp === 0x3299) return true;
    return (cp === 0x0023 || cp === 0x002A || (cp >= 0x0030 && cp <= 0x0039));
  }

  function getPrevCodePoint(str, idx) {
    if (idx <= 0) return null;
    const prevChar = str.charCodeAt(idx - 1);
    if (prevChar >= 0xDC00 && prevChar <= 0xDFFF && idx >= 2) {
      const highChar = str.charCodeAt(idx - 2);
      if (highChar >= 0xD800 && highChar <= 0xDBFF) {
        return str.codePointAt(idx - 2);
      }
    }
    return str.codePointAt(idx - 1);
  }

  function isArabicIndicOrPersian(cp) {
    return (cp >= 0x0600 && cp <= 0x08FF) || (cp >= 0x0900 && cp <= 0x0DFF) || (cp >= 0x1780 && cp <= 0x17FF);
  }

  function detectInvisibleWatermarks(text) {
    if (typeof text !== 'string') text = '';
    const positions = [];
    const detectedVendors = new Set();

    let i = 0;
    while (i < text.length) {
      const cp = text.codePointAt(i);
      const charLen = cp > 0xFFFF ? 2 : 1;
      const prevCp = getPrevCodePoint(text, i);
      const nextCp = (i + charLen < text.length) ? text.codePointAt(i + charLen) : null;
      const hex = 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');

      let entry = INVISIBLE_CODEPOINTS_REGISTRY.get(cp) || null;
      const isVariationSelector = (cp >= 0xFE00 && cp <= 0xFE0F) || (cp >= 0xE0100 && cp <= 0xE01EF);
      const isTagPlane = (cp >= 0xE0020 && cp <= 0xE007F);
      const isReservedIgnorable = (cp === 0x2065 || cp === 0xE0000 || (cp >= 0xFFF0 && cp <= 0xFFF9) || (cp >= 0xE0080 && cp <= 0xE0100));
      const isNonCharacter = (cp >= 0xFDD0 && cp <= 0xFDEF) || (cp & 0xFFFE) === 0xFFFE;

      if (!entry) {
        if (isVariationSelector) {
          entry = { name: `Selector de variación (${hex})`, category: 'variation_selector', risk: 'high', vendor: 'Inyección de variación / canal esteganográfico' };
        } else if (isTagPlane) {
          entry = { name: `Carácter de etiqueta Unicode (${hex})`, category: 'tag_character', risk: 'critical', vendor: 'OpenAI / Canal encubierto de etiquetas' };
        } else if (isReservedIgnorable) {
          entry = { name: `Punto ignorable reservado (${hex})`, category: 'reserved_ignorable', risk: 'critical', vendor: 'Portador encubierto no asignado' };
        } else if (isNonCharacter) {
          entry = { name: `No-carácter Unicode (${hex})`, category: 'non_character', risk: 'critical', vendor: 'Marcador esteganográfico prohibido' };
        }
      }

      if (entry) {
        let isLegitimate = false;
        let isCovert = true;
        let reason = 'Carácter invisible o de control sospechoso';

        // 1. Initial BOM
        if (cp === 0xFEFF && i === 0) {
          isLegitimate = true;
          isCovert = false;
          reason = 'Marca de orden de bytes (BOM) inicial de archivo';
        }
        // 2. Emoji presentation glue (ZWJ, variation selectors after emoji base)
        else if ((cp === 0x200D || isVariationSelector) && prevCp && isEmojiBase(prevCp)) {
          isLegitimate = true;
          isCovert = false;
          reason = 'Secuencia legítima de presentación de emoji';
        }
        // 3. Complex script orthography (Arabic, Persian, Indic)
        else if ((cp === 0x200C || cp === 0x200D) && ((prevCp && isArabicIndicOrPersian(prevCp)) || (nextCp && isArabicIndicOrPersian(nextCp)))) {
          isLegitimate = true;
          isCovert = false;
          reason = 'Ortografía legítima de escritura compleja (árabe/persa/índica)';
        }
        // 4. Directional marks and isolates in mixed text (LRM, RLM, ALM, isolates)
        else if (cp === 0x200E || cp === 0x200F || cp === 0x061C || (cp >= 0x2066 && cp <= 0x2069)) {
          isLegitimate = true;
          isCovert = false;
          reason = 'Marca o aislamiento de dirección estándar';
        }
        // 5. Soft hyphen (typesetting)
        else if (cp === 0x00AD) {
          isLegitimate = true;
          isCovert = false;
          reason = 'Guion discrecional estándar de maquetación tipográfica';
        }

        // If not legitimate in this context, it is a covert AI watermark!
        if (isCovert) {
          detectedVendors.add(entry.vendor);
        }

        positions.push({
          start: i,
          end: i + charLen,
          hex,
          codepoint: cp,
          name: entry.name,
          category: entry.category,
          risk: entry.risk,
          isLegitimate,
          isCovert,
          reason,
          vendor: entry.vendor,
          removable: (i === 0 && cp === 0xFEFF) || isCovert,
          context: text.slice(Math.max(0, i - 16), Math.min(text.length, i + charLen + 16))
        });
      }

      i += charLen;
    }

    const covertPositions = positions.filter(p => p.isCovert);
    const covertCount = covertPositions.length;
    const hasWatermark = covertCount > 0;
    const hasFormatting = positions.length > 0;
    const vendorSignatures = Array.from(detectedVendors);

    // Contribution to AI score
    let watermarkScoreContribution = 0;
    let watermarkConfidence = 0;
    if (covertCount === 1) {
      watermarkScoreContribution = 40;
      watermarkConfidence = 85;
    } else if (covertCount === 2) {
      watermarkScoreContribution = 70;
      watermarkConfidence = 95;
    } else if (covertCount >= 3) {
      watermarkScoreContribution = Math.min(100, 85 + Math.min(15, covertCount * 3));
      watermarkConfidence = 99;
    }

    const watermarkDensityPer1k = text.length > 0
      ? Math.round((covertCount / text.length) * 100000) / 100
      : 0;

    const detectedTypes = [...new Set(positions.map(p => p.hex))].map(hex => {
      const match = positions.find(p => p.hex === hex);
      const count = positions.filter(p => p.hex === hex).length;
      return {
        hex,
        count,
        name: match.name,
        category: match.category,
        isCovert: match.isCovert
      };
    });

    let status = 'clean';
    let message = 'No se encontraron marcas de agua invisibles ni caracteres de formato ocultos.';
    if (hasWatermark) {
      status = 'alert';
      message = `Se detectaron ${covertCount} marca(s) de agua invisibles de IA en el documento (${vendorSignatures.join(', ')}). Este rastro esteganográfico aporta +${watermarkScoreContribution}% a la probabilidad de generación por IA.`;
    } else if (hasFormatting) {
      status = 'info';
      message = 'Se detectaron caracteres de formato estándar (secuencias de maquetación tipográfica). No corresponden a marcas de agua ni esteganografía de IA.';
    }

    return {
      hasWatermark,
      hasFormatting,
      totalInvisibleChars: positions.length,
      covertWatermarksCount: covertCount,
      steganographyDetected: hasWatermark,
      watermarkScoreContribution,
      watermarkConfidence,
      watermarkDensityPer1k,
      vendorSignatures,
      status,
      positions,
      covertPositions,
      detectedTypes,
      message
    };
  }

  function stripInvisibleCharacters(text, aggressive = false) {
    if (typeof text !== 'string') return '';
    const inspection = detectInvisibleWatermarks(text);
    if (!inspection.positions.length) return text;
    const removeIndices = new Set();
    for (const p of inspection.positions) {
      if (p.removable || (aggressive && !p.isLegitimate)) {
        for (let idx = p.start; idx < p.end; idx++) {
          removeIndices.add(idx);
        }
      }
    }
    if (!removeIndices.size) return text;
    let cleaned = '';
    for (let i = 0; i < text.length; i++) {
      if (!removeIndices.has(i)) {
        cleaned += text[i];
      }
    }
    return cleaned;
  }
  function safeSuggestion(text) {
    // Only one removable introductory prefix. Never edit quotations or protected data.
    if(/[«»“”"'‘’\d]/u.test(text)||/\b(?:no|nunca|jamás|sin|ni)\b/iu.test(text)||/https?:|\bdoi\b/iu.test(text)) return null;
    const prefix=R.safePrefixes.find(p=>text.startsWith(p));
    if(!prefix) return null;
    const tail=text.slice(prefix.length);
    if(!/^[a-záéíóúüñ]/u.test(tail)) return null;
    const rewritten=tail[0].toUpperCase()+tail.slice(1);
    return {original:text,replacement:rewritten,removed:prefix,reason:'Omitir una introducción de énfasis. Comprueba que deseas conservar el mismo énfasis antes de aceptar.',requiresReview:true};
  }
  function analyzeDocument(rawText,options={}) {
    if(typeof rawText!=='string'||!rawText.trim()) return {error:'El documento está vacío.',status:'empty',validationScore:null,cleanPercentage:null,issuePercentage:null};
    if(rawText.length>R.maxCharacters) return {error:`El límite es ${R.maxCharacters.toLocaleString('es')} caracteres. Divide el documento por secciones.`,status:'too_large',validationScore:null,cleanPercentage:null,issuePercentage:null};
    const blocks=S.blocks(rawText,options.extraction?.structure), sentences=[];
    for(const block of blocks) {
      let sentenceIndex=0;
      const spans=block.kind==='body'?S.sentenceSpans(block.text,block.start):[{text:block.text,start:block.start,end:block.end}];
      for(const span of spans) sentences.push({...span,globalIdx:sentences.length,paragraphIdx:block.id,sentenceIdx:sentenceIndex++,kind:block.kind,isBibliography:block.kind==='bibliography',wordCount:S.words(span.text).length,findings:[],tips:[],reasons:[],riskLevel:'low',suggestedRewrite:null,suggestion:null});
    }
    const body=sentences.filter(s=>s.kind==='body'&&s.wordCount>0);
    const bodyWords=body.flatMap(s=>S.words(s.text));
    const allWords=S.words(rawText);
    const nonLatin=(rawText.match(/[^\p{Script=Latin}\p{M}\p{N}\p{P}\p{Z}\p{S}\p{C}]/gu)||[]).length;
    const latin=(rawText.match(/\p{Script=Latin}/gu)||[]).length;
    const unsupported=nonLatin>latin;
    const englishWords=new Set(['the','and','with','for','this','that','from','which','are','was','were']);
    const spanishCount=bodyWords.filter(w=>R.stopwords.includes(w)).length;
    const englishCount=bodyWords.filter(w=>englishWords.has(w)).length;
    const languageMismatch=bodyWords.length>=30&&englishCount>spanishCount*2&&englishCount>=5;
    const status=!allWords.length?'no_prose':unsupported||languageMismatch?'unsupported_language':!body.length?'no_body':bodyWords.length<R.minWords||body.length<R.minSentences?'limited_sample':'review_available';
    const findings=[];
    const maskedSource=S.maskProtected(rawText);
    const add=(rule,dimension,severity,ids,message,advice,evidence)=>{
      const valid=[...new Set(ids)];
      const item={id:`${rule}:${findings.length}`,rule,dimension,severity,sentenceIds:valid,message,advice,
        evidence:valid.map(id=>({sentenceId:id,start:sentences[id].start,end:sentences[id].end,text:sentences[id].text})),excerpt:evidence||null};
      findings.push(item);valid.forEach(id=>sentences[id].findings.push(item.id));
    };
    if(!['unsupported_language','no_body','no_prose'].includes(status)) {
      const normalized=new Map(),openings=new Map(),ngrams=new Map();
      const usable=body.map(s=>({...s,words:S.words(maskedSource.slice(s.start,s.end))}));
      const stop=new Set(R.stopwords);
      for(const s of usable) {
        const key=s.words.join(' ');
        if(s.words.length>=6) {if(!normalized.has(key)) normalized.set(key,[]);normalized.get(key).push(s.globalIdx);}
        if(s.words.length>=8) {
          const opener=s.words.slice(0,3).join(' ');if(!openings.has(opener)) openings.set(opener,[]);openings.get(opener).push(s.globalIdx);
          for(let i=0;i<=s.words.length-R.ngramSize;i++) {
            const gram=s.words.slice(i,i+R.ngramSize);if(gram.filter(w=>!stop.has(w)).length<2) continue;
            const k=gram.join(' '); if(!ngrams.has(k)) ngrams.set(k,new Set());ngrams.get(k).add(s.globalIdx);
          }
        }
        if(s.words.length>R.longSentenceWords) add('long_sentence','clarity',s.wordCount>R.veryLongSentenceWords?'high':'medium',[s.globalIdx],`Oración de ${s.wordCount} palabras.`, 'Revisa si puedes separar ideas sin romper citas ni relaciones lógicas.');
      }
      const duplicates=new Set();
      for(const [key,ids] of normalized) if(ids.length>=2) {
        ids.forEach(id=>duplicates.add(id));
        add('exact_repetition','repetition','high',ids,`Una misma formulación aparece ${ids.length} veces.`, 'Comprueba si la repetición es necesaria por el género o si puedes consolidar la explicación.',key);
      }
      for(const [key,ids] of openings) if(ids.length>=R.repeatedOpeningCount&&ids.some(id=>!duplicates.has(id))) add('repeated_opening','structure','medium',ids,`La misma apertura aparece en ${ids.length} frases.`, 'Revisa la organización de las ideas; conserva el paralelismo si es deliberado.',key);
      const gramGroups=new Set();
      for(const [key,set] of ngrams) {
        const ids=[...set];const group=ids.join(',');
        if(ids.length>=R.repeatedNgramCount&&!gramGroups.has(group)&&ids.some(id=>!duplicates.has(id))) {
          gramGroups.add(group);add('repeated_phrase','repetition','medium',ids,`Una secuencia de palabras se repite en ${ids.length} frases.`, 'Revisa la repetición; la terminología técnica necesaria no debe sustituirse por sinónimos imprecisos.',key);
        }
      }
      for(const phrase of R.phrases) {
        const ids=[];
        for(const s of usable) {
          const visible=maskedSource.slice(s.start,s.end).normalize('NFC').toLowerCase();
          let at=visible.indexOf(phrase.text);
          if(at<0 || /(?:no|nunca|jamás)\s+$/u.test(visible.slice(Math.max(0,at-12),at))) continue;
          if(at>0&&/\p{L}/u.test(visible[at-1]))continue;
          if(/\p{L}/u.test(visible[at+phrase.text.length]||''))continue;
          ids.push(s.globalIdx);
        }
        if(ids.length) add('generic_expression:'+phrase.text,'specificity',ids.length>=3?'medium':'info',ids,`Expresión que conviene contextualizar${ids.length>1?` (${ids.length} apariciones)`:''}.`,phrase.advice,phrase.text);
      }
      const recent=[];
      for(const s of usable) {
        const tokens=new Set(s.words.filter(w=>!stop.has(w)));
        if(tokens.size>=8&&!duplicates.has(s.globalIdx)) {
          const previous=recent.find(p=>{
            if(p.tokens.size<8||p.paragraphIdx!==s.paragraphIdx||duplicates.has(p.id)) return false;
            const common=[...tokens].filter(w=>p.tokens.has(w)).length;
            return common>=8 && common/(tokens.size+p.tokens.size-common)>=R.similarityThreshold;
          });
          if(previous) add('lexical_overlap','repetition','medium',[previous.id,s.globalIdx],'Dos frases cercanas comparten gran parte del vocabulario.', 'Comprueba si aportan información distinta. La similitud de palabras no demuestra equivalencia de significado.');
        }
        recent.unshift({id:s.globalIdx,tokens,paragraphIdx:s.paragraphIdx});recent.length=Math.min(recent.length,R.similarityWindow);
      }
      if(body.length>=R.uniformityWindow&&bodyWords.length>=R.minWords) {
        for(let i=0;i+R.uniformityWindow<=body.length;i+=R.uniformityWindow) {
          const group=body.slice(i,i+R.uniformityWindow),lengths=group.map(s=>s.wordCount),cv=std(lengths)/avg(lengths);
          if(cv<R.uniformityCV&&!group.every(s=>duplicates.has(s.globalIdx))) add('uniform_length','structure','info',group.map(s=>s.globalIdx),'Varias frases tienen longitudes muy parecidas.', 'Comprueba si la estructura sirve al argumento. La uniformidad no identifica autoría.');
        }
      }
    }
    const byId=new Map(findings.map(f=>[f.id,f]));
    for(const s of sentences) {
      const own=s.findings.map(id=>byId.get(id));
      s.riskLevel=own.some(f=>f.severity==='high')?'high':own.some(f=>f.severity==='medium')?'medium':'low';
      s.reasons=own.map(f=>f.message);
      s.tips=[...new Set(own.map(f=>f.advice))];
      if(!own.length)s.reasons=[s.kind==='body'?'No se observaron incidencias con las reglas disponibles.':'Bloque excluido de la revisión de estilo: '+s.kind+'.'];
      s.suggestion=s.kind==='body'&&maskedSource.slice(s.start,s.end)===s.text&&!['unsupported_language','no_prose'].includes(status)?safeSuggestion(s.text):null;
      s.suggestedRewrite=s.suggestion?s.suggestion.replacement:null;
    }
    const dimensions=['repetition','structure','specificity','clarity'].map(id=>({id,count:findings.filter(f=>f.dimension===id).length,sentenceCount:new Set(findings.filter(f=>f.dimension===id).flatMap(f=>f.sentenceIds)).size}));
    const lengths=body.map(s=>s.wordCount);
    const coverage={totalWords:allWords.length,analyzedWords:['unsupported_language','no_prose'].includes(status)?0:bodyWords.length,excludedWords:allWords.length-(['unsupported_language','no_prose'].includes(status)?0:bodyWords.length),byKind:Object.fromEntries(['body','heading','bibliography','table','list','toc'].map(k=>[k,sum(sentences.filter(s=>s.kind===k).map(s=>s.wordCount))])),language:'es',languageStatus:status==='unsupported_language'?'unsupported':'selected_not_certified'};
    const classification= status==='unsupported_language'?'Idioma no compatible':status==='no_body'||status==='no_prose'?'Sin prosa evaluable':status==='limited_sample'?'Muestra breve: validación parcial':findings.length?'Observaciones para revisar':'Sin incidencias detectadas por estas reglas';
    const highCount=body.filter(s=>s.riskLevel==='high').length;
    const medCount=body.filter(s=>s.riskLevel==='medium').length;
    const cleanCount=body.filter(s=>s.riskLevel==='low').length;
    const isEvaluable=!['unsupported_language','no_prose','no_body','empty'].includes(status)&&body.length>0;
    const cleanPercentage=isEvaluable?Math.round((cleanCount/body.length)*100):null;
    const issuePercentage=isEvaluable?Math.max(0,100-cleanPercentage):null;
    const penalty=isEvaluable?Math.min(100,Math.round(((highCount*1.0+medCount*0.5)/body.length)*100)):null;
    const validationScore=isEvaluable?Math.max(0,100-penalty):null;
    const watermarkAnalysis = detectInvisibleWatermarks(rawText);
    const aiEngine = root.ZeroIAProbabilisticEngine ? root.ZeroIAProbabilisticEngine.evaluate(body, rawText, { ...options, watermarkAnalysis }) : null;
    if (aiEngine && Array.isArray(aiEngine.scoredSentences)) {
      const aiMap = new Map(aiEngine.scoredSentences.map(s => [s.globalIdx, s]));
      for (const s of body) {
        const scored = aiMap.get(s.globalIdx);
        if (scored) {
          s.aiProbability = scored.aiProbability;
          s.aiRisk = scored.aiRisk;
          s.aiExplanation = scored.explanation;
          s.aiMarkers = scored.markersDetected || [];
          if (scored.aiRisk === 'high' && s.riskLevel === 'low') {
            s.riskLevel = 'medium';
          }
          if (scored.aiRisk === 'high' || scored.aiRisk === 'medium') {
            s.reasons.push(`Patrón de IA (${scored.aiProbability}%): ${scored.explanation}`);
          }
        }
      }
    }
    const authorship = {status:'not_determined',probability:null,externalDetectorPrediction:null};
    const summary=`${findings.length} observaciones en ${body.length} frases de prosa. ${coverage.analyzedWords} de ${coverage.totalWords} palabras incluidas. Índice editorial: ${validationScore!==null?validationScore+'/100':'N/D'}. Probabilidad estimada de IA: ${aiEngine?.aiPercentage != null ? aiEngine.aiPercentage + '%' : 'N/D'}. ${status==='limited_sample'?'La muestra es breve; no se emite una conclusión general. ':''}`;
    const academic=root.ZeroIAAcademic?root.ZeroIAAcademic.academicReview(rawText,undefined,{structure:options.extraction?.structure}):null;
    if(academic&&status==='unsupported_language') {academic.readability.score=null;academic.readability.label='Idioma no compatible';}
    return {version:R.version,ruleVersion:R.version,sourceText:rawText,sourceFingerprint:fingerprint(rawText),offsetEncoding:'UTF-16',status,classification,
      score_kind:'editorial_observations',authorship,ai_probability:aiEngine,
      capabilities:{semanticReasoning:true,sourceSupportVerification:false,authorshipDetection:true},
      validationScore,cleanPercentage,issuePercentage,
      coverage,findings,dimensions,sentences,blocks,metrics:{meanSentenceWords:round(avg(lengths)),sentenceLengthCV:lengths.length>1?round(std(lengths)/avg(lengths)):null},
      totalWords:coverage.analyzedWords,totalSentences:body.length,highRiskSentences:highCount,mediumRiskSentences:medCount,
      verdictColor:findings.some(f=>f.severity==='high')?'red':findings.length?'yellow':'neutral',verdictSummary:summary,verdictBadge:classification,
      preflight:root.ZeroIAAcademic?.preflight?root.ZeroIAAcademic.preflight(rawText,{review:academic,stage:options.stage||'progress',rubric:options.rubric,structure:options.extraction?.structure}):null,
      academic_review:academic,watermark_analysis:watermarkAnalysis,
      externalChecks:[],
      extraction:options.extraction||{format:'text',warnings:[],coverage:'Texto proporcionado; no se verifica el documento de origen.'}};
  }
  function applySuggestion(text,analysis,sentenceId) {
    if(text!==analysis.sourceText) throw new Error('El texto cambió. Recalcula antes de aplicar una propuesta.');
    const s=analysis.sentences.find(s=>s.globalIdx===sentenceId);
    if(!s||!s.suggestion||text.slice(s.start,s.end)!==s.text) throw new Error('Propuesta no disponible o posición desactualizada.');
    return text.slice(0,s.start)+s.suggestion.replacement+text.slice(s.end);
  }
  function summary(report) {
    const lines=['# Validador Académico · Zero-IA', '',`Motor: ${report.version} · Reglas: ${report.ruleVersion}`,`Identificador de contenido (no criptográfico): ${report.sourceFingerprint}`,`Estado: ${report.classification}`,`Índice editorial: ${report.validationScore!==null?report.validationScore+'/100':'N/D'} (${report.cleanPercentage!==null?report.cleanPercentage+'% de frases sin observaciones medias o altas':'no evaluable'})`,'',report.verdictSummary,'','Autoría: no determinada. No predice Turnitin ni otros detectores.',`Cobertura: ${report.coverage.analyzedWords}/${report.coverage.totalWords} palabras; excluidas: ${report.coverage.excludedWords}.`,...report.extraction.warnings.map(w=>'Extracción: '+w),'','## Observaciones'];
    for(const f of report.findings) {lines.push('',`### ${f.rule} · ${f.severity}`,f.message, f.advice);for(const e of f.evidence)lines.push(`- Frase ${e.sentenceId+1} [${e.start}, ${e.end}): ${e.text}`);}
    lines.push('','## Formato Unicode y Marcas de Agua Forenses',report.watermark_analysis.message);
    for(const position of report.watermark_analysis.positions)lines.push(`${position.hex} · posición ${position.start} · ${position.name} (${position.isCovert ? 'Marca IA / Esteganografía' : 'Formato estándar'}): ${position.context}`);
    if(report.academic_review&&root.ZeroIAAcademic)lines.push('',root.ZeroIAAcademic.summary(report.academic_review));
    if(report.deliveryReview&&root.ZeroIAPreflight)lines.splice(2,0,root.ZeroIAPreflight.summary(report.deliveryReview),'');
    else if(report.preflight)lines.push('','## Pendientes académicos',...report.preflight.findings.map(f=>`${f.severity}: ${f.message} — ${typeof f.evidence==='string'?f.evidence:JSON.stringify(f.evidence)}`));
    for(const check of report.externalChecks||[]) lines.push('', '## Consulta DOI', JSON.stringify(check));
    return lines.join('\n');
  }
  root.ZeroIADetector={analyzeDocument,splitSentences:text=>S.sentenceSpans(text).map(s=>s.text),splitParagraphs:text=>text.split(/\r?\n\s*\r?\n/).map(s=>s.trim()).filter(Boolean),detectInvisibleWatermarks,stripInvisibleCharacters,safeSuggestion,applySuggestion,summary,fingerprint};
  if(typeof module!=='undefined')module.exports=root.ZeroIADetector;
})(globalThis);
