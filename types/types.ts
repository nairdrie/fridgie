export type Item = {
    id: string;
    text: string;
    checked: boolean;
    listOrder: string; 
    mealOrder?: string; 
    isSection: boolean; 
    mealId?: string;
    quantity?: string;
    isManuallyAdded?: boolean;
  };
  
export type List = {
    id: string; // Firestore document ID
    weekStart:string;
    hasContent?: boolean;
    items: Item[];
    meals: Meal[];
    // New field to store user-defined quantities for aggregated items
    userDefinedQuantities?: { [itemName: string]: { quantity: number; unit: string } };
    mutations?: { [itemId: string]: { ignored?: boolean } };
};

export type AggregatedItem = {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    items: Item[]; // The original items that were aggregated
    checked: boolean; // Represents the checked state of the aggregated item
};

// types/types.ts
export interface Group {
  id: string;
  name: string;
  members: UserProfile[]
}

export interface Meal {
  id: string;
  listId: string;
  dayOfWeek?: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  name: string;
  recipeId?: string;
  addedToCookbook?: boolean; 
}

export enum ListView {
  GroceryList = 'list',
  MealPlan = 'plan'
}

export interface UserProfile {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  displayName?: string | null;
  // Add other properties from your user document here
}

export interface MealPreferences {
  dietaryNeeds?: string[];
  cookingStyles?: string[];
  cuisines?: string[];
  dislikedIngredients?: string;
  query?: string;
}

export interface Ingredient {
  name: string;
  quantity: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  photoURL?: string;
  ingredients: Ingredient [];
  instructions: string[];
}