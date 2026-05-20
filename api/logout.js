// Clears the auth cookie, so the user has to re-enter a password.
export const config = { runtime: 'edge' };

export default async function handler() {
  const cookie = 'imari_auth=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json', 'set-cookie': cookie },
  });
}
