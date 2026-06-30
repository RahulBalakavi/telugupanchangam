// Server-side SEO/AEO rendering.
//
// The app is a client-rendered SPA, so crawlers (and especially AI answer
// engines, which mostly don't run JS) otherwise see an empty <div id="root">.
// For a set of content URLs we inject, into the built index.html:
//   - per-page <title>, description, canonical, and Open Graph tags,
//   - schema.org JSON-LD (Event / HowTo / FAQPage / ItemList), and
//   - a semantic HTML content block inside #root.
// React's createRoot().render() discards that block and renders the live app on
// hydrate, so humans get the SPA and bots get real, indexable, citable content.

import type { Express, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { getAllFestivals } from "./data";
import { getPanchangForDate, getTodayInTimezone } from "./panchang";
import { getMuhurtam } from "./muhurtam";
import { VRATHAMS, vrathamBySlug } from "../client/src/lib/vrathams";
import { festivalContent, festivalImage } from "../client/src/lib/festival-content";

const SITE = "https://mytelugupanchangam.space";
const TZ = "Asia/Kolkata"; // canonical timezone for date-based pages
const abs = (p: string) => SITE + p;

interface PageMeta {
  title: string;
  description: string;
  canonicalPath: string;
  jsonLd: Record<string, unknown>[];
  bodyHtml: string;
  maxAge: number; // seconds for Cache-Control
}

// ---- escaping helpers ----
function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonLdTag(obj: Record<string, unknown>): string {
  // Escape "<" so a string value can never break out of the <script> element.
  const json = JSON.stringify(obj).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

function formatDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD; pin to noon UTC so the displayed date can't shift.
  const d = new Date(dateStr + "T12:00:00Z");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function faqPage(qa: { q: string; a: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

function paragraphs(lines: string[]): string {
  return lines.map((l) => `<p>${esc(l)}</p>`).join("\n");
}

// Render the same Q&A both as visible HTML (indexable content) and, via
// faqPage(), as FAQ structured data — keeping the two in sync.
function faqSection(qa: { q: string; a: string }[]): string {
  const items = qa
    .map(({ q, a }) => `<dt><strong>${esc(q)}</strong></dt>\n<dd>${esc(a)}</dd>`)
    .join("\n");
  return `<section>\n  <h2>Frequently asked questions</h2>\n  <dl>\n${items}\n  </dl>\n</section>`;
}

// Internal-link block appended to every page so crawlers can traverse the site
// and link equity flows between related pages.
function relatedNav(): string {
  return `<nav aria-label="Explore">
  <h2>Explore</h2>
  <ul>
    <li><a href="/today">Today's panchangam &amp; muhurtam</a></li>
    <li><a href="/festivals">Telugu festivals &amp; dates</a></li>
    <li><a href="/vrathams">Vratham (puja) guides</a></li>
    <li><a href="/">Telugu Panchangam home</a></li>
  </ul>
</nav>`;
}

function breadcrumb(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

// The festival (if any) whose puja is this vratham — for a reverse cross-link.
function festivalForVratham(slug: string) {
  return getAllFestivals().find((f) => festivalContent(f.id)?.vrathamSlug === slug);
}

// ---- per-page builders ----

function homePage(): PageMeta {
  const today = getTodayInTimezone(TZ);
  const p = getPanchangForDate(today, TZ);
  const m = getMuhurtam(today, TZ);
  const rahu = m.periods.find((x) => x.nameEn === "Rahu Kalam");
  const abhijit = m.periods.find((x) => x.nameEn === "Abhijit Muhurtam");
  const dateLabel = formatDate(p.date);

  const intro =
    "Telugu Panchangam is a bilingual (Telugu & English) Hindu almanac: the daily panchangam — tithi, nakshatra, paksha, Telugu masa and samvatsara — plus festival dates, muhurtam timings, and step-by-step vratham (puja) guides. All timings are computed from astronomical data.";

  const body = `
<main style="max-width:760px;margin:0 auto;padding:24px;font-family:Georgia,serif">
  <h1>Telugu Panchangam — తెలుగు పంచాంగం</h1>
  <p>${esc(intro)}</p>
  <h2>Today's Panchangam — ${esc(dateLabel)}</h2>
  <ul>
    <li><strong>Tithi:</strong> ${esc(p.tithi)} (${esc(p.tithiTelugu)})</li>
    <li><strong>Nakshatra:</strong> ${esc(p.nakshatra)} (${esc(p.nakshatraTelugu)})</li>
    <li><strong>Paksha:</strong> ${esc(p.paksha)}</li>
    <li><strong>Masa:</strong> ${esc(p.teluguMonthEnglish)} (${esc(p.teluguMonth)})</li>
    <li><strong>Sunrise / Sunset:</strong> ${esc(p.sunrise)} / ${esc(p.sunset)}</li>
    ${rahu ? `<li><strong>Rahu Kalam (avoid):</strong> ${esc(rahu.start)}–${esc(rahu.end)}</li>` : ""}
    ${abhijit ? `<li><strong>Abhijit Muhurtam (auspicious):</strong> ${esc(abhijit.start)}–${esc(abhijit.end)}</li>` : ""}
  </ul>
  <h2>Explore</h2>
  <ul>
    <li><a href="/festivals">Telugu festivals &amp; their dates</a></li>
    <li><a href="/vrathams">Vratham (puja) guides</a></li>
    <li><a href="/today">Today's full panchangam &amp; muhurtam</a></li>
  </ul>
</main>`.trim();

  return {
    title: "Telugu Panchangam — తెలుగు పంచాంగం | Daily Tithi, Nakshatra, Festivals & Muhurtam",
    description:
      "Bilingual Telugu & English Hindu calendar: today's tithi, nakshatra, festival dates, muhurtam timings (rahukalam, abhijit) and step-by-step vratham guides.",
    canonicalPath: "/",
    jsonLd: [
      faqPage([
        {
          q: "What is today's tithi?",
          a: `Today (${dateLabel}) is ${p.tithi} (${p.tithiTelugu}), nakshatra ${p.nakshatra}, in the ${p.paksha} paksha of ${p.teluguMonthEnglish} masa.`,
        },
        rahu
          ? {
              q: "What is the Rahu Kalam today?",
              a: `Rahu Kalam today is from ${rahu.start} to ${rahu.end} (${TZ}); it is traditionally avoided for starting travel and new ventures.`,
            }
          : { q: "What is a panchangam?", a: intro },
      ]),
    ],
    bodyHtml: body,
    maxAge: 600,
  };
}

function panchangPage(dateStr: string, isToday: boolean): PageMeta {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const p = getPanchangForDate(date, TZ);
  const m = getMuhurtam(date, TZ);
  const dateLabel = formatDate(dateStr);
  const muhurtamRows = m.periods
    .map(
      (x) =>
        `<li><strong>${esc(x.nameEn)} (${esc(x.nameTe)}):</strong> ${esc(x.start)}–${esc(x.end)} — ${x.auspicious ? "auspicious" : "inauspicious"}</li>`,
    )
    .join("\n");

  const rahu = m.periods.find((x) => x.nameEn === "Rahu Kalam");
  const yama = m.periods.find((x) => x.nameEn === "Yamagandam");
  const gulika = m.periods.find((x) => x.nameEn === "Gulika Kalam");
  const abhijit = m.periods.find((x) => x.nameEn === "Abhijit Muhurtam");
  // "today" vs a fixed date — phrase questions for the high-intent "...today" queries.
  const whenWord = isToday ? "today" : `on ${dateLabel}`;
  const heading = isToday ? `Today's Panchangam — ${dateLabel}` : `Panchangam for ${dateLabel}`;

  const faq: { q: string; a: string }[] = [
    {
      q: `What is the tithi ${whenWord}?`,
      a: `The tithi ${whenWord} is ${p.tithi} (${p.tithiTelugu}), nakshatra ${p.nakshatra}, in the ${p.paksha} paksha of ${p.teluguMonthEnglish} masa.`,
    },
  ];
  if (rahu) {
    faq.push({
      q: `What is the Rahu Kalam ${whenWord}?`,
      a: `Rahu Kalam ${whenWord} is ${rahu.start}–${rahu.end} (${TZ}) — traditionally avoided for travel and new ventures.`,
    });
  }
  if (abhijit) {
    faq.push({
      q: `What is the Abhijit Muhurtam ${whenWord}?`,
      a: `Abhijit Muhurtam ${whenWord} is ${abhijit.start}–${abhijit.end} (${TZ}) — the auspicious midday window, favourable for travel and new beginnings.`,
    });
  }
  if (rahu && yama && gulika) {
    faq.push({
      q: `Is ${isToday ? "today" : dateLabel} a good day for travel or starting new work?`,
      a: `Avoid Rahu Kalam (${rahu.start}–${rahu.end}), Yamagandam (${yama.start}–${yama.end}) and Gulika Kalam (${gulika.start}–${gulika.end}); the Abhijit Muhurtam${abhijit ? ` (${abhijit.start}–${abhijit.end})` : ""} is the auspicious window.`,
    });
  }

  const body = `
<main style="max-width:760px;margin:0 auto;padding:24px;font-family:Georgia,serif">
  <h1>${esc(heading)}</h1>
  <ul>
    <li><strong>Tithi:</strong> ${esc(p.tithi)} (${esc(p.tithiTelugu)})</li>
    <li><strong>Nakshatra:</strong> ${esc(p.nakshatra)} (${esc(p.nakshatraTelugu)})</li>
    <li><strong>Paksha:</strong> ${esc(p.paksha)}</li>
    <li><strong>Masa:</strong> ${esc(p.teluguMonthEnglish)} (${esc(p.teluguMonth)}), ${esc(p.samvatsaraName)} samvatsara</li>
    <li><strong>Sunrise / Sunset:</strong> ${esc(p.sunrise)} / ${esc(p.sunset)} (${esc(TZ)})</li>
  </ul>
  <h2>Muhurtam timings ${esc(whenWord)}</h2>
  <ul>${muhurtamRows}</ul>
  ${faqSection(faq)}
  ${relatedNav()}
</main>`.trim();

  return {
    title: isToday
      ? `Today's Panchangam — Tithi, Nakshatra, Rahu Kalam & Muhurtam (${dateLabel}) | Telugu Panchangam`
      : `Panchangam for ${dateLabel} — Tithi ${p.tithi}, Nakshatra ${p.nakshatra} | Telugu Panchangam`,
    description: isToday
      ? `Today's Telugu panchangam (${dateLabel}): tithi ${p.tithi}, nakshatra ${p.nakshatra}, Rahu Kalam ${rahu ? `${rahu.start}–${rahu.end}` : ""}, Abhijit muhurtam, sunrise ${p.sunrise}, sunset ${p.sunset}.`
      : `Panchangam for ${dateLabel}: tithi ${p.tithi}, nakshatra ${p.nakshatra}, ${p.paksha} paksha, sunrise ${p.sunrise}, sunset ${p.sunset}, with Rahu Kalam, Yamagandam and Abhijit muhurtam timings.`,
    canonicalPath: isToday ? "/today" : `/panchangam/${dateStr}`,
    jsonLd: [
      faqPage(faq),
      breadcrumb([
        { name: "Home", path: "/" },
        { name: isToday ? "Today's Panchangam" : `Panchangam ${dateStr}`, path: isToday ? "/today" : `/panchangam/${dateStr}` },
      ]),
    ],
    bodyHtml: body,
    // A specific past/future date is immutable; today rolls over daily.
    maxAge: isToday ? 600 : 86400,
  };
}

function festivalsListPage(): PageMeta {
  const fests = getAllFestivals();
  const items = fests
    .map(
      (f) =>
        `<li><a href="/festivals/${esc(f.id)}">${esc(f.name)} (${esc(f.nameTelugu)})</a> — ${esc(formatDate(f.date))}</li>`,
    )
    .join("\n");
  const body = `
<main style="max-width:760px;margin:0 auto;padding:24px;font-family:Georgia,serif">
  <h1>Telugu Festivals &amp; Their Dates</h1>
  <p>Dates and significance of major Telugu and Hindu festivals. Tap a festival for details and, where applicable, its vratham (puja) guide.</p>
  <ul>${items}</ul>
  ${relatedNav()}
</main>`.trim();

  return {
    title: "Telugu Festivals — Dates & Significance | Telugu Panchangam",
    description:
      "List of major Telugu and Hindu festivals with their dates and significance: Ugadi, Sri Rama Navami, Varalakshmi Vratam, Vinayaka Chavithi, Dussehra, Deepavali, Sankranti and more.",
    canonicalPath: "/festivals",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Telugu Festivals",
        itemListElement: fests.map((f, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: f.name,
          url: abs(`/festivals/${f.id}`),
        })),
      },
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Festivals", path: "/festivals" },
      ]),
    ],
    bodyHtml: body,
    maxAge: 3600,
  };
}

