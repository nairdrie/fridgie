import convert from 'convert';

// A map to handle common abbreviations and variations
const unitSynonyms: { [key: string]: string } = {
  'g': 'g', 'gram': 'g', 'grams': 'g',
  'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
  'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
  'lb': 'lb', 'pound': 'lb', 'pounds': 'lb',
  'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml',
  'l': 'l', 'liter': 'l', 'liters': 'l',
  'tsp': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp',
  'tbsp': 'Tbs', 'tablespoon': 'Tbs', 'tablespoons': 'Tbs', // 'convert' library uses 'Tbs'
  'cup': 'cup', 'cups': 'cup',
  // Add more as needed
};

function parseQuantity(quantityStr?: string): { value: number; unit: string } | null {
    if (!quantityStr) return null;
    const match = quantityStr.trim().match(/^(\d*\.?\d+)\s*(.*)$/);
    if (!match) return null;

    const value = parseFloat(match[1]);
    const unitStr = match[2].trim().toLowerCase();
    const unit = unitSynonyms[unitStr] || unitStr;

    return { value, unit };
}


export function aggregateQuantities(quantities: (string | undefined)[]): string {
    const parsedQuantities = quantities.filter(Boolean).map(q => parseQuantity(q as string)).filter(Boolean) as { value: number; unit: string }[];
    if (parsedQuantities.length === 0) return '';

    try {
        // Attempt to convert all quantities to the unit of the first quantity
        const baseUnit = parsedQuantities[0].unit;
        const total = parsedQuantities.reduce((acc, q) => {
            return acc + convert(q.value, q.unit).to(baseUnit);
        }, 0);

        // Use 'best' to format the final result nicely
        const best = convert(total, baseUnit).to('best');
        return `${parseFloat(best.quantity.toFixed(2))} ${best.unit}`;

    } catch (e) {
        // If conversion fails (e.g., mixing mass and volume), fall back to the original logic
        const unitTotals = parsedQuantities.reduce((acc, q) => {
            const unitKey = q.unit.toLowerCase() || 'misc';
            acc[unitKey] = (acc[unitKey] || 0) + q.value;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(unitTotals)
            .map(([unit, value]) => `${parseFloat(value.toFixed(2))}${unit === 'misc' ? '' : ` ${unit}`}`)
            .join(' + ');
    }
}
