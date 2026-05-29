import { Client } from '@notionhq/client';

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
  timeoutMs: 8000,
});

export const EVENTS_DB = process.env.NOTION_EVENTS_DB ?? '358caae5-8631-8009-a521-000bba763510';
export const COMMUNITIES_DB = process.env.NOTION_COMMUNITIES_DB ?? '358caae5-8631-8006-8b92-000b7084f601';

export interface NotionCommunity {
  id: string;
  notionId: string;
  name: string;
  slug: string;
  region: string;
  topics: string[];
  members: string;
  founded: number | null;
  description: string;
  communityPage: string;
  logoUrl: string;
  status: string;
  approved: boolean;
}

export interface NotionEvent {
  id: string;
  notionId: string;
  name: string;
  description: string;
  venue: string;
  date: string | null;
  region: string;
  format: string;
  topics: string[];
  eventUrl: string;
  price: string;
  approved: boolean;
  communityIds: string[];
}

function richText(p: any): string {
  if (!p) return '';
  if (p.type === 'rich_text') return p.rich_text?.map((r: any) => r.plain_text).join('') ?? '';
  if (p.type === 'title') return p.title?.map((r: any) => r.plain_text).join('') ?? '';
  return '';
}

function selectVal(p: any): string {
  return p?.select?.name ?? '';
}

function multiSelectVals(p: any): string[] {
  return p?.multi_select?.map((o: any) => o.name) ?? [];
}

function checkboxVal(p: any): boolean {
  return p?.checkbox ?? false;
}

function urlVal(p: any): string {
  return p?.url ?? '';
}

function numberVal(p: any): number | null {
  return p?.number ?? null;
}

function dateVal(p: any): string | null {
  return p?.date?.start ?? null;
}

function relationIds(p: any): string[] {
  return p?.relation?.map((r: any) => r.id) ?? [];
}

export function parseCommunity(page: any): NotionCommunity {
  const p = page.properties;
  return {
    id: richText(p['Slug']) || page.id,
    notionId: page.id,
    name: richText(p['Name']),
    slug: richText(p['Slug']),
    region: selectVal(p['Region']),
    topics: multiSelectVals(p['Topic']),
    members: richText(p['Members']),
    founded: numberVal(p['Founded']),
    description: richText(p['Description']),
    communityPage: urlVal(p['Community Page']),
    logoUrl: urlVal(p['Logo URL']),
    status: selectVal(p['Status']),
    approved: checkboxVal(p['Approved']),
  };
}

export function parseEvent(page: any): NotionEvent {
  const p = page.properties;
  return {
    id: page.id,
    notionId: page.id,
    name: richText(p['Name']),
    description: richText(p['Description']),
    venue: richText(p['Venue']),
    date: dateVal(p['Date']),
    region: selectVal(p['Region']),
    format: selectVal(p['Format']),
    topics: multiSelectVals(p['Topic']),
    eventUrl: urlVal(p['Event URL']),
    price: selectVal(p['Price']),
    approved: checkboxVal(p['Approved']),
    communityIds: relationIds(p['Community']),
  };
}

export async function getCommunities(includeUnapproved = false) {
  const filter: any = includeUnapproved ? undefined : {
    property: 'Approved',
    checkbox: { equals: true },
  };
  const res = await (notion as any).dataSources.query({
    data_source_id: COMMUNITIES_DB,
    filter,
    sorts: [{ property: 'Name', direction: 'ascending' }],
  });
  return res.results.map(parseCommunity);
}

export async function getEvents(includeUnapproved = false, includePast = false) {
  const filters: any[] = [];
  if (!includeUnapproved) filters.push({ property: 'Approved', checkbox: { equals: true } });
  if (!includePast) {
    filters.push({ property: 'Date', date: { on_or_after: new Date().toISOString().split('T')[0] } });
  }
  const filter = filters.length > 1 ? { and: filters } : filters[0];
  const res = await (notion as any).dataSources.query({
    data_source_id: EVENTS_DB,
    filter,
    sorts: [{ property: 'Date', direction: 'ascending' }],
  });
  return res.results.map(parseEvent);
}
