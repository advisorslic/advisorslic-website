export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) return new Response("Missing code", { status: 400 });

  // Read oauth_state cookie set by /api/auth
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)oauth_state=([^;]+)/);
  const cookieState = match ? decodeURIComponent(match[1]) : null;

  // Validate state (must match cookie)
  if (!state || !cookieState || state !== cookieState) {
    return new Response(
      `Invalid state. state=${state} cookie=${cookieState}`,
      { status: 400 }
    );
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
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
    return new Response(
      "Token exchange failed: " + JSON.stringify(tokenJson),
      { status: 400 }
    );
  }

  const ORIGIN = "https://advisorslic.in";
  const msg = `authorization:github:success:${token}`;

  const html = `<!doctype html><html><body>
<script>
  (function () {
    var msg = ${JSON.stringify(msg)};
    if (window.opener) {
      window.opener.postMessage(msg, ${JSON.stringify(ORIGIN)});
      window.close();
    } else {
      document.body.innerText = "Authorized. Please return to the Admin tab.";
    }
  })();
</script>
Authorized.
</body></html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Clear cookie after success
      "Set-Cookie": "oauth_state=; Path=/; Max-Age=0; Secure; SameSite=Lax",
    },
  });
}
