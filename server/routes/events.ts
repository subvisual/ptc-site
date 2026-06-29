import { Router } from 'express';
import { notion, EVENTS_DB, getEvents, parseEvent } from '../notion.js';
import { requireAuth, verifyAdminSession } from './auth.js';
import { getPortalSession } from './portal.js';

export const eventsRouter = Router();

function requireAdminOrPortal(req: any, res: any, next: any) {
  if (verifyAdminSession(req) || getPortalSession(req)) return next();
  res.status(401).json({ error: 'Não autorizado.' });
}

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

eventsRouter.put('/:id', requireAdminOrPortal, async (req, res) => {
  try {
    const body = req.body as Record<string, any>;
    const portalSession = getPortalSession(req);

    if (portalSession) {
      const existing = await notion.pages.retrieve({ page_id: req.params.id }) as any;
      const existingEvent = parseEvent(existing);
      const owns = existingEvent.communityIds.some((id: string) => portalSession.communityIds.includes(id));
      if (!owns) return res.status(403).json({ error: 'Sem permissão para editar este evento.' });
      delete body.approved;
      delete body.communityIds;
    }

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

eventsRouter.post('/', requireAdminOrPortal, async (req, res) => {
  try {
    const body = req.body as Record<string, any>;
    const portalSession = getPortalSession(req);

    // community auth: force communityIds and always pending approval
    const communityIds = portalSession ? portalSession.communityIds : (body.communityIds ?? []);
    const approved = portalSession ? false : (body.approved ?? false);

    const page = await notion.pages.create({
      parent: { database_id: EVENTS_DB() },
      properties: {
        'Name': { title: [{ text: { content: body.name ?? '' } }] },
        'Description': { rich_text: [{ text: { content: body.description ?? '' } }] },
        'Venue': { rich_text: [{ text: { content: body.venue ?? '' } }] },
        'Date': body.date ? { date: { start: body.date } } : { date: null },
        'Region': { select: { name: body.region ?? 'Lisboa' } },
        'Format': { select: { name: body.format ?? 'Meetup' } },
        'Topic': { multi_select: (body.topics ?? []).map((t: string) => ({ name: t })) },
        'Price': { select: { name: body.price ?? 'Free' } },
        'Approved': { checkbox: approved },
        'Community': { relation: communityIds.map((id: string) => ({ id })) },
      },
    }) as any;
    res.json(parseEvent(page));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

eventsRouter.delete('/:id', requireAdminOrPortal, async (req, res) => {
  try {
    const portalSession = getPortalSession(req);

    if (portalSession) {
      const existing = await notion.pages.retrieve({ page_id: req.params.id }) as any;
      const existingEvent = parseEvent(existing);
      const owns = existingEvent.communityIds.some((id: string) => portalSession.communityIds.includes(id));
      if (!owns) return res.status(403).json({ error: 'Sem permissão para apagar este evento.' });
    }

    await notion.pages.update({ page_id: req.params.id, archived: true });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
