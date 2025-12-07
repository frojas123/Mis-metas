export enum Category {
  TRAVEL = 'Viajes',
  VEHICLE = 'Vehículos',
  HOME = 'Hogar',
  GADGETS = 'Tecnología',
  PERSONAL = 'Personal',
  OTHER = 'Otros'
}

export enum Importance {
  HIGH = 'Alta',
  MEDIUM = 'Media',
  LOW = 'Baja'
}

export interface Wish {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  savedAmount: number;
  imageUrl: string; // Base64 or URL
  category: Category;
  importance?: Importance;
  createdAt: number;
  isCompleted: boolean;
  targetDate?: string; // YYYY-MM-DD
  actionPlan?: string; // AI generated plan
}

export type CreateWishParams = Omit<Wish, 'id' | 'createdAt' | 'isCompleted' | 'savedAmount' | 'imageUrl'> & {
  prompt: string; // Used for AI generation
};