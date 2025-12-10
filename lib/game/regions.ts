// regions.ts - Regional groupings for targeted actions

export interface Region {
  id: string;
  name: string;
  states: string[];
  color: string;
}

export const regions: Region[] = [
  {
    id: 'west',
    name: 'West Coast',
    states: ['CA', 'OR', 'WA', 'HI', 'AK'],
    color: '#3b82f6', // blue
  },
  {
    id: 'southwest',
    name: 'Southwest',
    states: ['AZ', 'NM', 'TX', 'NV', 'UT', 'CO'],
    color: '#f59e0b', // amber
  },
  {
    id: 'midwest',
    name: 'Midwest',
    states: ['OH', 'MI', 'IN', 'IL', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
    color: '#22c55e', // green
  },
  {
    id: 'south',
    name: 'South',
    states: ['FL', 'GA', 'SC', 'NC', 'VA', 'WV', 'KY', 'TN', 'AL', 'MS', 'LA', 'AR', 'OK'],
    color: '#ef4444', // red
  },
  {
    id: 'northeast',
    name: 'Northeast',
    states: ['NY', 'PA', 'NJ', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME', 'MD', 'DE', 'DC'],
    color: '#a855f7', // purple
  },
  {
    id: 'mountain',
    name: 'Mountain',
    states: ['MT', 'WY', 'ID'],
    color: '#6366f1', // indigo
  },
];

// Get region for a state
export function getStateRegion(stateCode: string): Region | undefined {
  return regions.find(r => r.states.includes(stateCode));
}

// Get region by ID
export function getRegionById(regionId: string): Region | undefined {
  return regions.find(r => r.id === regionId);
}

// Calculate average support for a region
export function getRegionSupport(regionId: string, support: { [stateCode: string]: number }): number {
  const region = getRegionById(regionId);
  if (!region) return 0;

  const values = region.states.map(s => support[s] || 0);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

// Calculate support for all regions
export function getAllRegionSupport(support: { [stateCode: string]: number }): { [regionId: string]: number } {
  const result: { [regionId: string]: number } = {};
  regions.forEach(region => {
    result[region.id] = getRegionSupport(region.id, support);
  });
  return result;
}

// Get states that need the most attention (lowest support)
export function getWeakestStates(support: { [stateCode: string]: number }, count: number = 5): string[] {
  return Object.entries(support)
    .sort((a, b) => a[1] - b[1])
    .slice(0, count)
    .map(([code]) => code);
}

// Get states that are close to victory threshold
export function getAlmostWonStates(support: { [stateCode: string]: number }, threshold: number = 70): string[] {
  return Object.entries(support)
    .filter(([, value]) => value >= threshold && value < 80)
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => code);
}

// Swing states (historically competitive)
export const SWING_STATES = ['PA', 'MI', 'WI', 'AZ', 'GA', 'NC', 'FL', 'NV', 'NH'];

// Get swing state support
export function getSwingStateSupport(support: { [stateCode: string]: number }): number {
  const values = SWING_STATES.map(s => support[s] || 0);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}
