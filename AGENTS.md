# Instructions for AI assistants editing lyndahasseler.com

You are helping Dr. Lynda R. Hasseler update her personal website. She is not a programmer. She will
ask for changes in plain English ("add this quote", "fix the date on the 2019 entry", "swap this video").
Make exactly the change she asks for, keep everything else the same, and explain what you changed in
one or two plain sentences with no code jargon.

## How the site works

- Plain HTML and CSS. No build step. Everything that is published lives in `docs/`.
- `docs/index.html` is the whole site, one page. `docs/styles.css` is the design.
  `docs/assets/images/` holds the photos.
- Merging to `main` publishes the site to https://www.lyndahasseler.com in about a minute.
- Never edit or delete `docs/CNAME`. It connects the domain.
- Never change the stay-in-touch form's `action` URL or its `entry.` field names. They connect it to Google Forms.

## Where things are in docs/index.html

Each section starts with an HTML comment in capitals, in this order:
HERO, LISTEN (performance videos), OVERVIEW (the six highlight facts), A NOTE FROM LYNDA, BIOGRAPHY,
HIGHLIGHTS (the timeline and selected recordings), TEACHING, CHRISTMAS FESTIVAL, PHOTOGRAPHS, QUOTE,
TRIBUTES (tributes, press quotes, press links), STILL TO COME, STAY IN TOUCH.

## Lynda's style rules (always follow)

1. **No italics anywhere.** Do not add `<em>`, `<i>`, or `font-style: italic`. Titles of musical works
   and albums go in curly quotation marks instead, with commas and periods inside the closing quote:
   `“<cite>Dark Matters</cite>,”`.
2. **Colors stay in her purples.** Use only the existing color variables in `styles.css`
   (`--plum-*`, `--violet`, `--accent*`, `--lav-*`). Do not add red, rose, pink, or gold.
3. **Readable text.** No text smaller than 15px, and no light-grey text on light backgrounds.
4. **Reuse what exists.** To add something, copy the nearest existing example (a timeline entry,
   a tribute, a press link, a video card) and change its words. Do not invent new layouts or styles
   unless she asks for one.
5. **Never invent facts.** Only add names, dates, quotes, titles, and numbers that Lynda gives you
   or that already appear on the site. If something is missing or unclear, ask her instead of guessing.
6. **Professional information only.** Do not add personal or family details beyond what is already
   on the site unless Lynda provides them herself.
7. **Write about her in the third person and in the past tense for her Capital years**
   (she retired in 2026). The only first-person text is her own note ("A Note from Lynda") and the
   stay-in-touch section.
8. Use curly quotes and apostrophes (’ “ ”), and an en dash for ranges (1990–2026).

## Common changes

- **Add a timeline entry:** copy an `<li class="reveal">` in the HIGHLIGHTS `<ol class="timeline">`
  and keep the entries in year order.
- **Add a tribute:** copy a `<figure class="tribute reveal">` block in TRIBUTES.
- **Add a press link:** copy an `<li>` inside the right `<ul class="coverage-list">`.
- **Add or swap a video:** copy a `<figure class="video reveal">` card. A YouTube video ID is the part
  after `v=` in its link. It appears three times in each card: the `href`, `data-video`, and the
  thumbnail URL. Update all three, plus the title, caption, and length.
- **Swap a photo:** replace the file in `docs/assets/images/` with one of the same name and size shape,
  and update its `alt` text if the picture changes. Keep photos under 400 KB.
- **If you change `styles.css`:** raise the number in `styles.css?v=` by one in both
  `docs/index.html` and `docs/404.html`, so visitors get the new design.

## Before you finish

Run `python3 scripts/check_site.py`. It must print `All checks passed`. Fix anything it reports.
Keep each pull request to one request from Lynda, and title it in plain English
(for example "Add Eric Whitacre's tribute").
