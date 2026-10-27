export const SECTION_NAMES = ['introduction', 'body', 'conclusion'];
export const SECTION_LIMIT = 10;
export function defaultRoles(length = 5) {
  return Array.from({length}, (_, i) => i === 0 ? 'introduction' : i === length - 1 ? 'conclusion' : 'body');
}
export function restoreRoles(sentences, roles) {
  if (!Array.isArray(roles) || roles.length !== sentences.length || !SECTION_NAMES.every(r=>roles.includes(r))) return defaultRoles(sentences.length);
  let previous = -1;
  for(const role of roles) {
    const position=SECTION_NAMES.indexOf(role);
    if(position<previous || position<0) return defaultRoles(sentences.length);
    previous=position;
  }
  return [...roles];
}
export function sectionNumber(roles, index) {
  return roles.slice(0,index+1).filter(r=>r===roles[index]).length;
}
export function addSectionSentence(state, section) {
  if (!SECTION_NAMES.includes(section) || state.roles.filter(r=>r===section).length>=SECTION_LIMIT) return -1;
  const index=state.roles.lastIndexOf(section)+1;
  state.sentences.splice(index,0,'');
  state.roles.splice(index,0,section);
  return index;
}
export function removeSectionSentence(state,index) {
  const section=state.roles[index];
  if (!section || state.roles.filter(r=>r===section).length<=1) return false;
  state.sentences.splice(index,1);
  state.roles.splice(index,1);
  return true;
}
