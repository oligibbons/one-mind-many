import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

interface ContentContextType {
  content: any;
  loading: boolean;
  error: string | null;
  refreshContent: () => Promise<void>;
}

const ContentContext = createContext<ContentContextType>({
  content: {},
  loading: true,
  error: null,
  refreshContent: async () => {},
});

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

export const ContentProvider = ({ children }: { children: ReactNode }) => {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from API first
      const response = await api.get('/api/admin/content');
      
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      } else {
        // Fallback to default content if API fails
        setContent(getDefaultContent());
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to load content');
      // Use default content as fallback
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const refreshContent = async () => {
    await fetchContent();
  };

  useEffect(() => {
    fetchContent();
  }, []);

  return (
    <ContentContext.Provider value={{ content, loading, error, refreshContent }}>
      {children}
    </ContentContext.Provider>
  );
};

// Default content fallback
const getDefaultContent = () => ({
  homepage: {
    hero_title: 'One Mind, Many',
    hero_subtitle: 'The ultimate social deduction experience',
    hero_description: 'Navigate through AI-driven scenarios where trust is scarce and survival depends on wit.',
    hero_cta_primary: 'Start Playing',
    hero_cta_secondary: 'How to Play',
    features: [
      {
        title: 'AI Scenarios',
        description: 'Dynamic stories that adapt to your choices',
        icon: 'Brain'
      },
      {
        title: 'Social Deduction',
        description: 'Trust no one, suspect everyone',
        icon: 'Users'
      },
      {
        title: 'Real-time Action',
        description: 'Every decision matters instantly',
        icon: 'Zap'
      }
    ],
    stats: [
      { label: 'Active Players', value: '12,847', icon: 'Users' },
      { label: 'Games Played', value: '89,234', icon: 'Play' },
      { label: 'Success Rate', value: '67%', icon: 'Trophy' }
    ],
    final_cta_title: 'Your Next Adventure Awaits',
    final_cta_description: 'Free to play. Easy to learn. Impossible to master.',
    final_cta_button: 'Start Your Journey'
  },
  global: {
    site_name: 'One Mind, Many',
    site_description: 'The ultimate social deduction game',
    contact_email: 'contact@onemindmany.com',
    social_links: {
      github: '#',
      twitter: '#',
      discord: '#'
    }
  }
});