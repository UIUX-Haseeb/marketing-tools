/**
 * Saves project pages (offplan-dubai.com, abudhabipropertyhub.com) into the booklet's local
 * project database, so the app never reads the sites: each page goes through the tool's own parser (scrape.ts), every
 * project picture is downloaded into public/, and the data is written as JSON that points at
 * those copies.
 *
 *   npm run snapshot                        re-save every project already saved
 *   npm run snapshot -- <project link> …    save these links (new ones, or again)
 *
 * Writes src/tools/project-booklet/projects/<id>.json and public/tools/project-booklet/projects/<id>/.
 * A new project also needs a line in projects/index.ts, under its source (that list is the
 * dropdown's order).
 * Runs scrape.ts with Node's built-in TypeScript support (Node 22.18+ / 24).
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITES, checkProjectUrl, fetchProjectHtml, parseProjectHtml, siteOf } from "../src/tools/project-booklet/scrape.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "src/tools/project-booklet/projects");
const FILES_DIR = path.join(ROOT, "public/tools/project-booklet/projects");
const FILES_URL = "/tools/project-booklet/projects";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif", "image/svg+xml": ".svg" };

async function download(url, site) {
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "image/*" }, signal: AbortSignal.timeout(30000) });
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!res.ok || !EXT[type]) throw new Error(`${url} answered ${res.status} ${type || "(no type)"}`);
  if (siteOf(new URL(res.url).hostname) !== site) throw new Error(`${url} redirected away from ${site.name}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  // The pictures are served from this app's own origin, so a logo must not be able to run anything.
  if (type === "image/svg+xml" && /<script|<foreignObject|javascript:|\son[a-z]+\s*=/i.test(bytes.toString("utf8"))) {
    throw new Error(`${url} has active content — not saved`);
  }
  return { bytes, ext: EXT[type] };
}

async function snapshot(link) {
  const url = checkProjectUrl(link);
  if (typeof url === "string") throw new Error(`${link}: ${url}`);
  const id = url.pathname.split("/").filter(Boolean).pop()?.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  if (!id) throw new Error(`${link}: no project in that link`);

  const site = siteOf(url.hostname);
  const data = parseProjectHtml(await fetchProjectHtml(url), url.toString());

  // Everything is downloaded first; the project's folder is only replaced once all of it arrived.
  const files = new Map(); // file name → bytes
  const sources = {}; // file name → where it came from
  const keep = (src, pic, name) => {
    const file = name + pic.ext;
    files.set(file, pic.bytes);
    sources[file] = src;
    return `${FILES_URL}/${id}/${file}`;
  };
  const one = async (src, name) => (src ? keep(src, await download(src, site), name) : "");

  // The site's galleries sometimes list the same picture twice; keep the first.
  const gallery = [];
  const seen = new Map();
  for (const src of data.gallery) {
    const pic = await download(src, site);
    const hash = createHash("sha1").update(pic.bytes).digest("hex");
    if (seen.has(hash)) {
      console.log(`  ${path.basename(src)} is the same picture as ${path.basename(seen.get(hash))} — left out`);
      continue;
    }
    seen.set(hash, src);
    gallery.push(keep(src, pic, `gallery-${String(gallery.length + 1).padStart(2, "0")}`));
  }
  const saved = {
    ...data,
    heroImage: await one(data.heroImage, "hero"),
    gallery,
    mapImage: await one(data.mapImage, "map"),
    developerLogo: await one(data.developerLogo, "developer-logo"),
    developerImage: await one(data.developerImage, "developer"),
    areaImage: await one(data.areaImage, "area"),
    thumbnail: await one(data.thumbnail, "thumbnail"),
  };

  const dir = path.join(FILES_DIR, id);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (const [file, bytes] of files) await writeFile(path.join(dir, file), bytes);
  await mkdir(DATA_DIR, { recursive: true });
  const record = { id, savedOn: new Date().toISOString().slice(0, 10), sources, data: saved };
  await writeFile(path.join(DATA_DIR, `${id}.json`), `${JSON.stringify(record, null, 2)}\n`);

  const size = [...files.values()].reduce((n, b) => n + b.length, 0);
  console.log(`✓ ${data.name} by ${data.developer} → ${id}: ${files.size} pictures (${gallery.length} in the gallery), ${(size / 1048576).toFixed(1)} MB`);
}

let links = process.argv.slice(2);
if (!links.length) {
  const files = (await readdir(DATA_DIR).catch(() => [])).filter((f) => f.endsWith(".json"));
  links = await Promise.all(files.map(async (f) => JSON.parse(await readFile(path.join(DATA_DIR, f), "utf8")).data.url));
  if (!links.length) {
    console.error(`No saved projects yet. Pass project links from ${SITES.map((s) => s.name).join(" or ")}: npm run snapshot -- https://…/`);
    process.exit(1);
  }
}

let failed = false;
for (const link of links) {
  try {
    await snapshot(link);
  } catch (e) {
    failed = true;
    console.error(`✗ ${e instanceof Error ? e.message : e}`);
  }
}
process.exit(failed ? 1 : 0);
