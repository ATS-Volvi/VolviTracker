import * as XLSX from 'xlsx';

/**
 * Normalizes varied date string formats (e.g. 18-Nov-2026, Nov 18 2026, 18/11/2026, 2026-11-18) into YYYY-MM-DD.
 */
export function parseDateToYmd(dateStr) {
  if (!dateStr) return '';
  const clean = String(dateStr).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  const monthMap = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  // DD-MMM-YYYY or DD MMM YYYY (e.g. 18-Nov-2026, 18 Nov 2026)
  const dMmmY = clean.match(/^(\d{1,2})[-/\s]([A-Za-z]{3,9})[-/\s](\d{4})$/);
  if (dMmmY) {
    const day = dMmmY[1].padStart(2, '0');
    const mStr = dMmmY[2].slice(0, 3).toLowerCase();
    const month = monthMap[mStr] || '01';
    return `${dMmmY[3]}-${month}-${day}`;
  }

  // MMM DD, YYYY (e.g. Nov 18, 2026 or November 18 2026)
  const mmmDY = clean.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (mmmDY) {
    const day = mmmDY[2].padStart(2, '0');
    const mStr = mmmDY[1].slice(0, 3).toLowerCase();
    const month = monthMap[mStr] || '01';
    return `${mmmDY[3]}-${month}-${day}`;
  }

  // DD/MM/YYYY or MM/DD/YYYY
  const dmy = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) {
    let d = parseInt(dmy[1], 10);
    let m = parseInt(dmy[2], 10);
    const y = dmy[3];
    if (m > 12 && d <= 12) {
      [d, m] = [m, d];
    }
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    try {
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }
  return '';
}

/**
 * Extracts text from PDF bytes via stream decompression & text token extraction.
 */
async function extractTextFromPdfBuffer(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const binaryString = new TextDecoder('latin1').decode(bytes);
  let accumulatedText = '';

  // 1. Direct visible strings in PDF (BT ... ET blocks, or literal strings `(...) Tj` or `(...) '`)
  const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
  let match;
  while ((match = tjRegex.exec(binaryString)) !== null) {
    accumulatedText += match[1] + ' ';
  }

  // 2. Bracket array strings `[(Part1) 10 (Part2)] TJ`
  const arrayTjRegex = /\[([^\]]+)\]\s*TJ/g;
  while ((match = arrayTjRegex.exec(binaryString)) !== null) {
    const subStrMatches = match[1].matchAll(/\(([^)]+)\)/g);
    for (const sub of subStrMatches) {
      accumulatedText += sub[1] + ' ';
    }
  }

  // 3. Decompress FlateDecode streams if browser supports DecompressionStream
  if (typeof DecompressionStream !== 'undefined') {
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let streamMatch;
    let streamCount = 0;
    while ((streamMatch = streamRegex.exec(binaryString)) !== null && streamCount < 15) {
      streamCount++;
      const rawStream = streamMatch[1];
      try {
        const streamBytes = new Uint8Array(rawStream.length);
        for (let i = 0; i < rawStream.length; i++) {
          streamBytes[i] = rawStream.charCodeAt(i) & 0xff;
        }

        const ds = new DecompressionStream('deflate');
        const writer = ds.writable.getWriter();
        writer.write(streamBytes);
        writer.close();

        const response = new Response(ds.readable);
        const decompressed = await response.text();
        if (decompressed && decompressed.length > 0) {
          // Extract text tokens from decompressed stream
          let subM;
          const subTj = /\(([^)]+)\)\s*(?:Tj|'|")/g;
          while ((subM = subTj.exec(decompressed)) !== null) {
            accumulatedText += subM[1] + ' ';
          }
          accumulatedText += ' ' + decompressed + ' ';
        }
      } catch {
        // Stream may not be deflate or was encrypted; continue gracefully
      }
    }
  }

  return accumulatedText;
}

/**
 * Extracts plain text from Excel files (.xlsx, .xls, .csv).
 */
