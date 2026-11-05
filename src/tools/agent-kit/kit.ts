/**
 * What's in the Agent Download Kit. Documents live on Google Drive (the PDFs are too big to ship here);
 * the banners are static files in public/tools/agent-kit/.
 * To add or swap an item, edit this list — the page reads nothing else.
 */
export interface KitDoc {
  name: string;
  description: string;
  /** Google Drive file id (the part after /file/d/ in a share link). */
  driveId: string;
  /** Mockup shown as the preview, path under /public. */
  cover: string;
}

export interface KitBanner {
  name: string;
  description: string;
  /** Path under /public. */
  src: string;
  width: number;
  height: number;
  /** Filename the download is saved as. */
  filename: string;
}

export const KIT_DOCS: KitDoc[] = [
  {
    name: "Company Profile",
    description: "Company Profile 2026 — who Provident is: history, people, companies and offices.",
    driveId: "1NB3LsXOA6o5gmJNT7-_84Xj4sZQKiw6b",
    cover: "/tools/agent-kit/company-profile.jpg",
  },
  {
    name: "Investment Guide",
    description: "The Investment Compass 2026 — the guide to send to buyers and investors.",
    driveId: "1S4iO3Nn6fpcHbT8moPPCC1s7yfLHMEZO",
    cover: "/tools/agent-kit/investment-guide.jpg",
  },
];

export const KIT_BANNERS: KitBanner[] = [
  {
    name: "LinkedIn banner",
    description: "Profile cover for LinkedIn.",
    src: "/tools/agent-kit/linkedin-banner.png",
    width: 1584,
    height: 396,
    filename: "Provident-LinkedIn-banner.png",
  },
  {
    name: "Facebook banner",
    description: "Cover photo for a Facebook profile or page.",
    src: "/tools/agent-kit/facebook-banner.png",
    width: 1702,
    height: 630,
    filename: "Provident-Facebook-banner.png",
  },
];

export const driveView = (id: string) => `https://drive.google.com/file/d/${id}/view`;
export const driveDownload = (id: string) => `https://drive.google.com/uc?export=download&id=${id}`;

/** The brand logo folder on Drive (the source of the Provident files in public/tools/agent-kit/logos/; the mark's
 * files were re-rendered here without the stray dashed outline in the Drive SVG). PVH, Property Management and
 * Premier Finance come from the SVGs in Drive's "Brand Logos" folders; their white versions are those SVGs with
 * the dark ink turned white (the orange dot stays). */
export const LOGO_FOLDER = "https://drive.google.com/drive/folders/1a4cce_vQYlsnrhZrkTH7E97_3TIMo9Lt";

export type LogoFormat = "png" | "jpg" | "pdf";

export interface KitLogo {
  label: string;
  /** What it sits on: navy / colour logos go on light backgrounds, white ones on dark. */
  tone: "navy" | "white";
  /** File stem under /public — each format is `${file}.${format}`. */
  file: string;
  /** Formats on hand. JPG is the logo on a square background (white or navy); PDF is the same square, in vector. */
  formats: LogoFormat[];
}

export interface KitLogoSet {
  name: string;
  description: string;
  /** Start of the downloaded file's name, before the label ("Premier Finance" → "Premier-Finance-White.png"). */
  download: string;
  logos: KitLogo[];
}

const L = "/tools/agent-kit/logos/";

export const KIT_LOGOS: KitLogoSet[] = [
  {
    name: "Wordmark",
    description: "The main logo. Use it wherever there's room.",
    download: "Provident Wordmark",
    logos: [
      { label: "Navy", tone: "navy", file: `${L}provident-navy`, formats: ["png", "jpg", "pdf"] },
      { label: "White", tone: "white", file: `${L}provident-white`, formats: ["png", "jpg", "pdf"] },
    ],
  },
  {
    name: "Logo mark",
    description: "The “p.” — for small or square spaces like profile pictures and favicons.",
    download: "Provident Logo mark",
    logos: [
      { label: "Navy", tone: "navy", file: `${L}provident-mark-navy`, formats: ["png", "jpg", "pdf"] },
      { label: "White", tone: "white", file: `${L}provident-mark-white`, formats: ["png", "jpg", "pdf"] },
    ],
  },
  {
    name: "Provident Vacation Homes",
    description: "PVH — Provident’s holiday homes brand.",
    download: "PVH",
    logos: [
      { label: "Colour", tone: "navy", file: `${L}pvh-colour`, formats: ["png", "jpg", "pdf"] },
      { label: "White", tone: "white", file: `${L}pvh-white`, formats: ["png", "jpg", "pdf"] },
    ],
  },
  {
    name: "Provident Property Management",
    description: "Provident’s property management brand.",
    download: "Provident Property Management",
    logos: [
      { label: "Colour", tone: "navy", file: `${L}property-management-colour`, formats: ["png", "jpg", "pdf"] },
      { label: "White", tone: "white", file: `${L}property-management-white`, formats: ["png", "jpg", "pdf"] },
    ],
  },
  {
    name: "Premier Finance",
    description: "Provident’s finance brand.",
    download: "Premier Finance",
    logos: [
      { label: "Colour", tone: "navy", file: `${L}premier-finance-colour`, formats: ["png", "jpg", "pdf"] },
      { label: "White", tone: "white", file: `${L}premier-finance-white`, formats: ["png", "jpg", "pdf"] },
    ],
  },
];
