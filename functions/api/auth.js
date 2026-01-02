export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname.endsWith("/auth")) {
    const clientId = env.GITHUB_CLIENT_ID;
    const redirectUri = `${url.origin}/api/callback`;

    return Response.redirect(
      `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo`,
      302
    );
  }

  if (url.pathname.endsWith("/callback")) {
    const code = url.searchParams.get("code");

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

    return new Response(
      `
      <script>
        window.opener.postMessage(
          { token: "${tokenData.access_token}", provider: "github" },
          "*"
        );
        window.close();
      </script>
      `,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  return new Response("Not found", { status: 404 });
}
