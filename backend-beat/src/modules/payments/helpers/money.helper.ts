export function rupeesToPaise(rupees: number): number {
  return Math.round(Number(rupees) * 100);
}

export function paiseToRupees(paise: number): number {
  return Number((Math.round(Number(paise)) / 100).toFixed(2));
}

export function paiseFromBps(amountPaise: number, bps: number): number {
  const basisPoints = Math.trunc(Number(bps));
  if (
    !Number.isInteger(amountPaise) ||
    amountPaise < 0 ||
    !Number.isFinite(basisPoints) ||
    basisPoints <= 0
  ) {
    return 0;
  }
  return Math.floor((amountPaise * basisPoints) / 10_000);
}

export function paiseFromPercent(amountPaise: number, percent: number): number {
  const bps = Math.round(Number(percent) * 100);
  return paiseFromBps(amountPaise, bps);
}

export function takePaise(
  remaining: number,
  wanted: number,
): { taken: number; remaining: number } {
  const taken = Math.min(Math.max(0, remaining), Math.max(0, wanted));
  return { taken, remaining: remaining - taken };
}
