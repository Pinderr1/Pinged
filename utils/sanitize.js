export function sanitizeText(text) {
  if (!text) return '';
  let clean = text.toString();
  // remove html tags
  clean = clean.replace(/<[^>]*>?/g, '');
  // remove common injection characters
  clean = clean.replace(/[\$%{}<>]/g, '');
  // basic profanity filter
  const badWords = ['fuck', 'shit', 'bitch', 'asshole', 'dick'];
  const regex = new RegExp(`\\b(${badWords.join('|')})\\b`, 'gi');
  clean = clean.replace(regex, '');
  // collapse repeated characters
  clean = clean.replace(/(.)\1{3,}/g, '$1$1$1');
  return clean.trim();
}