function extractTextFromExcelBuffer(arrayBuffer) {
  try {
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    let text = '';
    wb.SheetNames.forEach(name => {
      const sheet = wb.Sheets[name];
      if (sheet) {
        text += XLSX.utils.sheet_to_csv(sheet) + '\n';
      }
    });
    return text;
  } catch (err) {
    console.warn('XLSX extraction error:', err);
    return '';
  }
}

/**
 * Extracts plain text from Word document (.docx) bytes.
 */
function extractTextFromDocxBuffer(arrayBuffer) {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const binaryString = new TextDecoder('latin1').decode(bytes);
    let text = '';
    const tagRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
    let match;
    while ((match = tagRegex.exec(binaryString)) !== null) {
      text += match[1] + ' ';
    }
    return text;
  } catch {
    return '';
  }
}

/**
 * Extracts raw textual content from any attached file.
 */
export async function extractTextFromFile(file) {
  if (!file) return '';
  const name = (file.name || '').toLowerCase();

  try {
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      return extractTextFromExcelBuffer(buffer);
    }
    if (name.endsWith('.pdf')) {
      const buffer = await file.arrayBuffer();
      return await extractTextFromPdfBuffer(buffer);
    }
    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      const buffer = await file.arrayBuffer();
      return extractTextFromDocxBuffer(buffer);
    }
    if (file.type?.startsWith('text/') || name.endsWith('.csv') || name.endsWith('.txt') || name.endsWith('.json') || name.endsWith('.md')) {
      return await file.text();
    }
    // Fallback: read bytes as text string
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch (err) {
    console.warn('File read error:', err);
    return '';
  }
}

/**
 * Intelligent invoice semantic parser that matches invoice fields against document text and context lists.
 */
