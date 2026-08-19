export class Optional<T> {
  private readonly value: T | undefined;

  private constructor(value: T | undefined) {
    if (new.target !== Optional) {
      throw new Error("Optional cannot be inherited");
    }
    this.value = value;
  }

  static empty<T>(): Optional<T> {
    return new Optional<T>(undefined);
  }

  static of<T>(value: T): Optional<T> {
    if (value === null || value === undefined) {
      throw new Error("Cannot call Optional.of() with null or undefined");
    }
    return new Optional<T>(value);
  }

  static ofNullable<T>(value: T | null | undefined): Optional<T> {
    return value === null || value === undefined
      ? Optional.empty()
      : new Optional<T>(value);
  }

  isPresent(): boolean {
    return this.value !== undefined;
  }

  isEmpty(): boolean {
    return this.value === undefined;
  }

  get(): T {
    if (this.isEmpty()) {
      throw new Error("No value present");
    }
    return this.value as T;
  }

  orElse(other: T): T {
    return this.isPresent() ? (this.value as T) : other;
  }

  orElseGet(supplier: () => T): T {
    return this.isPresent() ? (this.value as T) : supplier();
  }

  orElseThrow(error: () => Error): T {
    if (this.isEmpty()) {
      throw error();
    }
    return this.value as T;
  }

  map<U>(mapper: (value: T) => U): Optional<U> {
    return this.isEmpty() ? Optional.empty() : Optional.ofNullable(mapper(this.value as T));
  }

  flatMap<U>(mapper: (value: T) => Optional<U>): Optional<U> {
    return this.isEmpty() ? Optional.empty() : mapper(this.value as T);
  }

  filter(predicate: (value: T) => boolean): Optional<T> {
    if (this.isEmpty()) {
      return this;
    }
    return predicate(this.value as T) ? this : Optional.empty();
  }
}