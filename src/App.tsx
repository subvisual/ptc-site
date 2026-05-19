import { useState } from 'react';
import { Page } from '@/components/NavBar';
import { Home } from '@/pages/Home';
import { Events } from '@/pages/Events';
import { Communities } from '@/pages/Communities';
import { CommunityDetail } from '@/pages/CommunityDetail';
import { Admin } from '@/pages/Admin';
import { AboutModal } from '@/components/AboutModal';
import { SubmitModal } from '@/components/SubmitModal';
import { useSiteConfig } from '@/lib/siteConfig';

interface AppState {
  page: Page | 'admin';
  communityId?: string;
}

export default function App() {
  const [state, setState] = useState<AppState>({ page: 'home' });
  const [showAbout, setShowAbout] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const { config } = useSiteConfig();

  function navigate(page: Page, communityId?: string) {
    setState({ page, communityId });
    window.scrollTo(0, 0);
  }

  const modalProps = {
    onOpenAbout: () => setShowAbout(true),
    onOpenSubmit: () => setShowSubmit(true),
    onOpenAdmin: () => setState({ page: 'admin' }),
  };

  let content: React.ReactNode;

  if (state.page === 'admin') {
    content = <Admin onExit={() => setState({ page: 'home' })} />;
  } else if (state.page === 'events') {
    content = <Events onNavigate={navigate} {...modalProps} />;
  } else if (state.page === 'communities') {
    content = <Communities onNavigate={navigate} {...modalProps} />;
  } else if (state.page === 'community-detail' && state.communityId) {
    content = <CommunityDetail communityId={state.communityId} onNavigate={navigate} {...modalProps} />;
  } else {
    content = <Home onNavigate={navigate} {...modalProps} />;
  }

  return (
    <>
      {content}
      {showAbout && (
        <AboutModal config={config} onClose={() => setShowAbout(false)} />
      )}
      {showSubmit && (
        <SubmitModal formUrl={config.notionFormUrl} onClose={() => setShowSubmit(false)} />
      )}
    </>
  );
}