function festivalPage(slug: string): PageMeta | null {
  const f = getAllFestivals().find((x) => x.id === slug);
  if (!f) return null;
  const content = festivalContent(f.id);
  const year = f.date.slice(0, 4);
  const dateLabel = formatDate(f.date);
  const about = content?.aboutEn?.length ? content.aboutEn : [f.description];
  const aboutTe = content?.aboutTe?.length ? content.aboutTe : [f.descriptionTelugu];
  const vrathamSlug = content?.vrathamSlug;

  const faq: { q: string; a: string }[] = [
    {
      q: `When is ${f.name} in ${year}?`,
      a: `${f.name} (${f.nameTelugu}) in ${year} falls on ${dateLabel}.`,
    },
    { q: `What is ${f.name} and its significance?`, a: about[0] },
  ];
  if (f.relatedTithi) {
    faq.push({
      q: `On which tithi is ${f.name} celebrated?`,
      a: `${f.name} is observed on ${f.relatedTithi} tithi.`,
    });
  }
  if (about[1]) faq.push({ q: `How is ${f.name} celebrated?`, a: about[1] });
  if (vrathamSlug) {
    faq.push({
      q: `How do you perform the ${f.name} puja at home?`,
      a: `Follow the step-by-step ${f.name} vratham guide, which lists the puja procedure and the full samagri (shopping list).`,
    });
  }

  const body = `
<main style="max-width:760px;margin:0 auto;padding:24px;font-family:Georgia,serif">
  <nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/festivals">Festivals</a> › ${esc(f.name)}</nav>
  <h1>${esc(f.name)} ${esc(year)} — ${esc(f.nameTelugu)}</h1>
  <p><strong>Date:</strong> ${esc(dateLabel)}${f.relatedTithi ? ` · <strong>Tithi:</strong> ${esc(f.relatedTithi)}` : ""}</p>
  ${paragraphs(about)}
  <h2>తెలుగులో</h2>
  ${paragraphs(aboutTe)}
  ${vrathamSlug ? `<p><a href="/vrathams/${esc(vrathamSlug)}">How to perform the ${esc(f.name)} vratham (puja guide) →</a></p>` : ""}
  ${faqSection(faq)}
  ${relatedNav()}
</main>`.trim();

  return {
    title: `${f.name} ${year} — Date, Significance & Puja | Telugu Panchangam`,
    description: `${f.name} (${f.nameTelugu}) ${year} falls on ${dateLabel}. ${f.description}`,
    canonicalPath: `/festivals/${f.id}`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Event",
        name: f.name,
        startDate: f.date,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        description: f.description,
        image: festivalImage(f.id),
        url: abs(`/festivals/${f.id}`),
        location: {
          "@type": "Place",
          name: "India",
          address: { "@type": "PostalAddress", addressCountry: "IN" },
        },
      },
      faqPage(faq),
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Festivals", path: "/festivals" },
        { name: f.name, path: `/festivals/${f.id}` },
      ]),
    ],
    bodyHtml: body,
    maxAge: 3600,
  };
}

