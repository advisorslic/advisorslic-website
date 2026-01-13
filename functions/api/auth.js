export async function onRequestGet({ env }) {
  const state = crypto.randomUUID();

  // Store state in a cookie so callback can validate it
  const cookie = `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=600`;

  const redirectUri = "https://advisorslic.in/api/callback";
  const authUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${encodeURIComponent(env.GITHUB_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent("repo,user")}` +
    `&state=${encodeURIComponent(state)}`;

  return new Response(null, {
    status: 302,
    headers: {
      "Set-Cookie": cookie,
      "Location": authUrl,
    },
  });
}
