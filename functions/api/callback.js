export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return new Response("Missing code", { status: 400 });

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

  if (!token) {
    return new Response(
      `<h3>Token error</h3><pre>${escapeHtml(JSON.stringify(tokenData, null, 2))}</pre>`,
      { headers: { "Content-Type": "text/html" }, status: 400 }
    );
  }

  const origin = url.origin;

  // Decap expects this message shape
  const html = `<!doctype html><html><body>
    <script>
      (function () {
        var msg = "authorization:github:success:" + JSON.stringify({ token: "${token}" });
        if (window.opener) {
          window.opener.postMessage(msg, "${origin}");
          window.close();
        } else {
          document.body.innerHTML = "Authorized. Return to the Admin tab.";
        }
      })();
    </script>
  </body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&lt;",'"':"&quot;","'":"&#39;"
  }[s]));
}
