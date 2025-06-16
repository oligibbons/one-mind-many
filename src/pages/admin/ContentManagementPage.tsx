import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, Download, Eye, Edit, Plus, Trash2, Globe, FileText, RefreshCw, Search, Tag, Image, Link, Code, Monitor } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { api } from '../../lib/api';
import { useContent } from '../../contexts/ContentContext';

interface ContentSection {
  id: string;
  name: string;
  type: 'text' | 'html' | 'image' | 'json';
  content: any;
  page: string;
  section: string;
  updated_at: string;
}

interface ContentPage {
  id: string;
  name: string;
  path: string;
  sections: ContentSection[];
}

interface SEOSettings {
  title: string;
  description: string;
  keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image: string;
  canonical_url: string;
  robots: string;
}

const ContentManagementPage = () => {
  const { content: globalContent, refreshContent } = useContent();
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('homepage');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'navigation' | 'html'>('content');
  const [htmlContent, setHtmlContent] = useState('');
  const [htmlPreviewMode, setHtmlPreviewMode] = useState(false);

  // Content state for editing
  const [content, setContent] = useState<Record<string, any>>({
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
    howtoplay: {
      page_title: 'How to Play',
      page_subtitle: 'Master the art of deception and strategy',
      page_description: 'Learn the rules, understand the roles, and dominate the game.',
      html_content: `
        <div class="how-to-play-content">
          <h2>Game Overview</h2>
          <p>In One Mind, Many, deception meets strategy in a gripping social deduction game. Players take turns programming actions for a shared character, navigating through dynamic, AI-driven scenarios where survival depends on cunning teamwork.</p>
          
          <h3>Key Features</h3>
          <ul>
            <li><strong>AI-Driven Scenarios:</strong> Dynamic stories that adapt to your choices</li>
            <li><strong>Social Deduction:</strong> Trust no one, suspect everyone</li>
            <li><strong>Real-time Action:</strong> Every decision matters instantly</li>
          </ul>
          
          <h2>Player Roles</h2>
          <div class="roles-grid">
            <div class="role-card">
              <h4>Collaborator</h4>
              <p>Work toward the shared character's well-intentioned goals. Use intention tags like Assist, Negotiate, Investigate, Collect, and Repair.</p>
            </div>
            <div class="role-card">
              <h4>Rogue</h4>
              <p>A neutral role where players are only out for themselves. Use intention tags like Infiltrate, Scout, Bypass, Manipulate, and Distract.</p>
            </div>
            <div class="role-card">
              <h4>Saboteur</h4>
              <p>Actively work against the Collaborators. Use intention tags like Disrupt, Obstruct, Mislead, Tamper, and Sabotage.</p>
            </div>
          </div>
          
          <h2>Game Flow</h2>
          <ol>
            <li><strong>Programming Phase:</strong> Players secretly program their actions</li>
            <li><strong>Resolution Phase:</strong> Actions are resolved in turn order</li>
            <li><strong>Narrative Update:</strong> AI provides context and updates game state</li>
            <li><strong>Next Turn:</strong> Process repeats until end conditions are met</li>
          </ol>
          
          <h2>Universal Actions</h2>
          <div class="actions-grid">
            <div class="action-card">
              <h4>Move</h4>
              <p>Moves the shared character towards a target location</p>
            </div>
            <div class="action-card">
              <h4>Interact</h4>
              <p>Interact with objects, locations, hazards, or NPCs</p>
            </div>
            <div class="action-card">
              <h4>Search</h4>
              <p>Search locations or containers for useful items</p>
            </div>
          </div>
          
          <style>
            .how-to-play-content {
              max-width: 800px;
              margin: 0 auto;
              padding: 2rem;
              font-family: 'Quicksand', system-ui, sans-serif;
              line-height: 1.6;
              color: #e2e8f0;
            }
            
            .how-to-play-content h2 {
              color: #f97316;
              font-size: 2rem;
              margin: 2rem 0 1rem 0;
              font-family: 'CustomHeading', 'Quicksand', system-ui, sans-serif;
            }
            
            .how-to-play-content h3 {
              color: #f59e0b;
              font-size: 1.5rem;
              margin: 1.5rem 0 1rem 0;
              font-family: 'CustomHeading', 'Quicksand', system-ui, sans-serif;
            }
            
            .how-to-play-content h4 {
              color: #fbbf24;
              font-size: 1.25rem;
              margin: 1rem 0 0.5rem 0;
              font-family: 'CustomHeading', 'Quicksand', system-ui, sans-serif;
            }
            
            .roles-grid, .actions-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 1.5rem;
              margin: 1.5rem 0;
            }
            
            .role-card, .action-card {
              background: rgba(30, 41, 59, 0.6);
              border: 1px solid rgba(107, 85, 137, 0.3);
              border-radius: 0.75rem;
              padding: 1.5rem;
              backdrop-filter: blur(8px);
            }
            
            .role-card h4, .action-card h4 {
              margin-top: 0;
              color: #f97316;
            }
            
            .how-to-play-content ul, .how-to-play-content ol {
              margin: 1rem 0;
              padding-left: 2rem;
            }
            
            .how-to-play-content li {
              margin: 0.5rem 0;
            }
            
            .how-to-play-content strong {
              color: #f97316;
            }
          </style>
        </div>
      `,
      sections: [
        {
          id: 'overview',
          title: 'Game Overview',
          content: 'In One Mind, Many, deception meets strategy in a gripping social deduction game...'
        }
      ]
    },
    about: {
      page_title: 'About One Mind, Many',
      page_subtitle: 'The story behind the game',
      page_description: 'Learn about our mission to create the ultimate social deduction experience.',
      html_content: `
        <div class="about-content">
          <h2>Our Mission</h2>
          <p>To create immersive, AI-driven gaming experiences that bring people together through strategic thinking and social interaction.</p>
          
          <h2>The Story Behind One Mind, Many</h2>
          <p>One Mind, Many was born from a passion for social deduction games and cutting-edge AI technology. We wanted to create an experience that combines the best of human psychology with dynamic, adaptive storytelling.</p>
          
          <h2>Our Team</h2>
          <p>We're a dedicated team of game developers, AI researchers, and design enthusiasts who believe in the power of games to connect people and create memorable experiences.</p>
          
          <h2>What Makes Us Different</h2>
          <ul>
            <li><strong>AI-Driven Narratives:</strong> Every game is unique with our advanced AI storytelling</li>
            <li><strong>Deep Strategy:</strong> Multiple layers of deception and cooperation</li>
            <li><strong>Community Focus:</strong> Built for players, by players</li>
          </ul>
          
          <style>
            .about-content {
              max-width: 800px;
              margin: 0 auto;
              padding: 2rem;
              font-family: 'Quicksand', system-ui, sans-serif;
              line-height: 1.6;
              color: #e2e8f0;
            }
            
            .about-content h2 {
              color: #f97316;
              font-size: 2rem;
              margin: 2rem 0 1rem 0;
              font-family: 'CustomHeading', 'Quicksand', system-ui, sans-serif;
            }
            
            .about-content ul {
              margin: 1rem 0;
              padding-left: 2rem;
            }
            
            .about-content li {
              margin: 0.5rem 0;
            }
            
            .about-content strong {
              color: #f97316;
            }
          </style>
        </div>
      `,
      team_section: {
        title: 'Our Team',
        description: 'Meet the passionate developers and designers behind One Mind, Many.',
        members: []
      },
      mission_statement: 'To create immersive, AI-driven gaming experiences that bring people together through strategic thinking and social interaction.'
    },
    global: {
      site_name: 'One Mind, Many',
      site_description: 'The ultimate social deduction game',
      contact_email: 'contact@onemindmany.com',
      social_links: {
        github: '#',
        twitter: '#',
        discord: '#'
      },
      navigation: {
        header_links: [
          { name: 'Home', path: '/', visible: true },
          { name: 'How to Play', path: '/how-to-play', visible: true },
          { name: 'About', path: '/about', visible: true }
        ],
        footer_links: [
          { name: 'Privacy Policy', path: '/privacy', visible: true },
          { name: 'Terms of Service', path: '/terms', visible: true },
          { name: 'Contact', path: '/contact', visible: true }
        ]
      }
    }
  });

  // SEO settings for each page
  const [seoSettings, setSeoSettings] = useState<Record<string, SEOSettings>>({
    homepage: {
      title: 'One Mind, Many - The Ultimate Social Deduction Game',
      description: 'Navigate through AI-driven scenarios where trust is scarce and survival depends on wit. Join thousands of players in the ultimate social deduction experience.',
      keywords: 'social deduction, online game, AI scenarios, multiplayer, strategy game, deception, teamwork',
      og_title: 'One Mind, Many - The Ultimate Social Deduction Game',
      og_description: 'Navigate through AI-driven scenarios where trust is scarce and survival depends on wit.',
      og_image: '/OneMindMany Icon PNG Orange.png',
      twitter_title: 'One Mind, Many - The Ultimate Social Deduction Game',
      twitter_description: 'Navigate through AI-driven scenarios where trust is scarce and survival depends on wit.',
      twitter_image: '/OneMindMany Icon PNG Orange.png',
      canonical_url: 'https://onemindmany.com',
      robots: 'index, follow'
    },
    howtoplay: {
      title: 'How to Play - One Mind, Many',
      description: 'Learn the rules, understand the roles, and master the art of deception in One Mind, Many. Complete guide to gameplay mechanics and strategies.',
      keywords: 'how to play, game rules, tutorial, strategy guide, social deduction rules',
      og_title: 'How to Play - One Mind, Many',
      og_description: 'Learn the rules, understand the roles, and master the art of deception in One Mind, Many.',
      og_image: '/OneMindMany Icon PNG Orange.png',
      twitter_title: 'How to Play - One Mind, Many',
      twitter_description: 'Learn the rules, understand the roles, and master the art of deception in One Mind, Many.',
      twitter_image: '/OneMindMany Icon PNG Orange.png',
      canonical_url: 'https://onemindmany.com/how-to-play',
      robots: 'index, follow'
    },
    about: {
      title: 'About Us - One Mind, Many',
      description: 'Learn about the team and mission behind One Mind, Many. Discover our passion for creating immersive social deduction experiences.',
      keywords: 'about us, game developers, team, mission, company',
      og_title: 'About Us - One Mind, Many',
      og_description: 'Learn about the team and mission behind One Mind, Many.',
      og_image: '/OneMindMany Icon PNG Orange.png',
      twitter_title: 'About Us - One Mind, Many',
      twitter_description: 'Learn about the team and mission behind One Mind, Many.',
      twitter_image: '/OneMindMany Icon PNG Orange.png',
      canonical_url: 'https://onemindmany.com/about',
      robots: 'index, follow'
    }
  });

  useEffect(() => {
    fetchContent();
  }, []);

  // Update local content when global content changes
  useEffect(() => {
    if (globalContent && Object.keys(globalContent).length > 0) {
      setContent(globalContent);
    }
  }, [globalContent]);

  // Update HTML content when page changes
  useEffect(() => {
    if (content[selectedPage]?.html_content) {
      setHtmlContent(content[selectedPage].html_content);
    } else {
      setHtmlContent('');
    }
  }, [selectedPage, content]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/content');
      
      if (response.ok) {
        const data = await response.json();
        setContent(data);
        
        // Convert content to pages structure
        const pagesData: ContentPage[] = [
          {
            id: 'homepage',
            name: 'Homepage',
            path: '/',
            sections: Object.entries(data.homepage || {}).map(([key, value]) => ({
              id: key,
              name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              type: typeof value === 'object' ? 'json' : 'text',
              content: value,
              page: 'homepage',
              section: key,
              updated_at: new Date().toISOString()
            }))
          },
          {
            id: 'howtoplay',
            name: 'How to Play',
            path: '/how-to-play',
            sections: Object.entries(data.howtoplay || {}).map(([key, value]) => ({
              id: key,
              name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              type: typeof value === 'object' ? 'json' : key === 'html_content' ? 'html' : 'text',
              content: value,
              page: 'howtoplay',
              section: key,
              updated_at: new Date().toISOString()
            }))
          },
          {
            id: 'about',
            name: 'About',
            path: '/about',
            sections: Object.entries(data.about || {}).map(([key, value]) => ({
              id: key,
              name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              type: typeof value === 'object' ? 'json' : key === 'html_content' ? 'html' : 'text',
              content: value,
              page: 'about',
              section: key,
              updated_at: new Date().toISOString()
            }))
          },
          {
            id: 'global',
            name: 'Global Settings',
            path: '/global',
            sections: Object.entries(data.global || {}).map(([key, value]) => ({
              id: key,
              name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              type: typeof value === 'object' ? 'json' : 'text',
              content: value,
              page: 'global',
              section: key,
              updated_at: new Date().toISOString()
            }))
          }
        ];
        
        setPages(pagesData);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContent = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Update HTML content in the content object
      const updatedContent = {
        ...content,
        [selectedPage]: {
          ...content[selectedPage],
          html_content: htmlContent
        }
      };

      const response = await api.put('/api/admin/content', updatedContent);
      
      if (!response.ok) {
        throw new Error('Failed to save content');
      }

      setContent(updatedContent);
      setSuccess('Content saved successfully!');
      setEditingSection(null);
      
      // Refresh content in the global context
      await refreshContent();
      
      // Refresh local content
      await fetchContent();
    } catch (error) {
      console.error('Error saving content:', error);
      setError('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishContent = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Update HTML content in the content object
      const updatedContent = {
        ...content,
        [selectedPage]: {
          ...content[selectedPage],
          html_content: htmlContent
        }
      };

      // First save the content
      const saveResponse = await api.put('/api/admin/content', updatedContent);
      if (!saveResponse.ok) {
        throw new Error('Failed to save content before publishing');
      }

      // Then publish it
      const publishResponse = await api.post('/api/admin/content/publish');
      if (!publishResponse.ok) {
        throw new Error('Failed to publish content');
      }

      setContent(updatedContent);

      // Refresh the global content context to update the live site
      await refreshContent();

      setSuccess('Content published successfully! Changes are now live on the website.');
    } catch (error) {
      console.error('Error publishing content:', error);
      setError('Failed to publish content');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSection = (page: string, section: string, value: any) => {
    setContent(prev => ({
      ...prev,
      [page]: {
        ...prev[page],
        [section]: value
      }
    }));
  };

  const handleUpdateSEO = (page: string, field: string, value: string) => {
    setSeoSettings(prev => ({
      ...prev,
      [page]: {
        ...prev[page],
        [field]: value
      }
    }));
  };

  const handleAddFeature = () => {
    const newFeature = {
      title: 'New Feature',
      description: 'Feature description',
      icon: 'Star'
    };
    
    setContent(prev => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        features: [...(prev.homepage.features || []), newFeature]
      }
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setContent(prev => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        features: prev.homepage.features.filter((_: any, i: number) => i !== index)
      }
    }));
  };

  const handleUpdateFeature = (index: number, field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        features: prev.homepage.features.map((feature: any, i: number) => 
          i === index ? { ...feature, [field]: value } : feature
        )
      }
    }));
  };

  const handleAddStat = () => {
    const newStat = {
      label: 'New Stat',
      value: '0',
      icon: 'Star'
    };
    
    setContent(prev => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        stats: [...(prev.homepage.stats || []), newStat]
      }
    }));
  };

  const handleRemoveStat = (index: number) => {
    setContent(prev => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        stats: prev.homepage.stats.filter((_: any, i: number) => i !== index)
      }
    }));
  };

  const handleUpdateStat = (index: number, field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        stats: prev.homepage.stats.map((stat: any, i: number) => 
          i === index ? { ...stat, [field]: value } : stat
        )
      }
    }));
  };

  const handleAddNavLink = (section: 'header_links' | 'footer_links') => {
    const newLink = {
      name: 'New Link',
      path: '/',
      visible: true
    };
    
    setContent(prev => ({
      ...prev,
      global: {
        ...prev.global,
        navigation: {
          ...prev.global.navigation,
          [section]: [...(prev.global.navigation[section] || []), newLink]
        }
      }
    }));
  };

  const handleRemoveNavLink = (section: 'header_links' | 'footer_links', index: number) => {
    setContent(prev => ({
      ...prev,
      global: {
        ...prev.global,
        navigation: {
          ...prev.global.navigation,
          [section]: prev.global.navigation[section].filter((_: any, i: number) => i !== index)
        }
      }
    }));
  };

  const handleUpdateNavLink = (section: 'header_links' | 'footer_links', index: number, field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      global: {
        ...prev.global,
        navigation: {
          ...prev.global.navigation,
          [section]: prev.global.navigation[section].map((link: any, i: number) => 
            i === index ? { ...link, [field]: value } : link
          )
        }
      }
    }));
  };

  const currentPage = pages.find(p => p.id === selectedPage);
  const currentSEO = seoSettings[selectedPage] || seoSettings.homepage;

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading content..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Content Management</h1>
          <p className="text-slate-400 mt-2">Manage website content, SEO, and navigation</p>
        </div>
        
        <div className="flex flex-wrap gap-2 md:gap-4">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            leftIcon={<Eye size={18} />}
            size="sm"
          >
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>

          <Button
            variant="outline"
            onClick={refreshContent}
            leftIcon={<RefreshCw size={18} />}
            size="sm"
          >
            Refresh
          </Button>
          
          <Button
            onClick={handleSaveContent}
            disabled={saving}
            isLoading={saving}
            leftIcon={<Save size={18} />}
            size="sm"
          >
            Save Changes
          </Button>
          
          <Button
            onClick={handlePublishContent}
            disabled={saving}
            isLoading={saving}
            leftIcon={<Globe size={18} />}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            Publish Live
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg">
          <p className="text-green-500">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        {/* Page Navigation */}
        <div className="lg:col-span-1">
          <Card className="p-4 md:p-6">
            <h3 className="text-lg font-bold text-white mb-4">Pages</h3>
            <nav className="space-y-2">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => setSelectedPage(page.id)}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors text-left ${
                    selectedPage === page.id
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FileText size={18} className="mr-3 flex-shrink-0" />
                  <span className="font-medium">{page.name}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content Editor */}
        <div className="lg:col-span-3">
          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-slate-700">
              <nav className="flex flex-wrap space-x-4 md:space-x-8">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'content'
                      ? 'border-orange-500 text-orange-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <FileText size={16} className="inline mr-2" />
                  Content
                </button>
                <button
                  onClick={() => setActiveTab('html')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'html'
                      ? 'border-orange-500 text-orange-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Code size={16} className="inline mr-2" />
                  HTML Editor
                </button>
                <button
                  onClick={() => setActiveTab('seo')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'seo'
                      ? 'border-orange-500 text-orange-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Search size={16} className="inline mr-2" />
                  SEO
                </button>
                {selectedPage === 'global' && (
                  <button
                    onClick={() => setActiveTab('navigation')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'navigation'
                        ? 'border-orange-500 text-orange-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Link size={16} className="inline mr-2" />
                    Navigation
                  </button>
                )}
              </nav>
            </div>
          </div>

          {/* HTML Editor Tab */}
          {activeTab === 'html' && (
            <div className="space-y-6">
              <Card className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">HTML Content Editor</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setHtmlPreviewMode(!htmlPreviewMode)}
                      leftIcon={htmlPreviewMode ? <Code size={16} /> : <Monitor size={16} />}
                      size="sm"
                    >
                      {htmlPreviewMode ? 'Edit Mode' : 'Preview'}
                    </Button>
                  </div>
                </div>
                
                {!htmlPreviewMode ? (
                  <div>
                    <textarea
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      className="w-full h-[60vh] bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 font-mono text-sm custom-scrollbar"
                      spellCheck="false"
                    />
                  </div>
                ) : (
                  <div className="border border-slate-700 rounded-md p-4 bg-white h-[60vh] overflow-auto custom-scrollbar">
                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                  </div>
                )}
                
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleSaveContent}
                    disabled={saving}
                    isLoading={saving}
                    leftIcon={<Save size={18} />}
                  >
                    Save HTML Content
                  </Button>
                </div>
              </Card>
              
              <Card className="p-4 md:p-6">
                <h2 className="text-xl font-bold text-white mb-4">HTML Tips</h2>
                <div className="space-y-3 text-slate-300">
                  <p>• Use semantic HTML tags like <code className="bg-slate-700 px-1 rounded">&lt;h1&gt;, &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;</code> for better structure</p>
                  <p>• Include inline CSS with <code className="bg-slate-700 px-1 rounded">&lt;style&gt;</code> tags for custom styling</p>
                  <p>• Use class names that won't conflict with the site's existing styles</p>
                  <p>• Test your HTML in preview mode before saving</p>
                  <p>• Remember to save your changes before switching pages</p>
                </div>
              </Card>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {selectedPage === 'homepage' && (
                <div className="space-y-6">
                  {/* Hero Section */}
                  <Card className="p-4 md:p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Hero Section</h2>
                    <div className="space-y-4">
                      <Input
                        label="Hero Title"
                        value={content.homepage?.hero_title || ''}
                        onChange={(e) => handleUpdateSection('homepage', 'hero_title', e.target.value)}
                      />
                      
                      <Input
                        label="Hero Subtitle"
                        value={content.homepage?.hero_subtitle || ''}
                        onChange={(e) => handleUpdateSection('homepage', 'hero_subtitle', e.target.value)}
                      />
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Hero Description</label>
                        <textarea
                          value={content.homepage?.hero_description || ''}
                          onChange={(e) => handleUpdateSection('homepage', 'hero_description', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Primary CTA Button"
                          value={content.homepage?.hero_cta_primary || ''}
                          onChange={(e) => handleUpdateSection('homepage', 'hero_cta_primary', e.target.value)}
                        />
                        
                        <Input
                          label="Secondary CTA Button"
                          value={content.homepage?.hero_cta_secondary || ''}
                          onChange={(e) => handleUpdateSection('homepage', 'hero_cta_secondary', e.target.value)}
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Stats Section */}
                  <Card className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-white">Game Statistics</h2>
                      <Button
                        onClick={handleAddStat}
                        leftIcon={<Plus size={16} />}
                        size="sm"
                      >
                        Add Stat
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {content.homepage?.stats?.map((stat: any, index: number) => (
                        <div key={index} className="bg-slate-800/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Stat {index + 1}</h3>
                            <Button
                              onClick={() => handleRemoveStat(index)}
                              leftIcon={<Trash2 size={16} />}
                              size="sm"
                              variant="outline"
                              className="text-red-400 hover:text-red-300"
                            >
                              Remove
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                              label="Label"
                              value={stat.label}
                              onChange={(e) => handleUpdateStat(index, 'label', e.target.value)}
                            />
                            
                            <Input
                              label="Value"
                              value={stat.value}
                              onChange={(e) => handleUpdateStat(index, 'value', e.target.value)}
                            />
                            
                            <Input
                              label="Icon"
                              value={stat.icon}
                              onChange={(e) => handleUpdateStat(index, 'icon', e.target.value)}
                              placeholder="Users, Play, Trophy, etc."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Features Section */}
                  <Card className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-white">Features</h2>
                      <Button
                        onClick={handleAddFeature}
                        leftIcon={<Plus size={16} />}
                        size="sm"
                      >
                        Add Feature
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {content.homepage?.features?.map((feature: any, index: number) => (
                        <div key={index} className="bg-slate-800/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Feature {index + 1}</h3>
                            <Button
                              onClick={() => handleRemoveFeature(index)}
                              leftIcon={<Trash2 size={16} />}
                              size="sm"
                              variant="outline"
                              className="text-red-400 hover:text-red-300"
                            >
                              Remove
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                              label="Title"
                              value={feature.title}
                              onChange={(e) => handleUpdateFeature(index, 'title', e.target.value)}
                            />
                            
                            <Input
                              label="Icon"
                              value={feature.icon}
                              onChange={(e) => handleUpdateFeature(index, 'icon', e.target.value)}
                              placeholder="Brain, Users, Zap, etc."
                            />
                            
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                              <textarea
                                value={feature.description}
                                onChange={(e) => handleUpdateFeature(index, 'description', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-20"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Final CTA Section */}
                  <Card className="p-4 md:p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Final Call-to-Action</h2>
                    <div className="space-y-4">
                      <Input
                        label="CTA Title"
                        value={content.homepage?.final_cta_title || ''}
                        onChange={(e) => handleUpdateSection('homepage', 'final_cta_title', e.target.value)}
                      />
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">CTA Description</label>
                        <textarea
                          value={content.homepage?.final_cta_description || ''}
                          onChange={(e) => handleUpdateSection('homepage', 'final_cta_description', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24"
                        />
                      </div>
                      
                      <Input
                        label="CTA Button Text"
                        value={content.homepage?.final_cta_button || ''}
                        onChange={(e) => handleUpdateSection('homepage', 'final_cta_button', e.target.value)}
                      />
                    </div>
                  </Card>
                </div>
              )}

              {selectedPage === 'howtoplay' && (
                <div className="space-y-6">
                  <Card className="p-4 md:p-6">
                    <h2 className="text-xl font-bold text-white mb-6">How to Play Page</h2>
                    <div className="space-y-4">
                      <Input
                        label="Page Title"
                        value={content.howtoplay?.page_title || ''}
                        onChange={(e) => handleUpdateSection('howtoplay', 'page_title', e.target.value)}
                      />
                      
                      <Input
                        label="Page Subtitle"
                        value={content.howtoplay?.page_subtitle || ''}
                        onChange={(e) => handleUpdateSection('howtoplay', 'page_subtitle', e.target.value)}
                      />
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Page Description</label>
                        <textarea
                          value={content.howtoplay?.page_description || ''}
                          onChange={(e) => handleUpdateSection('howtoplay', 'page_description', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24"
                        />
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-slate-400 mb-2">For detailed content editing, use the HTML Editor tab.</p>
                        <Button
                          onClick={() => setActiveTab('html')}
                          leftIcon={<Code size={16} />}
                          variant="outline"
                          size="sm"
                        >
                          Edit HTML Content
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {selectedPage === 'about' && (
                <div className="space-y-6">
                  <Card className="p-4 md:p-6">
                    <h2 className="text-xl font-bold text-white mb-6">About Page</h2>
                    <div className="space-y-4">
                      <Input
                        label="Page Title"
                        value={content.about?.page_title || ''}
                        onChange={(e) => handleUpdateSection('about', 'page_title', e.target.value)}
                      />
                      
                      <Input
                        label="Page Subtitle"
                        value={content.about?.page_subtitle || ''}
                        onChange={(e) => handleUpdateSection('about', 'page_subtitle', e.target.value)}
                      />
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Page Description</label>
                        <textarea
                          value={content.about?.page_description || ''}
                          onChange={(e) => handleUpdateSection('about', 'page_description', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Mission Statement</label>
                        <textarea
                          value={content.about?.mission_statement || ''}
                          onChange={(e) => handleUpdateSection('about', 'mission_statement', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-32"
                        />
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-slate-400 mb-2">For detailed content editing, use the HTML Editor tab.</p>
                        <Button
                          onClick={() => setActiveTab('html')}
                          leftIcon={<Code size={16} />}
                          variant="outline"
                          size="sm"
                        >
                          Edit HTML Content
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {selectedPage === 'global' && (
                <div className="space-y-6">
                  {/* Site Settings */}
                  <Card className="p-4 md:p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Site Settings</h2>
                    <div className="space-y-4">
                      <Input
                        label="Site Name"
                        value={content.global?.site_name || ''}
                        onChange={(e) => handleUpdateSection('global', 'site_name', e.target.value)}
                      />
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Site Description</label>
                        <textarea
                          value={content.global?.site_description || ''}
                          onChange={(e) => handleUpdateSection('global', 'site_description', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24"
                        />
                      </div>
                      
                      <Input
                        label="Contact Email"
                        type="email"
                        value={content.global?.contact_email || ''}
                        onChange={(e) => handleUpdateSection('global', 'contact_email', e.target.value)}
                      />
                    </div>
                  </Card>

                  {/* Social Links */}
                  <Card className="p-4 md:p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Social Links</h2>
                    <div className="space-y-4">
                      <Input
                        label="GitHub URL"
                        value={content.global?.social_links?.github || ''}
                        onChange={(e) => handleUpdateSection('global', 'social_links', {
                          ...content.global?.social_links,
                          github: e.target.value
                        })}
                      />
                      
                      <Input
                        label="Twitter URL"
                        value={content.global?.social_links?.twitter || ''}
                        onChange={(e) => handleUpdateSection('global', 'social_links', {
                          ...content.global?.social_links,
                          twitter: e.target.value
                        })}
                      />
                      
                      <Input
                        label="Discord URL"
                        value={content.global?.social_links?.discord || ''}
                        onChange={(e) => handleUpdateSection('global', 'social_links', {
                          ...content.global?.social_links,
                          discord: e.target.value
                        })}
                      />
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <Card className="p-4 md:p-6">
                <h2 className="text-xl font-bold text-white mb-6">SEO Settings for {currentPage?.name}</h2>
                <div className="space-y-4">
                  <Input
                    label="Page Title"
                    value={currentSEO.title}
                    onChange={(e) => handleUpdateSEO(selectedPage, 'title', e.target.value)}
                    placeholder="Page title for search engines"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Meta Description</label>
                    <textarea
                      value={currentSEO.description}
                      onChange={(e) => handleUpdateSEO(selectedPage, 'description', e.target.value)}
                      placeholder="Brief description for search results (150-160 characters)"
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24"
                    />
                    <p className="text-xs text-slate-500 mt-1">{currentSEO.description.length}/160 characters</p>
                  </div>
                  
                  <Input
                    label="Keywords"
                    value={currentSEO.keywords}
                    onChange={(e) => handleUpdateSEO(selectedPage, 'keywords', e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                  
                  <Input
                    label="Canonical URL"
                    value={currentSEO.canonical_url}
                    onChange={(e) => handleUpdateSEO(selectedPage, 'canonical_url', e.target.value)}
                    placeholder="https://onemindmany.com/page"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Robots</label>
                    <select
                      value={currentSEO.robots}
                      onChange={(e) => handleUpdateSEO(selectedPage, 'robots', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                    >
                      <option value="index, follow">Index, Follow</option>
                      <option value="noindex, follow">No Index, Follow</option>
                      <option value="index, nofollow">Index, No Follow</option>
                      <option value="noindex, nofollow">No Index, No Follow</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Open Graph Settings */}
              <Card className="p-4 md:p-6">
                <h2 className="text-xl font-bold text-white mb-6">Open Graph (Facebook)</h2>
                <div className="space-y-4">
                  <Input
                    label="OG Title"
                    value={currentSEO.og_title}
                    onChange={(e) => handleUpdateSEO(selectedPage, 'og_title', e.target.value)}
                    placeholder="Title for social media sharing"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">OG Description</label>
                    <textarea
                      value={currentSEO.og_description}
                      onChange={(e) => handleUpdateSEO(selectedPage, 'og_description', e.target.value)}
                      placeholder="Description for social media sharing"
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-20"
                    />
                  </div>
                  
                  <Input
                    label="OG Image URL"
                    value={currentSEO.og_image}
                    onChange={(e) => handleUpdateSEO(selectedPage, 'og_image', e.target.value)}
                    placeholder="/path/to/image.jpg"
                  />
                </div>
              </Card>

              {/* Twitter Settings */}
              <Card className="p-4 md:p-6">
                <h2 className="text-xl font-bold text-white mb-6">Twitter Card</h2>
                <div className="space-y-4">
                  <Input
                    label="Twitter Title"
                    value={currentSEO.twitter_title}
                    onChange={(e) => handleUpdateSEO(selectedPage, 'twitter_title', e.target.value)}
                    placeholder="Title for Twitter sharing"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Twitter Description</label>
                    <textarea
                      value={currentSEO.twitter_description}
                      onChange={(e) => handleUpdateSEO(selectedPage, 'twitter_description', e.target.value)}
                      placeholder="Description for Twitter sharing"
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-20"
                    />
                  </div>
                  
                  <Input
                    label="Twitter Image URL"
                    value={currentSEO.twitter_image}
                    onChange={(e) => handleUpdateSEO(selectedPage, 'twitter_image', e.target.value)}
                    placeholder="/path/to/image.jpg"
                  />
                </div>
              </Card>
            </div>
          )}

          {/* Navigation Tab */}
          {activeTab === 'navigation' && selectedPage === 'global' && (
            <div className="space-y-6">
              {/* Header Navigation */}
              <Card className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Header Navigation</h2>
                  <Button
                    onClick={() => handleAddNavLink('header_links')}
                    leftIcon={<Plus size={16} />}
                    size="sm"
                  >
                    Add Link
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {content.global?.navigation?.header_links?.map((link: any, index: number) => (
                    <div key={index} className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Link {index + 1}</h3>
                        <Button
                          onClick={() => handleRemoveNavLink('header_links', index)}
                          leftIcon={<Trash2 size={16} />}
                          size="sm"
                          variant="outline"
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          label="Name"
                          value={link.name}
                          onChange={(e) => handleUpdateNavLink('header_links', index, 'name', e.target.value)}
                        />
                        
                        <Input
                          label="Path"
                          value={link.path}
                          onChange={(e) => handleUpdateNavLink('header_links', index, 'path', e.target.value)}
                        />
                        
                        <div className="flex items-center pt-6">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={link.visible}
                              onChange={(e) => handleUpdateNavLink('header_links', index, 'visible', e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm text-slate-300">Visible</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Footer Navigation */}
              <Card className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Footer Navigation</h2>
                  <Button
                    onClick={() => handleAddNavLink('footer_links')}
                    leftIcon={<Plus size={16} />}
                    size="sm"
                  >
                    Add Link
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {content.global?.navigation?.footer_links?.map((link: any, index: number) => (
                    <div key={index} className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Link {index + 1}</h3>
                        <Button
                          onClick={() => handleRemoveNavLink('footer_links', index)}
                          leftIcon={<Trash2 size={16} />}
                          size="sm"
                          variant="outline"
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          label="Name"
                          value={link.name}
                          onChange={(e) => handleUpdateNavLink('footer_links', index, 'name', e.target.value)}
                        />
                        
                        <Input
                          label="Path"
                          value={link.path}
                          onChange={(e) => handleUpdateNavLink('footer_links', index, 'path', e.target.value)}
                        />
                        
                        <div className="flex items-center pt-6">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={link.visible}
                              onChange={(e) => handleUpdateNavLink('footer_links', index, 'visible', e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm text-slate-300">Visible</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Preview Mode */}
      {previewMode && (
        <Card className="p-4 md:p-6 mt-8">
          <h2 className="text-xl font-bold text-white mb-6">Live Preview</h2>
          <div className="bg-slate-800/50 rounded-lg p-4 md:p-6">
            <div className="text-center">
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-4">
                {content.homepage?.hero_title}
              </h1>
              <p className="text-lg md:text-xl text-slate-300 mb-2">
                {content.homepage?.hero_subtitle}
              </p>
              <p className="text-slate-400 mb-6">
                {content.homepage?.hero_description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium">
                  {content.homepage?.hero_cta_primary}
                </button>
                <button className="bg-slate-700 text-white px-6 py-3 rounded-lg font-medium">
                  {content.homepage?.hero_cta_secondary}
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ContentManagementPage;