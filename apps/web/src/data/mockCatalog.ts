/**
 * TEMPORARY MOCK DATA — Phase 1 UI development only.
 *
 * This is a small, hand-written catalog used only to build and exercise the
 * browsing/search/selection UI. It is NOT the real application catalog
 * described in `docs/catalog.md` (that file is currently empty; the real
 * catalog is planned for a later phase). Entries deliberately carry no
 * installation metadata — no package names, no package-manager mappings, no
 * supported-distro lists — because that has not been verified against
 * official sources yet. Do not read anything here as "this app can be
 * installed on Linux via X"; it's display data only.
 */

export type Category =
  | 'Browsers'
  | 'Code Editors'
  | 'CLI Tools'
  | 'Development'
  | 'Utilities'
  | 'Media'
  | 'Communication';

export const CATEGORIES: Category[] = [
  'Browsers',
  'Code Editors',
  'CLI Tools',
  'Development',
  'Utilities',
  'Media',
  'Communication',
];

export interface MockApp {
  id: string;
  name: string;
  category: Category;
  description: string;
}

export const MOCK_CATALOG: MockApp[] = [
  { id: 'firefox', name: 'Firefox', category: 'Browsers', description: 'Free and open-source web browser from Mozilla.' },
  { id: 'chrome', name: 'Google Chrome', category: 'Browsers', description: 'Widely used web browser from Google.' },
  { id: 'brave', name: 'Brave', category: 'Browsers', description: 'Privacy-focused browser with built-in ad and tracker blocking.' },

  { id: 'vscode', name: 'VS Code', category: 'Code Editors', description: "Lightweight, extensible source code editor from Microsoft." },
  { id: 'cursor', name: 'Cursor', category: 'Code Editors', description: 'AI-assisted code editor built on VS Code.' },
  { id: 'zed', name: 'Zed', category: 'Code Editors', description: 'High-performance, multiplayer-capable code editor.' },

  { id: 'git', name: 'Git', category: 'CLI Tools', description: 'Distributed version control system.' },
  { id: 'docker', name: 'Docker', category: 'CLI Tools', description: 'Container runtime and tooling for building and running apps.' },
  { id: 'nodejs', name: 'Node.js', category: 'CLI Tools', description: "JavaScript runtime built on Chrome's V8 engine." },

  { id: 'insomnia', name: 'Insomnia', category: 'Development', description: 'API client for designing and testing HTTP and GraphQL APIs.' },
  { id: 'dbeaver', name: 'DBeaver', category: 'Development', description: 'Universal database tool for browsing and querying databases.' },

  { id: 'gnome-tweaks', name: 'GNOME Tweaks', category: 'Utilities', description: 'Adjust advanced GNOME desktop settings.' },
  { id: 'flameshot', name: 'Flameshot', category: 'Utilities', description: 'Screenshot tool with built-in annotation.' },

  { id: 'vlc', name: 'VLC', category: 'Media', description: 'Media player that plays almost any file, disc, or stream.' },
  { id: 'obs-studio', name: 'OBS Studio', category: 'Media', description: 'Free and open-source software for recording and streaming.' },

  { id: 'slack', name: 'Slack', category: 'Communication', description: 'Team messaging and collaboration app.' },
  { id: 'discord', name: 'Discord', category: 'Communication', description: 'Voice, video, and text chat for communities.' },
];
