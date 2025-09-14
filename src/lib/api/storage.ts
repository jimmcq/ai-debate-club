import { DebateState } from '@/lib/types/debate';

// In-memory storage for debates
// In production, this would be replaced with a proper database
class DebateStorage {
    private debates = new Map<string, DebateState>();

    set(id: string, debate: DebateState): void {
        this.debates.set(id, debate);
    }

    get(id: string): DebateState | undefined {
        return this.debates.get(id);
    }

    has(id: string): boolean {
        return this.debates.has(id);
    }

    delete(id: string): boolean {
        return this.debates.delete(id);
    }

    clear(): void {
        this.debates.clear();
    }

    size(): number {
        return this.debates.size;
    }
}

// Singleton instance
export const debateStorage = new DebateStorage();
