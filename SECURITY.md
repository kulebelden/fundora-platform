# HopeNest security protocol

How HopeNest is protected, and the rules staff follow to keep it that way. Read this before you get admin access, and review it whenever the platform changes.

## 1. What the system enforces

### Accounts and sign-in
| Protection | Detail |
|---|---|
| Password storage | Argon2id hashes. Passwords are never stored or logged. |
| Password strength | At least 8 characters with upper and lower case, a number and a symbol; at most 128 (stops oversized-input attacks on hashing). |
| Account lockout | 5 wrong passwords in a row lock password sign-in for 15 minutes. A password reset unlocks at once. |
| Timing-safe login | A login for an unknown account costs the same work as a wrong password, so response times do not reveal who is registered. |
| No account discovery | "Forgot password" and "resend verification" answer the same whether or not the address has an account. |
| Password reset | Single-use link, valid 30 minutes, stored only as a SHA-256 hash. A new request cancels older links. The reset signs out every device and emails the owner a "password changed" notice. |
| Sessions | HTTP-only, `Secure`, `SameSite=Lax` cookies that page scripts cannot read. Access tokens last 15 minutes. Refresh tokens rotate on every use, are stored hashed, and replaying an old one revokes every session for that account (stolen-token detection). |
| Social sign-in | Google/Apple sign-in links to an existing account only when the provider has verified the email. |

### Rate limits (per client IP)
| Route | Limit |
|---|---|
| Everything | 120 requests per minute |
| Login | 10 per 5 minutes |
| Sign-up | 5 per hour |
| Forgot password, resend verification | 5 per 15 minutes |
| Reset password, verify email | 10 per 15 minutes |
| Donations | 20 per 10 minutes (blocks stolen-card testing) |
| Contact form | 5 per hour |
| Photo uploads | 30 per 10 minutes |
| Bank-transfer confirmation | 10 per 15 minutes |

Payment webhooks are not rate limited (providers retry in bursts); each one is signature-checked instead, and unsigned webhooks are refused.

### Money
- **Append-only ledger.** Every donation and payout is a balanced double-entry posting. Database triggers refuse edits and deletes.
- **Payouts.** Released only to identity-verified organisers, after review by finance staff.
- **Manual bank-transfer confirmation** (Admin → Bank transfers), protected by these rules:
  - Only finance officers, admins and super admins can confirm.
  - The staff member must re-enter their password every time.
  - The amount must match the pledge exactly.
  - Each bank-statement reference can be used once, so one transfer can never credit two donations.
  - Nobody can confirm money into a campaign they run.
  - Every confirmation is stored permanently with who confirmed it and when (the database refuses edits and deletes), and **every super admin is emailed a copy**. The full record can be downloaded as CSV or printed from the same page.

### Web and server
- HTTPS only, with HSTS (browsers refuse plain HTTP for a year).
- Security headers: no framing by other sites (clickjacking), `nosniff`, a strict referrer policy, a locked-down permissions policy, and a CSP that blocks plugins and foreign form targets. Server software versions are not advertised.
- Request bodies are capped at 1 MB (15 MB for photo uploads).
- Strict input validation: unknown fields are rejected on every API request.
- The database and Redis are reachable only inside the private Docker network. Only ports 80 and 443 are published.
- The server installs security patches automatically every day.
- SSH accepts keys only: no passwords, no root login, 3 attempts per connection.
- Container logs are size-capped, so a flood of requests cannot fill the disk.

## 2. Rules for staff

1. **One person, one account.** Never share a login. Every action is recorded against your name.
2. **Use a unique password of 12+ characters and a password manager.** Never reuse your HopeNest password elsewhere.
3. **Least privilege.** Give people the lowest role that does the job: Moderator for content, Finance Officer for money, Admin only when needed. Keep Super Admin to the owner and one trusted backup.
4. **Confirm a bank transfer only when you can see it on the bank statement.** Never because a donor sent a screenshot or an email.
5. **Never change bank details or approve a payout because of an email, call or chat message**, even one that appears to come from a colleague or the owner. Verify on a known phone number first.
6. **Remove access the same day someone leaves**: set their role back to Donor.
7. **Report anything suspicious immediately** to a super admin: an unexpected "password changed" email, a confirmation copy you did not expect, or login alerts.

## 3. Rules for whoever runs the server

1. **Keep secrets out of git.** `deploy/.env` and `apps/api/.env` are git-ignored; keep it that way. Never paste secrets into chat or tickets.
2. **Guard the SSH key** (`tukaah-key.pem`). Keep it only on your own computer, never email it, and replace it if a laptop is lost.
3. **AWS security group:** allow 80 and 443 from anywhere, and **22 (SSH) only from your own IP address**.
4. **Turn on multi-factor authentication** for the AWS root account and every AWS user. Do not use the root account day to day.
5. **Back up the database every night to a separate place** (e.g. S3) and test a restore every month. *(Not set up yet: this is the top open item.)*
6. **Rotate secrets** (`JWT_*_SECRET`, `DB_PASSWORD`, webhook secrets) at least yearly, and immediately if one may have leaked. Rotating the JWT secrets signs everyone out.
7. **Before going live**, follow [deploy/GOING-LIVE.md](deploy/GOING-LIVE.md): move to the real domain, configure SMTP so reset and confirmation emails are delivered, and set `EMAIL_VERIFICATION_REQUIRED=true`.

## 4. If something goes wrong

1. **Contain.** Suspected account takeover: reset that account's password (this signs out every device). Suspected server compromise: rotate every secret in `deploy/.env` and redeploy.
2. **Preserve evidence.** Do not delete logs. Ledger and confirmation records cannot be deleted by design.
3. **Assess.** Check the bank-transfer confirmation record, withdrawals in Manage audits, and recent sign-ins.
4. **Notify.** Tell affected users. Depending on your jurisdiction, you may have to tell the data-protection authority within 72 hours of discovering a breach of personal data.
5. **Fix and review.** Patch the cause, then update this document.

## 5. Reporting a vulnerability

Email **security@hopenest.org** with the details. Please do not test against real users' accounts or data, and give us reasonable time to fix the issue before sharing it.
