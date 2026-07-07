import { jsonrepair } from 'jsonrepair';
import { toast } from 'sonner';

export const copyToClipboard = (text: string, label: string) => {
  if (text === '[]') return;
  navigator.clipboard.writeText(text);
  toast.success(`Copied ${label} to clipboard!`);
};

export const parseLooseJSON = (str: string) => {
  let cleanStr = str.trim();
  
  // Extract JSON object or array if wrapped in conversational text or markdown
  const startArr = cleanStr.indexOf('[');
  const startObj = cleanStr.indexOf('{');
  let startIndex = -1;
  let isArray = false;
  
  if (startArr !== -1 && (startObj === -1 || startArr < startObj)) {
    startIndex = startArr;
    isArray = true;
  } else if (startObj !== -1) {
    startIndex = startObj;
  }

  if (startIndex !== -1) {
    const endChar = isArray ? ']' : '}';
    const endIndex = cleanStr.lastIndexOf(endChar);
    if (endIndex !== -1 && endIndex > startIndex) {
      cleanStr = cleanStr.substring(startIndex, endIndex + 1);
    }
  }
  
  cleanStr = cleanStr.trim();
  
  // Remove markdown code blocks if still present at the absolute start/end (just in case)
  if (cleanStr.startsWith('```json')) cleanStr = cleanStr.substring(7);
  else if (cleanStr.startsWith('```')) cleanStr = cleanStr.substring(3);
  if (cleanStr.endsWith('```')) cleanStr = cleanStr.slice(0, -3);
  cleanStr = cleanStr.trim();
  
  try {
    // First try direct JSON.parse
    return JSON.parse(cleanStr);
  } catch (e: any) {
    // If direct parse fails, try jsonrepair first as it's often smarter
    try {
      const repaired = jsonrepair(cleanStr);
      return JSON.parse(repaired);
    } catch (repairError: any) {
      // If simple repair fails, use the custom logic
      let fixedStr = '';
      try {
        let inString = false;
        let isKey = false;
        let expectValue = false;
        const stack: ('object' | 'array')[] = [];

        const getNextNonWhitespaceChar = (index: number): { char: string | null; pos: number } => {
          for (let i = index; i < cleanStr.length; i++) {
            const char = cleanStr[i];
            if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
              continue;
            }
            return { char, pos: i };
          }
          return { char: null, pos: cleanStr.length };
        };

        const checkNextKeyStart = (index: number): boolean => {
          let hasQuote = false;
          for (let i = index; i < cleanStr.length; i++) {
            const c = cleanStr[i];
            if (c === ' ' || c === '\t' || c === '\n' || c === '\r') continue;
            if (!hasQuote) {
              if (c === '"') {
                hasQuote = true;
              } else if (c === '}') {
                return true; // trailing comma followed by }
              } else {
                return false;
              }
            } else {
              if (c === '"') {
                const next = getNextNonWhitespaceChar(i + 1);
                return next.char === ':';
              }
            }
          }
          return false;
        };

        const isClosingQuote = (i: number, isKey: boolean, topStack: 'object' | 'array' | undefined): boolean => {
          const next = getNextNonWhitespaceChar(i + 1);
          if (next.char === null) return true; // End of string

          if (isKey) {
            // A closed key MUST be followed by ':'
            return next.char === ':';
          }

          if (topStack === 'object') {
            if (next.char === '}') return true;
            if (next.char === ',') {
              // Skip the comma and check if the next token is a key start
              return checkNextKeyStart(next.pos + 1);
            }
            return false;
          }

          if (topStack === 'array') {
            if (next.char === ']') return true;
            if (next.char === ',') {
              // Skip comma and check if the next token starts a valid JSON value or closing bracket
              const afterComma = getNextNonWhitespaceChar(next.pos + 1);
              if (afterComma.char === null) return false;
              const validStarts = ['"', '{', '[', ']', 't', 'f', 'n', '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
              return validStarts.includes(afterComma.char);
            }
            return false;
          }

          // Fallback if not in object/array
          return next.char === ',' || next.char === '}' || next.char === ']';
        };

        for (let i = 0; i < cleanStr.length; i++) {
          const char = cleanStr[i];

          if (inString && char === '\\') {
            const nextChar = cleanStr[i + 1];
            if (nextChar) {
              fixedStr += char + nextChar;
              i++;
              continue;
            }
          }

          if (char === '"') {
            if (!inString) {
              inString = true;
              const top = stack[stack.length - 1];
              if (top === 'object') {
                isKey = !expectValue;
              } else if (top === 'array') {
                isKey = false;
              } else {
                isKey = false;
              }
              fixedStr += char;
            } else {
              const top = stack[stack.length - 1];
              if (isClosingQuote(i, isKey, top)) {
                inString = false;
                isKey = false;
                expectValue = false;
                fixedStr += char;
              } else {
                // Unescaped quote
                fixedStr += '\\"';
              }
            }
            continue;
          }

          if (!inString) {
            if (char === '{') {
              stack.push('object');
              expectValue = false;
            } else if (char === '[') {
              stack.push('array');
              expectValue = false;
            } else if (char === '}') {
              if (stack[stack.length - 1] === 'object') stack.pop();
              expectValue = false;
            } else if (char === ']') {
              if (stack[stack.length - 1] === 'array') stack.pop();
              expectValue = false;
            } else if (char === ':') {
              expectValue = true;
            } else if (char === ',') {
              const top = stack[stack.length - 1];
              if (top === 'object') {
                expectValue = false;
              } else if (top === 'array') {
                expectValue = true;
              }
            }
            fixedStr += char;
          } else {
            if (char === '\n') {
              fixedStr += '\\n';
            } else if (char === '\r') {
              // skip
            } else if (char === '\t') {
              fixedStr += '\\t';
            } else {
              fixedStr += char;
            }
          }
        }

        const repairedFinal = jsonrepair(fixedStr);
        return JSON.parse(repairedFinal);
      } catch (retryError: any) {
        // Provide detailed error info
        let context = '';
        const match = retryError.message.match(/at position (\d+)/) || e.message.match(/at position (\d+)/);
        if (match && match[1]) {
          const pos = parseInt(match[1], 10);
          const sourceStr = retryError.message.match(/at position/) ? fixedStr : cleanStr;
          const start = Math.max(0, pos - 120);
          const end = Math.min(sourceStr.length, pos + 120);
          const errorChar = sourceStr.charAt(pos);
          
          const rawSnippet = sourceStr.substring(start, end);
          context = `\n\nError at position ${pos} (char '${errorChar}')\nContext around error:\n...${rawSnippet}...`;
        }
        
        console.error("JSON repair failed. Original error:", e);
        console.error("Retry error:", retryError);
        console.error("fixedStr:", fixedStr);
        
        throw new Error(`${retryError.message || e.message}${context}`);
      }
    }
  }
};
