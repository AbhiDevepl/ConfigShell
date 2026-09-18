import type { Application } from './types.ts';

/**
 * The ConfigShell trusted application catalog.
 *
 * All applications are categorized into role-oriented, actionable categories:
 * - General
 * - Student
 * - Developer
 * - Web Developer
 * - DevOps
 * - Data & AI
 * - Content Creator
 * - Gaming
 */
export const APPLICATIONS: readonly Application[] = [
  {
    "id": "firefox",
    "name": "Firefox",
    "description": "Open-source web browser from Mozilla.",
    "category": "General",
    "homepage": "https://www.mozilla.org/firefox/",
    "popularity": 96,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "firefox-esr",
        "origin": "distro",
        "distros": [
          "Debian"
        ]
      },
      {
        "method": "apt",
        "identifier": "firefox",
        "origin": "vendor",
        "distros": [
          "Ubuntu",
          "Debian"
        ],
        "url": "https://support.mozilla.org/kb/install-firefox-linux"
      },
      {
        "method": "dnf",
        "identifier": "firefox",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "firefox",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.mozilla.firefox",
        "origin": "vendor"
      },
      {
        "method": "snap",
        "identifier": "firefox",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "firefox"
    }
  },
  {
    "id": "google-chrome",
    "name": "Google Chrome",
    "description": "Google's proprietary web browser, built on Chromium.",
    "category": "General",
    "homepage": "https://www.google.com/chrome/",
    "popularity": 98,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "google-chrome-stable",
        "origin": "vendor",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "google-chrome-stable",
        "origin": "vendor",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "com.google.Chrome",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "google-chrome-stable"
    }
  },
  {
    "id": "brave",
    "name": "Brave",
    "description": "Chromium-based browser with built-in ad and tracker blocking.",
    "category": "General",
    "homepage": "https://brave.com/",
    "popularity": 88,
    "installation": [
      {
        "method": "apt",
        "identifier": "brave-browser",
        "origin": "vendor",
        "distros": [
          "Ubuntu",
          "Debian"
        ],
        "url": "https://brave.com/linux/"
      },
      {
        "method": "dnf",
        "identifier": "brave-browser",
        "origin": "vendor",
        "distros": [
          "Fedora"
        ],
        "url": "https://brave.com/linux/"
      },
      {
        "method": "flatpak",
        "identifier": "com.brave.Browser",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "brave",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "brave-browser"
    }
  },
  {
    "id": "chromium",
    "name": "Chromium",
    "description": "Open-source browser project that Chrome is built from.",
    "category": "General",
    "homepage": "https://www.chromium.org/chromium-projects/",
    "popularity": 85,
    "installation": [
      {
        "method": "apt",
        "identifier": "chromium",
        "origin": "distro",
        "distros": [
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "chromium",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "chromium",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.chromium.Chromium",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "chromium",
        "origin": "distro"
      }
    ]
  },
  {
    "id": "vscode",
    "name": "Visual Studio Code",
    "description": "Extensible source code editor from Microsoft.",
    "category": "Developer",
    "homepage": "https://code.visualstudio.com/",
    "popularity": 99,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "code",
        "origin": "vendor",
        "distros": [
          "Ubuntu",
          "Debian"
        ],
        "url": "https://code.visualstudio.com/docs/setup/linux"
      },
      {
        "method": "dnf",
        "identifier": "code",
        "origin": "vendor",
        "distros": [
          "Fedora"
        ],
        "url": "https://code.visualstudio.com/docs/setup/linux"
      },
      {
        "method": "pacman",
        "identifier": "code",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "com.visualstudio.code",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "code",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "code"
    }
  },
  {
    "id": "cursor",
    "name": "Cursor",
    "description": "AI-assisted code editor built on Visual Studio Code.",
    "category": "Developer",
    "homepage": "https://cursor.com/",
    "popularity": 91,
    "featured": true,
    "installation": [
      {
        "method": "official",
        "identifier": "cursor",
        "origin": "vendor",
        "url": "https://cursor.com/"
      }
    ]
  },
  {
    "id": "zed",
    "name": "Zed",
    "description": "High-performance, collaborative code editor.",
    "category": "Developer",
    "homepage": "https://zed.dev/",
    "popularity": 82,
    "installation": [
      {
        "method": "pacman",
        "identifier": "zed",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "dev.zed.Zed",
        "origin": "community"
      }
    ]
  },
  {
    "id": "sublime-text",
    "name": "Sublime Text",
    "description": "Proprietary text editor known for its speed.",
    "category": "Developer",
    "homepage": "https://www.sublimetext.com/",
    "popularity": 84,
    "installation": [
      {
        "method": "apt",
        "identifier": "sublime-text",
        "origin": "vendor",
        "distros": [
          "Ubuntu",
          "Debian"
        ],
        "url": "https://www.sublimetext.com/docs/linux_repositories.html"
      },
      {
        "method": "dnf",
        "identifier": "sublime-text",
        "origin": "vendor",
        "distros": [
          "Fedora"
        ],
        "url": "https://www.sublimetext.com/docs/linux_repositories.html"
      },
      {
        "method": "flatpak",
        "identifier": "com.sublimehq.SublimeText",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "sublime-text",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "subl"
    }
  },
  {
    "id": "git",
    "name": "Git",
    "description": "Distributed version control system.",
    "category": "Developer",
    "homepage": "https://git-scm.com/",
    "popularity": 99,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "git",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "git",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "git",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "git"
    }
  },
  {
    "id": "docker",
    "name": "Docker",
    "description": "Container runtime and tooling for building and running applications.",
    "category": "DevOps",
    "homepage": "https://www.docker.com/",
    "popularity": 97,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "docker-ce",
        "origin": "vendor",
        "distros": [
          "Ubuntu",
          "Debian"
        ],
        "url": "https://docs.docker.com/engine/install/"
      },
      {
        "method": "apt",
        "identifier": "docker.io",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "docker-ce",
        "origin": "vendor",
        "distros": [
          "Fedora"
        ],
        "url": "https://docs.docker.com/engine/install/fedora/"
      },
      {
        "method": "pacman",
        "identifier": "docker",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "docker",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "docker"
    }
  },
  {
    "id": "nodejs",
    "name": "Node.js",
    "description": "JavaScript runtime built on Chrome's V8 engine.",
    "category": "Web Developer",
    "homepage": "https://nodejs.org/",
    "popularity": 96,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "nodejs",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "nodejs",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "nodejs",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "node",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "node"
    }
  },
  {
    "id": "curl",
    "name": "curl",
    "description": "Command-line tool for transferring data over network protocols.",
    "category": "DevOps",
    "homepage": "https://curl.se/",
    "popularity": 95,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "curl",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "curl",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "curl",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "curl"
    }
  },
  {
    "id": "htop",
    "name": "htop",
    "description": "Interactive process viewer for the terminal.",
    "category": "Developer",
    "homepage": "https://htop.dev/",
    "popularity": 91,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "htop",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "htop",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "htop",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "htop"
    }
  },
  {
    "id": "neovim",
    "name": "Neovim",
    "description": "Terminal-based text editor, a refactored fork of Vim.",
    "category": "Developer",
    "homepage": "https://neovim.io/",
    "popularity": 94,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "neovim",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "neovim",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "neovim",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "io.neovim.nvim",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "nvim",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "nvim"
    }
  },
  {
    "id": "insomnia",
    "name": "Insomnia",
    "description": "API client for designing and testing HTTP and GraphQL APIs.",
    "category": "Web Developer",
    "homepage": "https://insomnia.rest/",
    "popularity": 87,
    "installation": [
      {
        "method": "apt",
        "identifier": "insomnia",
        "origin": "vendor",
        "distros": [
          "Ubuntu",
          "Debian"
        ],
        "url": "https://docs.insomnia.rest/insomnia/install"
      },
      {
        "method": "flatpak",
        "identifier": "rest.insomnia.Insomnia",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "insomnia",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "insomnia"
    }
  },
  {
    "id": "dbeaver",
    "name": "DBeaver Community",
    "description": "Universal database tool for browsing and querying databases.",
    "category": "Developer",
    "homepage": "https://dbeaver.io/",
    "popularity": 92,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "dbeaver-ce",
        "origin": "vendor",
        "distros": [
          "Ubuntu",
          "Debian"
        ],
        "url": "https://dbeaver.io/download/"
      },
      {
        "method": "pacman",
        "identifier": "dbeaver",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "io.dbeaver.DBeaverCommunity",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "dbeaver-ce",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "dbeaver"
    }
  },
  {
    "id": "postman",
    "name": "Postman",
    "description": "Collaborative platform for building and testing APIs.",
    "category": "Web Developer",
    "homepage": "https://www.postman.com/",
    "popularity": 94,
    "featured": true,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "com.getpostman.Postman",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "postman",
        "origin": "vendor"
      }
    ]
  },
  {
    "id": "github-cli",
    "name": "GitHub CLI",
    "description": "Command-line interface for GitHub's pull requests, issues, and releases.",
    "category": "Developer",
    "homepage": "https://cli.github.com/",
    "popularity": 93,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "gh",
        "origin": "vendor",
        "distros": [
          "Ubuntu",
          "Debian"
        ],
        "url": "https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
      },
      {
        "method": "dnf",
        "identifier": "gh",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "github-cli",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "gh"
    }
  },
  {
    "id": "gnome-tweaks",
    "name": "GNOME Tweaks",
    "description": "Adjust advanced GNOME desktop settings.",
    "category": "Developer",
    "homepage": "https://gitlab.gnome.org/GNOME/gnome-tweaks",
    "popularity": 86,
    "installation": [
      {
        "method": "apt",
        "identifier": "gnome-tweaks",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "gnome-tweaks",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "gnome-tweaks",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "gnome-tweaks"
    }
  },
  {
    "id": "flameshot",
    "name": "Flameshot",
    "description": "Screenshot tool with built-in annotation.",
    "category": "General",
    "homepage": "https://flameshot.org/",
    "popularity": 94,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "flameshot",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "flameshot",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "flameshot",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.flameshot.Flameshot",
        "origin": "vendor"
      },
      {
        "method": "snap",
        "identifier": "flameshot",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "flameshot"
    }
  },
  {
    "id": "timeshift",
    "name": "Timeshift",
    "description": "System restore tool that creates filesystem snapshots.",
    "category": "General",
    "homepage": "https://github.com/linuxmint/timeshift",
    "popularity": 90,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "timeshift",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "timeshift",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "timeshift",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "timeshift"
    }
  },
  {
    "id": "gparted",
    "name": "GParted",
    "description": "Graphical partition editor for managing disk partitions.",
    "category": "General",
    "homepage": "https://gparted.org/",
    "popularity": 91,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "gparted",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "gparted",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "gparted",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "gparted"
    }
  },
  {
    "id": "vlc",
    "name": "VLC",
    "description": "Media player that plays most files, discs, and streams.",
    "category": "General",
    "homepage": "https://www.videolan.org/vlc/",
    "popularity": 98,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "vlc",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "pacman",
        "identifier": "vlc",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.videolan.VLC",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "vlc",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "vlc"
    }
  },
  {
    "id": "obs-studio",
    "name": "OBS Studio",
    "description": "Open-source software for video recording and live streaming.",
    "category": "Content Creator",
    "homepage": "https://obsproject.com/",
    "popularity": 96,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "obs-studio",
        "origin": "distro",
        "distros": [
          "Ubuntu"
        ]
      },
      {
        "method": "dnf",
        "identifier": "obs-studio",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "obs-studio",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "com.obsproject.Studio",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "obs"
    }
  },
  {
    "id": "audacity",
    "name": "Audacity",
    "description": "Multi-track audio editor and recorder.",
    "category": "Content Creator",
    "homepage": "https://www.audacityteam.org/",
    "popularity": 89,
    "installation": [
      {
        "method": "apt",
        "identifier": "audacity",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "audacity",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "audacity",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.audacityteam.Audacity",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "audacity",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "audacity"
    }
  },
  {
    "id": "gimp",
    "name": "GIMP",
    "description": "Raster image editor for photo retouching and graphic design.",
    "category": "Content Creator",
    "homepage": "https://www.gimp.org/",
    "popularity": 93,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "gimp",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "gimp",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "gimp",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.gimp.GIMP",
        "origin": "vendor"
      },
      {
        "method": "snap",
        "identifier": "gimp",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "gimp"
    }
  },
  {
    "id": "slack",
    "name": "Slack",
    "description": "Team messaging and collaboration app.",
    "category": "General",
    "homepage": "https://slack.com/",
    "popularity": 92,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "slack-desktop",
        "origin": "vendor",
        "distros": [
          "Ubuntu",
          "Debian"
        ],
        "url": "https://slack.com/downloads/linux"
      },
      {
        "method": "dnf",
        "identifier": "slack",
        "origin": "vendor",
        "distros": [
          "Fedora"
        ],
        "url": "https://slack.com/downloads/linux"
      },
      {
        "method": "flatpak",
        "identifier": "com.slack.Slack",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "slack",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "slack"
    }
  },
  {
    "id": "discord",
    "name": "Discord",
    "description": "Voice, video, and text chat for communities.",
    "category": "General",
    "homepage": "https://discord.com/",
    "popularity": 97,
    "featured": true,
    "installation": [
      {
        "method": "pacman",
        "identifier": "discord",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "com.discordapp.Discord",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "discord",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "discord"
    }
  },
  {
    "id": "telegram-desktop",
    "name": "Telegram Desktop",
    "description": "Desktop client for the Telegram messaging service.",
    "category": "General",
    "homepage": "https://desktop.telegram.org/",
    "popularity": 89,
    "installation": [
      {
        "method": "apt",
        "identifier": "telegram-desktop",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "pacman",
        "identifier": "telegram-desktop",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.telegram.desktop",
        "origin": "vendor"
      },
      {
        "method": "snap",
        "identifier": "telegram-desktop",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "telegram-desktop"
    }
  },
  {
    "id": "thunderbird",
    "name": "Thunderbird",
    "description": "Email, calendar, and chat client from Mozilla.",
    "category": "General",
    "homepage": "https://www.thunderbird.net/",
    "popularity": 88,
    "installation": [
      {
        "method": "apt",
        "identifier": "thunderbird",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "thunderbird",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "thunderbird",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.mozilla.thunderbird",
        "origin": "vendor"
      },
      {
        "method": "snap",
        "identifier": "thunderbird",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "thunderbird"
    }
  },
  {
    "id": "zoom",
    "name": "Zoom",
    "description": "Video conferencing and online meeting client.",
    "category": "General",
    "homepage": "https://zoom.us/",
    "popularity": 90,
    "featured": true,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "us.zoom.Zoom",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "zoom-client",
        "origin": "community"
      },
      {
        "method": "official",
        "identifier": "zoom",
        "origin": "vendor",
        "url": "https://zoom.us/download"
      }
    ]
  },
  {
    "id": "vivaldi",
    "name": "Vivaldi",
    "description": "Feature-rich web browser with built-in productivity tools.",
    "category": "General",
    "homepage": "https://vivaldi.com/",
    "popularity": 82,
    "installation": [
      {
        "method": "apt",
        "identifier": "vivaldi-stable",
        "origin": "vendor",
        "distros": [
          "Ubuntu",
          "Debian"
        ],
        "url": "https://vivaldi.com/download/"
      },
      {
        "method": "dnf",
        "identifier": "vivaldi-stable",
        "origin": "vendor",
        "distros": [
          "Fedora"
        ],
        "url": "https://vivaldi.com/download/"
      },
      {
        "method": "flatpak",
        "identifier": "com.vivaldi.Vivaldi",
        "origin": "community"
      }
    ]
  },
  {
    "id": "opera",
    "name": "Opera",
    "description": "Web browser with built-in ad blocker and free VPN.",
    "category": "General",
    "homepage": "https://www.opera.com/",
    "popularity": 80,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "com.opera.Opera",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "opera",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "opera"
    }
  },
  {
    "id": "tor-browser",
    "name": "Tor Browser",
    "description": "Privacy-focused browser that routes traffic through the Tor network.",
    "category": "General",
    "homepage": "https://www.torproject.org/",
    "popularity": 85,
    "installation": [
      {
        "method": "apt",
        "identifier": "torbrowser-launcher",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "torbrowser-launcher",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "torbrowser-launcher",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "com.github.micahflee.torbrowser-launcher",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "torbrowser-launcher"
    }
  },
  {
    "id": "microsoft-edge",
    "name": "Microsoft Edge",
    "description": "Chromium-based web browser from Microsoft.",
    "category": "General",
    "homepage": "https://www.microsoft.com/edge/",
    "popularity": 78,
    "installation": [
      {
        "method": "apt",
        "identifier": "microsoft-edge-stable",
        "origin": "vendor",
        "distros": [
          "Ubuntu",
          "Debian"
        ],
        "url": "https://www.microsoft.com/edge/download"
      },
      {
        "method": "dnf",
        "identifier": "microsoft-edge-stable",
        "origin": "vendor",
        "distros": [
          "Fedora"
        ],
        "url": "https://www.microsoft.com/edge/download"
      },
      {
        "method": "flatpak",
        "identifier": "com.microsoft.Edge",
        "origin": "community"
      }
    ]
  },
  {
    "id": "librewolf",
    "name": "LibreWolf",
    "description": "Community-maintained independent browser focused on privacy, security and freedom.",
    "category": "General",
    "homepage": "https://librewolf.net/",
    "popularity": 79,
    "installation": [
      {
        "method": "pacman",
        "identifier": "librewolf",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "io.gitlab.librewolf-community",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "librewolf"
    }
  },
  {
    "id": "epiphany",
    "name": "GNOME Web",
    "description": "Simple, clean, beautiful web browser designed for the GNOME desktop.",
    "category": "General",
    "homepage": "https://apps.gnome.org/Epiphany/",
    "popularity": 70,
    "installation": [
      {
        "method": "apt",
        "identifier": "epiphany-browser",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "epiphany",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "epiphany",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.gnome.Epiphany",
        "origin": "distro"
      }
    ]
  },
  {
    "id": "vscodium",
    "name": "VSCodium",
    "description": "Community-driven, telemetry-free binary distribution of VS Code.",
    "category": "Developer",
    "homepage": "https://vscodium.com/",
    "popularity": 85,
    "installation": [
      {
        "method": "pacman",
        "identifier": "vscodium",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "com.vscodium.codium",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "codium",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "codium"
    }
  },
  {
    "id": "helix",
    "name": "Helix",
    "description": "Post-modern modal text editor with built-in tree-sitter and language server support.",
    "category": "Developer",
    "homepage": "https://helix-editor.com/",
    "popularity": 83,
    "installation": [
      {
        "method": "dnf",
        "identifier": "helix",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "helix",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "com.helix_editor.Helix",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "hx"
    }
  },
  {
    "id": "emacs",
    "name": "GNU Emacs",
    "description": "Extensible, customizable, self-documenting text editor and computing environment.",
    "category": "Developer",
    "homepage": "https://www.gnu.org/software/emacs/",
    "popularity": 88,
    "installation": [
      {
        "method": "apt",
        "identifier": "emacs",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "emacs",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "emacs",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.gnu.emacs",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "emacs",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "emacs"
    }
  },
  {
    "id": "vim",
    "name": "Vim",
    "description": "Ubiquitous modal text editor designed for efficiency.",
    "category": "Developer",
    "homepage": "https://www.vim.org/",
    "popularity": 92,
    "installation": [
      {
        "method": "apt",
        "identifier": "vim",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "vim-enhanced",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "vim",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "vim"
    }
  },
  {
    "id": "geany",
    "name": "Geany",
    "description": "Fast, lightweight IDE and text editor using GTK.",
    "category": "Developer",
    "homepage": "https://www.geany.org/",
    "popularity": 76,
    "installation": [
      {
        "method": "apt",
        "identifier": "geany",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "geany",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "geany",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.geany.Geany",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "geany"
    }
  },
  {
    "id": "kate",
    "name": "Kate",
    "description": "Powerful multi-document text editor by KDE.",
    "category": "Developer",
    "homepage": "https://kate-editor.org/",
    "popularity": 78,
    "installation": [
      {
        "method": "apt",
        "identifier": "kate",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "kate",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "kate",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.kde.kate",
        "origin": "distro"
      },
      {
        "method": "snap",
        "identifier": "kate",
        "origin": "distro"
      }
    ],
    "verify": {
      "binary": "kate"
    }
  },
  {
    "id": "micro",
    "name": "Micro",
    "description": "Modern and intuitive terminal-based text editor with intuitive keybindings.",
    "category": "Developer",
    "homepage": "https://micro-editor.github.io/",
    "popularity": 80,
    "installation": [
      {
        "method": "apt",
        "identifier": "micro",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "micro",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "micro",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "micro",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "micro"
    }
  },
  {
    "id": "pycharm-community",
    "name": "PyCharm Community",
    "description": "Pure Python IDE with smart code completion, inspections, and debugging.",
    "category": "Developer",
    "homepage": "https://www.jetbrains.com/pycharm/",
    "popularity": 87,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "com.jetbrains.PyCharm-Community",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "pycharm-community",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "pycharm-community"
    }
  },
  {
    "id": "intellij-idea-community",
    "name": "IntelliJ IDEA Community",
    "description": "Capable, ergonomic Java and Kotlin IDE.",
    "category": "Developer",
    "homepage": "https://www.jetbrains.com/idea/",
    "popularity": 89,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "com.jetbrains.IntelliJ-IDEA-Community",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "intellij-idea-community",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "intellij-idea-community"
    }
  },
  {
    "id": "android-studio",
    "name": "Android Studio",
    "description": "Official IDE for Android app development, based on IntelliJ IDEA.",
    "category": "Developer",
    "homepage": "https://developer.android.com/studio",
    "popularity": 86,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "com.google.AndroidStudio",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "android-studio",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "android-studio"
    }
  },
  {
    "id": "codeblocks",
    "name": "Code::Blocks",
    "description": "Configurable C, C++ and Fortran IDE built to meet demanding needs.",
    "category": "Developer",
    "homepage": "https://www.codeblocks.org/",
    "popularity": 71,
    "installation": [
      {
        "method": "apt",
        "identifier": "codeblocks",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "codeblocks",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "codeblocks",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.codeblocks.codeblocks",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "codeblocks"
    }
  },
  {
    "id": "nano",
    "name": "GNU nano",
    "description": "Small, friendly text editor inspired by Pico.",
    "category": "Developer",
    "homepage": "https://www.nano-editor.org/",
    "popularity": 84,
    "installation": [
      {
        "method": "apt",
        "identifier": "nano",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "nano",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "nano",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "nano"
    }
  },
  {
    "id": "lapce",
    "name": "Lapce",
    "description": "Lightning-fast and powerful code editor written in Rust.",
    "category": "Developer",
    "homepage": "https://lapce.dev/",
    "popularity": 74,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "dev.lapce.lapce",
        "origin": "community"
      },
      {
        "method": "pacman",
        "identifier": "lapce",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "lapce"
    }
  },
  {
    "id": "tmux",
    "name": "tmux",
    "description": "Terminal multiplexer letting you switch easily between several programs.",
    "category": "Developer",
    "homepage": "https://github.com/tmux/tmux",
    "popularity": 92,
    "installation": [
      {
        "method": "apt",
        "identifier": "tmux",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "tmux",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "tmux",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "tmux"
    }
  },
  {
    "id": "btop",
    "name": "btop",
    "description": "Resource monitor that shows usage and stats for processor, memory, disks and network.",
    "category": "Developer",
    "homepage": "https://github.com/aristocratos/btop",
    "popularity": 91,
    "installation": [
      {
        "method": "apt",
        "identifier": "btop",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "btop",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "btop",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "btop",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "btop"
    }
  },
  {
    "id": "ripgrep",
    "name": "ripgrep",
    "description": "Extremely fast line-oriented search tool respecting .gitignore rules.",
    "category": "Developer",
    "homepage": "https://github.com/BurntSushi/ripgrep",
    "popularity": 94,
    "installation": [
      {
        "method": "apt",
        "identifier": "ripgrep",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "ripgrep",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "ripgrep",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "ripgrep",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "rg"
    }
  },
  {
    "id": "fd-find",
    "name": "fd",
    "description": "Simple, fast and user-friendly alternative to find.",
    "category": "Developer",
    "homepage": "https://github.com/sharkdp/fd",
    "popularity": 90,
    "installation": [
      {
        "method": "apt",
        "identifier": "fd-find",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "fd-find",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "fd",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ]
  },
  {
    "id": "fzf",
    "name": "fzf",
    "description": "General-purpose interactive command-line fuzzy finder.",
    "category": "Developer",
    "homepage": "https://github.com/junegunn/fzf",
    "popularity": 93,
    "installation": [
      {
        "method": "apt",
        "identifier": "fzf",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "fzf",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "fzf",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "fzf"
    }
  },
  {
    "id": "bat",
    "name": "bat",
    "description": "Cat clone with syntax highlighting and Git integration.",
    "category": "Developer",
    "homepage": "https://github.com/sharkdp/bat",
    "popularity": 89,
    "installation": [
      {
        "method": "apt",
        "identifier": "bat",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "bat",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "bat",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ]
  },
  {
    "id": "eza",
    "name": "eza",
    "description": "Modern, maintained replacement for ls with colors and git indicators.",
    "category": "Developer",
    "homepage": "https://github.com/eza-community/eza",
    "popularity": 87,
    "installation": [
      {
        "method": "dnf",
        "identifier": "eza",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "eza",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "eza"
    }
  },
  {
    "id": "jq",
    "name": "jq",
    "description": "Lightweight and flexible command-line JSON processor.",
    "category": "Developer",
    "homepage": "https://jqlang.github.io/jq/",
    "popularity": 95,
    "installation": [
      {
        "method": "apt",
        "identifier": "jq",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "jq",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "jq",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "jq"
    }
  },
  {
    "id": "yq",
    "name": "yq",
    "description": "Portable command-line YAML, JSON, XML, and CSV processor.",
    "category": "Developer",
    "homepage": "https://mikefarah.gitbook.io/yq/",
    "popularity": 82,
    "installation": [
      {
        "method": "pacman",
        "identifier": "yq",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "yq",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "yq"
    }
  },
  {
    "id": "wget",
    "name": "GNU Wget",
    "description": "Package for retrieving files using HTTP, HTTPS, and FTP protocols.",
    "category": "Developer",
    "homepage": "https://www.gnu.org/software/wget/",
    "popularity": 94,
    "installation": [
      {
        "method": "apt",
        "identifier": "wget",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "wget",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "wget",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "wget"
    }
  },
  {
    "id": "aria2",
    "name": "aria2",
    "description": "Lightweight multi-protocol and multi-source command-line download utility.",
    "category": "Developer",
    "homepage": "https://aria2.github.io/",
    "popularity": 84,
    "installation": [
      {
        "method": "apt",
        "identifier": "aria2",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "aria2",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "aria2",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "aria2c"
    }
  },
  {
    "id": "ncdu",
    "name": "ncdu",
    "description": "NCurses disk usage analyzer for quickly tracking down storage hogs.",
    "category": "Developer",
    "homepage": "https://dev.yorhel.nl/ncdu",
    "popularity": 88,
    "installation": [
      {
        "method": "apt",
        "identifier": "ncdu",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "ncdu",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "ncdu",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "ncdu"
    }
  },
  {
    "id": "tree",
    "name": "tree",
    "description": "Recursive directory listing command that produces a depth-indented tree.",
    "category": "Developer",
    "homepage": "https://oldmanprogrammer.net/source.php?dir=projects/tree",
    "popularity": 86,
    "installation": [
      {
        "method": "apt",
        "identifier": "tree",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "tree",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "tree",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "tree"
    }
  },
  {
    "id": "zsh",
    "name": "Zsh",
    "description": "Advanced command interpreter and interactive login shell.",
    "category": "Developer",
    "homepage": "https://www.zsh.org/",
    "popularity": 93,
    "installation": [
      {
        "method": "apt",
        "identifier": "zsh",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "zsh",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "zsh",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "zsh"
    }
  },
  {
    "id": "fish",
    "name": "Fish Shell",
    "description": "Smart and user-friendly command-line shell with autosuggestions.",
    "category": "Developer",
    "homepage": "https://fishshell.com/",
    "popularity": 87,
    "installation": [
      {
        "method": "apt",
        "identifier": "fish",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "fish",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "fish",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "fish"
    }
  },
  {
    "id": "starship",
    "name": "Starship",
    "description": "Cross-shell prompt customized for speed, minimalism and context.",
    "category": "Developer",
    "homepage": "https://starship.rs/",
    "popularity": 91,
    "installation": [
      {
        "method": "dnf",
        "identifier": "starship",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "starship",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "starship",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "starship"
    }
  },
  {
    "id": "fastfetch",
    "name": "Fastfetch",
    "description": "Fast, highly customizable system information tool written in C.",
    "category": "Developer",
    "homepage": "https://github.com/fastfetch-cli/fastfetch",
    "popularity": 90,
    "installation": [
      {
        "method": "apt",
        "identifier": "fastfetch",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "fastfetch",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "fastfetch",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "fastfetch"
    }
  },
  {
    "id": "neofetch",
    "name": "Neofetch",
    "description": "CLI system information tool displaying distro logo and system specs.",
    "category": "Developer",
    "homepage": "https://github.com/dylanaraps/neofetch",
    "popularity": 85,
    "installation": [
      {
        "method": "apt",
        "identifier": "neofetch",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "neofetch",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "neofetch",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "neofetch"
    }
  },
  {
    "id": "zellij",
    "name": "Zellij",
    "description": "Terminal workspace and multiplexer with tabs and built-in layout management.",
    "category": "Developer",
    "homepage": "https://zellij.dev/",
    "popularity": 84,
    "installation": [
      {
        "method": "dnf",
        "identifier": "zellij",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "zellij",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "zellij"
    }
  },
  {
    "id": "ranger",
    "name": "Ranger",
    "description": "Console file manager with VI key bindings and smooth file previews.",
    "category": "Developer",
    "homepage": "https://ranger.github.io/",
    "popularity": 83,
    "installation": [
      {
        "method": "apt",
        "identifier": "ranger",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "ranger",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "ranger",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "ranger"
    }
  },
  {
    "id": "lazygit",
    "name": "Lazygit",
    "description": "Simple terminal UI for git commands.",
    "category": "Developer",
    "homepage": "https://github.com/jesseduffield/lazygit",
    "popularity": 92,
    "installation": [
      {
        "method": "dnf",
        "identifier": "lazygit",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "lazygit",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "lazygit"
    }
  },
  {
    "id": "lazydocker",
    "name": "Lazydocker",
    "description": "Simple terminal UI for both docker and docker-compose.",
    "category": "DevOps",
    "homepage": "https://github.com/jesseduffield/lazydocker",
    "popularity": 88,
    "installation": [
      {
        "method": "pacman",
        "identifier": "lazydocker",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "lazydocker"
    }
  },
  {
    "id": "dust",
    "name": "dust",
    "description": "More intuitive version of du written in Rust giving graphical disk usage.",
    "category": "Developer",
    "homepage": "https://github.com/bootandy/dust",
    "popularity": 81,
    "installation": [
      {
        "method": "pacman",
        "identifier": "dust",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "dust"
    }
  },
  {
    "id": "tldr",
    "name": "tldr",
    "description": "Collaborative, simplified and community-driven man pages.",
    "category": "Developer",
    "homepage": "https://tldr.sh/",
    "popularity": 89,
    "installation": [
      {
        "method": "apt",
        "identifier": "tldr",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "tldr",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "tldr",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "tldr"
    }
  },
  {
    "id": "glances",
    "name": "Glances",
    "description": "Cross-platform system monitoring tool with web interface and REST API.",
    "category": "Developer",
    "homepage": "https://nicolargo.github.io/glances/",
    "popularity": 85,
    "installation": [
      {
        "method": "apt",
        "identifier": "glances",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "glances",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "glances",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "glances",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "glances"
    }
  },
  {
    "id": "hyperfine",
    "name": "Hyperfine",
    "description": "Command-line benchmarking tool with statistical analysis and outlier detection.",
    "category": "Developer",
    "homepage": "https://github.com/sharkdp/hyperfine",
    "popularity": 85,
    "installation": [
      {
        "method": "apt",
        "identifier": "hyperfine",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "hyperfine",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "hyperfine",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "hyperfine"
    }
  },
  {
    "id": "python",
    "name": "Python 3",
    "description": "High-level, interpreted programming language with extensive standard library.",
    "category": "Data & AI",
    "homepage": "https://www.python.org/",
    "popularity": 97,
    "installation": [
      {
        "method": "apt",
        "identifier": "python3",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "python3",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "python",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "python3"
    }
  },
  {
    "id": "golang",
    "name": "Go",
    "description": "Open-source programming language that makes it easy to build fast software.",
    "category": "Developer",
    "homepage": "https://go.dev/",
    "popularity": 93,
    "installation": [
      {
        "method": "apt",
        "identifier": "golang-go",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "golang",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "go",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "go",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "go"
    }
  },
  {
    "id": "rust",
    "name": "Rust",
    "description": "Systems programming language empowering everyone to build reliable and efficient software.",
    "category": "Developer",
    "homepage": "https://www.rust-lang.org/",
    "popularity": 94,
    "installation": [
      {
        "method": "apt",
        "identifier": "rustc",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "rust",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "rust",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "rustup",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "rustc"
    }
  },
  {
    "id": "gcc",
    "name": "GCC",
    "description": "GNU Compiler Collection supporting C, C++, Fortran, and Go.",
    "category": "Developer",
    "homepage": "https://gcc.gnu.org/",
    "popularity": 95,
    "installation": [
      {
        "method": "apt",
        "identifier": "gcc",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "gcc",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "gcc",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "gcc"
    }
  },
  {
    "id": "clang",
    "name": "Clang",
    "description": "C, C++, and Objective-C compiler front-end for LLVM.",
    "category": "Developer",
    "homepage": "https://clang.llvm.org/",
    "popularity": 91,
    "installation": [
      {
        "method": "apt",
        "identifier": "clang",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "clang",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "clang",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "clang"
    }
  },
  {
    "id": "cmake",
    "name": "CMake",
    "description": "Cross-platform, open-source build system generator.",
    "category": "Developer",
    "homepage": "https://cmake.org/",
    "popularity": 93,
    "installation": [
      {
        "method": "apt",
        "identifier": "cmake",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "cmake",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "cmake",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "cmake",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "cmake"
    }
  },
  {
    "id": "ninja",
    "name": "Ninja",
    "description": "Small build system with a focus on speed.",
    "category": "Developer",
    "homepage": "https://ninja-build.org/",
    "popularity": 88,
    "installation": [
      {
        "method": "apt",
        "identifier": "ninja-build",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "ninja-build",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "ninja",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "ninja"
    }
  },
  {
    "id": "bun",
    "name": "Bun",
    "description": "Incredibly fast JavaScript and TypeScript runtime, bundler, and package manager.",
    "category": "Web Developer",
    "homepage": "https://bun.sh/",
    "popularity": 89,
    "installation": [
      {
        "method": "official",
        "identifier": "bun",
        "origin": "vendor",
        "url": "https://bun.sh/"
      }
    ]
  },
  {
    "id": "deno",
    "name": "Deno",
    "description": "Secure, modern runtime for JavaScript and TypeScript with built-in toolchain.",
    "category": "Web Developer",
    "homepage": "https://deno.com/",
    "popularity": 86,
    "installation": [
      {
        "method": "pacman",
        "identifier": "deno",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "deno",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "deno"
    }
  },
  {
    "id": "openjdk",
    "name": "OpenJDK",
    "description": "Free and open-source implementation of the Java Platform, Standard Edition.",
    "category": "Developer",
    "homepage": "https://openjdk.org/",
    "popularity": 91,
    "installation": [
      {
        "method": "apt",
        "identifier": "default-jdk",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "java-latest-openjdk-devel",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "jdk-openjdk",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "javac"
    }
  },
  {
    "id": "ruby",
    "name": "Ruby",
    "description": "Dynamic, open-source programming language with a focus on simplicity.",
    "category": "Developer",
    "homepage": "https://www.ruby-lang.org/",
    "popularity": 82,
    "installation": [
      {
        "method": "apt",
        "identifier": "ruby-full",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "ruby",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "ruby",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "ruby",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "ruby"
    }
  },
  {
    "id": "php",
    "name": "PHP",
    "description": "Popular general-purpose scripting language suited for web development.",
    "category": "Developer",
    "homepage": "https://www.php.net/",
    "popularity": 84,
    "installation": [
      {
        "method": "apt",
        "identifier": "php",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "php",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "php",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "php"
    }
  },
  {
    "id": "podman",
    "name": "Podman",
    "description": "Daemonless container engine for developing, managing, and running OCI containers.",
    "category": "DevOps",
    "homepage": "https://podman.io/",
    "popularity": 90,
    "installation": [
      {
        "method": "apt",
        "identifier": "podman",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "podman",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "podman",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "podman"
    }
  },
  {
    "id": "docker-compose",
    "name": "Docker Compose",
    "description": "Tool for defining and running multi-container Docker applications.",
    "category": "DevOps",
    "homepage": "https://docs.docker.com/compose/",
    "popularity": 93,
    "installation": [
      {
        "method": "pacman",
        "identifier": "docker-compose",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "docker-compose"
    }
  },
  {
    "id": "kubectl",
    "name": "Kubectl",
    "description": "Kubernetes command-line tool for controlling Kubernetes clusters.",
    "category": "DevOps",
    "homepage": "https://kubernetes.io/docs/reference/kubectl/",
    "popularity": 91,
    "installation": [
      {
        "method": "pacman",
        "identifier": "kubectl",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "kubectl",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "kubectl"
    }
  },
  {
    "id": "minikube",
    "name": "Minikube",
    "description": "Local Kubernetes engine making it easy to learn and develop for Kubernetes.",
    "category": "DevOps",
    "homepage": "https://minikube.sigs.k8s.io/",
    "popularity": 84,
    "installation": [
      {
        "method": "pacman",
        "identifier": "minikube",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "minikube",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "minikube"
    }
  },
  {
    "id": "terraform",
    "name": "Terraform",
    "description": "Infrastructure as code tool for provisioning cloud and on-prem resources.",
    "category": "DevOps",
    "homepage": "https://www.terraform.io/",
    "popularity": 89,
    "installation": [
      {
        "method": "pacman",
        "identifier": "terraform",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "terraform",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "terraform"
    }
  },
  {
    "id": "ansible",
    "name": "Ansible",
    "description": "Radically simple IT automation engine for configuration management and deployment.",
    "category": "DevOps",
    "homepage": "https://www.ansible.com/",
    "popularity": 88,
    "installation": [
      {
        "method": "apt",
        "identifier": "ansible",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "ansible",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "ansible",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "ansible"
    }
  },
  {
    "id": "valgrind",
    "name": "Valgrind",
    "description": "Instrumentation framework for building dynamic analysis and profiling tools.",
    "category": "Developer",
    "homepage": "https://valgrind.org/",
    "popularity": 81,
    "installation": [
      {
        "method": "apt",
        "identifier": "valgrind",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "valgrind",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "valgrind",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "valgrind"
    }
  },
  {
    "id": "sqlitebrowser",
    "name": "DB Browser for SQLite",
    "description": "Visual tool to create, design, and edit database files compatible with SQLite.",
    "category": "Developer",
    "homepage": "https://sqlitebrowser.org/",
    "popularity": 85,
    "installation": [
      {
        "method": "apt",
        "identifier": "sqlitebrowser",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "sqlitebrowser",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "sqlitebrowser",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.sqlitebrowser.sqlitebrowser",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "sqlitebrowser",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "sqlitebrowser"
    }
  },
  {
    "id": "redis-insight",
    "name": "Redis Insight",
    "description": "GUI tool for visualizing and optimizing Redis data.",
    "category": "Web Developer",
    "homepage": "https://redis.io/insight/",
    "popularity": 79,
    "installation": [
      {
        "method": "snap",
        "identifier": "redis-insight",
        "origin": "vendor"
      },
      {
        "method": "official",
        "identifier": "redis-insight",
        "origin": "vendor",
        "url": "https://redis.io/insight/"
      }
    ],
    "verify": {
      "binary": "redis-insight"
    }
  },
  {
    "id": "beekeeper-studio",
    "name": "Beekeeper Studio",
    "description": "Modern and easy to use SQL client for MySQL, Postgres, SQLite, and SQL Server.",
    "category": "Developer",
    "homepage": "https://www.beekeeperstudio.io/",
    "popularity": 83,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "io.beekeeperstudio.Studio",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "beekeeper-studio",
        "origin": "vendor"
      },
      {
        "method": "official",
        "identifier": "beekeeper-studio",
        "origin": "vendor",
        "url": "https://www.beekeeperstudio.io/get"
      }
    ],
    "verify": {
      "binary": "beekeeper-studio"
    }
  },
  {
    "id": "mongodb-compass",
    "name": "MongoDB Compass",
    "description": "GUI for MongoDB to query, visualize and optimize database schemas.",
    "category": "Web Developer",
    "homepage": "https://www.mongodb.com/products/tools/compass",
    "popularity": 80,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "com.mongodb.Compass",
        "origin": "community"
      },
      {
        "method": "official",
        "identifier": "mongodb-compass",
        "origin": "vendor",
        "url": "https://www.mongodb.com/try/download/compass"
      }
    ]
  },
  {
    "id": "gitlab-cli",
    "name": "GitLab CLI",
    "description": "GitLab command line tool bringing GitLab to your terminal.",
    "category": "Developer",
    "homepage": "https://gitlab.com/gitlab-org/cli",
    "popularity": 79,
    "installation": [
      {
        "method": "dnf",
        "identifier": "glab",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "glab",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "glab",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "glab"
    }
  },
  {
    "id": "libreoffice",
    "name": "LibreOffice",
    "description": "Comprehensive office productivity suite including Writer, Calc, and Impress.",
    "category": "Student",
    "homepage": "https://www.libreoffice.org/",
    "popularity": 94,
    "installation": [
      {
        "method": "apt",
        "identifier": "libreoffice",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "libreoffice",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "libreoffice-fresh",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.libreoffice.LibreOffice",
        "origin": "distro"
      },
      {
        "method": "snap",
        "identifier": "libreoffice",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "libreoffice"
    }
  },
  {
    "id": "onlyoffice",
    "name": "ONLYOFFICE Desktop Editors",
    "description": "Office suite for working with documents, spreadsheets, presentations, and PDF forms.",
    "category": "Student",
    "homepage": "https://www.onlyoffice.com/",
    "popularity": 83,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "org.onlyoffice.desktopeditors",
        "origin": "vendor"
      },
      {
        "method": "snap",
        "identifier": "onlyoffice-desktopeditors",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "onlyoffice-desktopeditors"
    }
  },
  {
    "id": "obsidian",
    "name": "Obsidian",
    "description": "Knowledge base and note-taking software working on local Markdown files.",
    "category": "Student",
    "homepage": "https://obsidian.md/",
    "popularity": 92,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "md.obsidian.Obsidian",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "obsidian",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "obsidian"
    }
  },
  {
    "id": "joplin",
    "name": "Joplin",
    "description": "Secure, open-source note taking and to-do application with end-to-end sync.",
    "category": "Student",
    "homepage": "https://joplinapp.org/",
    "popularity": 81,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "net.cozic.joplin_desktop",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "joplin-desktop",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "joplin-desktop"
    }
  },
  {
    "id": "zotero",
    "name": "Zotero",
    "description": "Assistant to collect, organize, annotate, cite, and share research sources.",
    "category": "Student",
    "homepage": "https://www.zotero.org/",
    "popularity": 84,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "org.zotero.Zotero",
        "origin": "community"
      },
      {
        "method": "official",
        "identifier": "zotero",
        "origin": "vendor",
        "url": "https://www.zotero.org/download/"
      }
    ]
  },
  {
    "id": "bleachbit",
    "name": "BleachBit",
    "description": "System cleaner freeing disk space and maintaining privacy.",
    "category": "General",
    "homepage": "https://www.bleachbit.org/",
    "popularity": 82,
    "installation": [
      {
        "method": "apt",
        "identifier": "bleachbit",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "bleachbit",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "bleachbit",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "bleachbit"
    }
  },
  {
    "id": "stacer",
    "name": "Stacer",
    "description": "Linux system optimizer and monitoring dashboard.",
    "category": "General",
    "homepage": "https://github.com/oguzhaninan/Stacer",
    "popularity": 79,
    "installation": [
      {
        "method": "apt",
        "identifier": "stacer",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "stacer",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "stacer",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "stacer"
    }
  },
  {
    "id": "baobab",
    "name": "GNOME Disk Usage Analyzer",
    "description": "Graphical disk usage analyzer for the GNOME desktop.",
    "category": "General",
    "homepage": "https://apps.gnome.org/Baobab/",
    "popularity": 85,
    "installation": [
      {
        "method": "apt",
        "identifier": "baobab",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "baobab",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "baobab",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.gnome.baobab",
        "origin": "distro"
      }
    ],
    "verify": {
      "binary": "baobab"
    }
  },
  {
    "id": "filelight",
    "name": "Filelight",
    "description": "Disk space usage visualizer using concentric pie charts by KDE.",
    "category": "General",
    "homepage": "https://apps.kde.org/filelight/",
    "popularity": 77,
    "installation": [
      {
        "method": "apt",
        "identifier": "filelight",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "filelight",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "filelight",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.kde.filelight",
        "origin": "distro"
      }
    ],
    "verify": {
      "binary": "filelight"
    }
  },
  {
    "id": "gnome-disk-utility",
    "name": "GNOME Disks",
    "description": "Disk management utility for inspecting, formatting, and partitioning drives.",
    "category": "Developer",
    "homepage": "https://apps.gnome.org/DiskUtility/",
    "popularity": 88,
    "installation": [
      {
        "method": "apt",
        "identifier": "gnome-disk-utility",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "gnome-disk-utility",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "gnome-disk-utility",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "gnome-disks"
    }
  },
  {
    "id": "okular",
    "name": "Okular",
    "description": "Universal document viewer for PDFs, EPubs, and comics by KDE.",
    "category": "Student",
    "homepage": "https://okular.kde.org/",
    "popularity": 87,
    "installation": [
      {
        "method": "apt",
        "identifier": "okular",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "okular",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "okular",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.kde.okular",
        "origin": "distro"
      }
    ],
    "verify": {
      "binary": "okular"
    }
  },
  {
    "id": "evince",
    "name": "Evince Document Viewer",
    "description": "Document viewer for multiple document formats by GNOME.",
    "category": "Student",
    "homepage": "https://apps.gnome.org/Evince/",
    "popularity": 86,
    "installation": [
      {
        "method": "apt",
        "identifier": "evince",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "evince",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "evince",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.gnome.Evince",
        "origin": "distro"
      }
    ],
    "verify": {
      "binary": "evince"
    }
  },
  {
    "id": "keepassxc",
    "name": "KeePassXC",
    "description": "Secure, offline password manager supporting modern encrypted databases.",
    "category": "General",
    "homepage": "https://keepassxc.org/",
    "popularity": 91,
    "installation": [
      {
        "method": "apt",
        "identifier": "keepassxc",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "keepassxc",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "keepassxc",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.keepassxc.KeePassXC",
        "origin": "vendor"
      },
      {
        "method": "snap",
        "identifier": "keepassxc",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "keepassxc"
    }
  },
  {
    "id": "bitwarden",
    "name": "Bitwarden",
    "description": "End-to-end encrypted password and secrets manager for desktop.",
    "category": "General",
    "homepage": "https://bitwarden.com/",
    "popularity": 93,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "com.bitwarden.desktop",
        "origin": "vendor"
      },
      {
        "method": "snap",
        "identifier": "bitwarden",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "bitwarden"
    }
  },
  {
    "id": "remmina",
    "name": "Remmina",
    "description": "Remote desktop client supporting RDP, VNC, SPICE, and SSH.",
    "category": "General",
    "homepage": "https://remmina.org/",
    "popularity": 87,
    "installation": [
      {
        "method": "apt",
        "identifier": "remmina",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "remmina",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "remmina",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.remmina.Remmina",
        "origin": "vendor"
      },
      {
        "method": "snap",
        "identifier": "remmina",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "remmina"
    }
  },
  {
    "id": "peazip",
    "name": "PeaZip",
    "description": "Free file archiver utility supporting 7Z, RAR, TAR, and ZIP extraction.",
    "category": "General",
    "homepage": "https://peazip.github.io/",
    "popularity": 76,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "io.github.peazip.PeaZip",
        "origin": "vendor"
      }
    ]
  },
  {
    "id": "p7zip",
    "name": "p7zip",
    "description": "High compression ratio archive utility supporting 7z format.",
    "category": "General",
    "homepage": "https://p7zip.sourceforge.net/",
    "popularity": 85,
    "installation": [
      {
        "method": "apt",
        "identifier": "p7zip-full",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "p7zip",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "p7zip",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "7z"
    }
  },
  {
    "id": "syncthing",
    "name": "Syncthing",
    "description": "Continuous file synchronization program that synchronizes files in real time.",
    "category": "General",
    "homepage": "https://syncthing.net/",
    "popularity": 89,
    "installation": [
      {
        "method": "apt",
        "identifier": "syncthing",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "syncthing",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "syncthing",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "syncthing"
    }
  },
  {
    "id": "redshift",
    "name": "Redshift",
    "description": "Screen color temperature adjuster according to the position of the sun.",
    "category": "General",
    "homepage": "https://github.com/jonls/redshift",
    "popularity": 83,
    "installation": [
      {
        "method": "apt",
        "identifier": "redshift-gtk",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "redshift-gtk",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "redshift",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "redshift"
    }
  },
  {
    "id": "rclone",
    "name": "Rclone",
    "description": "Command-line tool to manage files on cloud storage like S3, Drive and Dropbox.",
    "category": "DevOps",
    "homepage": "https://rclone.org/",
    "popularity": 88,
    "installation": [
      {
        "method": "apt",
        "identifier": "rclone",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "rclone",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "rclone",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "rclone"
    }
  },
  {
    "id": "virt-manager",
    "name": "Virtual Machine Manager",
    "description": "Desktop user interface for managing KVM and QEMU virtual machines.",
    "category": "DevOps",
    "homepage": "https://virt-manager.org/",
    "popularity": 87,
    "installation": [
      {
        "method": "apt",
        "identifier": "virt-manager",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "virt-manager",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "virt-manager",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "virt-manager"
    }
  },
  {
    "id": "xournalpp",
    "name": "Xournal++",
    "description": "Handwriting notetaking software with PDF annotation support.",
    "category": "Student",
    "homepage": "https://xournalpp.github.io/",
    "popularity": 82,
    "installation": [
      {
        "method": "apt",
        "identifier": "xournalpp",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "xournalpp",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "xournalpp",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "com.github.xournalpp.xournalpp",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "xournalpp"
    }
  },
  {
    "id": "ulauncher",
    "name": "Ulauncher",
    "description": "Application launcher for Linux with extensions, fuzzy search, and custom themes.",
    "category": "General",
    "homepage": "https://ulauncher.io/",
    "popularity": 84,
    "installation": [
      {
        "method": "pacman",
        "identifier": "ulauncher",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "official",
        "identifier": "ulauncher",
        "origin": "vendor",
        "url": "https://ulauncher.io/#download"
      }
    ],
    "verify": {
      "binary": "ulauncher"
    }
  },
  {
    "id": "copyq",
    "name": "CopyQ Clipboard Manager",
    "description": "Advanced clipboard manager with searchable and editable history.",
    "category": "General",
    "homepage": "https://hluk.github.io/CopyQ/",
    "popularity": 80,
    "installation": [
      {
        "method": "apt",
        "identifier": "copyq",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "copyq",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "copyq",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "com.github.hluk.copyq",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "copyq"
    }
  },
  {
    "id": "blender",
    "name": "Blender",
    "description": "Free and open-source 3D creation suite supporting modeling, rigging, and animation.",
    "category": "Content Creator",
    "homepage": "https://www.blender.org/",
    "popularity": 95,
    "installation": [
      {
        "method": "apt",
        "identifier": "blender",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "blender",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "blender",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.blender.Blender",
        "origin": "vendor"
      },
      {
        "method": "snap",
        "identifier": "blender",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "blender"
    }
  },
  {
    "id": "kdenlive",
    "name": "Kdenlive",
    "description": "Powerful multi-track open-source video editor built on MLT framework.",
    "category": "Content Creator",
    "homepage": "https://kdenlive.org/",
    "popularity": 88,
    "installation": [
      {
        "method": "apt",
        "identifier": "kdenlive",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "kdenlive",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "kdenlive",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.kde.kdenlive",
        "origin": "distro"
      }
    ],
    "verify": {
      "binary": "kdenlive"
    }
  },
  {
    "id": "inkscape",
    "name": "Inkscape",
    "description": "Professional vector graphics editor for creating illustrations and icons.",
    "category": "Content Creator",
    "homepage": "https://inkscape.org/",
    "popularity": 91,
    "installation": [
      {
        "method": "apt",
        "identifier": "inkscape",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "inkscape",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "inkscape",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.inkscape.Inkscape",
        "origin": "vendor"
      },
      {
        "method": "snap",
        "identifier": "inkscape",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "inkscape"
    }
  },
  {
    "id": "krita",
    "name": "Krita",
    "description": "Digital painting and illustration program designed for concept artists and illustrators.",
    "category": "Content Creator",
    "homepage": "https://krita.org/",
    "popularity": 89,
    "installation": [
      {
        "method": "apt",
        "identifier": "krita",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "krita",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "krita",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.kde.krita",
        "origin": "distro"
      },
      {
        "method": "snap",
        "identifier": "krita",
        "origin": "distro"
      }
    ],
    "verify": {
      "binary": "krita"
    }
  },
  {
    "id": "shotcut",
    "name": "Shotcut",
    "description": "Free, open source, cross-platform video editor supporting 4K resolutions.",
    "category": "Content Creator",
    "homepage": "https://shotcut.org/",
    "popularity": 82,
    "installation": [
      {
        "method": "pacman",
        "identifier": "shotcut",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.shotcut.Shotcut",
        "origin": "vendor"
      },
      {
        "method": "snap",
        "identifier": "shotcut",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "shotcut"
    }
  },
  {
    "id": "handbrake",
    "name": "HandBrake",
    "description": "Open-source video transcoder for converting video from nearly any format.",
    "category": "Content Creator",
    "homepage": "https://handbrake.fr/",
    "popularity": 90,
    "installation": [
      {
        "method": "apt",
        "identifier": "handbrake",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "handbrake",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "handbrake",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "fr.handbrake.ghb",
        "origin": "vendor"
      }
    ]
  },
  {
    "id": "ffmpeg",
    "name": "FFmpeg",
    "description": "Complete solution to record, convert, transcode, and stream audio and video.",
    "category": "Content Creator",
    "homepage": "https://ffmpeg.org/",
    "popularity": 96,
    "installation": [
      {
        "method": "apt",
        "identifier": "ffmpeg",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "pacman",
        "identifier": "ffmpeg",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "ffmpeg",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "ffmpeg"
    }
  },
  {
    "id": "darktable",
    "name": "Darktable",
    "description": "Photography workflow application and raw developer managing digital negatives.",
    "category": "Content Creator",
    "homepage": "https://www.darktable.org/",
    "popularity": 84,
    "installation": [
      {
        "method": "apt",
        "identifier": "darktable",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "darktable",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "darktable",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.darktable.Darktable",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "darktable"
    }
  },
  {
    "id": "rawtherapee",
    "name": "RawTherapee",
    "description": "Non-destructive raw photo processing system aimed at high precision.",
    "category": "Content Creator",
    "homepage": "https://rawtherapee.com/",
    "popularity": 80,
    "installation": [
      {
        "method": "apt",
        "identifier": "rawtherapee",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "rawtherapee",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "rawtherapee",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "com.rawtherapee.RawTherapee",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "rawtherapee"
    }
  },
  {
    "id": "mpv",
    "name": "mpv",
    "description": "Command-line video player with broad format support and high quality output.",
    "category": "General",
    "homepage": "https://mpv.io/",
    "popularity": 92,
    "installation": [
      {
        "method": "apt",
        "identifier": "mpv",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "mpv",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "mpv",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "io.mpv.Mpv",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "mpv"
    }
  },
  {
    "id": "strawberry",
    "name": "Strawberry Music Player",
    "description": "Music player and music collection organizer aimed at audio enthusiasts.",
    "category": "General",
    "homepage": "https://www.strawberrymusicplayer.org/",
    "popularity": 79,
    "installation": [
      {
        "method": "apt",
        "identifier": "strawberry",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "strawberry",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "strawberry",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.strawberrymusicplayer.strawberry",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "strawberry"
    }
  },
  {
    "id": "rhythmbox",
    "name": "Rhythmbox",
    "description": "Music playing application for GNOME that makes listening and organizing music easy.",
    "category": "General",
    "homepage": "https://gitlab.gnome.org/GNOME/rhythmbox",
    "popularity": 81,
    "installation": [
      {
        "method": "apt",
        "identifier": "rhythmbox",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "rhythmbox",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "rhythmbox",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.gnome.Rhythmbox3",
        "origin": "distro"
      }
    ],
    "verify": {
      "binary": "rhythmbox"
    }
  },
  {
    "id": "simplescreenrecorder",
    "name": "SimpleScreenRecorder",
    "description": "Feature-rich screen recorder for programs and games that is fast and easy to use.",
    "category": "Content Creator",
    "homepage": "https://www.maartenbaert.be/simplescreenrecorder/",
    "popularity": 83,
    "installation": [
      {
        "method": "apt",
        "identifier": "simplescreenrecorder",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "simplescreenrecorder",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "simplescreenrecorder",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "simplescreenrecorder"
    }
  },
  {
    "id": "imagemagick",
    "name": "ImageMagick",
    "description": "Software suite to create, edit, compose, or convert bitmap images.",
    "category": "Content Creator",
    "homepage": "https://imagemagick.org/",
    "popularity": 91,
    "installation": [
      {
        "method": "apt",
        "identifier": "imagemagick",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "ImageMagick",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "imagemagick",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "magick"
    }
  },
  {
    "id": "peek",
    "name": "Peek Animated GIF Recorder",
    "description": "Simple animated GIF recorder with an easy-to-use interface.",
    "category": "Content Creator",
    "homepage": "https://github.com/phw/peek",
    "popularity": 80,
    "installation": [
      {
        "method": "apt",
        "identifier": "peek",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "peek",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "peek",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "com.uploadedlobster.peek",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "peek"
    }
  },
  {
    "id": "kooha",
    "name": "Kooha Screen Recorder",
    "description": "Elegantly simple screen recorder with support for Wayland and X11.",
    "category": "Content Creator",
    "homepage": "https://github.com/SeaDve/Kooha",
    "popularity": 78,
    "installation": [
      {
        "method": "pacman",
        "identifier": "kooha",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "io.github.seadve.Kooha",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "kooha"
    }
  },
  {
    "id": "lmms",
    "name": "LMMS",
    "description": "Digital audio workstation for making music, creating beats, and synthesizing sound.",
    "category": "Content Creator",
    "homepage": "https://lmms.io/",
    "popularity": 82,
    "installation": [
      {
        "method": "apt",
        "identifier": "lmms",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "lmms",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "lmms",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "io.lmms.LMMS",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "lmms"
    }
  },
  {
    "id": "signal-desktop",
    "name": "Signal Desktop",
    "description": "Private messenger with state-of-the-art end-to-end encryption.",
    "category": "General",
    "homepage": "https://signal.org/",
    "popularity": 92,
    "installation": [
      {
        "method": "apt",
        "identifier": "signal-desktop",
        "origin": "vendor",
        "distros": [
          "Ubuntu",
          "Debian"
        ],
        "url": "https://signal.org/download/linux/"
      },
      {
        "method": "pacman",
        "identifier": "signal-desktop",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.signal.Signal",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "signal-desktop",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "signal-desktop"
    }
  },
  {
    "id": "element-desktop",
    "name": "Element",
    "description": "Secure, decentralized collaboration app powered by the Matrix network.",
    "category": "Developer",
    "homepage": "https://element.io/",
    "popularity": 86,
    "installation": [
      {
        "method": "apt",
        "identifier": "element-desktop",
        "origin": "vendor",
        "distros": [
          "Ubuntu",
          "Debian"
        ],
        "url": "https://element.io/download"
      },
      {
        "method": "pacman",
        "identifier": "element-desktop",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "im.riot.Riot",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "element-desktop"
    }
  },
  {
    "id": "matrix-fractal",
    "name": "Fractal Matrix Client",
    "description": "Matrix messaging client written in Rust for the GNOME desktop.",
    "category": "Developer",
    "homepage": "https://gitlab.gnome.org/World/fractal",
    "popularity": 76,
    "installation": [
      {
        "method": "pacman",
        "identifier": "fractal",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "org.gnome.Fractal",
        "origin": "distro"
      }
    ],
    "verify": {
      "binary": "fractal"
    }
  },
  {
    "id": "hexchat",
    "name": "HexChat",
    "description": "IRC chat client based on XChat that is easy to use and highly customizable.",
    "category": "General",
    "homepage": "https://hexchat.github.io/",
    "popularity": 81,
    "installation": [
      {
        "method": "apt",
        "identifier": "hexchat",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "hexchat",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "hexchat",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "io.github.Hexchat",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "hexchat"
    }
  },
  {
    "id": "weechat",
    "name": "WeeChat",
    "description": "Fast, light, and extensible chat client with terminal interface.",
    "category": "General",
    "homepage": "https://weechat.org/",
    "popularity": 83,
    "installation": [
      {
        "method": "apt",
        "identifier": "weechat",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "weechat",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "weechat",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "weechat"
    }
  },
  {
    "id": "irssi",
    "name": "Irssi",
    "description": "Terminal-based IRC client designed for text terminals and UNIX servers.",
    "category": "General",
    "homepage": "https://irssi.org/",
    "popularity": 79,
    "installation": [
      {
        "method": "apt",
        "identifier": "irssi",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "irssi",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "irssi",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "snap",
        "identifier": "irssi",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "irssi"
    }
  },
  {
    "id": "mumble",
    "name": "Mumble",
    "description": "Low-latency, high quality open source voice chat application.",
    "category": "General",
    "homepage": "https://www.mumble.info/",
    "popularity": 82,
    "installation": [
      {
        "method": "apt",
        "identifier": "mumble",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "mumble",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "mumble",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "info.mumble.Mumble",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "mumble"
    }
  },
  {
    "id": "mattermost-desktop",
    "name": "Mattermost Desktop",
    "description": "Open-source platform for secure team collaboration and messaging.",
    "category": "General",
    "homepage": "https://mattermost.com/",
    "popularity": 80,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "com.mattermost.Desktop",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "mattermost-desktop",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "mattermost-desktop"
    }
  },
  {
    "id": "zulip",
    "name": "Zulip Desktop",
    "description": "Organized team chat with thread-based messaging model.",
    "category": "Developer",
    "homepage": "https://zulip.com/",
    "popularity": 81,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "org.zulip.Zulip",
        "origin": "vendor"
      },
      {
        "method": "snap",
        "identifier": "zulip",
        "origin": "vendor"
      }
    ],
    "verify": {
      "binary": "zulip"
    }
  },
  {
    "id": "session-desktop",
    "name": "Session Desktop",
    "description": "Private messenger routing messages through a decentralized onion network.",
    "category": "General",
    "homepage": "https://getsession.org/",
    "popularity": 77,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "network.loki.Session",
        "origin": "community"
      }
    ]
  },
  {
    "id": "briar",
    "name": "Briar Desktop",
    "description": "Peer-to-peer encrypted messaging app that works over Tor or local networks.",
    "category": "Developer",
    "homepage": "https://briarproject.org/",
    "popularity": 75,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "org.briarproject.Briar",
        "origin": "vendor"
      }
    ]
  },
  {
    "id": "jupyter",
    "name": "JupyterLab",
    "description": "Web-based interactive computing platform for notebooks, code, and data.",
    "category": "Data & AI",
    "homepage": "https://jupyter.org/",
    "popularity": 93,
    "featured": true,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "org.jupyter.JupyterLab",
        "origin": "community"
      },
      {
        "method": "pacman",
        "identifier": "jupyterlab",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "official",
        "identifier": "jupyterlab",
        "origin": "vendor",
        "url": "https://jupyter.org/install"
      }
    ],
    "verify": {
      "binary": "jupyter"
    }
  },
  {
    "id": "ollama",
    "name": "Ollama",
    "description": "Get up and running with large language models locally on Linux.",
    "category": "Data & AI",
    "homepage": "https://ollama.com/",
    "popularity": 95,
    "featured": true,
    "installation": [
      {
        "method": "pacman",
        "identifier": "ollama",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "official",
        "identifier": "ollama",
        "origin": "vendor",
        "url": "https://ollama.com/download"
      }
    ],
    "verify": {
      "binary": "ollama"
    }
  },
  {
    "id": "duckdb",
    "name": "DuckDB",
    "description": "In-process SQL OLAP database management system for fast analytical queries.",
    "category": "Data & AI",
    "homepage": "https://duckdb.org/",
    "popularity": 88,
    "installation": [
      {
        "method": "pacman",
        "identifier": "duckdb",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "official",
        "identifier": "duckdb",
        "origin": "vendor",
        "url": "https://duckdb.org/docs/installation/"
      }
    ],
    "verify": {
      "binary": "duckdb"
    }
  },
  {
    "id": "steam",
    "name": "Steam",
    "description": "Digital storefront and gaming platform by Valve with Proton compatibility.",
    "category": "Gaming",
    "homepage": "https://store.steampowered.com/",
    "popularity": 98,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "steam-installer",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "steam",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "steam",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "com.valvesoftware.Steam",
        "origin": "community"
      },
      {
        "method": "snap",
        "identifier": "steam",
        "origin": "distro"
      },
      {
        "method": "official",
        "identifier": "steam",
        "origin": "vendor",
        "url": "https://store.steampowered.com/about/"
      }
    ],
    "verify": {
      "binary": "steam"
    }
  },
  {
    "id": "lutris",
    "name": "Lutris",
    "description": "Open source video game preservation and management platform for Linux.",
    "category": "Gaming",
    "homepage": "https://lutris.net/",
    "popularity": 90,
    "featured": true,
    "installation": [
      {
        "method": "apt",
        "identifier": "lutris",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "lutris",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "lutris",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      },
      {
        "method": "flatpak",
        "identifier": "net.lutris.Lutris",
        "origin": "community"
      }
    ],
    "verify": {
      "binary": "lutris"
    }
  },
  {
    "id": "heroic-games-launcher",
    "name": "Heroic Games Launcher",
    "description": "Open source game launcher for Epic Games, GOG, and Prime Gaming.",
    "category": "Gaming",
    "homepage": "https://heroicgameslauncher.com/",
    "popularity": 87,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "com.heroicgameslauncher.hgl",
        "origin": "community"
      },
      {
        "method": "official",
        "identifier": "heroic-games-launcher",
        "origin": "vendor",
        "url": "https://heroicgameslauncher.com/downloads"
      }
    ]
  },
  {
    "id": "mangohud",
    "name": "MangoHud",
    "description": "Vulkan and OpenGL overlay for monitoring FPS, temperatures, and system stats.",
    "category": "Gaming",
    "homepage": "https://github.com/flightlessmango/MangoHud",
    "popularity": 85,
    "installation": [
      {
        "method": "apt",
        "identifier": "mangohud",
        "origin": "distro",
        "distros": [
          "Ubuntu",
          "Debian"
        ]
      },
      {
        "method": "dnf",
        "identifier": "mangohud",
        "origin": "distro",
        "distros": [
          "Fedora"
        ]
      },
      {
        "method": "pacman",
        "identifier": "mangohud",
        "origin": "distro",
        "distros": [
          "Arch Linux"
        ]
      }
    ],
    "verify": {
      "binary": "mangohud"
    }
  },
  {
    "id": "bottles",
    "name": "Bottles",
    "description": "Easily manage Wine and Proton prefixes to run Windows software and games.",
    "category": "Gaming",
    "homepage": "https://usebottles.com/",
    "popularity": 88,
    "installation": [
      {
        "method": "flatpak",
        "identifier": "com.usebottles.bottles",
        "origin": "community"
      },
      {
        "method": "official",
        "identifier": "bottles",
        "origin": "vendor",
        "url": "https://usebottles.com/download/"
      }
    ]
  }
] as const;
