export const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Edit My Website</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
<style>
:root{--plum:#41305f;--plum9:#2b2042;--violet:#5a45c2;--violet-d:#46349f;--lav:#efeaf8;--line:#ddd4f1;--text:#231a33;--muted:#4a4158;--ok:#1e6b45;--bad:#9b2c2c}
*{box-sizing:border-box;margin:0;padding:0}
body{font:400 20px/1.6 'Source Sans 3',Arial,sans-serif;color:var(--text);background:#f8f5fc}
header{background:var(--plum9);color:#fff;padding:22px 20px}
header h1{font:600 30px/1.2 Fraunces,Georgia,serif;max-width:860px;margin:0 auto}
header p{max-width:860px;margin:4px auto 0;color:#e4dff5;font-size:18px}
main{max-width:860px;margin:0 auto;padding:28px 20px 60px}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:26px;margin-bottom:22px}
h2{font:600 24px/1.3 Fraunces,Georgia,serif;color:var(--plum);margin-bottom:10px}
label{display:block;font-weight:700;margin-bottom:8px}
input,textarea{width:100%;font:inherit;font-size:20px;padding:14px 16px;border:2px solid #b9aee6;border-radius:10px;color:var(--text);background:#fff}
textarea{min-height:150px;resize:vertical}
input:focus,textarea:focus{outline:3px solid #a99df5;border-color:var(--violet)}
.row{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px}
button{font:700 20px/1 'Source Sans 3',Arial,sans-serif;padding:16px 26px;border-radius:10px;border:2px solid var(--violet);background:var(--violet);color:#fff;cursor:pointer}
button:hover{background:var(--violet-d)}
button.plain{background:#fff;color:var(--violet)}
button.plain:hover{background:var(--lav)}
button:disabled{opacity:.55;cursor:wait}
.hint{color:var(--muted);font-size:18px;margin-top:10px}
.examples{margin-top:10px;padding-left:22px;color:var(--muted);font-size:18px}
.msg{font-size:21px;line-height:1.5}
.change{border-left:5px solid var(--violet);background:var(--lav);border-radius:0 10px 10px 0;padding:14px 18px;margin-top:14px}
.change b{display:block;font-size:15px;letter-spacing:.08em;text-transform:uppercase;color:var(--plum);margin-top:6px}
.change p{font-size:18px;margin-top:2px}
.status{padding:16px 18px;border-radius:10px;font-weight:600;margin-top:16px}
.status.ok{background:#e3f4ea;color:var(--ok)}
.status.bad{background:#fbeaea;color:var(--bad)}
iframe{width:100%;height:560px;border:2px solid var(--line);border-radius:10px;margin-top:14px;background:#fff}
.hidden{display:none}
a{color:var(--violet);font-weight:700}
</style></head><body>
<header><h1>Edit My Website</h1><p>lyndahasseler.com</p></header>
<main>
  <section id="login" class="card">
    <h2>Welcome, Lynda</h2>
    <label for="pw">Your password</label>
    <input id="pw" type="password" autocomplete="current-password">
    <div class="row"><button id="loginBtn">Sign in</button></div>
    <p id="loginStatus" class="status bad hidden"></p>
  </section>

  <section id="ask" class="card hidden">
    <h2>What would you like to change?</h2>
    <label for="req">Describe the change in your own words</label>
    <textarea id="req" placeholder="For example: Add this tribute from Eric Whitacre to the Tributes section: ..."></textarea>
    <ul class="examples">
      <li>Fix a typo: change "..." to "..."</li>
      <li>Add a 2026 entry to the timeline that says ...</li>
      <li>Replace the "Gaudete!" video with this YouTube link: ...</li>
    </ul>
    <div class="row"><button id="sendBtn">Show me the change</button></div>
    <p id="working" class="hint hidden">Working on it. This usually takes about a minute...</p>
    <p id="askStatus" class="status bad hidden"></p>
  </section>

  <section id="answer" class="card hidden">
    <h2 id="answerTitle">Here's the change</h2>
    <p id="answerMsg" class="msg"></p>
    <div id="changes"></div>
    <div id="previewWrap" class="hidden">
      <button class="plain" id="previewBtn" style="margin-top:16px">See the whole page</button>
      <iframe id="preview" class="hidden" title="Preview of the changed website"></iframe>
    </div>
    <div id="decide" class="row">
      <button id="publishBtn">Publish</button>
      <button class="plain" id="cancelBtn">Cancel</button>
    </div>
    <p id="answerStatus" class="status hidden"></p>
  </section>

  <section id="undoCard" class="card hidden">
    <h2>Change your mind?</h2>
    <p id="lastInfo" class="hint">Your most recent change from this page can be undone.</p>
    <div class="row"><button class="plain" id="undoBtn">Undo my last change</button></div>
    <p id="undoStatus" class="status hidden"></p>
    <p class="hint" style="margin-top:16px">See your website: <a href="https://www.lyndahasseler.com" target="_blank" rel="noopener">www.lyndahasseler.com</a>. For new photos, email them to Vikram.</p>
  </section>
</main>
<script>
const $ = (id) => document.getElementById(id);
let password = "";
try { password = localStorage.getItem("lh-editor-pw") || ""; } catch (e) {}
let proposal = null;
let history = [];

async function api(path, data) {
  const res = await fetch("/api/" + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, password }) });
  const out = await res.json().catch(() => ({ error: "Something went wrong. Please try again." }));
  if (res.status === 401) { signOut(); }
  return out;
}
function show(el, text, kind) { el.textContent = text; el.className = "status " + (kind || ""); el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }
function signOut() { try { localStorage.removeItem("lh-editor-pw"); } catch (e) {} $("login").classList.remove("hidden"); $("ask").classList.add("hidden"); $("undoCard").classList.add("hidden"); }

async function signIn() {
  password = $("pw").value.trim() || password;
  $("loginBtn").disabled = true;
  const out = await api("login", {});
  $("loginBtn").disabled = false;
  if (out.ok) {
    try { localStorage.setItem("lh-editor-pw", password); } catch (e) {}
    hide($("login")); $("ask").classList.remove("hidden"); $("undoCard").classList.remove("hidden"); $("req").focus(); refreshLast();
  } else { show($("loginStatus"), out.error || "Please try again.", "bad"); }
}
$("loginBtn").onclick = signIn;
$("pw").addEventListener("keydown", (e) => { if (e.key === "Enter") signIn(); });

$("sendBtn").onclick = async () => {
  const text = $("req").value.trim();
  if (!text) { $("req").focus(); return; }
  $("sendBtn").disabled = true; $("working").classList.remove("hidden"); hide($("askStatus")); hide($("answer"));
  const out = await api("propose", { request: text, history });
  $("sendBtn").disabled = false; hide($("working"));
  if (out.error) { show($("askStatus"), out.error, "bad"); return; }
  history.push({ role: "lynda", text }, { role: "assistant", text: out.message });
  proposal = out.status === "ready" ? out : null;
  $("answer").classList.remove("hidden"); hide($("answerStatus"));
  $("answerTitle").textContent = proposal ? "Here's the change" : "A quick question";
  $("answerMsg").textContent = out.message;
  $("changes").innerHTML = "";
  (out.changes || []).forEach((c) => {
    const d = document.createElement("div"); d.className = "change";
    const b1 = document.createElement("b"); b1.textContent = c.before ? "Before" : "New";
    const p1 = document.createElement("p"); p1.textContent = c.before || "(added)";
    const b2 = document.createElement("b"); b2.textContent = "After";
    const p2 = document.createElement("p"); p2.textContent = c.after || "(removed)";
    if (c.before) d.append(b1, p1); d.append(b2, p2); $("changes").append(d);
  });
  $("previewWrap").classList.toggle("hidden", !proposal);
  $("preview").classList.add("hidden");
  $("decide").classList.toggle("hidden", !proposal);
  if (!proposal) { $("req").value = ""; $("req").placeholder = "Type your answer here, then click the button again."; $("req").focus(); }
  $("answer").scrollIntoView({ behavior: "smooth" });
};

$("previewBtn").onclick = () => { if (!proposal) return; $("preview").srcdoc = proposal.previewHtml; $("preview").classList.remove("hidden"); };

$("publishBtn").onclick = async () => {
  if (!proposal) return;
  $("publishBtn").disabled = true;
  const out = await api("publish", { edits: proposal.edits, baseSha: proposal.baseSha, message: proposal.message });
  $("publishBtn").disabled = false;
  if (out.ok) {
    show($("answerStatus"), out.message, "ok"); $("decide").classList.add("hidden");
    proposal = null; history = []; $("req").value = ""; $("req").placeholder = "Describe your next change..."; refreshLast();
  } else { show($("answerStatus"), out.error, "bad"); }
};
$("cancelBtn").onclick = () => { proposal = null; hide($("answer")); $("req").focus(); };

async function refreshLast() {
  const out = await api("last", {});
  $("undoBtn").disabled = !out.canUndo;
  $("lastInfo").textContent = out.canUndo ? "Most recent change: " + out.message : "There's no recent change from this page to undo.";
}
$("undoBtn").onclick = async () => {
  if (!confirm("Undo your last change?")) return;
  $("undoBtn").disabled = true;
  const out = await api("undo", {});
  show($("undoStatus"), out.ok ? out.message : out.error, out.ok ? "ok" : "bad");
  refreshLast();
};

if (password) { $("pw").value = password; signIn(); }
</script>
</body></html>`;
