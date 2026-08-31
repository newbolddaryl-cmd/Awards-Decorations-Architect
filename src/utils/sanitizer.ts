export interface SensitiveScanResult {
  hasSensitiveData: boolean;
  type: 'CLASSIFIED_MARKINGS' | 'SSN' | 'DOD_ID' | 'PHI' | 'FINANCIAL' | 'NONE';
  description: string;
}

/**
 * Scans input text for prohibited sensitive information.
 * Notice: We NEVER repeat the sensitive text back in user-facing warnings.
 */
export function scanForSensitiveData(text: string): SensitiveScanResult {
  if (!text || text.trim() === '') {
    return { hasSensitiveData: false, type: 'NONE', description: '' };
  }

  // Check classified / CUI markings
  const classifiedRegex = /\b(TOP SECRET|SECRET|CONFIDENTIAL|CUI|CONTROLLED UNCLASSIFIED|FOUO|FOR OFFICIAL USE ONLY|NOFORN|SCI|TK|HCS|ORCON)\b/i;
  if (classifiedRegex.test(text)) {
    return {
      hasSensitiveData: true,
      type: 'CLASSIFIED_MARKINGS',
      description: 'Potential classified markings or CUI/FOUO identifiers detected.',
    };
  }

  // Check SSN format (e.g. 000-00-0000 or continuous 9 digits where likely an SSN)
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/;
  if (ssnRegex.test(text)) {
    return {
      hasSensitiveData: true,
      type: 'SSN',
      description: 'Potential Social Security Number (SSN) detected.',
    };
  }

  // Check DoD ID format (explicit "DOD ID: 1234567890" or "EDIPI")
  const dodIdRegex = /\b(DOD\s*ID|EDIPI)\s*[:#]?\s*\d{10}\b/i;
  if (dodIdRegex.test(text)) {
    return {
      hasSensitiveData: true,
      type: 'DOD_ID',
      description: 'Potential 10-digit DoD ID / EDIPI detected.',
    };
  }

  // Check PHI / Medical info
  const phiRegex = /\b(HIPAA|DIAGNOSED WITH|PRESCRIPTION FOR|MEDICAL RECORD NUMBER|PATIENT MRN)\b/i;
  if (phiRegex.test(text)) {
    return {
      hasSensitiveData: true,
      type: 'PHI',
      description: 'Potential Protected Health Information (PHI) detected.',
    };
  }

  // Check credit card / banking data
  const financialRegex = /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b|\b(ROUTING NUMBER|BANK ACCOUNT)\s*[:#]?\s*\d+/i;
  if (financialRegex.test(text)) {
    return {
      hasSensitiveData: true,
      type: 'FINANCIAL',
      description: 'Potential credit card or personal banking account number detected.',
    };
  }

  return { hasSensitiveData: false, type: 'NONE', description: '' };
}
