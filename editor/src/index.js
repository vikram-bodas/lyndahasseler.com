// "Edit My Website" for lyndahasseler.com.
// Lynda types a request in plain English; Claude proposes exact text edits to docs/index.html;
// she previews them and clicks Publish, which commits to GitHub (GitHub Pages then deploys).
import Anthropic from "@anthropic-ai/sdk";
import { PAGE } from "./page.js";

const FILE = "docs/index.html";
const EDITOR_PREFIX = "Website editor: ";
const FORM_URL =
  "docs.google.com/forms/d/e/1FAIpQLSdmT6eLsomsDcI6EJuw0RDb3Mb268mBrHzUeiJe3V11aaX6ng/formResponse";
const SECTIONS = ["listen", "overview", "welcome", "biography", "highlights", "teaching", "christmas", "tributes", "stay-in-touch"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/") {
        return new Response(PAGE, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
      }
      if (request.method !== "POST" || !url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);

      const body = await request.json().catch(() => ({}));
      if (!(await passwordOk(body.password, env.EDIT_PASSWORD))) {
        await new Promise((r) => setTimeout(r, 1200));
        return json({ error: "That password isn't right. Please try again." }, 401);
      }
      if (url.pathname === "/api/login") return json({ ok: true });
      if (url.pathname === "/api/propose") return json(await propose(body, env));
      if (url.pathname === "/api/publish") return json(await publish(body, env));
      if (url.pathname === "/api/undo") return json(await undo(env));
      if (url.pathname === "/api/last") return json(await lastChange(env));
      return json({ error: "Not found" }, 404);
    } catch (err) {
      console.error(err);
      return json({ error: friendlyError(err) }, 500);
    }
  },
};

// ---------- proposing a change ----------

const EDIT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["status", "message", "edits"],
  properties: {
    status: { type: "string", enum: ["ready", "question"] },
    message: { type: "string" },
    edits: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["find", "replace"],
        properties: { find: { type: "string" }, replace: { type: "string" } },
      },
    },
  },
};

const EDITOR_RULES = `You are the "Edit My Website" assistant for Dr. Lynda R. Hasseler. She is not technical.
She will describe a change to her website in plain English. You change the HTML of her one-page site.

Answer with JSON only, matching the schema:
- status "ready" with edits when you can make the change. message: one or two warm, plain sentences
  telling her what you changed, as if talking to her ("I added Eric Whitacre's tribute below Jared Tice's.").
  No code words like HTML, tag, div, or class.
- status "question" with no edits when the request is unclear, needs facts she has not given you
  (exact wording, a name, a date, a link), or asks for something you should not do. message: one short,
  friendly question.
- Each edit is an exact find-and-replace on the CURRENT HTML. "find" must be copied character for
  character from the HTML and must appear exactly once, so include enough surrounding text to be unique.
  Keep edits as small as possible. Never rewrite large parts of the page.
- You cannot add or change photos here. If she asks, say Vikram can do that if she emails him the photo.
- Never change the stylesheet link, the stay-in-touch form's action or entry names, the page's <head>, or scripts.

Follow these site rules exactly:
`;

async function propose(body, env) {
  const requestText = String(body.request || "").trim().slice(0, 4000);
  if (!requestText) return { status: "question", message: "What would you like to change?", edits: [] };
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];

  const [{ text: html, sha }, { text: agents }] = await Promise.all([
    getFile(env, FILE),
    getFile(env, "AGENTS.md"),
  ]);

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const conversation = history
    .map((h) => `${h.role === "lynda" ? "Lynda" : "You"}: ${String(h.text).slice(0, 2000)}`)
    .join("\n");

  let feedback = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: EDIT_SCHEMA } },
      system: [
        { type: "text", text: EDITOR_RULES + agents },
        { type: "text", text: `CURRENT HTML of ${FILE}:\n\n${html}`, cache_control: { type: "ephemeral" } },
      ],
      messages: [
        {
          role: "user",
          content:
            (conversation ? `Earlier in this conversation:\n${conversation}\n\n` : "") +
            `Lynda's request: ${requestText}` +
            (feedback ? `\n\nYour previous answer could not be used: ${feedback}\nPlease try again.` : ""),
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return { status: "question", message: "I can't make that change. Could you ask in a different way, or check with Vikram?", edits: [] };
    }
    const textBlock = response.content.find((b) => b.type === "text");
    let plan;
    try {
      plan = JSON.parse(textBlock ? textBlock.text : "");
    } catch {
      feedback = "The answer was not valid JSON.";
      continue;
    }
    if (plan.status !== "ready") return { status: "question", message: plan.message, edits: [] };

    const result = applyEdits(html, plan.edits);
    if (result.error) {
      feedback = result.error;
      continue;
    }
    const problems = checkSite(result.html);
    if (problems.length) {
      feedback = "The edited page fails these checks: " + problems.join("; ");
      continue;
    }
    return {
      status: "ready",
      message: plan.message,
      edits: plan.edits,
      baseSha: sha,
      changes: plan.edits.map((e) => ({ before: plainText(e.find), after: plainText(e.replace) })),
      previewHtml: result.html.replace("<head>", `<head><base href="${env.SITE_URL}">`),
    };
  }
  return {
    status: "question",
    message: "I wasn't able to make that change cleanly. Could you describe it a little differently?",
    edits: [],
  };
}

// ---------- publishing and undo ----------

