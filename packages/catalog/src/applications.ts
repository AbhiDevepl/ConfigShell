import type { Application } from './types.ts';

/**
 * The verified application catalog.
 *
 * Every identifier below was checked against an authoritative source: the
 * distribution's own package database (packages.ubuntu.com,
 * packages.fedoraproject.org, archlinux.org/packages), Flathub, the Snap Store,
 * or the vendor's own install documentation.
 *
 * A method that could not be confirmed is simply absent. Absence means "not
 * verified", never "not installable" — several applications genuinely have no
 * route on some distributions, and inventing one would be worse than omitting
 * it. Notable examples of deliberate omissions:
 *
 * - VLC has no `dnf` entry: it is not in Fedora's own repositories (codec
 *   licensing), and RPM Fusion is a third-party repo.
 * - Chrome, Brave, Cursor, Sublime Text, Postman, Slack and Zoom have no
 *   `pacman` entry: they are AUR-only, and the AUR is not an official repo.
 * - Ubuntu is missing from Firefox's and Chromium's distro `apt` entries: on
 *   current Ubuntu those archive packages are transitional stubs that install
 *   the snap, not real debs.
 */
export const APPLICATIONS: readonly Application[] = [
  // ---------------------------------------------------------------- Browsers
  {
    id: 'firefox',
    name: 'Firefox',
    description: 'Open-source web browser from Mozilla.',
    category: 'Browsers',
    homepage: 'https://www.mozilla.org/firefox/',
    installation: [
      { method: 'apt', identifier: 'firefox-esr', origin: 'distro', distros: ['Debian'] },
      {
        method: 'apt',
        identifier: 'firefox',
        origin: 'vendor',
        distros: ['Ubuntu', 'Debian'],
        url: 'https://support.mozilla.org/kb/install-firefox-linux',
      },
      { method: 'dnf', identifier: 'firefox', origin: 'distro', distros: ['Fedora'] },
      { method: 'pacman', identifier: 'firefox', origin: 'distro', distros: ['Arch Linux'] },
      { method: 'flatpak', identifier: 'org.mozilla.firefox', origin: 'vendor' },
      { method: 'snap', identifier: 'firefox', origin: 'vendor' },
    ],
  },
  {
    id: 'google-chrome',
    name: 'Google Chrome',
    description: "Google's proprietary web browser, built on Chromium.",
    category: 'Browsers',
    homepage: 'https://www.google.com/chrome/',
    installation: [
      {
        method: 'apt',
        identifier: 'google-chrome-stable',
        origin: 'vendor',
        distros: ['Ubuntu', 'Debian'],
      },
      {
        method: 'dnf',
        identifier: 'google-chrome-stable',
        origin: 'vendor',
        distros: ['Fedora'],
      },
      { method: 'flatpak', identifier: 'com.google.Chrome', origin: 'community' },
    ],
  },
  {
    id: 'brave',
    name: 'Brave',
    description: 'Chromium-based browser with built-in ad and tracker blocking.',
    category: 'Browsers',
    homepage: 'https://brave.com/',
    installation: [
      {
        method: 'apt',
        identifier: 'brave-browser',
        origin: 'vendor',
        distros: ['Ubuntu', 'Debian'],
        url: 'https://brave.com/linux/',
      },
      {
        method: 'dnf',
        identifier: 'brave-browser',
        origin: 'vendor',
        distros: ['Fedora'],
        url: 'https://brave.com/linux/',
      },
      { method: 'flatpak', identifier: 'com.brave.Browser', origin: 'community' },
      { method: 'snap', identifier: 'brave', origin: 'vendor' },
    ],
  },
  {
    id: 'chromium',
    name: 'Chromium',
    description: 'Open-source browser project that Chrome is built from.',
    category: 'Browsers',
    homepage: 'https://www.chromium.org/chromium-projects/',
    installation: [
      { method: 'apt', identifier: 'chromium', origin: 'distro', distros: ['Debian'] },
      { method: 'dnf', identifier: 'chromium', origin: 'distro', distros: ['Fedora'] },
      { method: 'pacman', identifier: 'chromium', origin: 'distro', distros: ['Arch Linux'] },
      { method: 'flatpak', identifier: 'org.chromium.Chromium', origin: 'community' },
      { method: 'snap', identifier: 'chromium', origin: 'distro' },
    ],
  },

  // ------------------------------------------------------------ Code Editors
  {
    id: 'vscode',
    name: 'Visual Studio Code',
    description: 'Extensible source code editor from Microsoft.',
    category: 'Code Editors',
    homepage: 'https://code.visualstudio.com/',
    installation: [
      {
        method: 'apt',
        identifier: 'code',
        origin: 'vendor',
        distros: ['Ubuntu', 'Debian'],
        url: 'https://code.visualstudio.com/docs/setup/linux',
      },
      {
        method: 'dnf',
        identifier: 'code',
        origin: 'vendor',
        distros: ['Fedora'],
        url: 'https://code.visualstudio.com/docs/setup/linux',
      },
      { method: 'pacman', identifier: 'code', origin: 'distro', distros: ['Arch Linux'] },
      { method: 'flatpak', identifier: 'com.visualstudio.code', origin: 'community' },
      { method: 'snap', identifier: 'code', origin: 'vendor' },
    ],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'AI-assisted code editor built on Visual Studio Code.',
    category: 'Code Editors',
    homepage: 'https://cursor.com/',
    installation: [
      {
        method: 'official',
        identifier: 'cursor',
        origin: 'vendor',
        url: 'https://cursor.com/',
      },
    ],
  },
  {
    id: 'zed',
    name: 'Zed',
    description: 'High-performance, collaborative code editor.',
    category: 'Code Editors',
    homepage: 'https://zed.dev/',
    installation: [
      { method: 'pacman', identifier: 'zed', origin: 'distro', distros: ['Arch Linux'] },
      { method: 'flatpak', identifier: 'dev.zed.Zed', origin: 'community' },
    ],
  },
  {
    id: 'sublime-text',
    name: 'Sublime Text',
    description: 'Proprietary text editor known for its speed.',
    category: 'Code Editors',
    homepage: 'https://www.sublimetext.com/',
    installation: [
      {
        method: 'apt',
        identifier: 'sublime-text',
        origin: 'vendor',
        distros: ['Ubuntu', 'Debian'],
        url: 'https://www.sublimetext.com/docs/linux_repositories.html',
      },
      {
        method: 'dnf',
        identifier: 'sublime-text',
        origin: 'vendor',
        distros: ['Fedora'],
        url: 'https://www.sublimetext.com/docs/linux_repositories.html',
      },
      { method: 'flatpak', identifier: 'com.sublimehq.SublimeText', origin: 'community' },
      { method: 'snap', identifier: 'sublime-text', origin: 'community' },
    ],
  },

  // --------------------------------------------------------------- CLI Tools
  {
    id: 'git',
    name: 'Git',
    description: 'Distributed version control system.',
    category: 'CLI Tools',
    homepage: 'https://git-scm.com/',
    installation: [
      { method: 'apt', identifier: 'git', origin: 'distro', distros: ['Ubuntu', 'Debian'] },
      { method: 'dnf', identifier: 'git', origin: 'distro', distros: ['Fedora'] },
      { method: 'pacman', identifier: 'git', origin: 'distro', distros: ['Arch Linux'] },
    ],
  },
  {
    id: 'docker',
    name: 'Docker',
    description: 'Container runtime and tooling for building and running applications.',
    category: 'CLI Tools',
    homepage: 'https://www.docker.com/',
    installation: [
      {
        method: 'apt',
        identifier: 'docker-ce',
        origin: 'vendor',
        distros: ['Ubuntu', 'Debian'],
        url: 'https://docs.docker.com/engine/install/',
      },
      { method: 'apt', identifier: 'docker.io', origin: 'distro', distros: ['Ubuntu', 'Debian'] },
      {
        method: 'dnf',
        identifier: 'docker-ce',
        origin: 'vendor',
        distros: ['Fedora'],
        url: 'https://docs.docker.com/engine/install/fedora/',
      },
      { method: 'pacman', identifier: 'docker', origin: 'distro', distros: ['Arch Linux'] },
      { method: 'snap', identifier: 'docker', origin: 'community' },
    ],
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    description: "JavaScript runtime built on Chrome's V8 engine.",
    category: 'CLI Tools',
    homepage: 'https://nodejs.org/',
    installation: [
      { method: 'apt', identifier: 'nodejs', origin: 'distro', distros: ['Ubuntu', 'Debian'] },
      { method: 'dnf', identifier: 'nodejs', origin: 'distro', distros: ['Fedora'] },
      { method: 'pacman', identifier: 'nodejs', origin: 'distro', distros: ['Arch Linux'] },
      { method: 'snap', identifier: 'node', origin: 'vendor' },
    ],
  },
  {
    id: 'curl',
    name: 'curl',
    description: 'Command-line tool for transferring data over network protocols.',
    category: 'CLI Tools',
    homepage: 'https://curl.se/',
    installation: [
      { method: 'apt', identifier: 'curl', origin: 'distro', distros: ['Ubuntu', 'Debian'] },
      { method: 'dnf', identifier: 'curl', origin: 'distro', distros: ['Fedora'] },
      { method: 'pacman', identifier: 'curl', origin: 'distro', distros: ['Arch Linux'] },
    ],
  },
  {
    id: 'htop',
    name: 'htop',
    description: 'Interactive process viewer for the terminal.',
    category: 'CLI Tools',
    homepage: 'https://htop.dev/',
    installation: [
      { method: 'apt', identifier: 'htop', origin: 'distro', distros: ['Ubuntu', 'Debian'] },
      { method: 'dnf', identifier: 'htop', origin: 'distro', distros: ['Fedora'] },
      { method: 'pacman', identifier: 'htop', origin: 'distro', distros: ['Arch Linux'] },
    ],
  },
  {
    id: 'neovim',
    name: 'Neovim',
    description: 'Terminal-based text editor, a refactored fork of Vim.',
    category: 'CLI Tools',
    homepage: 'https://neovim.io/',
    installation: [
      { method: 'apt', identifier: 'neovim', origin: 'distro', distros: ['Ubuntu', 'Debian'] },
      { method: 'dnf', identifier: 'neovim', origin: 'distro', distros: ['Fedora'] },
      { method: 'pacman', identifier: 'neovim', origin: 'distro', distros: ['Arch Linux'] },
      { method: 'flatpak', identifier: 'io.neovim.nvim', origin: 'community' },
      { method: 'snap', identifier: 'nvim', origin: 'community' },
    ],
  },

  // ------------------------------------------------------------- Development
  {
    id: 'insomnia',
    name: 'Insomnia',
    description: 'API client for designing and testing HTTP and GraphQL APIs.',
    category: 'Development',
    homepage: 'https://insomnia.rest/',
    installation: [
      {
        method: 'apt',
        identifier: 'insomnia',
        origin: 'vendor',
        distros: ['Ubuntu', 'Debian'],
        url: 'https://docs.insomnia.rest/insomnia/install',
      },
      { method: 'flatpak', identifier: 'rest.insomnia.Insomnia', origin: 'community' },
      { method: 'snap', identifier: 'insomnia', origin: 'vendor' },
    ],
  },
  {
    id: 'dbeaver',
    name: 'DBeaver Community',
    description: 'Universal database tool for browsing and querying databases.',
    category: 'Development',
    homepage: 'https://dbeaver.io/',
    installation: [
      {
        method: 'apt',
        identifier: 'dbeaver-ce',
        origin: 'vendor',
        distros: ['Ubuntu', 'Debian'],
        url: 'https://dbeaver.io/download/',
      },
      { method: 'pacman', identifier: 'dbeaver', origin: 'distro', distros: ['Arch Linux'] },
      { method: 'flatpak', identifier: 'io.dbeaver.DBeaverCommunity', origin: 'community' },
      { method: 'snap', identifier: 'dbeaver-ce', origin: 'vendor' },
    ],
  },
  {
    id: 'postman',
    name: 'Postman',
    description: 'Collaborative platform for building and testing APIs.',
    category: 'Development',
    homepage: 'https://www.postman.com/',
    installation: [
      { method: 'flatpak', identifier: 'com.getpostman.Postman', origin: 'community' },
      { method: 'snap', identifier: 'postman', origin: 'vendor' },
    ],
  },
  {
    id: 'github-cli',
    name: 'GitHub CLI',
    description: "Command-line interface for GitHub's pull requests, issues, and releases.",
    category: 'Development',
    homepage: 'https://cli.github.com/',
    installation: [
      {
        method: 'apt',
        identifier: 'gh',
        origin: 'vendor',
        distros: ['Ubuntu', 'Debian'],
        url: 'https://github.com/cli/cli/blob/trunk/docs/install_linux.md',
      },
      { method: 'dnf', identifier: 'gh', origin: 'distro', distros: ['Fedora'] },
      { method: 'pacman', identifier: 'github-cli', origin: 'distro', distros: ['Arch Linux'] },
    ],
  },

  // --------------------------------------------------------------- Utilities
  {
    id: 'gnome-tweaks',
    name: 'GNOME Tweaks',
    description: 'Adjust advanced GNOME desktop settings.',
    category: 'Utilities',
    homepage: 'https://gitlab.gnome.org/GNOME/gnome-tweaks',
    installation: [
      {
        method: 'apt',
        identifier: 'gnome-tweaks',
        origin: 'distro',
        distros: ['Ubuntu', 'Debian'],
      },
      { method: 'dnf', identifier: 'gnome-tweaks', origin: 'distro', distros: ['Fedora'] },
      { method: 'pacman', identifier: 'gnome-tweaks', origin: 'distro', distros: ['Arch Linux'] },
    ],
  },
  {
    id: 'flameshot',
    name: 'Flameshot',
    description: 'Screenshot tool with built-in annotation.',
    category: 'Utilities',
    homepage: 'https://flameshot.org/',
    installation: [
      { method: 'apt', identifier: 'flameshot', origin: 'distro', distros: ['Ubuntu', 'Debian'] },
      { method: 'dnf', identifier: 'flameshot', origin: 'distro', distros: ['Fedora'] },
      { method: 'pacman', identifier: 'flameshot', origin: 'distro', distros: ['Arch Linux'] },
      { method: 'flatpak', identifier: 'org.flameshot.Flameshot', origin: 'vendor' },
      { method: 'snap', identifier: 'flameshot', origin: 'community' },
    ],
  },
  {
    id: 'timeshift',
    name: 'Timeshift',
    description: 'System restore tool that creates filesystem snapshots.',
    category: 'Utilities',
    homepage: 'https://github.com/linuxmint/timeshift',
    installation: [
      { method: 'apt', identifier: 'timeshift', origin: 'distro', distros: ['Ubuntu', 'Debian'] },
      { method: 'dnf', identifier: 'timeshift', origin: 'distro', distros: ['Fedora'] },
      { method: 'pacman', identifier: 'timeshift', origin: 'distro', distros: ['Arch Linux'] },
    ],
  },
  {
    id: 'gparted',
    name: 'GParted',
    description: 'Graphical partition editor for managing disk partitions.',
    category: 'Utilities',
    homepage: 'https://gparted.org/',
    installation: [
      { method: 'apt', identifier: 'gparted', origin: 'distro', distros: ['Ubuntu', 'Debian'] },
      { method: 'dnf', identifier: 'gparted', origin: 'distro', distros: ['Fedora'] },
      { method: 'pacman', identifier: 'gparted', origin: 'distro', distros: ['Arch Linux'] },
    ],
  },

  // ------------------------------------------------------------------- Media
  {
    id: 'vlc',
    name: 'VLC',
    description: 'Media player that plays most files, discs, and streams.',
    category: 'Media',
    homepage: 'https://www.videolan.org/vlc/',
    installation: [
      { method: 'apt', identifier: 'vlc', origin: 'distro', distros: ['Ubuntu', 'Debian'] },
      { method: 'pacman', identifier: 'vlc', origin: 'distro', distros: ['Arch Linux'] },
      { method: 'flatpak', identifier: 'org.videolan.VLC', origin: 'community' },
      { method: 'snap', identifier: 'vlc', origin: 'vendor' },
    ],
  },
  {
    id: 'obs-studio',
    name: 'OBS Studio',
    description: 'Open-source software for video recording and live streaming.',
    category: 'Media',
    homepage: 'https://obsproject.com/',
    installation: [
      { method: 'apt', identifier: 'obs-studio', origin: 'distro', distros: ['Ubuntu'] },
      { method: 'dnf', identifier: 'obs-studio', origin: 'distro', distros: ['Fedora'] },
      { method: 'pacman', identifier: 'obs-studio', origin: 'distro', distros: ['Arch Linux'] },
      { method: 'flatpak', identifier: 'com.obsproject.Studio', origin: 'vendor' },
    ],
  },
  {
    id: 'audacity',
    name: 'Audacity',
    description: 'Multi-track audio editor and recorder.',
    category: 'Media',
    homepage: 'https://www.audacityteam.org/',
    installation: [
      { method: 'apt', identifier: 'audacity', origin: 'distro', distros: ['Ubuntu', 'Debian'] },
      { method: 'dnf', identifier: 'audacity', origin: 'distro', distros: ['Fedora'] },
      { method: 'pacman', identifier: 'audacity', origin: 'distro', distros: ['Arch Linux'] },
      { method: 'flatpak', identifier: 'org.audacityteam.Audacity', origin: 'community' },
      { method: 'snap', identifier: 'audacity', origin: 'community' },
    ],
  },
  {
    id: 'gimp',
    name: 'GIMP',
    description: 'Raster image editor for photo retouching and graphic design.',
    category: 'Media',
    homepage: 'https://www.gimp.org/',
    installation: [
      { method: 'apt', identifier: 'gimp', origin: 'distro', distros: ['Ubuntu', 'Debian'] },
      { method: 'dnf', identifier: 'gimp', origin: 'distro', distros: ['Fedora'] },
      { method: 'pacman', identifier: 'gimp', origin: 'distro', distros: ['Arch Linux'] },
      { method: 'flatpak', identifier: 'org.gimp.GIMP', origin: 'vendor' },
      { method: 'snap', identifier: 'gimp', origin: 'vendor' },
    ],
  },

  // ----------------------------------------------------------- Communication
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team messaging and collaboration app.',
    category: 'Communication',
    homepage: 'https://slack.com/',
    installation: [
      {
        method: 'apt',
        identifier: 'slack-desktop',
        origin: 'vendor',
        distros: ['Ubuntu', 'Debian'],
        url: 'https://slack.com/downloads/linux',
      },
      {
        method: 'dnf',
        identifier: 'slack',
        origin: 'vendor',
        distros: ['Fedora'],
        url: 'https://slack.com/downloads/linux',
      },
      { method: 'flatpak', identifier: 'com.slack.Slack', origin: 'community' },
      { method: 'snap', identifier: 'slack', origin: 'vendor' },
    ],
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Voice, video, and text chat for communities.',
    category: 'Communication',
    homepage: 'https://discord.com/',
    installation: [
      { method: 'pacman', identifier: 'discord', origin: 'distro', distros: ['Arch Linux'] },
      { method: 'flatpak', identifier: 'com.discordapp.Discord', origin: 'community' },
      { method: 'snap', identifier: 'discord', origin: 'community' },
    ],
  },
  {
    id: 'telegram-desktop',
    name: 'Telegram Desktop',
    description: 'Desktop client for the Telegram messaging service.',
    category: 'Communication',
    homepage: 'https://desktop.telegram.org/',
    installation: [
      {
        method: 'apt',
        identifier: 'telegram-desktop',
        origin: 'distro',
        distros: ['Ubuntu', 'Debian'],
      },
      {
        method: 'pacman',
        identifier: 'telegram-desktop',
        origin: 'distro',
        distros: ['Arch Linux'],
      },
      { method: 'flatpak', identifier: 'org.telegram.desktop', origin: 'vendor' },
      { method: 'snap', identifier: 'telegram-desktop', origin: 'vendor' },
    ],
  },
  {
    id: 'thunderbird',
    name: 'Thunderbird',
    description: 'Email, calendar, and chat client from Mozilla.',
    category: 'Communication',
    homepage: 'https://www.thunderbird.net/',
    installation: [
      {
        method: 'apt',
        identifier: 'thunderbird',
        origin: 'distro',
        distros: ['Ubuntu', 'Debian'],
      },
      { method: 'dnf', identifier: 'thunderbird', origin: 'distro', distros: ['Fedora'] },
      { method: 'pacman', identifier: 'thunderbird', origin: 'distro', distros: ['Arch Linux'] },
      { method: 'flatpak', identifier: 'org.mozilla.thunderbird', origin: 'vendor' },
      { method: 'snap', identifier: 'thunderbird', origin: 'vendor' },
    ],
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Video conferencing and online meeting client.',
    category: 'Communication',
    homepage: 'https://zoom.us/',
    installation: [
      { method: 'flatpak', identifier: 'us.zoom.Zoom', origin: 'community' },
      { method: 'snap', identifier: 'zoom-client', origin: 'community' },
      { method: 'official', identifier: 'zoom', origin: 'vendor', url: 'https://zoom.us/download' },
    ],
  },
];
