importScripts('editorial-rules.js?v=2.0.0','text-structure.js?v=2.0.0','academic-review.js?v=2.0.0','detector.js?v=2.0.0');
self.onmessage = ({data}) => {
  try {
    self.postMessage({id:data.id,stage:'Revisando estructura y redacción…'});
    const result=ZeroIADetector.analyzeDocument(data.text,data.options);
    self.postMessage({id:data.id,result});
  } catch(error) { self.postMessage({id:data.id,error:error.message}); }
};
