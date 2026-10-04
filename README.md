# lyndahasseler.com

Personal site for Dr. Lynda Hasseler. Plain HTML and CSS in `docs/`, hosted free on GitHub Pages
under the vikram-bodas GitHub account. Vikram maintains it, with Claude making and publishing changes.

## Status

- **Preview published** at https://vikram-bodas.github.io/lyndahasseler.com/ . `docs/index.html` carries a
  noindex tag that keeps search engines off the draft. Remove it at launch.
- **Stay-in-touch form not connected yet.** Until it is, the button reads "Form opens soon".

## 1. Create the Google Form (about 5 minutes)

Use a Google account that will stay around, Vikram's or Lynda's personal one.

1. forms.google.com → **Blank form** → title it **Stay in Touch**.
2. Add five questions in this order. Make all of them **Short answer** except the last, and make
   **none of them required**. The website already enforces required fields, and a required question
   on Google's side silently drops submissions.
   1. Name
   2. Email
   3. How we met
   4. Years at Capital
   5. A note or a favorite memory (**Paragraph**)
3. **Settings → Responses:** set "Collect email addresses" to **Do not collect**, and keep
   "Limit to 1 response" **off**. If the form lives in a work account, also turn **off**
   "Restrict to users in [organization]", or outside visitors can't submit.
4. **Responses tab:** Link to Sheets, then ⋮ → **Get email notifications for new responses**.
   Add Lynda as a collaborator so she can turn on her own notifications.
5. Send Claude the form's share link. Claude reads the answer-field IDs and connects the site.

## 2. Hosting

Public repo `vikram-bodas/lyndahasseler.com`. GitHub Pages publishes from `main` / `docs`, and every
push to `main` goes live in about a minute.

## 3. Launch on the domain (needs Lynda's GoDaddy login)

GoDaddy → lyndahasseler.com → **DNS**:

| Action | Type | Name | Value |
|---|---|---|---|
| Delete both existing | A | @ | 13.248.243.5 and 76.223.105.230 (GoDaddy's "Launching Soon" page) |
| Add | A | @ | 185.199.108.153 |
| Add | A | @ | 185.199.109.153 |
| Add | A | @ | 185.199.110.153 |
| Add | A | @ | 185.199.111.153 |
| Edit (currently @) | CNAME | www | vikram-bodas.github.io |

- If GoDaddy says the domain is connected to its Website Builder, disconnect that site first.
- Leave everything else alone. The domain has no email records today.

Then Claude adds `docs/CNAME` with `www.lyndahasseler.com`, removes the noindex tag, and turns on
**Enforce HTTPS** once GitHub issues the certificate, which can take up to 24 hours. The bare domain then
redirects to www automatically.

Do this before the reception cards go out. The QR code opens https://www.lyndahasseler.com.

Optional hardening: verify the domain in GitHub profile settings → Pages → **Add a domain**, which adds
one TXT record. It stops anyone else from claiming the domain on GitHub if the repo is ever removed.

## Editing

- **Words:** `docs/index.html`. **Styles:** `docs/styles.css`. Bump the `styles.css?v=` number when
  styles change.
- **Photos:** `docs/assets/images`. Replace files using the same names. `lynda-hero` is the red-gown
  photo, `lynda-portrait` is the headshot from the 2018 ACDA Michigan program, and the collage photos
  are a first pick from the 2024 Christmas Festival gallery.
- **Design:** ink, ivory, and garnet with Bodoni Moda, EB Garamond, and Jost, kept deliberately distinct
  from the Chasing Beauty singer hub.
- A push goes live in about a minute.

## Cost

$0 a year. GitHub Pages and Google Forms are free. Lynda's only cost is her GoDaddy domain renewal.
