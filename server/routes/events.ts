import { Router } from 'express';
import { notion, EVENTS_DB, getEvents, parseEvent } from '../notion.js';
import { requireAuth } from './auth.js';

export const eventsRouter = Router();

eventsRouter.get('/', async (req, res) => {
  try {
    const includeUnapproved = req.query.all === 'true';
    const includePast = req.query.past === 'true';
    const data = await getEvents(includeUnapproved, includePast);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

eventsRouter.get('/:id', async (req, res) => {
  try {
    const page = await notion.pages.retrieve({ page_id: req.params.id }) as any;
    res.json(parseEvent(page));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

eventsRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const body = req.body as Record<string, any>;
    const props: Record<string, any> = {};

    if (body.name !== undefined) props['Name'] = { title: [{ text: { content: body.name } }] };
    if (body.description !== undefined) props['Description'] = { rich_text: [{ text: { content: body.description } }] };
    if (body.venue !== undefined) props['Venue'] = { rich_text: [{ text: { content: body.venue } }] };
    if (body.date !== undefined) props['Date'] = { date: body.date ? { start: body.date } : null };
    if (body.region !== undefined) props['Region'] = { select: { name: body.region } };
    if (body.format !== undefined) props['Format'] = { select: { name: body.format } };
    if (body.topics !== undefined) props['Topic'] = { multi_select: body.topics.map((t: string) => ({ name: t })) };
    if (body.eventUrl !== undefined) props['Event URL'] = { url: body.eventUrl || null };
    if (body.price !== undefined) props['Price'] = { select: { name: body.price } };
    if (body.approved !== undefined) props['Approved'] = { checkbox: body.approved };
    if (body.communityIds !== undefined) props['Community'] = { relation: body.communityIds.map((id: string) => ({ id })) };

    const updated = await notion.pages.update({ page_id: req.params.id, properties: props }) as any;
    res.json(parseEvent(updated));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

eventsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const body = req.body as Record<string, any>;
    const page = await notion.pages.create({
      parent: { database_id: EVENTS_DB },
      properties: {
        'Name': { title: [{ text: { content: body.name ?? '' } }] },
        'Description': { rich_text: [{ text: { content: body.description ?? '' } }] },
        'Venue': { rich_text: [{ text: { content: body.venue ?? '' } }] },
        'Date': body.date ? { date: { start: body.date } } : { date: null },
        'Region': { select: { name: body.region ?? 'Lisboa' } },
        'Format': { select: { name: body.format ?? 'Meetup' } },
        'Topic': { multi_select: (body.topics ?? []).map((t: string) => ({ name: t })) },
        'Price': { select: { name: body.price ?? 'Free' } },
        'Approved': { checkbox: body.approved ?? false },
        'Community': { relation: (body.communityIds ?? []).map((id: string) => ({ id })) },
      },
    }) as any;
    res.json(parseEvent(page));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

eventsRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    await notion.pages.update({ page_id: req.params.id, archived: true });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
