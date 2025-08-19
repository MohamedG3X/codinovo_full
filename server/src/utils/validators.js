export function isValidPhone(num){
  // Very simple check: digits only, 8-15 length (adjust for your markets)
  return typeof num === 'string' && /^[0-9]{8,15}$/.test(num);
}
