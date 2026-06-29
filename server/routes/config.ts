import { Router } from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { requireAuth } from './auth.js';

export const configRouter = Router();

const CONFIG_PATH = join(process.cwd(), 'data', 'site-config.json');

const DEFAULT_CONFIG = {
  aboutText: 'Portuguese Tech Communities (PTC) is a directory of meetups, talks, and tech events happening across Portugal. Curated by the organizers themselves.',
  faqs: [
    { q: 'How can I add my community?', a: 'Click "Submit yours" and fill in the form. The PTC team will review and publish it shortly.' },
    { q: 'Is PTC free?', a: 'Yes, the directory is completely free for both organizers and participants.' },
    { q: 'How often are events updated?', a: 'Events are updated continuously by the organizers of each community.' },
  ],
  notionFormUrl: '',
  contactFormUrl: '',
  newsletterUrl: '',
  whatsappUrl: '',
  telegramUrl: '',
  twitterUrl: '',
  linkedinUrl: '',
  instagramUrl: '',
};

function readConfig() {
  try {
    if (existsSync(CONFIG_PATH)) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) };
    }
  } catch {}
  return DEFAULT_CONFIG;
}

function writeConfig(config: object) {
  const dir = join(process.cwd(), 'data');
  if (!existsSync(dir)) {
    import('fs').then(fs => fs.mkdirSync(dir, { recursive: true }));
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

configRouter.get('/', (_req, res) => {
  res.json(readConfig());
});

configRouter.put('/', requireAuth, (req, res) => {
  const current = readConfig();
  const updated = { ...current, ...req.body };
  writeConfig(updated);
  res.json(updated);
});
