import { useState } from 'react';
import { Page } from '@/components/NavBar';
import { Home } from '@/pages/Home';
import { Events } from '@/pages/Events';
import { Communities } from '@/pages/Communities';
import { CommunityDetail } from '@/pages/CommunityDetail';
import { About } from '@/pages/About';
import { Admin } from '@/pages/Admin';
import { SubmitModal } from '@/components/SubmitModal';
import { useSiteConfig } from '@/lib/siteConfig';

interface AppState {
  page: Page | 'admin';
  communityId?: string;
}

export default function App() {
  const [state, setState] = useState<AppState>(() => ({
    page: window.location.hash === '#admin' ? 'admin' : 'home',
  }));
  const [showSubmit, setShowSubmit] = useState(false);
  const { config } = useSiteConfig();

  function navigate(page: Page, communityId?: string) {
    setState({ page, communityId });
    window.history.pushState(null, '', page === 'home' ? '/' : `#${page}`);
    window.scrollTo(0, 0);
  }

  const modalProps = {
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
  } else if (state.page === 'about') {
    content = <About onNavigate={navigate} {...modalProps} />;
  } else {
    content = <Home onNavigate={navigate} {...modalProps} />;
  }

  return (
    <>
      {content}
      {showSubmit && (
        <SubmitModal formUrl={config.notionFormUrl} onClose={() => setShowSubmit(false)} />
      )}
    </>
  );
}
