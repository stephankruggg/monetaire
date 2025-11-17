/**
 * Installment detection utility
 * Extracts vendor name, current installment, and total installments from expense titles
 */

export interface InstallmentInfo {
  vendor: string;
  current: number;
  total: number;
}

/**
 * Detects installment patterns in expense titles
 *
 * Supported patterns:
 * - "Amazon Parcela 2/10"
 * - "Netflix 2/10"
 * - "Spotify 2 de 10"
 * - "Magazine Luiza Parc 3/12"
 *
 * @param title - The expense title to analyze
 * @returns InstallmentInfo if pattern detected, null otherwise
 */
export function detectInstallment(title: string): InstallmentInfo | null {
  if (!title || title.trim().length === 0) {
    return null;
  }

  // Normalize whitespace
  const normalized = title.trim().replace(/\s+/g, ' ');

  // Regex patterns for installment detection
  // Pattern 1: "N/M" format (e.g., "2/10")
  // Pattern 2: "N de M" format (e.g., "2 de 10", case insensitive)
  // We also handle optional "Parcela" or "Parc" keywords

  const patterns = [
    // Pattern: "Parcela N/M" or "Parc N/M" or just "N/M"
    /(?:parcela|parc)?\s*(\d+)\s*\/\s*(\d+)/i,
    // Pattern: "N de M" or "N DE M"
    /(\d+)\s+de\s+(\d+)/i,
  ];

  let matchResult: RegExpMatchArray | null = null;
  let matchedPattern: RegExp | null = null;

  // Find the first matching pattern
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      matchResult = match;
      matchedPattern = pattern;
      break;
    }
  }

  if (!matchResult) {
    return null;
  }

  const current = parseInt(matchResult[1], 10);
  const total = parseInt(matchResult[2], 10);

  // Validate installment numbers
  if (
    isNaN(current) ||
    isNaN(total) ||
    current <= 0 ||
    total <= 0 ||
    current > total
  ) {
    return null;
  }

  // Extract vendor name by removing the installment pattern and everything after it
  const installmentPattern = matchResult[0];
  const patternIndex = normalized.indexOf(installmentPattern);

  // Get text before the pattern as potential vendor
  let beforePattern = normalized.substring(0, patternIndex).trim();
  // Get text after the pattern as potential vendor
  let afterPattern = normalized.substring(patternIndex + installmentPattern.length).trim();

  // Remove common keywords from both parts
  beforePattern = beforePattern.replace(/\b(parcela|parc)\b/gi, '').trim().replace(/\s+/g, ' ');
  afterPattern = afterPattern.replace(/\b(parcela|parc)\b/gi, '').trim().replace(/\s+/g, ' ');

  // Prioritize the longer/more meaningful part as vendor
  // If before pattern exists and is substantial, use it
  // Otherwise use after pattern
  let vendor = beforePattern.length > 0 ? beforePattern : afterPattern;

  // If both exist, prefer the before pattern (more common case)
  // But if before is very short and after is longer, use after
  if (beforePattern.length > 0 && afterPattern.length > beforePattern.length) {
    // Check if the after pattern doesn't contain another installment pattern
    const hasAnotherPattern = patterns.some(p => p.test(afterPattern));
    if (!hasAnotherPattern) {
      vendor = afterPattern;
    }
  }

  // If vendor is empty, return null
  if (vendor.length === 0) {
    return null;
  }

  return {
    vendor,
    current,
    total,
  };
}
