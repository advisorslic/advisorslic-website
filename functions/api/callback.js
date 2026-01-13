export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");

  if (!code || !returnedState) {
    return new Response("Missing code or state", { status: 400 });
  }

  // 🔹 Read cookie
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)__Host-oauth_state=([^;]+)/);

  if (!match) {
    return new Response("Invalid state (cookie missing)", { status: 400 });
  }

  const storedState = match[1];

  if (storedState !== returnedState) {
    return new Response("Invalid state (mismatch)", { status: 400 });
  }

  // 🔹 Exchange code for token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
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

  // 🔹 Send token back to Decap CMS window
  const ORIGIN = "https://advisorslic.in";
  const msg = `authorization:github:success:${token}`;

  const html = `<!doctype html>
<html>
  <body>
    <script>
      (function () {
        var msg = ${JSON.stringify(msg)};
        if (window.opener) {
          window.opener.postMessage(msg, ${JSON.stringify(ORIGIN)});
          window.close();
        } else {
          document.body.innerText = "Authorized. Return to the Admin tab.";
        }
      })();
    </script>
    Authorized.
  </body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",

      // 🔹 Clear cookie
      "Set-Cookie":
        "__Host-oauth_state=; Path=/; Max-Age=0; Secure; SameSite=None",

      "Cache-Control": "no-store",
    },
  });
}