export function extractInvoiceData(rawText, filename = '', contextData = {}) {
  const text = (rawText || '') + '\n' + (filename || '');
  const result = {};
  const extractedKeys = [];

  const {
    clientsList = [],
    projectsList = [],
    clientPosList = [],
    availableLocations = []
  } = contextData;

  // 1. Currency
  const curMatch = text.match(/\b(USD|AED|SAR|INR|EUR|GBP)\b/i);
  if (curMatch) {
    result.currency = curMatch[1].toUpperCase();
    extractedKeys.push('currency');
  } else if (text.includes('$')) {
    result.currency = 'USD';
    extractedKeys.push('currency');
  } else if (text.includes('AED') || text.includes('Dhs')) {
    result.currency = 'AED';
    extractedKeys.push('currency');
  } else if (text.includes('SAR')) {
    result.currency = 'SAR';
    extractedKeys.push('currency');
  } else if (text.includes('€')) {
    result.currency = 'EUR';
    extractedKeys.push('currency');
  } else if (text.includes('£')) {
    result.currency = 'GBP';
    extractedKeys.push('currency');
  } else if (text.includes('₹')) {
    result.currency = 'INR';
    extractedKeys.push('currency');
  }

  // 2. Invoice Number
  const invMatch =
    text.match(/(?:invoice|inv|facture|tax\s*invoice)[ \t]*(?:number|no|num|#)?[ \t]*[:#\-][ \t]*([A-Z0-9\-_/]+)/i) ||
    text.match(/\b(VOL-(?:EXP|DOM|IMP)-INV-[A-Z0-9\-_]+)\b/i) ||
    text.match(/\b(INV-[A-Z0-9\-_]+)\b/i) ||
    filename.match(/\b(INV[-_0-9A-Za-z]+)\b/i);

  if (invMatch) {
    const val = (invMatch[1] || '').trim();
    if (val.length >= 3 && !/^(date|total|to|for|number|no|details)$/i.test(val)) {
      result.invoiceNumber = val;
      extractedKeys.push('invoiceNumber');
    }
  }

  // 3. Client PO Number / Linked PO
  // Match known POs first
  const knownPo = clientPosList.find(p => p.poNumber && text.toLowerCase().includes(p.poNumber.toLowerCase()));
  if (knownPo) {
    result.selectedClientPoId = knownPo.id || knownPo.poNumber;
    result.poNumber = knownPo.poNumber;
    if (knownPo.clientName) result.clientName = knownPo.clientName;
    if (knownPo.totalValueNative) result.poValue = knownPo.totalValueNative;
    if (knownPo.poDate) result.poDate = knownPo.poDate;
    if (knownPo.linkedProject) result.selectedProject = knownPo.linkedProject;
    extractedKeys.push('selectedClientPoId');
  } else {
    const poMatch =
      text.match(/(?:client\s*po|purchase\s*order|po\s*number|po\s*#|linked\s*po|customer\s*po|p\.o\.)[ \t]*(?:number|no|num|#)?[ \t]*[:#\-][ \t]*([A-Z0-9\-_/]+)/i) ||
      text.match(/\b(VOL-CPO-[A-Z0-9\-_]+)\b/i) ||
      text.match(/\b(PO-[A-Z0-9\-_]+)\b/i);

    if (poMatch) {
      const val = (poMatch[1] || '').trim();
      if (val.length >= 3 && !/^(date|total|amount|value|to)$/i.test(val)) {
        result.poNumber = val;
        extractedKeys.push('poNumber');
      }
    }
  }

  // 4. Invoicing Date
  const dateMatch = text.match(
    /(?:invoice\s*date|issue\s*date|billing\s*date|invoice\s*dated|dated)[ \t]*[:#\-][ \t]*([0-9]{1,2}[-/\s][A-Za-z]{3,9}[-/\s][0-9]{2,4}|[A-Za-z]{3,9}[-/\s][0-9]{1,2},?[-/\s][0-9]{2,4}|[0-9]{1,4}[-/.][0-9]{1,2}[-/.][0-9]{1,4})/i
  );
  if (dateMatch) {
    const parsed = parseDateToYmd(dateMatch[1]);
    if (parsed) {
      result.invoicingDate = parsed;
      extractedKeys.push('invoicingDate');
    }
  }

  // 5. PO Date
  const poDateMatch = text.match(
    /(?:po\s*date|order\s*date)[ \t]*[:#\-][ \t]*([0-9]{1,2}[-/\s][A-Za-z]{3,9}[-/\s][0-9]{2,4}|[A-Za-z]{3,9}[-/\s][0-9]{1,2},?[-/\s][0-9]{2,4}|[0-9]{1,4}[-/.][0-9]{1,2}[-/.][0-9]{1,4})/i
  );
  if (poDateMatch) {
    const parsed = parseDateToYmd(poDateMatch[1]);
    if (parsed) {
      result.poDate = parsed;
      extractedKeys.push('poDate');
    }
  }

  // 6. Payment Terms (Net days)
  const termsMatch = text.match(/(?:payment\s*terms?|terms?)[ \t]*[:#\-][ \t]*(?:net\s*)?(\d{1,3})\s*(?:days)?/i);
  if (termsMatch) {
    const days = parseInt(termsMatch[1], 10);
    if (!isNaN(days) && days > 0) {
      result.paymentTermDays = days;
      extractedKeys.push('paymentTermDays');
    }
  }

  // 7. Total Amount / Invoice Value
  const totalMatches = [
    text.match(/(?:total\s*amount\s*due|invoice\s*total|total\s*due|grand\s*total|balance\s*due|amount\s*due|net\s*total)[ \t]*[:#\-][ \t]*[$€£₹AED\s]*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i),
    text.match(/(?:total|amount)[ \t]*[:#\-][ \t]*[$€£₹AED\s]*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i),
    text.match(/(?:subtotal|sub-total)[ \t]*[:#\-][ \t]*[$€£₹AED\s]*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i)
  ];
  const foundTotal = totalMatches.find(Boolean);
  if (foundTotal) {
    const cleanNum = parseFloat(foundTotal[1].replace(/,/g, ''));
    if (!isNaN(cleanNum) && cleanNum > 0) {
      result.invoiceValue = cleanNum;
      result.invoiceValueTax = cleanNum;
      extractedKeys.push('invoiceValue');
    }
  }

  // 8. PO Value
  if (!result.poValue) {
    const poValMatch = text.match(
      /(?:po\s*amount|po\s*value|purchase\s*order\s*amount)[ \t]*[:#\-][ \t]*[$€£₹AED\s]*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i
    );
    if (poValMatch) {
      const cleanNum = parseFloat(poValMatch[1].replace(/,/g, ''));
      if (!isNaN(cleanNum) && cleanNum > 0) {
        result.poValue = cleanNum;
        extractedKeys.push('poValue');
      }
    }
  }

  // 9. Client Name
  if (!result.clientName) {
    const matchedClient = clientsList.find(c => {
      const name = (c.name || '').toLowerCase();
      const comp = (c.company || '').toLowerCase();
      return (name && name.length >= 3 && text.toLowerCase().includes(name)) ||
             (comp && comp.length >= 3 && text.toLowerCase().includes(comp));
    });
    if (matchedClient) {
      result.clientName = matchedClient.name;
      if (matchedClient.country) result.clientLocation = matchedClient.country;
      extractedKeys.push('clientName');
    } else {
      const billToMatch = text.match(/(?:billed?\s*to|client(?:\s*name)?|customer(?:\s*name)?|invoiced\s*to)[ \t]*[:#\-][ \t]*([^\n\r,]+)/i);
      if (billToMatch) {
        const line = billToMatch[1].trim();
        if (line.length >= 2 && !/^(address|email|phone|date|invoice)$/i.test(line)) {
          result.clientName = line;
          extractedKeys.push('clientName');
        }
      }
    }
  }

  // 10. Project Name / Code match
  if (!result.selectedProject) {
    const matchedProj = projectsList.find(p => {
      const pName = (p.projectName || p.name || '').toLowerCase();
      const pCode = (p.projectCode || '').toLowerCase();
      return (pCode && pCode.length >= 3 && text.toLowerCase().includes(pCode)) ||
             (pName && pName.length >= 4 && text.toLowerCase().includes(pName));
    });
    if (matchedProj) {
      result.selectedProject = matchedProj.projectCode || matchedProj.name || matchedProj.id;
      extractedKeys.push('selectedProject');
    }
  }

  // 11. Client Location match
  if (!result.clientLocation) {
    const matchedLoc = availableLocations.find(loc => {
      const label = (loc.label || loc.value || '').toLowerCase();
      return label && label.length >= 4 && text.toLowerCase().includes(label);
    });
    if (matchedLoc) {
      result.clientLocation = matchedLoc.value || matchedLoc.label;
      extractedKeys.push('clientLocation');
    }
  }

  // 12. Import / Export Classification
  if (/export|cross-border|international|overseas/i.test(text)) {
    result.importExport = 'Export';
    extractedKeys.push('importExport');
  } else if (/domestic|local|in-country/i.test(text)) {
    result.importExport = 'Domestic';
    extractedKeys.push('importExport');
  }

  // 13. Milestone / Deliverable
  const msMatch = text.match(/(?:milestone|deliverable|scope\s*of\s*work)[ \t]*[:#\-][ \t]*([^\n\r]+)/i);
  if (msMatch) {
    const val = msMatch[1].trim();
    if (val.length >= 3) {
      result.milestonesText = val;
      extractedKeys.push('milestonesText');
    }
  }

  // 14. Notes
  const notesMatch = text.match(/(?:notes?|remarks?|payment\s*instructions?)[ \t]*[:#\-][ \t]*([^\n\r]+)/i);
  if (notesMatch) {
    result.notes = notesMatch[1].trim();
    extractedKeys.push('notes');
  }

  return {
    extracted: result,
    extractedKeys,
    extractedCount: extractedKeys.length,
    sourceFileName: filename
  };
}

/**
 * High-level helper: extracts text from file and parses structured invoice data.
 */
export async function extractInvoiceFromFile(file, contextData = {}) {
  if (!file) return null;
  const rawText = await extractTextFromFile(file);
  return extractInvoiceData(rawText, file.name, contextData);
}
