export interface Vinyl {
  title: string;
  year: number;
}

export function describeVinyl(vinyl: Vinyl): string {
  return `${vinyl.title} (${String(vinyl.year)})`;
}

export function firstTitle(vinyls: readonly Vinyl[]): string | undefined {
  return vinyls[0]?.title;
}
