const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  return [TENS[Math.floor(n / 10)], ONES[n % 10]].filter(Boolean).join(' ');
}

function threeDigits(n) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  return [hundred ? `${ONES[hundred]} Hundred` : '', twoDigits(rest)].filter(Boolean).join(' ');
}

export function numberToWordsIndian(value) {
  let n = Math.round(Math.abs(Number(value) || 0));
  if (n === 0) return 'Zero';

  const crore = Math.floor(n / 1e7);
  n %= 1e7;
  const lac = Math.floor(n / 1e5);
  n %= 1e5;
  const thousand = Math.floor(n / 1e3);
  n %= 1e3;
  const remainder = n;

  const parts = [
    crore ? `${threeDigits(crore)} Crore` : '',
    lac ? `${twoDigits(lac)} Lac` : '',
    thousand ? `${twoDigits(thousand)} Thousand` : '',
    remainder ? threeDigits(remainder) : '',
  ].filter(Boolean);

  return parts.join(' ');
}

export function amountInWords(value, currencyWord = 'Taka') {
  return `${numberToWordsIndian(value)} ${currencyWord} Only`;
}
