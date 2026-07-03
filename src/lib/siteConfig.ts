import { useState, useEffect } from 'react';

export interface FAQ {
  q: string;
  a: string;
}

export interface SiteConfig {
  adminPassword: string;
  notionFormUrl: string;
  notionFormEmbed: boolean;
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
  notionFormEmbed: false,
  contactFormUrl: 'https://subvisual.notion.site/e99c402a87554e1da9d6242c1a8f4cd3',
  newsletterUrl: '',
  whatsappUrl: 'https://www.whatsapp.com/channel/0029VbClHwg7oQhYhNupxd3R',
  telegramUrl: 'https://t.me/+NPjwePZ6jEVmMmM8',
  twitterUrl: '',
  linkedinUrl: '',
  instagramUrl: '',
  aboutText:
    'Portuguese Tech Communities (PTC) is a directory of meetups, talks, and tech events happening across Portugal. Curated by the organizers themselves.',
  faqs: [
    {
      q: 'How can I add my community?',
      a: 'Click "Submit yours" and fill in the form. The PTC team will review and publish it shortly.',
    },
    {
      q: 'Is PTC free?',
      a: 'Yes, the directory is completely free for both organizers and participants.',
    },
    {
      q: 'How often are events updated?',
      a: 'Events are updated continuously by the organizers of each community.',
    },
    {
      q: 'What events are listed here?',
      a: 'Only in-person events organized by and run within Portugal\'s tech communities. Standalone events that aren\'t tied to a community aren\'t part of the curation, at least for now.',
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

  // Try to hydrate from the API (server may not be running in all envs)
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setConfigState(prev => ({ ...prev, ...data }));
      })
      .catch(() => {});
  }, []);

  function setConfig(update: Partial<SiteConfig>) {
    setConfigState(prev => ({ ...prev, ...update }));
  }

  return { config, setConfig };
}
