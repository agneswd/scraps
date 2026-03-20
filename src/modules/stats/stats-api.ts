import type { RecordModel } from 'pocketbase';
import { pocketbase } from '@/shared/api/pocketbase';

export type StatsPeriod = '7d' | '30d' | 'all';
export type ArchivedLeftoverStatus = 'consumed' | 'wasted';

export type ArchivedLeftoverRecord = RecordModel & {
  status: ArchivedLeftoverStatus;
};

export type StatsSummary = {
  period: StatsPeriod;
  totalItems: number;
  consumedCount: number;
  wastedCount: number;
  consumedPercentage: number;
  wastePercentage: number;
};

const PERIOD_DAY_MAP: Record<Exclude<StatsPeriod, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
};

export async function listArchivedLeftovers() {
  return pocketbase.collection('leftovers').getFullList<ArchivedLeftoverRecord>({
    filter: 'status != "active"',
    sort: '-updated',
  });
}

function getPeriodCutoff(period: StatsPeriod, now: Date) {
  if (period === 'all') {
    return null;
  }

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - PERIOD_DAY_MAP[period]);
  return cutoff.getTime();
}

function getCompletedAt(leftover: ArchivedLeftoverRecord) {
  const completedAt = Date.parse(leftover.updated || leftover.created || '');
  return Number.isNaN(completedAt) ? null : completedAt;
}

export function filterArchivedLeftoversByPeriod(
  leftovers: ArchivedLeftoverRecord[],
  period: StatsPeriod,
  now = new Date(),
) {
  const cutoff = getPeriodCutoff(period, now);

  if (cutoff === null) {
    return leftovers;
  }

  return leftovers.filter((leftover) => {
    const completedAt = getCompletedAt(leftover);
    return completedAt !== null && completedAt >= cutoff;
  });
}

export function summarizeArchivedLeftovers(
  leftovers: ArchivedLeftoverRecord[],
  period: StatsPeriod,
  now = new Date(),
): StatsSummary {
  const periodLeftovers = filterArchivedLeftoversByPeriod(leftovers, period, now);
  const consumedCount = periodLeftovers.filter((leftover) => leftover.status === 'consumed').length;
  const wastedCount = periodLeftovers.length - consumedCount;
  const totalItems = periodLeftovers.length;

  if (totalItems === 0) {
    return {
      period,
      totalItems,
      consumedCount,
      wastedCount,
      consumedPercentage: 0,
      wastePercentage: 0,
    };
  }

  return {
    period,
    totalItems,
    consumedCount,
    wastedCount,
    consumedPercentage: (consumedCount / totalItems) * 100,
    wastePercentage: (wastedCount / totalItems) * 100,
  };
}