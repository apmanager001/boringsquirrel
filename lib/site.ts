import type { Metadata } from "next";
import { env } from "@/lib/env";

export type GameEntry = {
  slug:
    | "sudoku"
    | "wordle"
    | "waffle"
    | "word-search"
    | "oilcap"
    | "acornsweeper";
  name: string;
  eyebrow: string;
  description: string;
  longDescription: string;
  heroImage: string;
  status: string;
  scoreHook: string;
  features: string[];
  keywords: string[];
};

export const siteConfig = {
  name: "Boring Squirrel",
  description:
    "SEO-first browser games, puzzle prototypes, and blog posts about building playful things on the web.",
  url: env.siteUrl,
  logoPath: "/squirrelglasses.webp",
  ogImage: "/squirrelglasses.webp",
  defaultAuthor: env.defaultAuthor,
  defaultKeywords: [
    "browser games",
    "SEO blog",
    "sudoku online",
    "puzzle games",
    "indie game blog",
    "boring squirrel",
  ],
  contactEmail: env.contactTo,
  googleSiteVerification: env.googleSiteVerification,
};

export const primaryNav = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Games", href: "/games" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerLinks = [
  ...primaryNav,
  // { label: "Profile", href: "/profile" },
  // { label: "Settings", href: "/settings" },
  // { label: "Admin", href: "/admin" },
] as const;

export const gameCatalog: GameEntry[] = [
  {
    slug: "sudoku",
    name: "Sudoku",
    eyebrow: "Puzzle",
    description:
      "A playable Sudoku board with easy, medium, and hard generation plus verified score saving.",
    longDescription:
      "Solve Sudoku puzzles across three difficulty levels, add notes to track your logic, and compete on the global leaderboard.",
    heroImage: "/games/sudoku.webp",
    status: "Ready To Play",
    scoreHook:
      "Each completed board scores from difficulty, remaining speed bonus, and mistake control.",
    features: [
      "Easy, medium, and hard puzzle generation with a unique-solution check.",
      "Responsive board with keyboard navigation, mobile keypad input, and pencil marks.",
      "Verified accounts can save a personal best directly into the live game leaderboard.",
    ],
    keywords: [
      "sudoku",
      "daily sudoku",
      "online sudoku",
      "logic game",
      "browser puzzle",
    ],
  },
  {
    slug: "wordle",
    name: "Wordle",
    eyebrow: "Word puzzle",
    description:
      "Guess a five-letter word in six tries with keyboard-first input and verified score saving.",
    longDescription:
      "Take on a fresh five-letter word, read the color feedback, and race the clock for a cleaner score on the leaderboard.",
    heroImage: "/games/wordle.webp",
    status: "Ready To Play",
    scoreHook:
      "Fewer guesses and faster solves keep more of the score intact for verified saves.",
    features: [
      "Fresh five-letter answers are drawn from the shared editable word bank.",
      "Physical keyboard input and a full on-screen key layout keep the game usable on desktop and mobile.",
      "Verified accounts can save their strongest solve once the hidden word is cracked.",
    ],
    keywords: [
      "wordle",
      "word game",
      "guess the word",
      "five letter word",
      "browser word puzzle",
    ],
  },
  {
    slug: "waffle",
    name: "Waffle",
    eyebrow: "Swap puzzle",
    description:
      "Swap letters across six crossing words and finish with moves left for a stronger verified score.",
    longDescription:
      "Untangle a shuffled waffle grid, swap letters into six clean crossings, and bank the remaining move budget on the leaderboard.",
    heroImage: "/squirrelglasses.webp",
    status: "Ready To Play",
    scoreHook:
      "Every swap left in the budget adds bonus value on top of the time-based core score.",
    features: [
      "Each board starts from six crossing five-letter words drawn from the shared bank.",
      "The opening shuffle stays solvable within the move budget because it is produced from controlled swaps.",
      "Verified accounts can save completed grids with their remaining swaps and finish time.",
    ],
    keywords: [
      "waffle game",
      "word waffle",
      "letter swap puzzle",
      "browser word game",
      "crossing word puzzle",
    ],
  },
  {
    slug: "word-search",
    name: "Word Search",
    eyebrow: "Grid hunt",
    description:
      "Scan a fresh letter grid, lock the hidden words, and save the quickest verified clears.",
    longDescription:
      "Trace hidden words across a fresh grid, keep false lines down, and finish fast enough to save a better leaderboard run.",
    heroImage: "/games/search.webp",
    status: "Ready To Play",
    scoreHook:
      "Fast clears and fewer bad selections preserve the most score for the leaderboard.",
    features: [
      "Fresh target words are pulled from the shared word bank and dropped into a new grid each run.",
      "Pointer drag support lets players trace horizontal, vertical, and diagonal words directly on the board.",
      "Verified accounts can save fully cleared grids with time and miss tracking in the score details.",
    ],
    keywords: [
      "word search",
      "hidden word game",
      "letter grid puzzle",
      "browser word search",
      "find the words",
    ],
  },
  {
    slug: "oilcap",
    name: "Oilcap",
    eyebrow: "Pipe strategy",
    description: "Classic remake of Oilcap, a pipe-routing strategy game.",
    longDescription:
      "Choose from a rolling queue of pipe pieces, connect the source to the cap, and keep your score high by building a tight route with minimal leaks or wasted parts.",
    heroImage: "/games/oilcap.png",
    status: "Ready To Play",
    scoreHook:
      "Useful connected pipes score up, while isolated pieces and leaks cut the run back down.",
    features: [
      "Click the pipe you want to place from the queue, then click an open cell to add it to the board and extend your route.",
      "Queue-based placement makes every turn matter instead of filling the board freely.",
      "Live scoring rewards efficient networks, and verified accounts can save best deliveries to the leaderboard.",
    ],
    keywords: [
      "pipe game",
      "oilcap",
      "dos remake",
      "strategy puzzle",
      "grid game",
    ],
  },
  {
    slug: "acornsweeper",
    name: "AcornSweeper",
    eyebrow: "Classic minesweeper",
    description:
      "A twist on minesweeper where hidden acorns replace mines, and you can mark danger with squirrel icons instead of flags.",
    longDescription:
      "Avoid hidden acorns, flag danger with squirrel markers, and clear the field fast enough to post a verified score to the leaderboard.",
    heroImage: "/games/acorn.webp",
    status: "Ready To Play",
    scoreHook:
      "Each difficulty starts with a base score that drops over time, and only cleared fields can be saved.",
    features: [
      "Right-click hidden squares to plant squirrel flags, or switch into flag mode for touch play.",
      "Easy, medium, and hard each generate a fresh field with a safe first reveal zone.",
      "Verified accounts can save clean clears directly into the live leaderboard.",
    ],
    keywords: [
      "minesweeper",
      "browser minesweeper",
      "squirrel game",
      "acorn game",
      "puzzle grid",
    ],
  },
];

