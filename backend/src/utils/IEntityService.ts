export interface IEntityService<T, C> {
    create(data: C): Promise<T>;
    getAll(): Promise<T[]>;
    getById(id: string): Promise<T | null>;
    update(id: string, data: Partial<C>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
}