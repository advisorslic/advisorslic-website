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

  if (!tokenData.access_token) {
    return new Response(JSON.stringify(tokenData, null, 2), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // IMPORTANT: Send token back to the opener (Decap CMS) and close the window
  const html = `
<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body>
    <script>
      (function() {
        var msg = { token: "${tokenData.access_token}", provider: "github" };
        if (window.opener) {
          window.opener.postMessage(msg, "*");
          window.close();
        } else {
          document.body.innerHTML = "Login completed. You can close this tab and return to the Admin page.";
        }
      })();
    </script>
  </body>
</html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
