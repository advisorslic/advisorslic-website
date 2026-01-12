export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // Read oauth_state cookie
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)oauth_state=([^;]+)/);
  const cookieState = match ? match[1] : null;

  if (!code) return new Response("Missing code", { status: 400 });
  if (!state || !cookieState || state !== cookieState) {
    return new Response("Invalid state", { status: 400 });
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: "https://advisorslic.in/api/callback",
      state,
    }),
  });

  const tokenJson = await tokenRes.json();
  const token = tokenJson.access_token;

  if (!token) {
    return new Response("Token exchange failed: " + JSON.stringify(tokenJson), { status: 400 });
  }

  // Send token back to the CMS window and close
  const body = `<!doctype html>
<html>
  <body>
    <script>
      (function() {
        const msg = 'authorization:github:success:${token}';
        window.opener && window.opener.postMessage(msg, '*');
        window.close();
      })();
    </script>
    Authorized. You can close this tab.
  </body>
</html>`;

  // Clear state cookie
  return new Response(body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": "oauth_state=; Path=/; Max-Age=0; Secure; SameSite=Lax",
    },
  });
}
