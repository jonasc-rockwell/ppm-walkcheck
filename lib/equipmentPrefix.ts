// lib/equipmentPrefix.ts

export interface TemplateWithPrefix {
  id: number;
  equipment_prefix?: string;
  title?: string;
  schema?: any;
  [key: string]: any;
}

/**
 * Extracts the lead equipment prefix from a code or string.
 * Examples:
 *   "AHU-M1"      -> "AHU"
 *   "AHU_01"      -> "AHU"
 *   "PUMP-SP1-2"  -> "PUMP"
 *   "SOLAR-01"    -> "SOLAR"
 */
export function extractEquipmentPrefix(codeOrName: string): string {
  if (!codeOrName) return '';
  
  const cleanStr = codeOrName.trim().toUpperCase();
  const parts = cleanStr.split(/[-_ ]+/);
  
  if (parts.length > 0 && parts[0]) {
    return parts[0];
  }
  
  return cleanStr;
}

/**
 * Strictly matches an equipment item's code against active template prefix rules.
 * 
 * Rules:
 * - Equipment code MUST strictly start with the template prefix.
 * - E.g. Equipment "AHU-M1" matches template prefix "AHU".
 * - Equipment "PUMP-01" will NOT match template prefix "AHU".
 * - Returns null if no rule exists yet for that prefix.
 */
export function matchTemplateByPrefix(
  equipmentCode: string,
  templates: TemplateWithPrefix[]
): TemplateWithPrefix | null {
  if (!equipmentCode || !templates || templates.length === 0) return null;

  const cleanCode = equipmentCode.trim().toUpperCase();
  const extractedPrefix = extractEquipmentPrefix(cleanCode);

  if (!extractedPrefix) return null;

  // 1. Exact match on extracted prefix (e.g. extractedPrefix "AHU" === template.equipment_prefix "AHU")
  const exactMatch = templates.find((t) => {
    const tPrefix = (t.equipment_prefix || '').trim().toUpperCase();
    return tPrefix !== '' && tPrefix !== 'GENERAL' && tPrefix === extractedPrefix;
  });

  if (exactMatch) return exactMatch;

  // 2. Fallback prefix check (starts with "AHU-", "AHU_", or "AHU ")
  const startsWithMatch = templates.find((t) => {
    const tPrefix = (t.equipment_prefix || '').trim().toUpperCase();
    if (!tPrefix || tPrefix === 'GENERAL') return false;

    return (
      cleanCode.startsWith(`${tPrefix}-`) ||
      cleanCode.startsWith(`${tPrefix}_`) ||
      cleanCode.startsWith(`${tPrefix} `)
    );
  });

  return startsWithMatch || null;
}