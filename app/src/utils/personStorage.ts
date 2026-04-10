import type { Person } from '../types/person';
import { fileStorage } from './fileStorage';

const STORAGE_KEY = 'persons.json';

export const personStorage = {
  async getAll(): Promise<Person[]> {
    return fileStorage.read<Person>(STORAGE_KEY);
  },

  async save(persons: Person[]): Promise<boolean> {
    return fileStorage.write(STORAGE_KEY, persons);
  },

  async add(person: Omit<Person, 'id' | 'createdAt'>): Promise<Person> {
    const persons = await this.getAll();
    const newPerson: Person = {
      ...person,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    persons.push(newPerson);
    await this.save(persons);
    return newPerson;
  },

  async update(id: string, updates: Partial<Omit<Person, 'id' | 'createdAt'>>): Promise<Person | null> {
    const persons = await this.getAll();
    const index = persons.findIndex(p => p.id === id);
    if (index === -1) return null;
    persons[index] = { ...persons[index], ...updates };
    await this.save(persons);
    return persons[index];
  },

  async delete(id: string): Promise<boolean> {
    const persons = await this.getAll();
    const filtered = persons.filter(p => p.id !== id);
    if (filtered.length === persons.length) return false;
    await this.save(filtered);
    return true;
  },
};