function vrathamsListPage(): PageMeta {
  const items = VRATHAMS.map(
    (v) =>
      `<li><a href="/vrathams/${esc(v.slug)}">${esc(v.nameEn)} (${esc(v.nameTe)})</a> — ${esc(v.deityEn)}</li>`,
  ).join("\n");
  const body = `
<main style="max-width:760px;margin:0 auto;padding:24px;font-family:Georgia,serif">
  <h1>Vratham (Puja) Guides</h1>
  <p>Step-by-step guides to perform key vrathams at home, with the puja procedure and samagri (shopping list).</p>
  <ul>${items}</ul>
  ${relatedNav()}
</main>`.trim();

  return {
    title: "Vratham Puja Guides — How to Perform | Telugu Panchangam",
    description:
      "How to perform key vrathams at home with the puja procedure and samagri (shopping list): Varalakshmi, Vinayaka, Satyanarayana and Venkateswara vratam.",
    canonicalPath: "/vrathams",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Vratham Guides",
        itemListElement: VRATHAMS.map((v, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: v.nameEn,
          url: abs(`/vrathams/${v.slug}`),
        })),
      },
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Vrathams", path: "/vrathams" },
      ]),
    ],
    bodyHtml: body,
    maxAge: 3600,
  };
}

function vrathamPage(slug: string): PageMeta | null {
  const v = vrathamBySlug(slug);
  if (!v) return null;
  const supplies = v.samagri.flatMap((g) => g.items.map((it) => it.en));
  const supplyList = supplies.map((s) => `<li>${esc(s)}</li>`).join("\n");

  const relatedFestival = festivalForVratham(v.slug);

  const faq: { q: string; a: string }[] = [
    { q: `When is ${v.nameEn} performed?`, a: v.whenEn },
    { q: `How do you perform ${v.nameEn} at home?`, a: v.aboutEn[0] },
    {
      q: `What samagri (items) are needed for ${v.nameEn}?`,
      a: `The main items include: ${supplies.slice(0, 12).join(", ")}.`,
    },
    {
      q: `Which deity is worshipped in ${v.nameEn}?`,
      a: `${v.nameEn} is dedicated to ${v.deityEn} (${v.deityTe}).`,
    },
  ];

  const body = `
<main style="max-width:760px;margin:0 auto;padding:24px;font-family:Georgia,serif">
  <nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/vrathams">Vrathams</a> › ${esc(v.nameEn)}</nav>
  <h1>${esc(v.nameEn)} — ${esc(v.nameTe)}</h1>
  <p><strong>Deity:</strong> ${esc(v.deityEn)} (${esc(v.deityTe)})</p>
  <h2>When it is performed</h2>
  <p>${esc(v.whenEn)}</p>
  ${paragraphs(v.aboutEn)}
  <h2>Puja samagri (shopping list)</h2>
  <ul>${supplyList}</ul>
  ${relatedFestival ? `<p><a href="/festivals/${esc(relatedFestival.id)}">About the ${esc(relatedFestival.name)} festival →</a></p>` : ""}
  ${faqSection(faq)}
  ${relatedNav()}
</main>`.trim();

  return {
    title: `${v.nameEn} — How to Perform, Puja Procedure & Samagri | Telugu Panchangam`,
    description: `How to perform ${v.nameEn} (${v.nameTe}): when it is observed, the significance, and the full puja samagri (shopping list). Dedicated to ${v.deityEn}.`,
    canonicalPath: `/vrathams/${v.slug}`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: `How to perform ${v.nameEn}`,
        description: v.aboutEn[0],
        supply: supplies.map((s) => ({ "@type": "HowToSupply", name: s })),
        step: [
          { "@type": "HowToStep", name: "When to perform", text: v.whenEn },
          {
            "@type": "HowToStep",
            name: "Prepare the samagri",
            text: `Gather the puja samagri: ${supplies.slice(0, 8).join(", ")}.`,
          },
          {
            "@type": "HowToStep",
            name: "Perform the puja",
            text: v.aboutEn[v.aboutEn.length - 1],
          },
        ],
      },
      faqPage(faq),
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Vrathams", path: "/vrathams" },
        { name: v.nameEn, path: `/vrathams/${v.slug}` },
      ]),
    ],
    bodyHtml: body,
    maxAge: 3600,
  };
}

