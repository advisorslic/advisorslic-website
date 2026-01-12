export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code
    })
  });

  const tokenData = await tokenResponse.json();
  const token = tokenData.access_token;

  if (!token) {
    return new Response(
      "Token exchange failed: " + JSON.stringify(tokenData),
      { status: 400 }
    );
  }

  const html = `
<!doctype html>
<html>
  <body>
    <script>
      (function () {
        window.opener.postMessage(
          "authorization:github:success:${token}",
          "*"
        );
        window.close();
      })();
    </script>
    Authorized. You may close this window.
  </body>
</html>
`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" }
  });
}
