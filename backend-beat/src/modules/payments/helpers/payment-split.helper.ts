import { SplitRecipientType } from '../../../database/entities/payment-split.entity';
import { paiseFromBps, paiseFromPercent, takePaise } from './money.helper';

export interface SplitLineInput {
  amountPaise: number;
  organizerId: string;
  allowReferral: boolean;
  referralPercent: number;
  allowPromoters: boolean;
  promoterPercent: number;
}

export interface CalculatedSplit {
  recipientType: SplitRecipientType;
  ownerUserId: string | null;
  amountPaise: number;
}

export function calculatePaymentSplits(params: {
  lines: SplitLineInput[];
  platformFeeBps: number;
  referrerUserId?: string | null;
  promoterUserId?: string | null;
}): CalculatedSplit[] {
  const totals = new Map<string, CalculatedSplit>();

  for (const line of params.lines) {
    if (line.amountPaise <= 0) {
      continue;
    }

    let remaining = line.amountPaise;
    const platform = takePaise(
      remaining,
      paiseFromBps(line.amountPaise, params.platformFeeBps),
    );
    remaining = platform.remaining;
    addSplit(totals, SplitRecipientType.PLATFORM, null, platform.taken);

    if (line.allowReferral && params.referrerUserId) {
      const referral = takePaise(
        remaining,
        paiseFromPercent(line.amountPaise, line.referralPercent),
      );
      remaining = referral.remaining;
      addSplit(
        totals,
        SplitRecipientType.REFERRAL,
        params.referrerUserId,
        referral.taken,
      );
    }

    if (line.allowPromoters && params.promoterUserId) {
      const promoter = takePaise(
        remaining,
        paiseFromPercent(line.amountPaise, line.promoterPercent),
      );
      remaining = promoter.remaining;
      addSplit(
        totals,
        SplitRecipientType.PROMOTER,
        params.promoterUserId,
        promoter.taken,
      );
    }

    addSplit(totals, SplitRecipientType.ORGANIZER, line.organizerId, remaining);
  }

  return [...totals.values()].filter((split) => split.amountPaise > 0);
}

function addSplit(
  totals: Map<string, CalculatedSplit>,
  recipientType: SplitRecipientType,
  ownerUserId: string | null,
  amountPaise: number,
): void {
  if (amountPaise <= 0) {
    return;
  }
  const key = `${recipientType}:${ownerUserId ?? ''}`;
  const existing = totals.get(key);
  if (existing) {
    existing.amountPaise += amountPaise;
    return;
  }
  totals.set(key, { recipientType, ownerUserId, amountPaise });
}

export function assertSplitsReconcile(
  paymentAmountPaise: number,
  splits: CalculatedSplit[],
): void {
  const sum = splits.reduce((total, split) => total + split.amountPaise, 0);
  if (sum !== paymentAmountPaise) {
    throw new Error(
      `Split total ${sum} does not equal payment amount ${paymentAmountPaise}`,
    );
  }
}