async function publish(body, env) {
  const { text: html, sha } = await getFile(env, FILE);
  if (body.baseSha !== sha) {
    return { error: "The website changed since this preview. Please send your request again." };
  }
  const result = applyEdits(html, body.edits || []);
  if (result.error) return { error: "That change no longer fits the page. Please send your request again." };
  const problems = checkSite(result.html);
  if (problems.length) return { error: "That change didn't pass the safety check, so nothing was published." };
  const summary = String(body.message || "Update").replace(/\s+/g, " ").slice(0, 120);
  await putFile(env, FILE, result.html, sha, EDITOR_PREFIX + summary);
  return { ok: true, message: "Published! Your website will show the change in about a minute." };
}

async function lastChange(env) {
  const commits = await gh(env, `/repos/${env.REPO}/commits?path=${FILE}&sha=main&per_page=1`);
  const c = commits[0];
  if (!c) return { canUndo: false };
  const msg = c.commit.message.split("\n")[0];
  return {
    canUndo: msg.startsWith(EDITOR_PREFIX) && !msg.startsWith(EDITOR_PREFIX + "Undo"),
    message: msg.replace(EDITOR_PREFIX, ""),
    date: c.commit.committer.date,
  };
}

async function undo(env) {
  const commits = await gh(env, `/repos/${env.REPO}/commits?path=${FILE}&sha=main&per_page=2`);
  const [latest, previous] = commits;
  const msg = latest ? latest.commit.message.split("\n")[0] : "";
  if (!latest || !previous || !msg.startsWith(EDITOR_PREFIX) || msg.startsWith(EDITOR_PREFIX + "Undo")) {
    return { error: "There's no recent change from this page to undo. Vikram can help with older changes." };
  }
  const { text: oldHtml } = await getFile(env, FILE, previous.sha);
  const { sha } = await getFile(env, FILE);
  await putFile(env, FILE, oldHtml, sha, `${EDITOR_PREFIX}Undo "${msg.replace(EDITOR_PREFIX, "").slice(0, 80)}"`);
  return { ok: true, message: "Undone. Your website will be back the way it was in about a minute." };
}

// ---------- edits and checks ----------

function applyEdits(html, edits) {
  if (!Array.isArray(edits) || edits.length === 0) return { error: "There were no edits." };
  let out = html;
  for (const e of edits) {
    if (typeof e.find !== "string" || !e.find || typeof e.replace !== "string") return { error: "An edit was incomplete." };
    const count = out.split(e.find).length - 1;
    if (count === 0) return { error: `This text was not found exactly: ${JSON.stringify(e.find.slice(0, 160))}` };
    if (count > 1) return { error: `This text appears ${count} times, so add more surrounding text: ${JSON.stringify(e.find.slice(0, 160))}` };
    out = out.replace(e.find, () => e.replace);
  }
  return { html: out };
}

function checkSite(html) {
  const problems = [];
  if (/<(em|i)[\s>]/.test(html)) problems.push("it uses italics (<em> or <i>); put titles in quotation marks instead");
  if (/font-style:\s*italic/.test(html)) problems.push("it uses italic styling");
  if (html.includes('name="robots" content="noindex"')) problems.push("it hides the site from search engines");
  if (!html.includes(FORM_URL)) problems.push("the stay-in-touch form is disconnected");
  for (const id of SECTIONS) if (!html.includes(`id="${id}"`)) problems.push(`section ${id} is missing`);
  if (!/styles\.css\?v=\d+/.test(html)) problems.push("the stylesheet link was changed");
  for (const tag of ["section", "div", "figure", "ul", "ol", "blockquote", "a", "h1", "h2", "h3"]) {
    const opens = (html.match(new RegExp(`<${tag}[\\s>]`, "g")) || []).length;
    const closes = (html.match(new RegExp(`</${tag}>`, "g")) || []).length;
    if (opens !== closes) problems.push(`<${tag}> opened ${opens} times but closed ${closes} times`);
  }
  if (!html.trim().endsWith("</html>")) problems.push("the page no longer ends properly");
  return problems;
}

function plainText(s) {
  return s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim().slice(0, 600);
}

// ---------- GitHub ----------

async function gh(env, path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      accept: "application/vnd.github+json",
      "user-agent": "lynda-website-editor",
      "x-github-api-version": "2022-11-28",
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function getFile(env, path, ref = "main") {
  const data = await gh(env, `/repos/${env.REPO}/contents/${path}?ref=${ref}`);
  const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, "")), (c) => c.charCodeAt(0));
  return { text: new TextDecoder().decode(bytes), sha: data.sha };
}

async function putFile(env, path, text, sha, message) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return gh(env, `/repos/${env.REPO}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({ message, content: btoa(bin), sha, branch: "main" }),
  });
}

// ---------- helpers ----------

async function passwordOk(given, expected) {
  if (typeof given !== "string" || !expected) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(given.trim())),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  return crypto.subtle.timingSafeEqual(a, b);
}

function friendlyError(err) {
  if (err instanceof Anthropic.RateLimitError) return "The assistant is busy right now. Please try again in a minute.";
  if (err instanceof Anthropic.AuthenticationError) return "The assistant isn't set up correctly. Please let Vikram know.";
  if (err instanceof Anthropic.APIError) return "The assistant had a problem. Please try again in a moment.";
  if (String(err).includes("GitHub")) return "Couldn't reach the website files. Please try again, or let Vikram know.";
  return "Something went wrong. Please try again, or let Vikram know.";
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
