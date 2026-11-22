import { config } from '@/config/env';
import { storeUrlFor, type Platform } from '@/utils/app-store';
import { isMachineId, type WebPromoPlace } from '@/utils/web-funnel';

export interface AppClick {
  machineId?: string | null;
  place: WebPromoPlace;
  clickId: string | null;
  platform: Platform;
}

export interface AppLinks {
  appLink: string | null;
  ios: string | null;
  android: string | null;
}

interface BranchTarget {
  appLink: string;
  ios: string;
  android: string;
  machineId: string;
}

const CONFIGURED: AppLinks = { appLink: config.appLinkUrl, ios: config.iosStoreUrl, android: config.androidStoreUrl };

function branchTarget(click: AppClick, links: AppLinks): BranchTarget | null {
  const { appLink, ios, android } = links;
  if (click.platform === 'other' || !isMachineId(click.machineId)) return null;
  if (!appLink || !ios || !android) return null;
  return { appLink, ios, android, machineId: click.machineId };
}

/** True when the link goes through Branch to the app; false when it is the raw store page. */
export function usesAppLink(click: AppClick, links: AppLinks = CONFIGURED): boolean {
  return branchTarget(click, links) !== null;
}

export function appLinkFor(click: AppClick, links: AppLinks = CONFIGURED): string | null {
  const target = branchTarget(click, links);
  if (!target) return storeUrlFor(click.platform, links);
  const url = new URL(target.appLink);
  const query = url.searchParams;
  query.set('m', target.machineId);
  query.set('src', 'web');
  if (click.clickId) query.set('wc', click.clickId);
  // The store overrides stop Branch sending a phone without the app back to this site (ADR-498).
  query.set('$ios_url', target.ios);
  query.set('$android_url', target.android);
  query.set('~channel', 'shopper_web');
  query.set('~feature', 'app_promo');
  query.set('~campaign', click.place);
  return url.href;
}
