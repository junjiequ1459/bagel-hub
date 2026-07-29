export type BagelApp = {
  id: string;
  name: string;
  icon: string;
  description: string;
  url: string;
};

/**
 * Every entry becomes one launchable tile on the bagel.
 *
 * To add an app:
 * 1. Create its folder and index.html.
 * 2. Add its metadata here.
 */
export const apps: BagelApp[] = [
  {
    id: 'weather',
    name: 'Weather Deck',
    icon: '🌤️',
    description: 'Local weather station',
    url: '/apps/weather/index.html'
  }
];
