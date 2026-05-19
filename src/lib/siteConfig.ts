import { useState, useEffect } from 'react';

export interface FAQ {
  q: string;
  a: string;
}

export interface SiteConfig {
  adminPassword: string;
  notionFormUrl: string;
  contactFormUrl: string;
  newsletterUrl: string;
  whatsappUrl: string;
  telegramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  aboutText: string;
  faqs: FAQ[];
}

export const DEFAULT_CONFIG: SiteConfig = {
  adminPassword: 'ptcadmin',
  notionFormUrl: '',
  contactFormUrl: '',
  newsletterUrl: '',
  whatsappUrl: '',
  telegramUrl: '',
  twitterUrl: '',
  linkedinUrl: '',
  instagramUrl: '',
  aboutText:
    'Portuguese Tech Communities (PTC) é um diretório de meetups, talks e eventos de tecnologia por todo Portugal. Curado pelos próprios organizadores das comunidades.',
  faqs: [
    {
      q: 'Como posso adicionar a minha comunidade?',
      a: 'Clica em "Submit yours" e preenche o formulário. A equipa do PTC irá rever e publicar brevemente.',
    },
    {
      q: 'O PTC é gratuito?',
      a: 'Sim, o diretório é completamente gratuito tanto para organizadores como para participantes.',
    },
    {
      q: 'Com que frequência são atualizados os eventos?',
      a: 'Os eventos são atualizados continuamente pelos organizadores das respetivas comunidades.',
    },
  ],
};

const STORAGE_KEY = 'ptc_site_config';

function loadConfig(): SiteConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_CONFIG;
}

function saveConfig(config: SiteConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function useSiteConfig() {
  const [config, setConfigState] = useState<SiteConfig>(loadConfig);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  function setConfig(update: Partial<SiteConfig>) {
    setConfigState(prev => ({ ...prev, ...update }));
  }

  return { config, setConfig };
}
