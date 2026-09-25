/* Private stdin/stdout bridge used by the Python interface. Never logs document content. */
require('./editorial-rules.js');
require('./text-structure.js');
require('./academic-review.js');
require('./detector.js');
const fs=require('node:fs');
try {
 const request=JSON.parse(fs.readFileSync(0,'utf8'));
 const E=globalThis.ZeroIADetector,S=globalThis.ZeroIAStructure;
 let result;
 switch(request.action) {
  case 'analyze': result=E.analyzeDocument(request.text,request.options||{});break;
  case 'sentences': result=E.splitSentences(request.text);break;
  case 'paragraphs': result=E.splitParagraphs(request.text);break;
  case 'bibliography': result=S.splitBibliography(request.text);break;
  case 'academic': result=globalThis.ZeroIAAcademic.academicReview(request.text,request.year);break;
  case 'syllables': result=globalThis.ZeroIAAcademic.syllables(request.text.normalize('NFC'));break;
  case 'academicSummary': result=globalThis.ZeroIAAcademic.summary(request.analysis);break;
  case 'unicode': result=E.detectInvisibleWatermarks(request.text);break;
  case 'clean': result=E.stripInvisibleCharacters(request.text);break;
  case 'suggest': result=E.safeSuggestion(request.text);break;
  case 'apply': result=E.applySuggestion(request.text,request.analysis,request.sentenceId);break;
  case 'report': result=E.summary(request.analysis);break;
  default: throw new Error('Unsupported engine action');
 }
 process.stdout.write(JSON.stringify(result));
} catch(e) {process.stderr.write(e.message);process.exitCode=1;}
