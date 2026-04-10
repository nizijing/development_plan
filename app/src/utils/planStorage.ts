import type { TrainingPlan } from '../types/plan';
import { fileStorage } from './fileStorage';

const STORAGE_KEY = 'training_plans.json';

export const planStorage = {
  async getAll(): Promise<TrainingPlan[]> {
    return fileStorage.read<TrainingPlan>(STORAGE_KEY);
  },

  async save(plans: TrainingPlan[]): Promise<boolean> {
    return fileStorage.write(STORAGE_KEY, plans);
  },

  async add(plan: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrainingPlan> {
    const plans = await this.getAll();
    const now = Date.now();
    const newPlan: TrainingPlan = {
      ...plan,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    plans.push(newPlan);
    await this.save(plans);
    return newPlan;
  },

  async update(id: string, updates: Partial<Omit<TrainingPlan, 'id' | 'createdAt'>>): Promise<TrainingPlan | null> {
    const plans = await this.getAll();
    const index = plans.findIndex(p => p.id === id);
    if (index === -1) return null;
    plans[index] = { 
      ...plans[index], 
      ...updates, 
      updatedAt: Date.now() 
    };
    await this.save(plans);
    return plans[index];
  },

  async delete(id: string): Promise<boolean> {
    const plans = await this.getAll();
    const filtered = plans.filter(p => p.id !== id);
    if (filtered.length === plans.length) return false;
    await this.save(filtered);
    return true;
  },
};
