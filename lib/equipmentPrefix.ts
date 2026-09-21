// lib/equipmentPrefix.ts

export interface TemplateWithPrefix {
  id: number;
  equipment_prefix?: string;
  schema?: any;
  [key: string]: any;
}

/**
 * Extracts the equipment prefix code from a full equipment number or name.
 * Examples: 
 *   "AHU-M1" -> "AHU"
 *   "AHU-AHU1" -> "AHU"
 *   "PUMP-SP1-2" -> "PUMP"
 *   "SOLAR-01" -> "SOLAR"
 */
export function extractEquipmentPrefix(codeOrName: string): string {
  if (!codeOrName) return '';
  
  const cleanStr = codeOrName.trim().toUpperCase();
  
  // Split by standard delimiters like hyphen (-), underscore (_), or space
  const parts = cleanStr.split(/[-_ ]+/);
  
  if (parts.length > 0 && parts[0]) {
    return parts[0];
  }
  
  return cleanStr;
}

/**
 * Matches an equipment item's prefix against available template prefixes.
 * Returns the matching template or null if no match is found.
 */
export function matchTemplateByPrefix(
  equipmentCode: string,
  templates: TemplateWithPrefix[]
): TemplateWithPrefix | null {
  const prefix = extractEquipmentPrefix(equipmentCode);
  if (!prefix || !templates || templates.length === 0) return null;

  return (
    templates.find(
      (t) => t.equipment_prefix && t.equipment_prefix.toUpperCase() === prefix
    ) || null
  );
}