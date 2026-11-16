"use strict";
// Ready-made search targets for the guide. Every URL was checked to respond
// (some sites block automated checks but work in a browser).
BK.PRESETS = [
  {
    "id": "search",
    "items": [
      {
        "n": "DuckDuckGo",
        "a": "@ddg",
        "u": "https://duckduckgo.com/?q=%s"
      },
      {
        "n": "Startpage",
        "a": "@sp",
        "u": "https://www.startpage.com/sp/search?query=%s"
      },
      {
        "n": "Ecosia",
        "a": "@eco",
        "u": "https://www.ecosia.org/search?q=%s"
      },
      {
        "n": "Brave Search",
        "a": "@brave",
        "u": "https://search.brave.com/search?q=%s"
      },
      {
        "n": "Qwant",
        "a": "@qw",
        "u": "https://www.qwant.com/?q=%s"
      }
    ]
  },
  {
    "id": "knowledge",
    "items": [
      {
        "n": "Wikipedia (de)",
        "a": "@wde",
        "u": "https://de.wikipedia.org/w/index.php?search=%s"
      },
      {
        "n": "Wikipedia (en)",
        "a": "@wen",
        "u": "https://en.wikipedia.org/w/index.php?search=%s"
      },
      {
        "n": "Wiktionary (de)",
        "a": "@wikt",
        "u": "https://de.wiktionary.org/w/index.php?search=%s"
      },
      {
        "n": "Duden",
        "a": "@duden",
        "u": "https://www.duden.de/suchen/dudenonline/%s"
      },
      {
        "n": "Wolfram|Alpha",
        "a": "@wa",
        "u": "https://www.wolframalpha.com/input?i=%s"
      },
      {
        "n": "Internet Archive",
        "a": "@archive",
        "u": "https://web.archive.org/web/*/%s"
      }
    ]
  },
  {
    "id": "translate",
    "items": [
      {
        "n": "DeepL",
        "a": "@deepl",
        "u": "https://www.deepl.com/translator#auto/de/%s"
      },
      {
        "n": "dict.cc",
        "a": "@dict",
        "u": "https://www.dict.cc/?s=%s"
      },
      {
        "n": "LEO",
        "a": "@leo",
        "u": "https://dict.leo.org/englisch-deutsch/%s"
      },
      {
        "n": "Linguee",
        "a": "@linguee",
        "u": "https://www.linguee.de/deutsch-englisch/search?query=%s"
      },
      {
        "n": "Google Übersetzer",
        "a": "@gt",
        "u": "https://translate.google.com/?sl=auto&tl=de&text=%s"
      }
    ]
  },
  {
    "id": "maps",
    "items": [
      {
        "n": "Google Maps",
        "a": "@maps",
        "u": "https://www.google.com/maps/search/%s"
      },
      {
        "n": "OpenStreetMap",
        "a": "@osm",
        "u": "https://www.openstreetmap.org/search?query=%s"
      }
    ]
  },
  {
    "id": "media",
    "items": [
      {
        "n": "YouTube",
        "a": "@yt",
        "u": "https://www.youtube.com/results?search_query=%s"
      },
      {
        "n": "Twitch",
        "a": "@twitch",
        "u": "https://www.twitch.tv/search?term=%s"
      },
      {
        "n": "Spotify",
        "a": "@spotify",
        "u": "https://open.spotify.com/search/%s"
      },
      {
        "n": "IMDb",
        "a": "@imdb",
        "u": "https://www.imdb.com/find/?q=%s"
      },
      {
        "n": "Reddit",
        "a": "@reddit",
        "u": "https://www.reddit.com/search/?q=%s"
      },
      {
        "n": "Pinterest",
        "a": "@pin",
        "u": "https://www.pinterest.com/search/pins/?q=%s"
      },
      {
        "n": "Unsplash",
        "a": "@unsplash",
        "u": "https://unsplash.com/s/photos/%s"
      }
    ]
  },
  {
    "id": "shopping",
    "items": [
      {
        "n": "Amazon.de",
        "a": "@amazon",
        "u": "https://www.amazon.de/s?k=%s"
      },
      {
        "n": "eBay.de",
        "a": "@ebay",
        "u": "https://www.ebay.de/sch/i.html?_nkw=%s"
      },
      {
        "n": "Kleinanzeigen",
        "a": "@ka",
        "u": "https://www.kleinanzeigen.de/s-%s/k0"
      },
      {
        "n": "idealo",
        "a": "@idealo",
        "u": "https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=%s"
      },
      {
        "n": "Geizhals",
        "a": "@geiz",
        "u": "https://geizhals.de/?fs=%s"
      },
      {
        "n": "Chefkoch",
        "a": "@chefkoch",
        "u": "https://www.chefkoch.de/rs/s0/%s/Rezepte.html"
      }
    ]
  },
  {
    "id": "dev",
    "items": [
      {
        "n": "GitHub",
        "a": "@github",
        "u": "https://github.com/search?q=%s"
      },
      {
        "n": "MDN Web Docs",
        "a": "@mdn",
        "u": "https://developer.mozilla.org/search?q=%s"
      },
      {
        "n": "Stack Overflow",
        "a": "@so",
        "u": "https://stackoverflow.com/search?q=%s"
      },
      {
        "n": "npm",
        "a": "@npm",
        "u": "https://www.npmjs.com/search?q=%s"
      },
      {
        "n": "PyPI",
        "a": "@pypi",
        "u": "https://pypi.org/search/?q=%s"
      },
      {
        "n": "Can I use",
        "a": "@caniuse",
        "u": "https://caniuse.com/?search=%s"
      },
      {
        "n": "Docker Hub",
        "a": "@docker",
        "u": "https://hub.docker.com/search?q=%s"
      }
    ]
  },
  {
    "id": "linux",
    "items": [
      {
        "n": "Flathub",
        "a": "@flathub",
        "u": "https://flathub.org/apps/search?q=%s"
      },
      {
        "n": "Ubuntu-Pakete",
        "a": "@ubuntu",
        "u": "https://packages.ubuntu.com/search?keywords=%s"
      },
      {
        "n": "ArchWiki",
        "a": "@arch",
        "u": "https://wiki.archlinux.org/index.php?search=%s"
      },
      {
        "n": "KDE Store",
        "a": "@kde",
        "u": "https://store.kde.org/search?search=%s"
      },
      {
        "n": "Ask Ubuntu",
        "a": "@askubuntu",
        "u": "https://askubuntu.com/search?q=%s"
      }
    ]
  },
  {
    "id": "ai",
    "items": [
      {
        "n": "Perplexity",
        "a": "@pplx",
        "u": "https://www.perplexity.ai/search?q=%s"
      },
      {
        "n": "Claude",
        "a": "@claude",
        "u": "https://claude.ai/new?q=%s"
      },
      {
        "n": "ChatGPT",
        "a": "@gpt",
        "u": "https://chatgpt.com/?q=%s"
      }
    ]
  }
];
