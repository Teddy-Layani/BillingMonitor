// utils/sapDateFormatter.js

/**
 * Parse SAP OData date format /Date(timestamp)/ to JavaScript Date object
 * @param {string} sapDateString - SAP date string in format /Date(1234567890000)/
 * @returns {Date|null} JavaScript Date object or null if invalid
 * @example
 * parseSapDate('/Date(1609459200000)/') // Returns Date object for 2021-01-01
 */
export function parseSapDate(sapDateString) {
  if (!sapDateString || typeof sapDateString !== 'string') {
    return null;
  }

  try {
    const timestamp = parseInt(
      sapDateString.replace('/Date(', '').replace(')/', '')
    );
    
    if (isNaN(timestamp)) {
      return null;
    }
    
    return new Date(timestamp);
  } catch (error) {
    console.error('Error parsing SAP date:', sapDateString, error);
    return null;
  }
}

/**
 * Format SAP OData date string to localized date string
 * @param {string} sapDateString - SAP date string in format /Date(timestamp)/
 * @param {string} locale - Locale string (default: 'he-IL')
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string or '-' if invalid
 * @example
 * formatSapDate('/Date(1609459200000)/', 'he-IL') // Returns '01.01.2021'
 */
export function formatSapDate(sapDateString, locale = 'he-IL', options = {}) {
  const date = parseSapDate(sapDateString);
  
  if (!date) {
    return '-';
  }
  
  try {
    return date.toLocaleDateString(locale, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * Format SAP date with custom format
 * @param {string} sapDateString - SAP date string
 * @param {Object} formatOptions - Format options
 * @param {string} formatOptions.locale - Locale (default: 'he-IL')
 * @param {boolean} formatOptions.includeTime - Include time (default: false)
 * @param {string} formatOptions.separator - Date separator (default: '.')
 * @returns {string} Formatted date string
 */
export function formatSapDateCustom(sapDateString, formatOptions = {}) {
  const {
    locale = 'he-IL',
    includeTime = false,
    separator = '.'
  } = formatOptions;
  
  const date = parseSapDate(sapDateString);
  
  if (!date) {
    return '-';
  }
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  let formatted = `${day}${separator}${month}${separator}${year}`;
  
  if (includeTime) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    formatted += ` ${hours}:${minutes}`;
  }
  
  return formatted;
}

/**
 * Check if SAP date string is valid
 * @param {string} sapDateString - SAP date string
 * @returns {boolean} True if valid SAP date format
 */
export function isValidSapDate(sapDateString) {
  return parseSapDate(sapDateString) !== null;
}

/**
 * Get relative time description (e.g., "2 days ago", "in 3 hours")
 * @param {string} sapDateString - SAP date string
 * @param {string} locale - Locale string (default: 'he-IL')
 * @returns {string} Relative time description
 */
export function getRelativeTime(sapDateString, locale = 'he-IL') {
  const date = parseSapDate(sapDateString);
  
  if (!date) {
    return '-';
  }
  
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (locale === 'he-IL') {
    if (diffDays > 0) return `לפני ${diffDays} ימים`;
    if (diffHours > 0) return `לפני ${diffHours} שעות`;
    if (diffMinutes > 0) return `לפני ${diffMinutes} דקות`;
    return 'כעת';
  } else {
    if (diffDays > 0) return `${diffDays} days ago`;
    if (diffHours > 0) return `${diffHours} hours ago`;
    if (diffMinutes > 0) return `${diffMinutes} minutes ago`;
    return 'now';
  }
}

/**
 * Convert JavaScript Date to SAP OData format
 * @param {Date} date - JavaScript Date object
 * @returns {string} SAP date string in format /Date(timestamp)/
 * @example
 * toSapDate(new Date('2021-01-01')) // Returns '/Date(1609459200000)/'
 */
export function toSapDate(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date object');
  }

  return `/Date(${date.getTime()})/`;
}

/**
 * Format SAP time string (HHMMSS or PT##H##M##S) to readable format HH:MM
 * @param {string} sapTimeString - SAP time string in format HHMMSS or PT##H##M##S
 * @returns {string} Formatted time string HH:MM or '-' if invalid
 * @example
 * formatSapTime('143052') // Returns '14:30'
 * formatSapTime('PT14H30M52S') // Returns '14:30'
 */
export function formatSapTime(sapTimeString) {
  if (!sapTimeString || typeof sapTimeString !== 'string') {
    return '-';
  }

  try {
    // Handle PT##H##M##S format (ISO 8601 duration)
    if (sapTimeString.startsWith('PT')) {
      const match = sapTimeString.match(/PT(\d+)H(\d+)M(\d+)S/);
      if (match) {
        const hours = match[1].padStart(2, '0');
        const minutes = match[2].padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    }

    // Handle HHMMSS format
    if (sapTimeString.length === 6 && /^\d{6}$/.test(sapTimeString)) {
      const hours = sapTimeString.substring(0, 2);
      const minutes = sapTimeString.substring(2, 4);
      return `${hours}:${minutes}`;
    }

    // Handle HH:MM:SS format (already formatted)
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(sapTimeString)) {
      return sapTimeString.substring(0, 5);
    }

    return sapTimeString;
  } catch (error) {
    console.error('Error formatting SAP time:', sapTimeString, error);
    return '-';
  }
}