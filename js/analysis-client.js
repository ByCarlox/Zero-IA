(function(root) {
 'use strict';
 let active=null,sequence=0;
 function cancel(){if(active){active.worker?.terminate();clearTimeout(active.timer);active.reject(Object.assign(new Error('Análisis cancelado. El texto se conserva.'),{name:'AbortError'}));active=null;}}
 function analyze(text,options={},onProgress=()=>{}) {
  cancel();
  return new Promise((resolve,reject)=>{
   const id=++sequence;
   let worker;
   try {if(root.location?.protocol==='file:')throw new Error('Local file compatibility');worker=new Worker('js/analysis-worker.js?v=2.0.0');} catch(error) {
    // file:// can prohibit workers; keep this explicit and bounded.
    if(text.length>50000){reject(new Error('Para documentos extensos abre la aplicación mediante su servidor local o GitHub Pages.'));return;}
    onProgress('Revisión local compatible (sin trabajador en segundo plano)…');
    const job={reject,worker:null,timer:null};active=job;
    job.timer=setTimeout(()=>{if(active!==job)return;active=null;try{resolve(root.ZeroIADetector.analyzeDocument(text,options));}catch(e){reject(e);}},0);
    return;
   }
   const finish=(error,result)=>{if(active?.id!==id)return;clearTimeout(active.timer);worker.terminate();active=null;error?reject(error):resolve(result);};
   active={id,worker,reject,timer:setTimeout(()=>finish(new Error('El análisis superó el tiempo disponible. Divide el documento por secciones.')),30000)};
   worker.onmessage=({data})=>{if(data.id!==id)return;if(data.stage)onProgress(data.stage);else finish(data.error?new Error(data.error):null,data.result);};
   worker.onerror=()=>finish(new Error('No se pudo iniciar el motor en segundo plano. Abre la aplicación desde su servidor local o recarga la web.'));
   worker.postMessage({id,text,options});
  });
 }
 root.ZeroIAAnalysisClient={analyze,cancel};
})(globalThis);