export function getGameBySlug(slug: GameEntry["slug"]) {
  return gameCatalog.find((game) => game.slug === slug);
}

export function getSocialLinks() {
  return [
    env.socialXUrl
      ? { label: "X", icon: "/socialIcons/x2.svg", href: env.socialXUrl }
      : null,
    env.socialBlueskyUrl
      ? {
          label: "Bluesky",
          icon: "/socialIcons/bluesky.svg",
          href: env.socialBlueskyUrl,
        }
      : null,
    env.socialGithubUrl
      ? {
          label: "GitHub",
          icon: "/socialIcons/github.svg",
          href: env.socialGithubUrl,
        }
      : null,
  ].filter((item): item is { label: string; href: string; icon: string } =>
    Boolean(item),
  );
}

export function absoluteUrl(pathname = "/") {
  return new URL(pathname, siteConfig.url).toString();
}

export function formatDate(input: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(input));
}

type BuildMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  keywords?: string[];
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  noIndex?: boolean;
};

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  image = siteConfig.ogImage,
  keywords = siteConfig.defaultKeywords,
  type = "website",
  publishedTime,
  modifiedTime,
  tags,
  noIndex = false,
}: BuildMetadataInput): Metadata {
  const imageUrl = image ? absoluteUrl(image) : absoluteUrl(siteConfig.ogImage);

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    keywords,
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
    openGraph: {
      type,
      title: title ?? siteConfig.name,
      description,
      url: path,
      siteName: siteConfig.name,
      images: [
        {
          url: imageUrl,
          alt: title ?? siteConfig.name,
        },
      ],
      ...(type === "article"
        ? {
            publishedTime,
            modifiedTime,
            authors: [siteConfig.defaultAuthor],
            tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? siteConfig.name,
      description,
      images: [imageUrl],
    },
  };
}
