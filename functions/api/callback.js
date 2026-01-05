export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return new Response("Missing ?code=", { status: 400 });

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  // If token is missing, SHOW the error (do not close)
  if (!token) {
    return new Response(
      `<h3>GitHub token error</h3><pre>${escapeHtml(JSON.stringify(tokenData, null, 2))}</pre>
       <p>Check Cloudflare Pages env vars: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET</p>`,
      { headers: { "Content-Type": "text/html" }, status: 400 }
    );
  }

  // Send token to Decap and close popup
  const html = `<!doctype html><html><body>
    <script>
      (function () {
        var msg = { token: "${token}", provider: "github" };
        if (window.opener) {
          window.opener.postMessage(msg, "${url.origin}");
          window.close();
        } else {
          document.body.innerHTML = "Login completed. Please return to the Admin tab.";
        }
      })();
    </script>
  </body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[s]));
}
