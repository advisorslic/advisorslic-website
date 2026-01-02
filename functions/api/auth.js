export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/callback`;

  const githubUrl =
    "https://github.com/login/oauth/authorize" +
    `?client_id=${encodeURIComponent(env.GITHUB_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=repo`;

  return Response.redirect(githubUrl, 302);
}
