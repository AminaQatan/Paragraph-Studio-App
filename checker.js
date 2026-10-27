// Local teaching checks: clues, never automatic rewrites.
export let dictionaryState = 'loading';
let dictionary = new Set();
export async function loadDictionary() {
  try {
    const response = await fetch(new URL('./assets/words.txt', import.meta.url));
    if (!response.ok) throw new Error('Dictionary unavailable');
    dictionary = new Set((await response.text()).split('\n'));
    dictionaryState = 'ready';
  } catch { dictionaryState = 'unavailable'; }
}
export function setDictionary(words) { dictionary = new Set(words); dictionaryState = 'ready'; }
export const wordCount = text => (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu) || []).length;
const irregularPast = 'went came saw ate drank wrote read took gave made did had bought brought thought taught caught found felt left met ran said sat slept spoke stood swam told understood wore won drove broke chose fell flew forgot got grew knew lost paid put sent spent began built cut drew heard held kept let meant rode sold sang'.split(' ');
const commonBase = 'go come work study play eat drink write read walk run make take give use wear need want like love live learn help visit clean watch wash repair start finish speak listen drive build open close arrive enjoy carry watch teach cook buy bring find leave meet sit sleep stand swim tell understand win do have say see think stop try move put keep cut draw sing get become look feel call ask seem turn show hear lead let begin talk change follow create wait serve send stay fall'.split(' ');
const basePattern = commonBase.join('|');
const auxiliary = /\b(am|is|are|was|were|be|been|being|have|has|had|do|does|did|can|could|will|would|shall|should|may|might|must)\b/i;
const irregular = new Set(irregularPast);
const baseSet = new Set(commonBase);
const britishForms = new Set('colour colours favourite favourites centre centres practise practises practised practising'.split(' '));
function looksLikeVerb(word) {
  word = word.toLowerCase();
  if (baseSet.has(word) || irregular.has(word)) return true;
  if (/ed$/.test(word)) return true;
  return (word.endsWith('s') && baseSet.has(word.slice(0,-1))) || (word.endsWith('ies') && baseSet.has(word.slice(0,-3)+'y')) || (word.endsWith('es') && baseSet.has(word.slice(0,-2)));
}
function oneSentenceBreak(text) {
  const protectedText = text.replace(/\b(?:Mr|Mrs|Ms|Dr|Prof|St|e\.g|i\.e)\./gi, m => m.replace(/\./g, '·')).replace(/(?<=\d)\.(?=\d)/g,'·');
  const m = /[.!?]["'”’)]*\s+(?=[\p{L}\p{N}"“])/u.exec(protectedText);
  return m ? m.index + m[0].length : -1;
}
export function checkSentence(text, ignored = new Set()) {
  if (!text.trim()) return [];
  const issues=[];
  const add=(start,end,type,hint,word)=>{
    start=Math.max(0,start); end=Math.min(text.length,Math.max(start+1,end));
    if (!issues.some(i=>i.start===start&&i.end===end&&i.type===type)) issues.push({start,end,type,hint,...(word?{word}:{})});
  };
  const scan=(pattern,type,hint,group=0)=>{
    for(const m of text.matchAll(pattern)){
      if(type==='Present simple' && /\b(?:can|could|should|must|will|would|may|might|does|did|do)\s+$/i.test(text.slice(0,m.index))) continue;
      const part=m[group]; if(!part) continue;
      const start=m.index+(group?m[0].lastIndexOf(part):0);
      add(start,start+part.length,type,typeof hint==='function'?hint(m):hint);
    }
  };
  const first=/[\p{L}]/u.exec(text);
  if(first && /[a-z]/.test(first[0])) add(first.index,first.index+1,'Capital letter','How should the first word of a sentence begin?');
  scan(/\bi\b/g,'Capital letter','The pronoun for yourself always needs a capital letter.');
  scan(/\b(english|arabic|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|april|june|july|august|september|october|november|december|oman|salalah|muscat)\b/g,'Capital letter','Does this language, place, day, or month need a capital letter?');
  if(!/[.!?]["'”’)]*\s*$/.test(text)){
    const last=/\S+\s*$/.exec(text); if(last) add(last.index,last.index+last[0].trimEnd().length,'End punctuation','What punctuation shows that your sentence has finished?');
  }
  const second=oneSentenceBreak(text);
  if(second>=0) add(second,text.length,'One sentence per box','This box seems to contain more than one sentence. Move the next sentence into another box in this section.');
  scan(/\b([a-z]+)\s+\1\b/gi,'Repeated word','Read this part aloud. Is the same word accidentally repeated?');
  scan(/[ \t]{2,}/g,'Spacing','Do you need more than one space here?');
  scan(/\s+[,.!?;:]/g,'Punctuation','Should there be a space before this punctuation mark?');
  scan(/[,;:](?=[A-Za-z])/g,'Spacing','Is there a space missing after this punctuation mark?');
  scan(/[!?]{2,}|\.{2,}|,{2,}/g,'Punctuation','Is one punctuation mark enough for this sentence?');
  scan(/\b(?:he|she|it)\s+(are|am|were|have|do)\b/gi,'Subject and verb','Does this verb agree with he, she, or it?',1);
  scan(/\b(?:we|they|you)\s+(is|am|was|has|does)\b/gi,'Subject and verb','Does this verb agree with we, they, or you?',1);
  scan(/\bI\s+(is|are|has|does)\b/g,'Subject and verb','Check which form of this verb goes with I.',1);
  scan(/\b(?:the\s+)?(?:students|workers|teachers|children|people|tools|machines|friends|boys|girls)\s+(is|was|has|does)\b/gi,'Subject and verb','Is your subject plural? Check the form of the verb.',1);
  scan(/\b(?:the|a|this|my|our)\s+(?:student|worker|teacher|child|machine|friend|boy|girl|workshop|school|classroom|floor|table|computer|car|book|tool|house|room|garden)\s+(are|were|have|do)\b/gi,'Subject and verb','Is your subject singular? Check the form of the verb.',1);
  scan(/\b(?:he|she|it)\s+(don't|don’t)\b/gi,'Subject and verb','Does this shortened helping verb agree with he, she, or it?',1);
  scan(/\b(?:I|we|you|they)\s+(doesn't|doesn’t)\b/gi,'Subject and verb','Does this shortened helping verb agree with the subject?',1);
  scan(/\bthere\s+(is|was)\s+(?:many|several|two|three|four|five)\b/gi,'Subject and verb','Are you describing more than one thing? Check the form of be.',1);
  scan(/\bthere\s+(many|several|a|an)\b/gi,'Missing verb','Is a form of be missing after there?',1);
  scan(new RegExp('\\b(?:he|she|it)\\s+(?:always\\s+|usually\\s+|often\\s+|never\\s+)?('+basePattern+')\\b','gi'),'Present simple','If this is a present simple statement, what ending does the verb need after he, she, or it?',1);
  scan(/\b(?:I|we|you|they)\s+(goes|comes|works|studies|plays|eats|drinks|writes|walks|runs|makes|takes|gives|uses|wears|needs|wants|likes|lives|learns|helps|visits|cleans|watches|repairs)\b/gi,'Present simple','Check the present simple verb form after this subject.',1);
  scan(/\b(?:can|could|should|must|will|would|may|might)\s+(?:not\s+)?(goes|went|going|works|worked|working|plays|played|playing|studies|studied|studying|does|did|has|had|is|are|was|were|uses|used|using|wears|wore|makes|made|takes|took|eats|ate)\b/gi,'Verb form','What form of the verb comes directly after a modal such as can, should, or must?',1);
  scan(/\b(?:did|didn't|didn’t|does|doesn't|doesn’t)\s+(?:not\s+)?(went|came|saw|ate|drank|wrote|took|gave|made|bought|played|worked|studied|visited|walked|goes|works|likes|plays|uses|has)\b/gi,'Verb form','After did or does, should the next verb keep its past tense or -s ending?',1);
  scan(/\b(?:am|is|are|was|were)\s+(go|work|study|play|eat|drink|write|walk|run|watch|repair|use|wear|wait|listen|speak|learn)\b/gi,'Verb form','Are you describing an action in progress? Check the verb form after be.',1);
  scan(/\b(?:I['’]m|he['’]s|she['’]s|it['’]s|we['’]re|they['’]re|you['’]re)\s+(go|work|study|play|eat|drink|write|walk|run|watch|repair|use|wear|wait|listen|speak|learn)\b/gi,'Verb form','This shortened form includes a helping verb. Check the form of the action verb that follows it.',1);
  scan(/\b(?:have|has|had)\s+(went|ate|drank|wrote|took|gave|saw|spoke|broke|chose|drove|flew|forgot|knew|rode|sang|swam|wore)\b/gi,'Verb form','After have, has, or had, do you need the past participle?',1);
  scan(/\b(?:I|he|she|it|we|they|you)\s+(?:very\s+)?(happy|sad|tired|hungry|thirsty|ready|busy|excited|afraid|angry|careful|safe|dangerous)\b/gi,'Missing verb','Is a form of be missing between the subject and this describing word?',1);
  scan(/\b(?:I|he|she|it|we|they|you)\s+(going|working|studying|playing|eating|drinking|writing|walking|running|watching|repairing|using|wearing|waiting|listening|speaking|learning)\b/gi,'Missing verb','Does this -ing verb need a helping verb before it?',1);
  scan(/\b(a)\s+(apple|orange|egg|idea|umbrella|elephant|engine|engineer|accident|hour|honest|interesting|important|old|easy|excellent|unsafe|unusual)\b/gi,'Article','Listen to the first sound of the next word. Should the article be a or an?',1);
  scan(/\b(an)\s+(book|car|tool|machine|student|teacher|workshop|uniform|university|useful|one|boy|girl|house|computer|table)\b/gi,'Article','Listen to the first sound of the next word. Should the article be a or an?',1);
  scan(/\b(?:a|an|one)\s+(books|cars|tools|machines|students|teachers|apples|eggs|children|friends)\b/gi,'Singular or plural','Can a, an, or one be followed by a plural noun?',1);
  scan(/\b(?:two|three|four|five|six|seven|eight|nine|ten|many|several)\s+(book|car|tool|machine|student|teacher|apple|egg|friend|child)\b/gi,'Singular or plural','This expression means more than one. Does the noun need a plural form?',1);
  scan(/\b(?:much)\s+(books|cars|tools|machines|students|teachers|apples)\b/gi,'Quantity','Are these nouns countable? Check much or many.');
  scan(/\b(?:many)\s+(water|money|information|advice|equipment|homework)\b/gi,'Quantity','Is this noun usually uncountable? Check much or many.');
  scan(/\b(?:informations|advices|equipments|homeworks)\b/gi,'Uncountable noun','This noun is usually uncountable in English. Does it need a plural ending?');
  scan(/\b(?:more|most)\s+(better|best|easier|easiest|faster|fastest|bigger|biggest|smaller|smallest)\b/gi,'Comparison','Are you marking the comparison twice?');
  scan(/\bdiscuss\s+about\b/gi,'Preposition','Check whether discuss needs a preposition before its object.');
  scan(/\b(?:listen|listens|listened|listening)\s+(?:the|my|our|music|a)\b/gi,'Missing preposition','Is a preposition missing after listen?');
  scan(/\b(?:go|goes|went|going)\s+to\s+home\b/gi,'Preposition','Does home need to after a movement verb?');
  scan(/\b(?:dont|doesnt|didnt|isnt|arent|wasnt|werent|cant|couldnt|shouldnt|wouldnt|hasnt|havent|hadnt)\b/gi,'Apostrophe','Has an apostrophe been left out of this shortened form?');
  scan(/\b(?:your|their)\s+(welcome|happy|tired|ready|busy|going|working)\b/gi,'Word choice','Do you mean possession, or a shortened subject + are?');
  const fragment=/^\s*(because|although|when|while|if|unless)\b/i.exec(text);
  if(fragment && !/[,;]/.test(text)){
    const ws=text.match(/[A-Za-z]+/g)||[];
    const verbCount=ws.filter((w,n)=>(looksLikeVerb(w)||auxiliary.test(w)) && !(n>0 && auxiliary.test(ws[n-1])) && !(n>1 && /^(?:very|quite|not|really)$/i.test(ws[n-1]) && auxiliary.test(ws[n-2]))).length;
    if(verbCount<=1) add(fragment.index,fragment.index+fragment[0].trimEnd().length,'Complete thought','This opening may leave the thought unfinished. Have you added a main clause that can stand alone?');
  }
  const words=[...text.matchAll(/[\p{L}]+(?:['’][\p{L}]+)*/gu)];
  // Only flag very short noun phrases; broader fragment detection would over-correct.
  if(/^(?:the|a|an|my|our|this)\s+(?:(?:new|old|big|small|beautiful|favourite|favorite|clean|safe|large|red|blue|good|best)\s+){0,2}(?:car|house|workshop|school|classroom|room|place|tool|machine|book|friend|teacher|student|garden|job|family)[.!?]?$/i.test(text.trim())) add(0,text.trimEnd().length,'Complete sentence','Can you find both a subject and a verb? This may be a phrase rather than a complete sentence.');
  if(dictionaryState==='ready') for(const m of words){
    const raw=m[0], word=raw.toLowerCase().replaceAll('’',"'");
    if(ignored.has(word)||dictionary.has(word)||britishForms.has(word)) continue;
    if(!/^[a-z']+$/.test(word) || /^[A-Z]{2,}$/.test(raw)) continue;
    if(word.endsWith("'s")&&dictionary.has(word.slice(0,-2))) continue;
    const before=text.slice(0,m.index),after=text.slice(m.index+raw.length);
    if(before.endsWith('@')||after.startsWith('@')||before.endsWith('://')) continue;
    add(m.index,m.index+raw.length,'Spelling','Check the letters in this word. If it is a name or a specialist word, you can keep it.',word);
  }
  return issues.sort((a,b)=>a.start-b.start||a.end-b.end);
}
export function highlightRanges(text,issues){
  const boundaries=[...new Set([0,text.length,...issues.flatMap(i=>[i.start,i.end])])].sort((a,b)=>a-b);
  return boundaries.slice(0,-1).map((start,n)=>({text:text.slice(start,boundaries[n+1]),start,end:boundaries[n+1],issue:issues.findIndex(i=>i.start<=start&&i.end>start)}));
}
