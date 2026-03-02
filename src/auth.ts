import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import type { Context } from 'hono';

interface SessionPayload {
  [key: string]: unknown;
  githubToken: string;
  login: string;
  avatarUrl: string;
  name: string;
  exp: number;
}

interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
}

const COOKIE_NAME = 'prtree_session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function getSessionAsync(c: Context, secret: string): Promise<SessionPayload | null> {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) {
    return null;
  }

  try {
    const payload = (await verify(token, secret, 'HS256')) as SessionPayload;
    return payload;
  } catch {
    return null;
  }
}

function isSecure(baseUrl: string): boolean {
  return baseUrl.startsWith('https://');
}

export function createAuthRoutes(clientId: string, clientSecret: string, sessionSecret: string, baseUrl: string): Hono {
  const auth = new Hono();

  auth.get('/login', (c) => {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${baseUrl}/auth/callback`,
      scope: 'repo'
    });

    return c.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  });

  auth.get('/callback', async (c) => {
    const code = c.req.query('code');
    if (!code) {
      return c.text('Missing code parameter', 400);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    });

    const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      return c.text('Failed to exchange code for token', 400);
    }

    const githubToken = tokenData.access_token;

    // Fetch user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!userResponse.ok) {
      return c.text('Failed to fetch GitHub user profile', 502);
    }

    const user = (await userResponse.json()) as GitHubUser;

    // Create JWT
    const now = Math.floor(Date.now() / 1000);
    const payload: SessionPayload = {
      githubToken,
      login: user.login,
      avatarUrl: user.avatar_url,
      name: user.name ?? user.login,
      exp: now + SESSION_TTL_SECONDS
    };

    const jwt = await sign(payload, sessionSecret);

    setCookie(c, COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: isSecure(baseUrl),
      sameSite: 'Lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS
    });

    return c.redirect('/');
  });

  auth.get('/me', async (c) => {
    const session = await getSessionAsync(c, sessionSecret);
    if (!session) {
      return c.json({ authenticated: false }, 401);
    }

    return c.json({
      authenticated: true,
      user: {
        login: session.login,
        avatarUrl: session.avatarUrl,
        name: session.name
      }
    });
  });

  auth.post('/logout', (c) => {
    deleteCookie(c, COOKIE_NAME, { path: '/' });
    return c.json({ ok: true });
  });

  return auth;
}
