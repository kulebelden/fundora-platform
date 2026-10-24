# Moving HopeNest to the real domain

The AWS server currently answers at a temporary test address
(`16-170-249-96.sslip.io`). Everything that depends on the address (HTTPS
certificates, email links, Google/Apple sign-in callbacks, link previews) is
derived from one setting, `SITE_HOST`, so switching to the real domain is one deploy.

## 1. Before you switch

1. **Give the server a fixed IP.** In the AWS console: EC2 → Elastic IPs →
   Allocate → Associate it with the HopeNest instance. Without this, the IP
   changes if the server is ever stopped. If the IP changes, run deploys with
   `HOST=<new ip>`.
2. **Point the domain at it.** At your domain registrar, add two DNS records:

   | Type | Name | Value |
   |---|---|---|
   | A | `@` (hopenest.org) | the Elastic IP |
   | A | `www` | the Elastic IP |

   Wait until `nslookup hopenest.org` returns the Elastic IP (minutes to a few hours).

## 2. Switch

From the repository root, in Git Bash:

```bash
SITE_HOST=hopenest.org bash deploy/deploy.sh
```

This updates the server's settings to the new address and rebuilds. Caddy then
fetches free HTTPS certificates for `hopenest.org` and `www.hopenest.org`
automatically, and `www` redirects to the bare domain. Every later deploy must use
the same `SITE_HOST=hopenest.org` prefix. Otherwise it switches back to the test
address.

## 3. After you switch

- **Email:** set up SMTP (see `smtp.env.example`) with a sender on the domain, e.g.
  `HopeNest <no-reply@hopenest.org>`. Add the SPF and DKIM records your email
  provider gives you, or messages land in spam. Then set
  `EMAIL_VERIFICATION_REQUIRED=true` in the server's `deploy/.env` and redeploy.
- **Google sign-in:** in Google Cloud Console, add
  `https://hopenest.org/api/v1/auth/oauth/google/callback` as an authorised
  redirect URI.
- **Apple sign-in:** add `hopenest.org` as a domain and
  `https://hopenest.org/api/v1/auth/oauth/apple/callback` as the return URL.
- **Payment providers:** register webhooks at
  `https://hopenest.org/api/v1/webhooks/<provider>` (`stripe`, `paypal`,
  `bank_wire`).
- **Legal pages:** fill in the company details in
  `apps/web/src/components/legal-page.tsx` and have a lawyer review `/terms` and
  `/privacy`.
- **Mailboxes:** the site shows `support@`, `privacy@`, `security@` and
  `careers@hopenest.org`. Create them, or forward them to an inbox you read.
- **AWS security group:** allow 80 and 443 from anywhere, and 22 only from your own IP.

## Taking the test deployment down

When you no longer need it: in the AWS console, **stop** the EC2 instance to pause it
and keep the data, or **terminate** it to delete everything, including the
database. Release the Elastic IP too if you allocated one, because AWS charges for
an unattached Elastic IP. Before terminating, copy anything you want to keep: the
database lives on that server.
