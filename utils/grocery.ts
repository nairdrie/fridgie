// Import the convert function AND the Unit type from the library
import convert, { Unit } from 'convert';

// A map to handle common abbreviations and variations
const unitSynonyms: { [key: string]: string } = {
  'g': 'g', 'gram': 'g', 'grams': 'g',
  'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
  'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
  'lb': 'lb', 'pound': 'lb', 'pounds': 'lb',
  'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml',
  'l': 'l', 'liter': 'l', 'liters': 'l',
  'tsp': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp',
  'Tbs': 'Tbs', 'tbsp': 'Tbs', 'tablespoon': 'Tbs', 'tablespoons': 'Tbs',
  'cup': 'cup', 'cups': 'cup',
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
        // Assert the type of the unit string to 'Unit'
        const baseUnit = parsedQuantities[0].unit as Unit;

        const total = parsedQuantities.reduce((acc, q) => {
            // Assert the unit here as well before passing it to the library
            const fromUnit = q.unit as Unit;
            return acc + convert(q.value, fromUnit).to(baseUnit);
        }, 0);

        // This part remains the same
        const best = convert(total, baseUnit).to('best');
        // Make sure to handle potential floating point inaccuracies gracefully
        const finalQuantity = parseFloat(best.quantity.toFixed(2));
        return `${finalQuantity} ${best.unit}`;

    } catch (e) {
        // Fallback logic remains the same
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