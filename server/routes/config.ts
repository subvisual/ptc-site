import { Router } from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { requireAuth } from './auth.js';

export const configRouter = Router();

const CONFIG_PATH = join(process.cwd(), 'data', 'site-config.json');

const DEFAULT_CONFIG = {
  aboutText: 'Portuguese Tech Communities (PTC) é um diretório de meetups, talks e eventos de tecnologia por todo Portugal. Curado pelos próprios organizadores das comunidades.',
  faqs: [
    { q: 'Como posso adicionar a minha comunidade?', a: 'Clica em "Submit yours" e preenche o formulário. A equipa do PTC irá rever e publicar brevemente.' },
    { q: 'O PTC é gratuito?', a: 'Sim, o diretório é completamente gratuito tanto para organizadores como para participantes.' },
    { q: 'Com que frequência são atualizados os eventos?', a: 'Os eventos são atualizados continuamente pelos organizadores das respetivas comunidades.' },
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
