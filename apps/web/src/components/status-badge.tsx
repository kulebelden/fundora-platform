import { CheckCircle2, CircleDashed, Clock, FileEdit, PauseCircle, Radio, XCircle } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { CampaignStatus, KycStatus, WithdrawalStatus } from '@/lib/types';

type Look = { variant: BadgeProps['variant']; label: string; Icon: typeof Clock };

const CAMPAIGN_LOOK: Record<CampaignStatus, Look> = {
  DRAFT: { variant: 'secondary', label: 'Draft', Icon: FileEdit },
  SUBMITTED: { variant: 'accent', label: 'Submitted', Icon: Clock },
  UNDER_REVIEW: { variant: 'warm', label: 'Under Review', Icon: Clock },
  APPROVED: { variant: 'accent', label: 'Approved', Icon: CheckCircle2 },
  LIVE: { variant: 'success', label: 'Live', Icon: Radio },
  SUSPENDED: { variant: 'destructive', label: 'Suspended', Icon: PauseCircle },
  COMPLETED: { variant: 'accent', label: 'Completed', Icon: CheckCircle2 },
  REJECTED: { variant: 'destructive', label: 'Rejected', Icon: XCircle },
};

const WITHDRAWAL_LOOK: Record<WithdrawalStatus, Look> = {
  REQUESTED: { variant: 'secondary', label: 'Requested', Icon: CircleDashed },
  PENDING_REVIEW: { variant: 'warm', label: 'Pending review', Icon: Clock },
  APPROVED: { variant: 'accent', label: 'Approved', Icon: CheckCircle2 },
  PROCESSING: { variant: 'accent', label: 'Processing', Icon: CircleDashed },
  COMPLETED: { variant: 'success', label: 'Paid out', Icon: CheckCircle2 },
  REJECTED: { variant: 'destructive', label: 'Rejected', Icon: XCircle },
};

const KYC_LOOK: Record<KycStatus, Look> = {
  NOT_STARTED: { variant: 'secondary', label: 'Not verified', Icon: CircleDashed },
  SUBMITTED: { variant: 'warm', label: 'Verification pending', Icon: Clock },
  VERIFIED: { variant: 'success', label: 'Identity verified', Icon: CheckCircle2 },
  REJECTED: { variant: 'destructive', label: 'Verification rejected', Icon: XCircle },
};

function render({ variant, label, Icon }: Look, pulse = false) {
  return (
    <Badge variant={variant}>
      <Icon className={pulse ? 'h-3 w-3 animate-pulse' : 'h-3 w-3'} />
      {label}
    </Badge>
  );
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const look = CAMPAIGN_LOOK[status];
  return look ? render(look, status === 'LIVE') : <Badge variant="secondary">{status}</Badge>;
}

export function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
  const look = WITHDRAWAL_LOOK[status];
  return look ? render(look) : <Badge variant="secondary">{status}</Badge>;
}

export function KycStatusBadge({ status }: { status: KycStatus }) {
  const look = KYC_LOOK[status];
  return look ? render(look) : <Badge variant="secondary">{status}</Badge>;
}
