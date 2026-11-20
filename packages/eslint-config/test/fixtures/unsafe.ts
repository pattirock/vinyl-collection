export function parse(value: any): unknown {
  return value;
}

export function first(items: number[]): number {
  return items[0]!;
}

export function buildMatcher(userInput: string): RegExp {
  return new RegExp(userInput);
}

export function log(message: string): void {
  console.log(message);
}

async function save(): Promise<void> {
  await Promise.resolve();
}

export function fireAndForget(): void {
  save();
}
