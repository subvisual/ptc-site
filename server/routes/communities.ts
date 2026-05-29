import { Router } from 'express';
import { notion, COMMUNITIES_DB, getCommunities, parseCommunity } from '../notion.js';
import { requireAuth } from './auth.js';

export const communitiesRouter = Router();

communitiesRouter.get('/', async (req, res) => {
  try {
    const isAdmin = req.query.all === 'true';
    const data = await getCommunities(isAdmin);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

communitiesRouter.get('/:id', async (req, res) => {
  try {
    const page = await notion.pages.retrieve({ page_id: req.params.id }) as any;
    res.json(parseCommunity(page));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

communitiesRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const body = req.body as Record<string, any>;
    const props: Record<string, any> = {};

    if (body.name !== undefined) props['Name'] = { title: [{ text: { content: body.name } }] };
    if (body.slug !== undefined) props['Slug'] = { rich_text: [{ text: { content: body.slug } }] };
    if (body.region !== undefined) props['Region'] = { select: { name: body.region } };
    if (body.topics !== undefined) props['Topic'] = { multi_select: body.topics.map((t: string) => ({ name: t })) };
    if (body.members !== undefined) props['Members'] = { rich_text: [{ text: { content: body.members } }] };
    if (body.founded !== undefined) props['Founded'] = { number: body.founded };
    if (body.description !== undefined) props['Description'] = { rich_text: [{ text: { content: body.description } }] };
    if (body.communityPage !== undefined) props['Community Page'] = { url: body.communityPage || null };
    if (body.logoUrl !== undefined) props['Logo URL'] = { url: body.logoUrl || null };
    if (body.status !== undefined) props['Status'] = { select: { name: body.status } };
    if (body.approved !== undefined) props['Approved'] = { checkbox: body.approved };

    const updated = await notion.pages.update({ page_id: req.params.id, properties: props }) as any;
    res.json(parseCommunity(updated));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

communitiesRouter.post('/', requireAuth, async (req, res) => {
  try {
    const body = req.body as Record<string, any>;
    const page = await notion.pages.create({
      parent: { database_id: COMMUNITIES_DB },
      properties: {
        'Name': { title: [{ text: { content: body.name ?? '' } }] },
        'Slug': { rich_text: [{ text: { content: body.slug ?? '' } }] },
        'Region': { select: { name: body.region ?? 'Lisboa' } },
        'Topic': { multi_select: (body.topics ?? []).map((t: string) => ({ name: t })) },
        'Members': { rich_text: [{ text: { content: body.members ?? '' } }] },
        'Founded': { number: body.founded ?? null },
        'Description': { rich_text: [{ text: { content: body.description ?? '' } }] },
        'Status': { select: { name: body.status ?? 'Active' } },
        'Approved': { checkbox: body.approved ?? false },
      },
    }) as any;
    res.json(parseCommunity(page));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

communitiesRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    await notion.pages.update({ page_id: req.params.id, archived: true });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