// Map a request path to its page meta, or null if it isn't an SEO route.
export function pageForPath(pathname: string): PageMeta | null {
  if (pathname === "/") return homePage();
  if (pathname === "/today") {
    return panchangPage(
      getTodayInTimezone(TZ).toISOString().slice(0, 10),
      true,
    );
  }
  if (pathname === "/festivals") return festivalsListPage();
  if (pathname === "/vrathams") return vrathamsListPage();

  let m = pathname.match(/^\/panchangam\/(\d{4}-\d{2}-\d{2})$/);
  if (m) return panchangPage(m[1], false);
  m = pathname.match(/^\/festivals\/([a-z0-9-]+)$/);
  if (m) return festivalPage(m[1]);
  m = pathname.match(/^\/vrathams\/([a-z0-9-]+)$/);
  if (m) return vrathamPage(m[1]);

  return null;
}

// ---- HTML injection (replace-or-insert, so it never silently no-ops) ----

function replaceOrInsert(html: string, re: RegExp, replacement: string): string {
  if (re.test(html)) return html.replace(re, replacement);
  return html.replace(/<\/head>/i, `  ${replacement}\n</head>`);
}

export function injectSeo(template: string, meta: PageMeta): string {
  const canonical = abs(meta.canonicalPath);
  let html = template;

  // <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(meta.title)}</title>`);

  // description, canonical, og:* — replace if present, else insert.
  html = replaceOrInsert(
    html,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${esc(meta.description)}" />`,
  );
  html = replaceOrInsert(
    html,
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${esc(canonical)}" />`,
  );
  html = replaceOrInsert(
    html,
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
  );
  html = replaceOrInsert(
    html,
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
  );
  html = replaceOrInsert(
    html,
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${esc(canonical)}" />`,
  );

  // JSON-LD before </head>
  const ld = meta.jsonLd.map(jsonLdTag).join("\n");
  html = html.replace(/<\/head>/i, `${ld}\n</head>`);

  // Content into #root (React discards it on hydrate).
  html = html.replace(/<div id="root">\s*<\/div>/i, `<div id="root">${meta.bodyHtml}</div>`);

  return html;
}

