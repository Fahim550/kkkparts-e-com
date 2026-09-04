/**
 * Converts a number to its word representation.
 * Simplified version to handle standard invoice amounts up to millions.
 */
export function numberToWords(num: number): string {
  if (num === 0) return "Zero";

  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const inWords = (n: number): string => {
    let str = "";
    if (n > 999999) {
      str += inWords(Math.floor(n / 1000000)) + "Million ";
      n %= 1000000;
    }
    if (n > 999) {
      str += inWords(Math.floor(n / 1000)) + "Thousand ";
      n %= 1000;
    }
    if (n > 99) {
      str += a[Math.floor(n / 100)] + "Hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (str !== "") str += "and ";
      if (n < 20) str += a[n];
      else {
        str += b[Math.floor(n / 10)] + " ";
        if (n % 10 > 0) {
          str += a[n % 10];
        }
      }
    }
    return str;
  };

  const wholePart = Math.floor(num);
  const decimalPart = Math.round((num - wholePart) * 1000);
  
  let result = (wholePart === 0 ? "Zero " : inWords(wholePart)) + "Rials";
  
  if (decimalPart > 0) {
    result += ` and ${inWords(decimalPart)} Baisa`;
  }
  
  return result.trim() + " only";
}
