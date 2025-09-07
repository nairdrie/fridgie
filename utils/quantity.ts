// A simple regex to separate the number and the unit
const quantityRegex = /^(\d*\.?\d+)\s*(.*)$/;

export const parseQuantity = (quantityString: string | undefined | null): { quantity: number; unit: string } => {
    if (!quantityString) {
        return { quantity: 1, unit: 'ct' }; // Default to 1 count if no quantity is specified
    }
    const match = quantityString.trim().match(quantityRegex);
    if (match) {
        const quantity = parseFloat(match[1]);
        const unit = match[2].trim() || 'ct'; // Default to 'count' if no unit
        return { quantity, unit };
    }
    // If no number is found, assume the whole string is the unit and quantity is 1
    return { quantity: 1, unit: quantityString.trim() };
};

export const normalizeName = (name: string): string => {
    return name.trim().toLowerCase().replace(/s$/, '');
};