// ---- sitemap ----
export function buildSitemap(): string {
  const urls: { loc: string; changefreq: string; priority: string }[] = [
    { loc: abs("/"), changefreq: "daily", priority: "1.0" },
    { loc: abs("/today"), changefreq: "daily", priority: "0.9" },
    { loc: abs("/festivals"), changefreq: "weekly", priority: "0.8" },
    { loc: abs("/vrathams"), changefreq: "monthly", priority: "0.8" },
    ...getAllFestivals().map((f) => ({
      loc: abs(`/festivals/${f.id}`),
      changefreq: "monthly",
      priority: "0.7",
    })),
    ...VRATHAMS.map((v) => ({
      loc: abs(`/vrathams/${v.slug}`),
      changefreq: "monthly",
      priority: "0.7",
    })),
  ];
  const body = urls
    .map(
      (u) =>
        `  <url><loc>${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

// ---- wiring ----
export function registerSeoRoutes(app: Express, distPath: string): void {
  const templatePath = path.resolve(distPath, "index.html");
  const template = fs.readFileSync(templatePath, "utf-8");

  // Dynamic sitemap — registered explicitly and before any static file or
  // dot-path heuristic, so it isn't shadowed by a stray static sitemap.xml.
  app.get("/sitemap.xml", (_req: Request, res: Response) => {
    res
      .type("application/xml")
      .set("Cache-Control", "public, max-age=3600")
      .send(buildSitemap());
  });

  app.get(
    [
      "/",
      "/today",
      "/festivals",
      "/vrathams",
      "/panchangam/:date",
      "/festivals/:slug",
      "/vrathams/:slug",
    ],
    (req: Request, res: Response, next: NextFunction) => {
      try {
        const meta = pageForPath(req.path);
        if (!meta) return next(); // unknown slug → fall through to the SPA shell
        res
          .type("html")
          .set("Cache-Control", `public, max-age=${meta.maxAge}`)
          .send(injectSeo(template, meta));
      } catch (err) {
        next(err);
      }
    },
  );
}
