export class GenericStringStorage {
  private readonly prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  private key(k: string): string {
    return `${this.prefix}:${k}`;
  }

  async getItem(k: string): Promise<string | null> {
    if (typeof window === "undefined" || !window.localStorage) return null;
    try {
      return window.localStorage.getItem(this.key(k));
    } catch {
      return null;
    }
  }

  async setItem(k: string, value: string): Promise<void> {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      window.localStorage.setItem(this.key(k), value);
    } catch {
      // ignore
    }
  }
}


