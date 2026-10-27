import {loadDictionary,dictionaryState,checkSentence,wordCount,highlightRanges} from './checker.js';
import {initClickSounds} from './sounds.js';
import {defaultRoles,restoreRoles,sectionNumber,addSectionSentence,removeSectionSentence,SECTION_NAMES,SECTION_LIMIT} from './sentences.js';
const $=id=>document.getElementById(id);
const KEY='paragraph-studio-v1';
const initial=()=>({topic:'',sentences:['','',''],roles:defaultRoles(3),active:0,ignored:[],checked:false});
let state=initial(),toastTimer,focusedIssue=null;
try{
  const data=JSON.parse(localStorage.getItem(KEY));
  if(data&&Array.isArray(data.sentences)&&data.sentences.length>=3&&data.sentences.length<=30&&data.sentences.every(x=>typeof x==='string')){
    state={...initial(),...data,sentences:data.sentences.map(x=>x.slice(0,800)),roles:restoreRoles(data.sentences,data.roles),topic:String(data.topic||'').slice(0,120),ignored:Array.isArray(data.ignored)?data.ignored.filter(x=>typeof x==='string'):[],active:Math.max(0,Math.min(Math.floor(Number(data.active)||0),data.sentences.length-1)),checked:!!data.checked};
  }
}catch{}
let allIssues=state.sentences.map(()=>[]);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const role=i=>state.roles[i];
const currentSection=()=>role(state.active);
const sectionTitle=r=>r[0].toUpperCase()+r.slice(1);
const indices=r=>state.roles.flatMap((item,i)=>item===r?[i]:[]);
const written=()=>state.sentences.filter(s=>s.trim()).length;
const complete=()=>written()===state.sentences.length;
const paragraph=()=>state.sentences.map(s=>s.trim()).filter(Boolean).join(' ');
const inputFor=i=>$('sentence-input-'+i);
const motion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
const labels={
  introduction:{title:'Introduce your main idea.',prompt:'Tell your reader what this paragraph is about. Add another sentence below whenever you need one.',placeholder:'Introduce your idea in one sentence…',starters:['My favourite…','There are…','Learning…']},
  body:{title:'Give your idea a little detail.',prompt:'Add reasons, examples, or details. Write one complete sentence in each box below.',placeholder:'Add one detail, reason, or example…',starters:['First, …','Also, …','For example, …','In addition, …']},
  conclusion:{title:'Bring your ideas together.',prompt:'Wrap up your paragraph with a closing thought. Add another sentence below if you need one.',placeholder:'Write one sentence to wrap up your idea…',starters:['In conclusion, …','Overall, …','To sum up, …']}
};
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('save-status').textContent='Saved on this device';}catch{$('save-status').textContent='Draft not saved — copy before leaving';}}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3500);}
function analyse(){allIssues=state.sentences.map(s=>checkSentence(s,new Set(state.ignored)));}
function tabs(){
  const selected=currentSection();
  $('sentence-tabs').innerHTML=SECTION_NAMES.map((r,n)=>{
    const rows=indices(r),hasText=rows.some(i=>state.sentences[i].trim()),hasIssues=rows.some(i=>allIssues[i]?.length),missing=state.checked&&rows.some(i=>!state.sentences[i].trim());
    return `<button id="section-tab-${r}" class="sentence-tab ${r} ${hasText?'written':''} ${hasIssues?'has-issues':''} ${missing?'missing':''}" type="button" role="tab" aria-selected="${r===selected}" aria-controls="sentence-panel" tabindex="${r===selected?0:-1}" data-section="${r}" aria-label="${sectionTitle(r)}"><span class="tab-number">${String(n+1).padStart(2,'0')}</span><span class="tab-caption">${sectionTitle(r)}</span></button>`;
  }).join('');
  $('progress-label').textContent=`${written()} / ${state.sentences.length} written`;
}
function marks(i){
  const mirror=$('editor-mirror-'+i),input=inputFor(i);
  if(!mirror||!input)return;
  mirror.innerHTML=highlightRanges(state.sentences[i],allIssues[i]||[]).map(x=>x.issue>=0?`<span class="mark">${escapeHTML(x.text)}</span>`:escapeHTML(x.text)).join('')+'\n';
  mirror.scrollTop=input.scrollTop;
  const count=wordCount(state.sentences[i]);$('sentence-words-'+i).textContent=`${count} ${count===1?'word':'words'}`;
}
function feedback(i){
  const box=$('feedback-'+i);if(!box)return;
  const issues=allIssues[i]||[],text=state.sentences[i];
  if(!text.trim()){box.innerHTML='';return;}
  if(!issues.length){box.innerHTML=`<span class="feedback-okay">✓ No common issues found. Read it aloud to double-check.</span>${dictionaryState!=='ready'?`<br><span>${dictionaryState==='loading'?'Spelling checks are loading…':'Spelling checks are unavailable. Grammar and punctuation checks still work.'}</span>`:''}`;return;}
  box.innerHTML=`<div class="feedback-intro"><b>⌁</b><span>${issues.length} ${issues.length===1?'clue':'clues'} to explore.</span></div><ul class="feedback-list">${issues.map((issue,n)=>`<li><button class="issue-card ${focusedIssue?.sentence===i&&focusedIssue?.issue===n?'focused':''}" data-issue="${n}" data-sentence="${i}"><strong>${escapeHTML(issue.type.toUpperCase())}</strong>${escapeHTML(issue.hint)}</button>${issue.word?`<button class="ignore-word" data-ignore="${escapeHTML(issue.word)}">Keep “${escapeHTML(text.slice(issue.start,issue.end))}” as a name or specialist word</button>`:''}</li>`).join('')}</ul>`;
}
function renderParagraph(){
  const value=paragraph(),count=wordCount(value);
  $('paragraph-empty').hidden=!!value;$('paragraph-text').hidden=!value;
  $('paper-title').textContent=state.topic.trim()||'A little idea, taking shape';
  $('paragraph-text').innerHTML=state.sentences.map((text,i)=>{
    if(!text.trim())return '';
    const html=highlightRanges(text,allIssues[i]||[]).map(x=>x.issue>=0?`<span class="mark paragraph-error" data-sentence="${i}" data-paragraph-issue="${x.issue}" role="button" tabindex="0" title="${escapeHTML(allIssues[i][x.issue].hint)}" aria-label="${escapeHTML(allIssues[i][x.issue].type+': '+x.text)}">${escapeHTML(x.text)}</span>`:escapeHTML(x.text)).join('');
    return `<span class="paragraph-sentence sentence-${role(i)}" data-sentence="${i}" title="Edit ${role(i)} sentence ${sectionNumber(state.roles,i)}">${html.trim()}</span>`;
  }).filter(Boolean).join(' ');
  $('paragraph-words').textContent=`${count} ${count===1?'word':'words'}`;
  const left=state.sentences.length-written();
  $('paragraph-progress').textContent=complete()?'All sentences connected':written()?`${left} ${left===1?'sentence':'sentences'} still to write`:'Start with your introduction';
  ['copy-btn','download-btn','print-btn'].forEach(id=>{$(id).disabled=!complete();$(id).title=complete()?'':'Write a sentence in every box, or remove unused extra boxes';});
  if(state.checked){
    const issueCount=allIssues.reduce((n,a)=>n+a.length,0);
    $('check-result').textContent=left?`There ${left===1?'is 1 empty sentence box':`are ${left} empty sentence boxes`}. Fill each box or remove the extras to finish your paragraph.`:issueCount?`Your paragraph is connected! Explore ${issueCount} ${issueCount===1?'clue':'clues'} by tapping the red underlines, then read it aloud.`:`Your paragraph is connected! ${dictionaryState==='ready'?'No common issues found.':'Spelling checks are '+(dictionaryState==='loading'?'loading.':'unavailable.')} Read it aloud and check that your ideas flow.`;
  }else $('check-result').textContent='';
}
function refreshAnalysis(){analyse();tabs();indices(currentSection()).forEach(i=>{marks(i);feedback(i);});renderParagraph();}
function focusInput(i,scroll=false){const input=inputFor(i);if(!input)return;input.focus({preventScroll:true});if(scroll)$('sentence-card-'+i).scrollIntoView({behavior:motion(),block:'nearest'});}
function renderEditor(focus=false){
  const r=currentSection(),label=labels[r],rows=indices(r);
  $('sentence-panel').setAttribute('aria-labelledby',`section-tab-${r}`);
  $('role-tag').className='role-tag '+r;$('role-tag').textContent=r.toUpperCase();
  $('sentence-title').textContent=label.title;$('sentence-prompt').textContent=label.prompt;
  $('sentence-list').innerHTML=rows.map((i,n)=>`<div class="sentence-entry ${r} ${i===state.active?'is-active':''}" id="sentence-card-${i}" data-index="${i}"><div class="sentence-entry-head"><label for="sentence-input-${i}"><span aria-hidden="true">${n+1}</span>Sentence ${n+1}</label>${rows.length>1?`<button class="remove-sentence" type="button" data-remove="${i}" aria-label="Remove sentence ${n+1} from ${sectionTitle(r)}" title="Remove this sentence"><span aria-hidden="true">−</span></button>`:''}</div><div class="editor-shell"><div class="editor-mirror" id="editor-mirror-${i}" aria-hidden="true"></div><textarea class="sentence-input" id="sentence-input-${i}" data-index="${i}" maxlength="800" placeholder="${escapeHTML(n===0?label.placeholder:'Write another complete sentence…')}" spellcheck="false" autocapitalize="sentences" autocomplete="off" aria-label="${sectionTitle(r)} sentence ${n+1}" aria-describedby="sentence-prompt sentence-limit-${i}">${escapeHTML(state.sentences[i])}</textarea></div><div class="editor-meta"><span id="sentence-limit-${i}">One complete sentence, ending with punctuation.</span><span id="sentence-words-${i}"></span></div><div class="feedback" id="feedback-${i}" aria-live="polite"></div></div>`).join('');
  $('add-btn').className='add-sentence '+r;$('add-btn').dataset.addRole=r;$('add-btn').setAttribute('aria-label',`Add a sentence to ${sectionTitle(r)}`);$('add-btn').disabled=rows.length>=SECTION_LIMIT;
  $('section-limit').hidden=rows.length<SECTION_LIMIT;$('section-limit').textContent=`This section has ${SECTION_LIMIT} sentence boxes. You can edit or remove any extra box.`;
  $('starter-buttons').innerHTML=label.starters.map(s=>`<button class="starter" data-starter="${escapeHTML(s.replace('…',''))}">${escapeHTML(s)}</button>`).join('');
  const sectionIndex=SECTION_NAMES.indexOf(r);
  $('prev-btn').disabled=sectionIndex===0;
  $('prev-btn').textContent=sectionIndex>0?'← '+sectionTitle(SECTION_NAMES[sectionIndex-1]):'← Previous section';
  $('next-btn').innerHTML=sectionIndex===2?'Check paragraph <span aria-hidden="true">✓</span>':sectionTitle(SECTION_NAMES[sectionIndex+1])+' <span aria-hidden="true">→</span>';
  rows.forEach(i=>{marks(i);feedback(i);});
  if(focus)focusInput(state.active,true);
}
function showSentence(i,focus=false){if(!state.sentences.hasOwnProperty(i))return;state.active=i;focusedIssue=null;analyse();tabs();renderEditor(focus);renderParagraph();save();}
function selectSection(r,focus=false){const first=state.roles.indexOf(r);if(first>=0)showSentence(first,focus);}
function pointToIssue(sentence,index){
  if(currentSection()!==role(sentence)||!inputFor(sentence))showSentence(sentence);
  state.active=sentence;focusedIssue={sentence,issue:index};
  const issue=allIssues[sentence]?.[index];if(!issue)return;
  feedback(sentence);focusInput(sentence,true);inputFor(sentence).setSelectionRange(issue.start,issue.end);save();
}
function onInput(input){
  const i=Number(input.dataset.index),start=input.selectionStart,clean=input.value.replace(/[\r\n]/g,' ');
  if(clean!==input.value){input.value=clean;input.setSelectionRange(start,start);}
  state.active=i;state.sentences[i]=clean;focusedIssue=null;save();refreshAnalysis();
}
$('sentence-list').addEventListener('input',event=>{if(event.target.matches('.sentence-input'))onInput(event.target);});
$('sentence-list').addEventListener('focusin',event=>{if(!event.target.matches('.sentence-input'))return;state.active=Number(event.target.dataset.index);document.querySelectorAll('.sentence-entry').forEach(card=>card.classList.toggle('is-active',Number(card.dataset.index)===state.active));save();});
$('sentence-list').addEventListener('scroll',event=>{if(event.target.matches('.sentence-input'))$('editor-mirror-'+event.target.dataset.index).scrollTop=event.target.scrollTop;},true);
$('sentence-list').addEventListener('keydown',event=>{
  if(event.key!=='Enter'||!event.target.matches('.sentence-input'))return;
  event.preventDefault();
  if(event.ctrlKey||event.metaKey){const rows=indices(currentSection()),position=rows.indexOf(state.active);if(position<rows.length-1)focusInput(rows[position+1],true);else $('next-btn').click();}
  else toast('One sentence in each box. Tap + Add sentence for another box below.');
});
$('sentence-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-section]');if(button)selectSection(button.dataset.section);});
$('sentence-tabs').addEventListener('keydown',event=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;event.preventDefault();const current=SECTION_NAMES.indexOf(currentSection()),position=event.key==='Home'?0:event.key==='End'?2:(current+(event.key==='ArrowRight'?1:-1)+3)%3;selectSection(SECTION_NAMES[position]);$('section-tab-'+SECTION_NAMES[position]).focus();});
$('prev-btn').onclick=()=>{const p=SECTION_NAMES.indexOf(currentSection());if(p>0)selectSection(SECTION_NAMES[p-1],true);};
$('next-btn').onclick=()=>{const p=SECTION_NAMES.indexOf(currentSection());if(p<2)selectSection(SECTION_NAMES[p+1],true);else checkAll();};
$('add-btn').onclick=()=>{const index=addSectionSentence(state,currentSection());if(index<0)return;showSentence(index,true);toast('A new sentence box is ready below.');};
function confirmAction(title,message,label,action){$('confirm-title').textContent=title;$('confirm-message').textContent=message;$('confirm-ok').textContent=label;$('confirm-ok').onclick=()=>{$('confirm-dialog').close();action();};$('confirm-dialog').showModal();}
$('confirm-cancel').onclick=()=>$('confirm-dialog').close();
function removeSentence(i){
  const section=role(i),number=sectionNumber(state.roles,i);
  const remove=()=>{if(!removeSectionSentence(state,i))return;const remaining=indices(section);showSentence(remaining[Math.min(number-1,remaining.length-1)],true);};
  if(state.sentences[i].trim())confirmAction('Remove this sentence?','This sentence will be removed from your paragraph.','Remove sentence',remove);else remove();
}
$('sentence-list').addEventListener('click',event=>{
  const remove=event.target.closest('[data-remove]');if(remove){removeSentence(Number(remove.dataset.remove));return;}
  const issue=event.target.closest('[data-issue]');if(issue){pointToIssue(Number(issue.dataset.sentence),Number(issue.dataset.issue));return;}
  const keep=event.target.closest('[data-ignore]');if(keep){state.ignored.push(keep.dataset.ignore);save();refreshAnalysis();toast('Word kept for this draft.');}
});
$('starter-buttons').onclick=event=>{const button=event.target.closest('[data-starter]');if(!button)return;const input=inputFor(state.active);if(input.value.trim()){toast('The starter is a suggestion. Your existing sentence has been kept.');return;}input.value=button.dataset.starter;onInput(input);focusInput(state.active,true);input.setSelectionRange(input.value.length,input.value.length);};
function paragraphClick(event){const span=event.target.closest('[data-sentence]');if(!span)return;const sentence=Number(span.dataset.sentence);showSentence(sentence,true);if(span.dataset.paragraphIssue!==undefined)pointToIssue(sentence,Number(span.dataset.paragraphIssue));}
$('paragraph-text').onclick=paragraphClick;
$('paragraph-text').onkeydown=event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-paragraph-issue]')){event.preventDefault();paragraphClick(event);}};
$('topic').value=state.topic;$('topic').oninput=()=>{state.topic=$('topic').value;save();renderParagraph();};
function checkAll(){state.checked=true;refreshAnalysis();save();const blank=state.sentences.findIndex(s=>!s.trim());if(blank>=0){showSentence(blank,true);toast('Fill this sentence box or remove it if it is an extra box.');return;}const i=allIssues.findIndex(a=>a.length);if(i>=0){showSentence(i,true);pointToIssue(i,0);}else{$('paragraph-heading').scrollIntoView({behavior:motion(),block:'nearest'});toast('Your paragraph is ready to read and review.');}}
$('check-btn').onclick=checkAll;
$('copy-btn').onclick=async()=>{if(!complete())return;try{await navigator.clipboard.writeText(paragraph());toast('Paragraph copied!');}catch{const selection=window.getSelection(),range=document.createRange();range.selectNodeContents($('paragraph-text'));selection.removeAllRanges();selection.addRange(range);toast('Select and copy the highlighted paragraph using your device.');}};
$('download-btn').onclick=()=>{if(!complete())return;const blob=new Blob([(state.topic.trim()?state.topic.trim()+'\n\n':'')+paragraph()+'\n'],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='My_Paragraph.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Your paragraph has been downloaded.');};
$('print-btn').onclick=()=>{if(complete())window.print();};
function reset(){state=initial();$('topic').value='';analyse();tabs();renderEditor(true);renderParagraph();save();toast('A fresh page for your next idea.');}
$('reset-btn').onclick=()=>{if(state.sentences.some(s=>s.trim())||state.topic.trim())confirmAction('Start a new paragraph?','Your current draft will be cleared from this device. Copy or download it first if you want to keep it.','Start fresh',reset);else reset();};
function example(){state={...initial(),roles:defaultRoles(5),topic:'Safety in the workshop',sentences:['Safety is important in every workshop.','First, students must wear safety glasses to protect their eyes.','They should also keep their tools in the correct places.','In addition, a clean floor helps prevent accidents.','In conclusion, simple safety rules help everyone work safely.']};$('topic').value=state.topic;analyse();tabs();renderEditor();renderParagraph();save();toast('Example loaded. Explore Introduction, Body, and Conclusion.');}
$('example-btn').onclick=()=>{if(state.sentences.some(s=>s.trim())||state.topic.trim())confirmAction('Explore an example?','The example will replace your current draft. Copy or download your paragraph first if you want to keep it.','Load example',example);else example();};
function info(html){$('dialog-content').innerHTML=html;$('info-dialog').showModal();}
$('how-btn').onclick=()=>info('<h2>Three parts. One paragraph.</h2><ol><li><strong>Choose a topic.</strong> What is your paragraph about?</li><li><strong>Open a section.</strong> The three tabs are Introduction, Body, and Conclusion.</li><li><strong>Write one sentence in each box.</strong> Tap + Add sentence inside a section to place another box underneath. Your main tabs stay the same. Use the minus button to remove an extra box.</li><li><strong>Explore the red underlines.</strong> Tap an underline or a clue and make your own correction.</li><li><strong>Read it together.</strong> Sentences from all three sections join into one paragraph. Copy, download, or print when every box is filled.</li></ol><p>You can have up to 10 sentence boxes in each section. Drafts and the Sound on/off preference save in this browser on this device.</p>');
$('about-btn').onclick=()=>info('<h2>A guide for your next draft.</h2><p>The checker looks for spelling, capital letters, punctuation, repeated words, common subject–verb errors, some verb forms, articles, and some incomplete sentences. Tap a red underline to explore a clue.</p><p><strong>It cannot detect every error or judge your ideas.</strong> Some valid phrases, names, and specialist words may be flagged. Read your work aloud and ask your teacher about anything uncertain.</p><p>Spelling uses an English dictionary with common British variants. You can keep a flagged name or specialist word for this draft.</p><p><strong>Your writing stays in this browser.</strong> No external checking service is needed. On a shared device, use New paragraph when you finish.</p>');
document.querySelector('.dialog-close').onclick=()=>$('info-dialog').close();document.querySelector('.dialog-done').onclick=()=>$('info-dialog').close();
initClickSounds();analyse();tabs();renderEditor();renderParagraph();save();loadDictionary().then(refreshAnalysis);
