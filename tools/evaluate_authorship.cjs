/* Independent QA: abstention/evidence integrity, never an accuracy benchmark. */
const fs=require('node:fs'),path=require('node:path');
for(const file of ['editorial-rules','text-structure','academic-review','detector','preflight'])require('../js/'+file+'.js');
const E=globalThis.ZeroIADetector,P=globalThis.ZeroIAPreflight;
function fixtures(){return ['human','generated'].flatMap(name=>JSON.parse(fs.readFileSync(path.join(__dirname,'../tests/fixtures/authorship',name+'.json'),'utf8')));}
function variants(text,seed=20260929){
 let state=seed; const rand=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
 const output=[['original',text],['nfd',text.normalize('NFD')],['crlf',text.replace(/\n/g,'\r\n')],['heading','INTRODUCCIÓN\n\n'+text],['html_literal','<img src=x onerror=alert(1)>\n'+text],['bibliography',text+'\n\nReferencias\nAutor, A. (2020). Ejemplo de referencia.']];
 for(let n=0;n<20;n++)output.push(['random-'+n,text.replace(/ /g,()=>rand()<0.07?['  ','\t','\u00a0','\u200b'][Math.floor(rand()*4)]:' ')]);
 return output;
}
async function evaluate(){
 const rows=[];
 for(const fixture of fixtures())for(const [variant,text]of variants(fixture.text)){
  const analysis=E.analyzeDocument(text); analysis.sourceSHA256=await P.hash(text);
  const result=P.evaluate(analysis);
  rows.push({id:fixture.id,label:fixture.label,variant,words:analysis.totalWords,editorialScore:analysis.validationScore,percentage:result.authorship.percentage,status:result.authorship.status,abstained:result.authorship.percentage===null&&analysis.authorship.probability===null&&analysis.authorship.externalDetectorPrediction===null});
 }
 return {date:'2026-09-29',seed:20260929,purpose:'Evidence integrity and abstention, NOT detection accuracy',caseCount:rows.length,abstentionCount:rows.filter(r=>r.abstained).length,detectionAccuracy:null,turnitinConcordance:null,rows};
}
module.exports={fixtures,variants,evaluate};
if(require.main===module)evaluate().then(result=>{const out=process.argv[2];if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)); console.log(JSON.stringify({...result,rows:undefined},null,2));if(result.abstentionCount!==result.caseCount)process.exitCode=1;}).catch(error=>{console.error(error);process.exitCode=1;});
