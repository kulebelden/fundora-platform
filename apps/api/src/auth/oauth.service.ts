import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EnvironmentVariables } from '../config/env.validation';
import type { OAuthProvider } from './user-identity.entity';

export const OAUTH_PROVIDERS: readonly OAuthProvider[] = ['google', 'apple'];

export function isOAuthProvider(value: unknown): value is OAuthProvider {
  return typeof value === 'string' && (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

/** What HopeNest keeps from a provider's ID token. */
export interface OAuthProfile {
  provider: OAuthProvider;
  subject: string;
  email: string | null;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
}

interface ProviderEndpoints {
  authorize: string;
  token: string;
  issuers: string[];
}

const ENDPOINTS: Record<OAuthProvider, ProviderEndpoints> = {
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    issuers: ['https://accounts.google.com', 'accounts.google.com'],
  },
  apple: {
    authorize: 'https://appleid.apple.com/auth/authorize',
    token: 'https://appleid.apple.com/auth/token',
    issuers: ['https://appleid.apple.com'],
  },
};

/**
 * Server-side OpenID Connect for Google and Apple (authorization-code flow).
 *
 * The ID token is taken straight from the provider's token endpoint over TLS,
 * authenticated with our client secret, so its claims are trusted without a
 * JWKS signature check (OIDC Core §3.1.3.7). Audience, issuer, expiry and the
 * per-request nonce are still checked.
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly jwtService: JwtService,
  ) {}

  /** Which providers have every credential they need. */
  enabledProviders(): Record<OAuthProvider, boolean> {
    const has = (...keys: (keyof EnvironmentVariables)[]) =>
      Boolean(this.config.get('APP_URL')) && keys.every((key) => Boolean(this.config.get(key)));

    return {
      google: has('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'),
      apple: has('APPLE_CLIENT_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY'),
    };
  }

  isEnabled(provider: OAuthProvider): boolean {
    return this.enabledProviders()[provider];
  }

  /**
   * Callbacks are served through the web app's `/api/v1` proxy, so the session
   * cookies set on the way back land on the web origin, like a password login.
   */
  redirectUri(provider: OAuthProvider): string {
    const appUrl = this.config.getOrThrow<string>('APP_URL').replace(/\/+$/, '');
    return `${appUrl}/api/v1/auth/oauth/${provider}/callback`;
  }

  authorizationUrl(provider: OAuthProvider, state: string, nonce: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId(provider),
      redirect_uri: this.redirectUri(provider),
      response_type: 'code',
      state,
      nonce,
    });

    if (provider === 'google') {
      params.set('scope', 'openid email profile');
      params.set('prompt', 'select_account');
    } else {
      // Asking Apple for name or email requires the form_post response mode.
      params.set('scope', 'name email');
      params.set('response_mode', 'form_post');
    }

    return `${ENDPOINTS[provider].authorize}?${params.toString()}`;
  }

  /**
   * Trades the authorization code for an ID token and returns the profile it
   * carries. `appleUser` is the `user` form field Apple sends on the very first
   * sign-in only — the one time it reveals the person's name.
   */
  async exchangeCode(
    provider: OAuthProvider,
    code: string,
    nonce: string,
    appleUser?: string,
  ): Promise<OAuthProfile> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId(provider),
      client_secret: await this.clientSecret(provider),
      redirect_uri: this.redirectUri(provider),
    });

    const response = await fetch(ENDPOINTS[provider].token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    const payload = (await response.json().catch(() => ({}))) as { id_token?: string; error?: string };
    if (!response.ok || !payload.id_token) {
      this.logger.warn(`${provider} token exchange failed: ${response.status} ${payload.error ?? ''}`);
      throw new UnauthorizedException('Sign-in with the provider failed');
    }

    const claims = this.readClaims(provider, payload.id_token, nonce);
    const name = provider === 'apple' ? this.appleName(appleUser) : null;

    return {
      provider,
      subject: claims.sub,
      email: typeof claims.email === 'string' ? claims.email.toLowerCase() : null,
      // Apple sends the flag as the string "true".
      emailVerified: claims.email_verified === true || claims.email_verified === 'true',
      firstName: name?.firstName ?? stringClaim(claims.given_name),
      lastName: name?.lastName ?? stringClaim(claims.family_name),
    };
  }

  private readClaims(provider: OAuthProvider, idToken: string, nonce: string): IdTokenClaims {
    const decoded = this.jwtService.decode(idToken) as IdTokenClaims | null;
    const now = Math.floor(Date.now() / 1000);

    const valid =
      decoded !== null &&
      typeof decoded.sub === 'string' &&
      decoded.sub.length > 0 &&
      ENDPOINTS[provider].issuers.includes(decoded.iss) &&
      (Array.isArray(decoded.aud)
        ? decoded.aud.includes(this.clientId(provider))
        : decoded.aud === this.clientId(provider)) &&
      typeof decoded.exp === 'number' &&
      decoded.exp > now &&
      decoded.nonce === nonce;

    if (!valid) {
      throw new UnauthorizedException('The provider returned an invalid identity token');
    }
    return decoded;
  }

  private clientId(provider: OAuthProvider): string {
    return this.config.getOrThrow<string>(provider === 'google' ? 'GOOGLE_CLIENT_ID' : 'APPLE_CLIENT_ID');
  }

  /**
   * Google uses a static secret. Apple wants a short-lived ES256 JWT signed with
   * the team's .p8 key instead.
   */
  private async clientSecret(provider: OAuthProvider): Promise<string> {
    if (provider === 'google') {
      return this.config.getOrThrow<string>('GOOGLE_CLIENT_SECRET');
    }

    const privateKey = this.config.getOrThrow<string>('APPLE_PRIVATE_KEY').replace(/\\n/g, '\n');
    // Passed as `secret`: @nestjs/jwt prefers its module-wide HMAC secret over a `privateKey` option.
    return this.jwtService.signAsync(
      {},
      {
        secret: privateKey,
        algorithm: 'ES256',
        keyid: this.config.getOrThrow<string>('APPLE_KEY_ID'),
        issuer: this.config.getOrThrow<string>('APPLE_TEAM_ID'),
        audience: 'https://appleid.apple.com',
        subject: this.clientId('apple'),
        expiresIn: '5m',
      },
    );
  }

  private appleName(raw: string | undefined): { firstName: string | null; lastName: string | null } | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { name?: { firstName?: unknown; lastName?: unknown } };
      return {
        firstName: stringClaim(parsed.name?.firstName),
        lastName: stringClaim(parsed.name?.lastName),
      };
    } catch {
      return null;
    }
  }
}

interface IdTokenClaims {
  iss: string;
  sub: string;
  aud: string | string[];
  exp: number;
  nonce?: string;
  email?: unknown;
  email_verified?: unknown;
  given_name?: unknown;
  family_name?: unknown;
}

function stringClaim(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 100) : null;
}
