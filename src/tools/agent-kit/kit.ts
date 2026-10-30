/**
 * What's in the Agent Kit. Documents live on Google Drive (the PDFs are too big to ship here);
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
