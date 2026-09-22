import * as XLSX from 'xlsx';

// Month names lookup for custom date string formats like 22-Sep-2026
const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
};

const formatYMD = (year, month, day) => {
  const y = String(year).length === 2 ? `20${year}` : String(year);
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Parses diverse date values (Excel serial numbers, Date objects, string formats)
 * into a standard 'YYYY-MM-DD' string.
 */
export const parseExcelDate = (val) => {
  if (!val && val !== 0) return '';

  // 1. JS Date object (e.g. XLSX cellDates: true)
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return formatYMD(val.getFullYear(), val.getMonth() + 1, val.getDate());
  }

  // 2. Numeric Excel serial date (e.g. 46287)
  if (typeof val === 'number') {
    if (val > 0) {
      // Excel epoch begins Dec 30, 1899 due to 1900 leap-year quirk
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return formatYMD(date.getFullYear(), date.getMonth() + 1, date.getDate());
      }
    }
  }

  const str = String(val).trim();
  if (!str) return '';

  // 3. Format: 22-sep-2026 or 22/Sep/2026 or 22-Sep-26
  const ddMonYyyy = str.match(/^(\d{1,2})[-/\s.]([a-zA-Z]+)[-/\s.](\d{2,4})$/);
  if (ddMonYyyy) {
    const [, day, monStr, year] = ddMonYyyy;
    const mon = MONTH_MAP[monStr.toLowerCase()];
    if (mon) return formatYMD(year, mon, day);
  }

  // 4. Format: Sep-22-2026 or Sep 22, 2026
  const monDdYyyy = str.match(/^([a-zA-Z]+)[-/\s.](\d{1,2})[,/\s.]+(\d{2,4})$/);
  if (monDdYyyy) {
    const [, monStr, day, year] = monDdYyyy;
    const mon = MONTH_MAP[monStr.toLowerCase()];
    if (mon) return formatYMD(year, mon, day);
  }

  // 5. ISO Format: 2026-09-22
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return formatYMD(year, month, day);
  }

  // 6. European / Indian Format: 22-09-2026 or 22/09/2026
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (ddmmyyyyMatch) {
    const [, d, m, y] = ddmmyyyyMatch;
    // If month > 12, might be swapped
    if (parseInt(m, 10) <= 12) {
      return formatYMD(y, m, d);
    }
    return formatYMD(y, d, m);
  }

  // 7. General JS Date fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return formatYMD(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }

  return '';
};

/**
 * Downloads an Excel (.xlsx) template pre-configured with the required columns
 * and sample rows.
 */
export const downloadTaskTemplateExcel = (employees = []) => {
  const headers = [
    'Task name',
    'Due Date (eg 22-sep-2026)',
    'Employee',
    'Priority (Low,Medium,High)'
  ];

  const emp1 = employees[0]?.fullName || 'Amara Patel';
  const emp2 = employees[1]?.fullName || (employees[0]?.fullName || 'Liam Chen');
  const emp3 = employees[2]?.fullName || (employees[0]?.fullName || 'Noor Hassan');

  const rows = [
    headers,
    ['Design homepage layout & wireframes', '22-Sep-2026', emp1, 'High'],
    ['Develop responsive authentication views', '25-Sep-2026', emp2, 'Medium'],
    ['QA testing & documentation review', '28-Sep-2026', emp3, 'Low']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Set friendly column widths
  worksheet['!cols'] = [
    { wch: 42 }, // Task name
    { wch: 28 }, // Due Date (eg 22-sep-2026)
    { wch: 26 }, // Employee
    { wch: 28 }  // Priority (Low,Medium,High)
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');

  XLSX.writeFile(workbook, 'Project_Tasks_Template.xlsx');
};

/**
 * Matches employee names or emails from the excel cell to existing employees.
 * Supports single employee or multiple comma/semicolon-separated employees.
 */
export const matchEmployees = (cellValue, employees = []) => {
  if (!cellValue || typeof cellValue !== 'string') return { assigneeIds: [], assigneeId: '' };

  // Split by comma, semicolon, or slash for multiple assignees
  const rawParts = cellValue.split(/[,;/]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
  if (rawParts.length === 0) return { assigneeIds: [], assigneeId: '' };

  const matchedIds = [];

  for (const part of rawParts) {
    // 1. Exact match by full name or email
    const exact = employees.find(
      e => (e.fullName && e.fullName.trim().toLowerCase() === part) ||
           (e.email && e.email.trim().toLowerCase() === part)
    );
    if (exact && !matchedIds.includes(exact.id)) {
      matchedIds.push(exact.id);
      continue;
    }

    // 2. Partial match (name contains part, or part contains name)
    const partial = employees.find(
      e => (e.fullName && e.fullName.trim().toLowerCase().includes(part)) ||
           (part.includes(e.fullName ? e.fullName.trim().toLowerCase() : '---'))
    );
    if (partial && !matchedIds.includes(partial.id)) {
      matchedIds.push(partial.id);
    }
  }

  return {
    assigneeIds: matchedIds,
    assigneeId: matchedIds[0] || ''
  };
};

/**
 * Normalizes priority value to 'Low', 'Medium', or 'High'.
 */
export const normalizePriority = (val) => {
  if (!val) return 'Medium';
  const str = String(val).toLowerCase().trim();
  if (str.includes('high')) return 'High';
  if (str.includes('low')) return 'Low';
  return 'Medium';
};

/**
 * Parses an Excel or CSV file uploaded by the user, returning an array of valid task objects.
 */
export const parseTaskExcelFile = async (file, employees = [], defaultDueDate = '') => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('The uploaded file contains no sheets.');
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rows || rows.length === 0) {
          resolve({ tasks: [], count: 0, message: 'No rows found in the sheet.' });
          return;
        }

        const parsedTasks = [];

        rows.forEach((row, idx) => {
          // Find key for Task name
          const taskNameKey = Object.keys(row).find(k =>
            k.toLowerCase().trim() === 'task name' ||
            k.toLowerCase().trim() === 'task' ||
            k.toLowerCase().trim() === 'title' ||
            k.toLowerCase().trim() === 'name'
          );
          const taskName = taskNameKey ? String(row[taskNameKey]).trim() : '';

          // Skip completely empty rows
          if (!taskName) return;

          // Find key for Due Date
          const dueDateKey = Object.keys(row).find(k =>
            k.toLowerCase().includes('due date') ||
            k.toLowerCase().includes('deadline') ||
            k.toLowerCase().trim() === 'date'
          );
          const rawDueDate = dueDateKey ? row[dueDateKey] : '';
          const parsedDueDate = parseExcelDate(rawDueDate) || defaultDueDate;

          // Find key for Employee
          const employeeKey = Object.keys(row).find(k =>
            k.toLowerCase().trim() === 'employee' ||
            k.toLowerCase().includes('assignee') ||
            k.toLowerCase().includes('assigned to')
          );
          const rawEmployee = employeeKey ? String(row[employeeKey]).trim() : '';
          const { assigneeIds, assigneeId } = matchEmployees(rawEmployee, employees);

          // Find key for Priority
          const priorityKey = Object.keys(row).find(k =>
            k.toLowerCase().includes('priority')
          );
          const rawPriority = priorityKey ? row[priorityKey] : 'Medium';
          const priority = normalizePriority(rawPriority);

          parsedTasks.push({
            id: `temp_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
            name: taskName,
            dueDate: parsedDueDate,
            assigneeIds,
            assigneeId,
            priority,
            status: 'Not started',
            description: ''
          });
        });

        resolve({
          tasks: parsedTasks,
          count: parsedTasks.length
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsArrayBuffer(file);
  });
};
