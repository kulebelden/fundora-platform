import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

/** Loopback, RFC 1918 and IPv6 unique-local addresses, including IPv4-mapped forms. */
export function isPrivateAddress(ip: string | undefined): boolean {
  if (!ip) return false;
  const address = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (address === '::1' || address.startsWith('127.') || address.startsWith('10.')) return true;
  if (address.startsWith('192.168.')) return true;
  const match = /^172\.(\d+)\./.exec(address);
  if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31) return true;
  return /^f[cd][0-9a-f]{2}:/i.test(address);
}

/**
 * Rate limits per client IP. `req.ip` is the visitor's address because main.ts trusts
 * the reverse proxy's X-Forwarded-For (Caddy overwrites that header, so it cannot be
 * forged from outside).
 *
 * The website's own server reads page data with GET requests over the private network
 * on behalf of every visitor at once; counting those against one shared address would
 * throttle the whole site. Writes are always limited, whatever the address.
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    return (req as unknown as Request).ip ?? 'unknown';
  }

  protected override async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (await super.shouldSkip(context)) return true;
    const req = context.switchToHttp().getRequest<Request>();
    return req.method === 'GET' && isPrivateAddress(req.ip);
  }
}
