/* Evidence-bound external results. This module does not infer authorship. */
(function(root) {
  'use strict';
  const schemaVersion=1;
  const hashPattern=/^sha256:[a-f0-9]{64}$/;
  async function hash(text) {
    if(typeof text!=='string') throw new Error('El texto debe ser una cadena.');
    let crypto=root.crypto;
    if(!crypto?.subtle && typeof require==='function') crypto=require('node:crypto').webcrypto;
    if(!crypto?.subtle) throw new Error('La huella del documento requiere HTTPS o un servidor local.');
    const bytes=new TextEncoder().encode(text);
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    return 'sha256:'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  }
  function percentage(value,label,optional=false) {
    if(optional && (value===null || value===undefined)) return null;
    if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>100) throw new Error(label+' debe estar entre 0 y 100.');
    return value;
  }
  function validate(input,provenance) {
    if(!input||typeof input!=='object'||Array.isArray(input)) throw new Error('Informe externo no válido.');
    if(input.schemaVersion!==schemaVersion) throw new Error('Versión de informe externo no compatible.');
    if(typeof input.provider!=='string'||!input.provider.trim()||input.provider.length>100) throw new Error('Indica el proveedor del informe.');
    if(!hashPattern.test(input.sourceSHA256||'')) throw new Error('Falta una huella SHA-256 válida del texto asociado.');
    if(typeof input.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error('Indica la fecha del informe.');
    const date=new Date(input.date+'T00:00:00Z');
    if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==input.date) throw new Error('Fecha de informe no válida.');
    const now=new Date(), today=new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()));
    if(date>today) throw new Error('La fecha del informe no puede ser futura.');
    const aiStatus=input.aiStatus||'reported';
    if(!['reported','below_threshold'].includes(aiStatus)) throw new Error('Estado de IA no compatible.');
    if(aiStatus==='below_threshold' && input.aiPercentage!==null && input.aiPercentage!==undefined) throw new Error('Un resultado con asterisco no tiene porcentaje numérico.');
    const aiPercentage=aiStatus==='reported'?percentage(input.aiPercentage,'El porcentaje de IA'):null;
    const similarityPercentage=percentage(input.similarityPercentage,'La similitud',true);
    if(input.excerpts!==undefined && (!Array.isArray(input.excerpts)||input.excerpts.length>100)) throw new Error('Máximo 100 fragmentos por informe.');
    const excerpts=(input.excerpts||[]).map(s=>{if(typeof s!=='string'||!s.trim()||s.length>5000)throw new Error('Fragmento no válido (máximo 5000 caracteres).');return s;});
    if(input.sourceNote!==undefined && (typeof input.sourceNote!=='string'||input.sourceNote.length>600)) throw new Error('La descripción de procedencia admite hasta 600 caracteres.');
    return {sourceNote:input.sourceNote||'',schemaVersion,provider:input.provider.trim(),date:input.date,aiStatus,aiPercentage,similarityPercentage,sourceSHA256:input.sourceSHA256,provenance,excerpts};
  }
  function createExternal(input,textHash) {return validate({...input,schemaVersion,sourceSHA256:textHash},'manual');}
  function importExternal(json) {
    if(typeof json!=='string'||json.length>1000000) throw new Error('El informe JSON supera 1 MB o no es texto.');
    let input;try{input=JSON.parse(json);}catch{throw new Error('El archivo no contiene JSON válido.');}
    return validate(input,'imported_unverified');
  }
  function exportExternal(record) {return JSON.stringify(validate(record,record.provenance==='manual'?'manual':'imported_unverified'),null,2);}
  function evaluate(report,options={}) {
    const stage=['proposal','progress','final'].includes(options.stage)?options.stage:'progress';
    const preflight=root.ZeroIAAcademic?.preflight?root.ZeroIAAcademic.preflight(report.sourceText||'',{stage,rubric:options.rubric,structure:report.extraction?.structure}):report.preflight||{};
    const findings=(preflight.findings||[]).map(f=>({...f,title:f.title||f.message,action:f.action||f.advice||'Revisa la evidencia y documenta tu decisión.'}));
    const authorship={status:'not_determined',percentage:null,label:'No determinado',provider:null,provenance:null,notice:'No hay un detector de IA calibrado en esta versión. Las reglas editoriales no estiman autoría.'};
    let external=null;
    if(options.externalReport) {
      external=validate(options.externalReport,options.externalReport.provenance==='manual'?'manual':'imported_unverified');
      authorship.provider=external.provider;authorship.provenance=external.provenance;
      if(!report.sourceSHA256||external.sourceSHA256!==report.sourceSHA256) {
        Object.assign(authorship,{status:'stale',label:'No determinado',notice:'El resultado externo corresponde a otra versión del texto. Revisa de nuevo el documento con el proveedor.'});
      } else {
        Object.assign(authorship,{status:external.aiStatus,percentage:external.aiPercentage,label:external.aiStatus==='below_threshold'?'*%':external.aiPercentage+'%',notice:'Resultado externo '+(external.provenance==='manual'?'declarado por el usuario':'importado sin verificación de autenticidad')+'. La coincidencia del texto no certifica el informe ni demuestra autoría.'});
      }
    }
    return {version:'3.0.0',stage,authorship,externalReport:external,findings,status:findings.some(f=>f.severity==='high')?'pending_review':findings.length?'observations':'checks_complete',summary:findings.length?`${findings.length} pendientes académicos para revisar.`:'Sin pendientes detectados por las comprobaciones disponibles. No certifica aceptación.',limitations:Array.isArray(preflight.limitations)?preflight.limitations:preflight.limitations?[preflight.limitations]:[],rubric:typeof options.rubric==='string'?options.rubric.slice(0,10000):''};
  }
  function summary(result) {
    const a=result.authorship;
    return ['## Resultado de IA',a.label,a.notice,a.provider?`Proveedor: ${a.provider}`:'',result.externalReport?`Fecha del informe: ${result.externalReport.date} · Similitud: ${result.externalReport.similarityPercentage??'No indicada'}${result.externalReport.similarityPercentage===null?'':'%'}`:'',`Etapa: ${result.stage}`,result.summary,...result.findings.flatMap(f=>['',`### ${f.severity} · ${f.title}`,f.message||'',typeof f.evidence==='string'?f.evidence:JSON.stringify(f.evidence),f.action]),'',...result.limitations].filter(v=>v!==undefined).join('\n');
  }
  root.ZeroIAPreflight={hash,createExternal,importExternal,exportExternal,evaluate,summary};
  if(typeof module!=='undefined')module.exports=root.ZeroIAPreflight;
})(globalThis);
