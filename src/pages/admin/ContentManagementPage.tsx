import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, Eye, Code, Smartphone, Tablet, Monitor, Search, Settings, 
  Plus, Edit, Trash2, Image, Video, Type, Link, Bold, Italic, 
  Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, Quote, Code2, Palette, Globe,
  FileText, Navigation, Layout, Zap, Users, Shield, Book, Home,
  Play, UserPlus, MessageSquare, Star, Target, Brain, Trophy,
  ChevronDown, ChevronRight, Upload, Download, Copy, ExternalLink,
  BarChart3, TrendingUp, Activity, Clock, Tag, Hash, Layers,
  MousePointer, Maximize2, RotateCcw, RefreshCw, Check, X,
  AlertTriangle, Info, HelpCircle, Lightbulb, Sparkles
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface PageContent {
  id: string;
  title: string;
  slug: string;
  content: any;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    ogImage: string;
    canonical: string;
    robots: string;
    structuredData: any;
  };
  status: 'draft' | 'published' | 'scheduled';
  lastModified: string;
  author: string;
  featuredImage?: string;
  excerpt?: string;
  customCSS?: string;
  customJS?: string;
}

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  defaultFont: string;
  headingFont: string;
  bodyFont: string;
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  favicon: string;
  googleAnalytics: string;
  googleSearchConsole: string;
  bingWebmaster: string;
  yandexWebmaster: string;
  facebookPixel: string;
  twitterSite: string;
  socialMedia: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string;
    github: string;
  };
}

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  children?: NavigationItem[];
  visible: boolean;
  order: number;
  target?: '_blank' | '_self';
}

const ContentManagementPage = () => {
  const [activeTab, setActiveTab] = useState('pages');
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'visual' | 'html'>('visual');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSEOAnalysis, setShowSEOAnalysis] = useState(false);

  // All available pages on the site
  const [allPages] = useState<PageContent[]>([
    {
      id: 'home',
      title: 'Home Page',
      slug: '/',
      content: {
        hero: {
          title: 'One Mind, Many',
          subtitle: 'The ultimate social deduction experience',
          description: 'Navigate through AI-driven scenarios where trust is scarce and survival depends on wit.',
          backgroundImage: '/OneMindMay Logo - long.png',
          ctaText: 'Start Playing',
          ctaLink: '/auth/register',
          secondaryCtaText: 'How to Play',
          secondaryCtaLink: '/how-to-play'
        },
        features: [
          {
            icon: 'Brain',
            title: 'AI Scenarios',
            description: 'Dynamic stories that adapt to your choices'
          },
          {
            icon: 'Users',
            title: 'Social Deduction',
            description: 'Trust no one, suspect everyone'
          },
          {
            icon: 'Zap',
            title: 'Real-time Action',
            description: 'Every decision matters instantly'
          }
        ],
        stats: [
          { label: 'Active Players', value: '12,847', icon: 'Users' },
          { label: 'Games Played', value: '89,234', icon: 'Play' },
          { label: 'Success Rate', value: '67%', icon: 'Trophy' }
        ]
      },
      seo: {
        title: 'One Mind, Many - Ultimate Social Deduction Game',
        description: 'Experience the ultimate social deduction game with AI-driven scenarios. Trust no one, suspect everyone in this gripping multiplayer experience.',
        keywords: ['social deduction', 'multiplayer game', 'AI scenarios', 'strategy game', 'online game'],
        ogImage: '/OneMindMay Logo - long.png',
        canonical: 'https://onemindmany.com/',
        robots: 'index, follow',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'One Mind, Many',
          description: 'Ultimate social deduction game with AI-driven scenarios'
        }
      },
      status: 'published',
      lastModified: new Date().toISOString(),
      author: 'Admin'
    },
    {
      id: 'how-to-play',
      title: 'How to Play',
      slug: '/how-to-play',
      content: {
        sections: [
          {
            id: 'overview',
            title: 'Game Overview',
            content: 'In One Mind, Many, deception meets strategy in a gripping social deduction game...'
          },
          {
            id: 'roles',
            title: 'Player Roles',
            content: 'There are 3 specific roles in One Mind, Many...'
          }
        ]
      },
      seo: {
        title: 'How to Play One Mind, Many - Complete Rules Guide',
        description: 'Learn how to play One Mind, Many with our comprehensive rules guide. Master the art of deception and strategy.',
        keywords: ['how to play', 'rules', 'game guide', 'tutorial', 'strategy'],
        ogImage: '/OneMindMay Logo - long.png',
        canonical: 'https://onemindmany.com/how-to-play',
        robots: 'index, follow',
        structuredData: {}
      },
      status: 'published',
      lastModified: new Date().toISOString(),
      author: 'Admin'
    },
    {
      id: 'auth-login',
      title: 'Login Page',
      slug: '/auth/login',
      content: {
        title: 'Welcome Back',
        subtitle: 'Sign in to continue to One Mind, Many',
        backgroundImage: '',
        showSocialLogin: false,
        forgotPasswordLink: true
      },
      seo: {
        title: 'Login - One Mind, Many',
        description: 'Sign in to your One Mind, Many account to continue playing.',
        keywords: ['login', 'sign in', 'account'],
        ogImage: '',
        canonical: 'https://onemindmany.com/auth/login',
        robots: 'noindex, nofollow',
        structuredData: {}
      },
      status: 'published',
      lastModified: new Date().toISOString(),
      author: 'Admin'
    },
    {
      id: 'auth-register',
      title: 'Register Page',
      slug: '/auth/register',
      content: {
        title: 'Create Account',
        subtitle: 'Join One Mind, Many to start playing',
        backgroundImage: '',
        showSocialLogin: false,
        termsLink: '/terms',
        privacyLink: '/privacy'
      },
      seo: {
        title: 'Create Account - One Mind, Many',
        description: 'Create your One Mind, Many account and start playing today.',
        keywords: ['register', 'sign up', 'create account', 'join'],
        ogImage: '',
        canonical: 'https://onemindmany.com/auth/register',
        robots: 'index, follow',
        structuredData: {}
      },
      status: 'published',
      lastModified: new Date().toISOString(),
      author: 'Admin'
    },
    {
      id: 'game-menu',
      title: 'Game Main Menu',
      slug: '/game',
      content: {
        welcomeMessage: 'Welcome, {username}',
        subtitle: 'What would you like to do today?',
        menuItems: [
          { title: 'Play', description: 'Join or create a game lobby', path: '/game/play', icon: 'Play' },
          { title: 'Scenarios', description: 'Browse available game scenarios', path: '/game/scenarios', icon: 'BookOpen' },
          { title: 'Friends', description: 'Manage your friends list', path: '/game/friends', icon: 'Users' },
          { title: 'Settings', description: 'Configure game preferences', path: '/game/settings', icon: 'Settings' }
        ]
      },
      seo: {
        title: 'Game Menu - One Mind, Many',
        description: 'Access all game features from the main menu.',
        keywords: ['game menu', 'dashboard', 'play'],
        ogImage: '',
        canonical: 'https://onemindmany.com/game',
        robots: 'noindex, nofollow',
        structuredData: {}
      },
      status: 'published',
      lastModified: new Date().toISOString(),
      author: 'Admin'
    },
    {
      id: 'game-play',
      title: 'Game Lobbies',
      slug: '/game/play',
      content: {
        title: 'Game Lobbies',
        subtitle: 'Join an existing game or create your own',
        createButtonText: 'Create Lobby',
        quickJoinButtonText: 'Quick Join',
        searchPlaceholder: 'Search lobbies...'
      },
      seo: {
        title: 'Game Lobbies - One Mind, Many',
        description: 'Join or create game lobbies to start playing.',
        keywords: ['lobbies', 'multiplayer', 'join game'],
        ogImage: '',
        canonical: 'https://onemindmany.com/game/play',
        robots: 'noindex, nofollow',
        structuredData: {}
      },
      status: 'published',
      lastModified: new Date().toISOString(),
      author: 'Admin'
    },
    {
      id: 'game-scenarios',
      title: 'Game Scenarios',
      slug: '/game/scenarios',
      content: {
        title: 'Game Scenarios',
        subtitle: 'Browse and manage available game scenarios',
        createButtonText: 'Create Scenario',
        searchPlaceholder: 'Search scenarios...'
      },
      seo: {
        title: 'Game Scenarios - One Mind, Many',
        description: 'Browse available game scenarios and create your own.',
        keywords: ['scenarios', 'game modes', 'content'],
        ogImage: '',
        canonical: 'https://onemindmany.com/game/scenarios',
        robots: 'noindex, nofollow',
        structuredData: {}
      },
      status: 'published',
      lastModified: new Date().toISOString(),
      author: 'Admin'
    },
    {
      id: 'game-friends',
      title: 'Friends',
      slug: '/game/friends',
      content: {
        title: 'Friends',
        subtitle: 'Manage your friends and friend requests',
        addFriendPlaceholder: 'Add friend by username...',
        addFriendButtonText: 'Add Friend',
        searchPlaceholder: 'Search friends...'
      },
      seo: {
        title: 'Friends - One Mind, Many',
        description: 'Manage your friends list and send friend requests.',
        keywords: ['friends', 'social', 'multiplayer'],
        ogImage: '',
        canonical: 'https://onemindmany.com/game/friends',
        robots: 'noindex, nofollow',
        structuredData: {}
      },
      status: 'published',
      lastModified: new Date().toISOString(),
      author: 'Admin'
    },
    {
      id: 'game-settings',
      title: 'Game Settings',
      slug: '/game/settings',
      content: {
        title: 'Settings',
        subtitle: 'Customize your game experience',
        sections: [
          { title: 'Display', icon: 'Monitor' },
          { title: 'Audio', icon: 'Volume2' },
          { title: 'Notifications', icon: 'Bell' },
          { title: 'Account Information', icon: 'User' }
        ]
      },
      seo: {
        title: 'Settings - One Mind, Many',
        description: 'Customize your game settings and preferences.',
        keywords: ['settings', 'preferences', 'configuration'],
        ogImage: '',
        canonical: 'https://onemindmany.com/game/settings',
        robots: 'noindex, nofollow',
        structuredData: {}
      },
      status: 'published',
      lastModified: new Date().toISOString(),
      author: 'Admin'
    }
  ]);

  const [pages, setPages] = useState<PageContent[]>(allPages);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'One Mind, Many',
    siteDescription: 'The ultimate social deduction game with AI-driven scenarios',
    siteUrl: 'https://onemindmany.com',
    defaultFont: 'Quicksand',
    headingFont: 'CustomHeading',
    bodyFont: 'Quicksand',
    primaryColor: '#D65F27',
    secondaryColor: '#2C365E',
    logo: '/OneMindMay Logo - long.png',
    favicon: '/favicon.svg',
    googleAnalytics: '',
    googleSearchConsole: '',
    bingWebmaster: '',
    yandexWebmaster: '',
    facebookPixel: '',
    twitterSite: '@onemindmany',
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: '',
      github: ''
    }
  });

  const [navigation, setNavigation] = useState<NavigationItem[]>([
    { id: '1', label: 'Home', path: '/', visible: true, order: 1 },
    { id: '2', label: 'How to Play', path: '/how-to-play', icon: 'Book', visible: true, order: 2 },
    { id: '3', label: 'Play', path: '/game', visible: true, order: 3 },
    { id: '4', label: 'Friends', path: '/game/friends', visible: true, order: 4 },
    { id: '5', label: 'Settings', path: '/game/settings', visible: true, order: 5 }
  ]);

  const [components] = useState([
    { id: 'hero', name: 'Hero Section', description: 'Large banner with title and CTA' },
    { id: 'features', name: 'Features Grid', description: 'Grid of feature cards' },
    { id: 'stats', name: 'Statistics', description: 'Numerical stats display' },
    { id: 'testimonials', name: 'Testimonials', description: 'Customer testimonials' },
    { id: 'cta', name: 'Call to Action', description: 'Action-focused section' },
    { id: 'gallery', name: 'Image Gallery', description: 'Photo gallery component' },
    { id: 'video', name: 'Video Player', description: 'Embedded video player' },
    { id: 'form', name: 'Contact Form', description: 'Contact/feedback form' },
    { id: 'pricing', name: 'Pricing Table', description: 'Pricing plans display' },
    { id: 'team', name: 'Team Section', description: 'Team member profiles' }
  ]);

  const [analytics] = useState({
    pageViews: 45672,
    uniqueVisitors: 12847,
    bounceRate: 32.5,
    avgSessionDuration: '4:32',
    topPages: [
      { page: '/', views: 15234, title: 'Home' },
      { page: '/how-to-play', views: 8901, title: 'How to Play' },
      { page: '/game/play', views: 6543, title: 'Game Lobbies' },
      { page: '/auth/register', views: 4321, title: 'Register' }
    ],
    searchTerms: [
      { term: 'social deduction game', count: 234 },
      { term: 'multiplayer strategy', count: 189 },
      { term: 'AI game scenarios', count: 156 },
      { term: 'online party game', count: 134 }
    ]
  });

  const [seoAnalysis, setSeoAnalysis] = useState({
    score: 85,
    issues: [
      { type: 'warning', message: 'Meta description could be longer (current: 120 chars, recommended: 150-160)' },
      { type: 'error', message: 'Missing alt text on 2 images' },
      { type: 'info', message: 'Consider adding more internal links' }
    ],
    recommendations: [
      'Add more relevant keywords to page content',
      'Optimize images for faster loading',
      'Create more internal linking opportunities',
      'Add structured data for better search visibility'
    ]
  });

  const tabs = [
    { id: 'pages', label: 'Pages', icon: <FileText size={18} /> },
    { id: 'navigation', label: 'Navigation', icon: <Navigation size={18} /> },
    { id: 'components', label: 'Components', icon: <Layout size={18} /> },
    { id: 'media', label: 'Media Library', icon: <Image size={18} /> },
    { id: 'seo', label: 'SEO & Analytics', icon: <BarChart3 size={18} /> },
    { id: 'settings', label: 'Site Settings', icon: <Settings size={18} /> }
  ];

  const fontOptions = [
    'CustomHeading',
    'Quicksand',
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Source Sans Pro',
    'Nunito',
    'Raleway',
    'Ubuntu',
    'Merriweather',
    'Playfair Display',
    'Oswald',
    'Lora'
  ];

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const handlePageSelect = (pageId: string) => {
    setSelectedPage(pageId);
  };

  const handleContentChange = (pageId: string, field: string, value: any) => {
    setPages(prev => prev.map(page => 
      page.id === pageId 
        ? { ...page, content: { ...page.content, [field]: value }, lastModified: new Date().toISOString() }
        : page
    ));
  };

  const handleSEOChange = (pageId: string, field: string, value: any) => {
    setPages(prev => prev.map(page => 
      page.id === pageId 
        ? { ...page, seo: { ...page.seo, [field]: value }, lastModified: new Date().toISOString() }
        : page
    ));
  };

  const addNavigationItem = () => {
    const newItem: NavigationItem = {
      id: Date.now().toString(),
      label: 'New Page',
      path: '/new-page',
      visible: true,
      order: navigation.length + 1
    };
    setNavigation([...navigation, newItem]);
  };

  const updateNavigationItem = (id: string, updates: Partial<NavigationItem>) => {
    setNavigation(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeNavigationItem = (id: string) => {
    setNavigation(prev => prev.filter(item => item.id !== id));
  };

  const selectedPageData = selectedPage ? pages.find(p => p.id === selectedPage) : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Management</h1>
          <p className="text-slate-400 mt-2">Manage all website content, pages, and settings</p>
        </div>
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            leftIcon={<Eye size={18} />}
            onClick={() => window.open('/', '_blank')}
          >
            Preview Site
          </Button>
          <Button
            onClick={handleSave}
            isLoading={saving}
            leftIcon={<Save size={18} />}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-700 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Page List */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">All Pages</h3>
                <Button size="sm" leftIcon={<Plus size={16} />}>
                  New Page
                </Button>
              </div>
              
              <div className="space-y-2">
                {pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => handlePageSelect(page.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedPage === page.id
                        ? 'bg-orange-500/20 border border-orange-500'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{page.title}</h4>
                        <p className="text-slate-400 text-sm">{page.slug}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        page.status === 'published' 
                          ? 'bg-green-500/20 text-green-400'
                          : page.status === 'draft'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {page.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Page Editor */}
          <div className="lg:col-span-2">
            {selectedPageData ? (
              <div className="space-y-6">
                {/* Editor Toolbar */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Editing: {selectedPageData.title}</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={editMode === 'visual' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setEditMode('visual')}
                      >
                        Visual
                      </Button>
                      <Button
                        variant={editMode === 'html' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setEditMode('html')}
                        leftIcon={<Code size={16} />}
                      >
                        HTML
                      </Button>
                    </div>
                  </div>

                  {/* Rich Text Toolbar */}
                  {editMode === 'visual' && (
                    <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-800 rounded-lg">
                      <select className="bg-slate-700 text-white rounded px-2 py-1 text-sm">
                        <option value="CustomHeading">CustomHeading</option>
                        <option value="Quicksand">Quicksand</option>
                        {fontOptions.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                      
                      <div className="w-px h-6 bg-slate-600"></div>
                      
                      <Button variant="ghost" size="sm"><Bold size={16} /></Button>
                      <Button variant="ghost" size="sm"><Italic size={16} /></Button>
                      <Button variant="ghost" size="sm"><Underline size={16} /></Button>
                      
                      <div className="w-px h-6 bg-slate-600"></div>
                      
                      <Button variant="ghost" size="sm"><Heading1 size={16} /></Button>
                      <Button variant="ghost" size="sm"><Heading2 size={16} /></Button>
                      <Button variant="ghost" size="sm"><Heading3 size={16} /></Button>
                      
                      <div className="w-px h-6 bg-slate-600"></div>
                      
                      <Button variant="ghost" size="sm"><List size={16} /></Button>
                      <Button variant="ghost" size="sm"><ListOrdered size={16} /></Button>
                      <Button variant="ghost" size="sm"><Quote size={16} /></Button>
                      
                      <div className="w-px h-6 bg-slate-600"></div>
                      
                      <Button variant="ghost" size="sm"><AlignLeft size={16} /></Button>
                      <Button variant="ghost" size="sm"><AlignCenter size={16} /></Button>
                      <Button variant="ghost" size="sm"><AlignRight size={16} /></Button>
                      
                      <div className="w-px h-6 bg-slate-600"></div>
                      
                      <Button variant="ghost" size="sm"><Link size={16} /></Button>
                      <Button variant="ghost" size="sm"><Image size={16} /></Button>
                      <Button variant="ghost" size="sm"><Video size={16} /></Button>
                      <Button variant="ghost" size="sm"><Code2 size={16} /></Button>
                    </div>
                  )}
                </Card>

                {/* Content Editor */}
                <Card className="p-6">
                  <div className="space-y-6">
                    {/* Page Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Page Title"
                        value={selectedPageData.title}
                        onChange={(e) => handleContentChange(selectedPage!, 'title', e.target.value)}
                      />
                      <Input
                        label="URL Slug"
                        value={selectedPageData.slug}
                        onChange={(e) => handleContentChange(selectedPage!, 'slug', e.target.value)}
                      />
                    </div>

                    {/* Content Areas */}
                    {selectedPageData.id === 'home' && (
                      <div className="space-y-6">
                        <h4 className="text-lg font-semibold text-white">Hero Section</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Hero Title"
                            value={selectedPageData.content.hero?.title || ''}
                            onChange={(e) => handleContentChange(selectedPage!, 'hero', {
                              ...selectedPageData.content.hero,
                              title: e.target.value
                            })}
                          />
                          <Input
                            label="Hero Subtitle"
                            value={selectedPageData.content.hero?.subtitle || ''}
                            onChange={(e) => handleContentChange(selectedPage!, 'hero', {
                              ...selectedPageData.content.hero,
                              subtitle: e.target.value
                            })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Hero Description</label>
                          <textarea
                            value={selectedPageData.content.hero?.description || ''}
                            onChange={(e) => handleContentChange(selectedPage!, 'hero', {
                              ...selectedPageData.content.hero,
                              description: e.target.value
                            })}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Primary CTA Text"
                            value={selectedPageData.content.hero?.ctaText || ''}
                            onChange={(e) => handleContentChange(selectedPage!, 'hero', {
                              ...selectedPageData.content.hero,
                              ctaText: e.target.value
                            })}
                          />
                          <Input
                            label="Primary CTA Link"
                            value={selectedPageData.content.hero?.ctaLink || ''}
                            onChange={(e) => handleContentChange(selectedPage!, 'hero', {
                              ...selectedPageData.content.hero,
                              ctaLink: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Generic Content Editor */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Page Content {editMode === 'html' && '(HTML)'}
                      </label>
                      {editMode === 'visual' ? (
                        <div className="bg-slate-800 border border-slate-700 rounded-md p-4 min-h-[300px] text-white">
                          <div contentEditable className="outline-none">
                            {JSON.stringify(selectedPageData.content, null, 2)}
                          </div>
                        </div>
                      ) : (
                        <textarea
                          value={JSON.stringify(selectedPageData.content, null, 2)}
                          onChange={(e) => {
                            try {
                              const content = JSON.parse(e.target.value);
                              handleContentChange(selectedPage!, 'content', content);
                            } catch (error) {
                              // Invalid JSON, don't update
                            }
                          }}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-64 font-mono text-sm"
                        />
                      )}
                    </div>

                    {/* Custom CSS/JS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Custom CSS</label>
                        <textarea
                          value={selectedPageData.customCSS || ''}
                          onChange={(e) => handleContentChange(selectedPage!, 'customCSS', e.target.value)}
                          placeholder="/* Custom CSS for this page */"
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-32 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Custom JavaScript</label>
                        <textarea
                          value={selectedPageData.customJS || ''}
                          onChange={(e) => handleContentChange(selectedPage!, 'customJS', e.target.value)}
                          placeholder="// Custom JavaScript for this page"
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-32 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* SEO Settings */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">SEO Settings</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSEOAnalysis(!showSEOAnalysis)}
                      leftIcon={<BarChart3 size={16} />}
                    >
                      SEO Analysis
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="SEO Title"
                      value={selectedPageData.seo.title}
                      onChange={(e) => handleSEOChange(selectedPage!, 'title', e.target.value)}
                      placeholder="Page title for search engines"
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Meta Description</label>
                      <textarea
                        value={selectedPageData.seo.description}
                        onChange={(e) => handleSEOChange(selectedPage!, 'description', e.target.value)}
                        placeholder="Brief description for search results"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-20"
                        maxLength={160}
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        {selectedPageData.seo.description.length}/160 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Keywords</label>
                      <Input
                        value={selectedPageData.seo.keywords.join(', ')}
                        onChange={(e) => handleSEOChange(selectedPage!, 'keywords', e.target.value.split(', '))}
                        placeholder="keyword1, keyword2, keyword3"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Canonical URL"
                        value={selectedPageData.seo.canonical}
                        onChange={(e) => handleSEOChange(selectedPage!, 'canonical', e.target.value)}
                        placeholder="https://example.com/page"
                      />
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Robots</label>
                        <select
                          value={selectedPageData.seo.robots}
                          onChange={(e) => handleSEOChange(selectedPage!, 'robots', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                        >
                          <option value="index, follow">Index, Follow</option>
                          <option value="noindex, nofollow">No Index, No Follow</option>
                          <option value="index, nofollow">Index, No Follow</option>
                          <option value="noindex, follow">No Index, Follow</option>
                        </select>
                      </div>
                    </div>

                    {showSEOAnalysis && (
                      <div className="mt-6 p-4 bg-slate-800 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-semibold text-white">SEO Analysis</h5>
                          <div className="flex items-center">
                            <span className="text-2xl font-bold text-green-400">{seoAnalysis.score}</span>
                            <span className="text-slate-400 ml-1">/100</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {seoAnalysis.issues.map((issue, index) => (
                            <div key={index} className="flex items-start">
                              {issue.type === 'error' && <X className="w-4 h-4 text-red-500 mr-2 mt-0.5" />}
                              {issue.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5" />}
                              {issue.type === 'info' && <Info className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />}
                              <span className="text-slate-300 text-sm">{issue.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <FileText size={48} className="mx-auto text-slate-600 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Select a Page to Edit</h3>
                <p className="text-slate-400">Choose a page from the list to start editing its content</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Navigation Tab */}
      {activeTab === 'navigation' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Navigation Menu</h3>
              <Button onClick={addNavigationItem} leftIcon={<Plus size={18} />}>
                Add Menu Item
              </Button>
            </div>

            <div className="space-y-4">
              {navigation.map((item) => (
                <div key={item.id} className="bg-slate-800 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <Input
                      label="Label"
                      value={item.label}
                      onChange={(e) => updateNavigationItem(item.id, { label: e.target.value })}
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Path</label>
                      <select
                        value={item.path}
                        onChange={(e) => updateNavigationItem(item.id, { path: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
                      >
                        {allPages.map(page => (
                          <option key={page.id} value={page.slug}>{page.title}</option>
                        ))}
                        <option value="/custom">Custom URL...</option>
                      </select>
                    </div>
                    <Input
                      label="Order"
                      type="number"
                      value={item.order}
                      onChange={(e) => updateNavigationItem(item.id, { order: parseInt(e.target.value) })}
                    />
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.visible}
                          onChange={(e) => updateNavigationItem(item.id, { visible: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-slate-300 text-sm">Visible</span>
                      </label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeNavigationItem(item.id)}
                      leftIcon={<Trash2 size={16} />}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Components Tab */}
      {activeTab === 'components' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">Available Components</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {components.map((component) => (
                <div key={component.id} className="bg-slate-800 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-2">{component.name}</h4>
                  <p className="text-slate-400 text-sm mb-4">{component.description}</p>
                  <div className="flex gap-2">
                    <Button size="sm" leftIcon={<Plus size={16} />}>
                      Insert
                    </Button>
                    <Button variant="outline" size="sm" leftIcon={<Edit size={16} />}>
                      Customize
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Media Library Tab */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Media Library</h3>
              <Button leftIcon={<Upload size={18} />}>
                Upload Files
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-slate-800 rounded-lg p-4 text-center">
                  <div className="w-full h-24 bg-slate-700 rounded mb-2 flex items-center justify-center">
                    <Image size={24} className="text-slate-500" />
                  </div>
                  <p className="text-slate-300 text-sm truncate">image-{i}.jpg</p>
                  <p className="text-slate-500 text-xs">2.4 MB</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* SEO & Analytics Tab */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Page Views</p>
                  <p className="text-3xl font-bold text-white">{analytics.pageViews.toLocaleString()}</p>
                </div>
                <BarChart3 className="w-12 h-12 text-blue-500 opacity-50" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Unique Visitors</p>
                  <p className="text-3xl font-bold text-white">{analytics.uniqueVisitors.toLocaleString()}</p>
                </div>
                <Users className="w-12 h-12 text-green-500 opacity-50" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Bounce Rate</p>
                  <p className="text-3xl font-bold text-white">{analytics.bounceRate}%</p>
                </div>
                <TrendingUp className="w-12 h-12 text-orange-500 opacity-50" />
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Avg. Session</p>
                  <p className="text-3xl font-bold text-white">{analytics.avgSessionDuration}</p>
                </div>
                <Clock className="w-12 h-12 text-purple-500 opacity-50" />
              </div>
            </Card>
          </div>

          {/* Top Pages */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">Top Pages</h3>
            <div className="space-y-4">
              {analytics.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">{page.title}</h4>
                    <p className="text-slate-400 text-sm">{page.page}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{page.views.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">views</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Search Terms */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">Top Search Terms</h3>
            <div className="space-y-3">
              {analytics.searchTerms.map((term, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-slate-300">{term.term}</span>
                  <span className="text-white font-medium">{term.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Site Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">General Settings</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Site Name"
                  value={siteSettings.siteName}
                  onChange={(e) => setSiteSettings(prev => ({ ...prev, siteName: e.target.value }))}
                />
                <Input
                  label="Site URL"
                  value={siteSettings.siteUrl}
                  onChange={(e) => setSiteSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Site Description</label>
                <textarea
                  value={siteSettings.siteDescription}
                  onChange={(e) => setSiteSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Default Font</label>
                  <select
                    value={siteSettings.defaultFont}
                    onChange={(e) => setSiteSettings(prev => ({ ...prev, defaultFont: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                  >
                    {fontOptions.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Heading Font</label>
                  <select
                    value={siteSettings.headingFont}
                    onChange={(e) => setSiteSettings(prev => ({ ...prev, headingFont: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                  >
                    {fontOptions.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Body Font</label>
                  <select
                    value={siteSettings.bodyFont}
                    onChange={(e) => setSiteSettings(prev => ({ ...prev, bodyFont: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                  >
                    {fontOptions.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Primary Color"
                  type="color"
                  value={siteSettings.primaryColor}
                  onChange={(e) => setSiteSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                />
                <Input
                  label="Secondary Color"
                  type="color"
                  value={siteSettings.secondaryColor}
                  onChange={(e) => setSiteSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                />
              </div>
            </div>
          </Card>

          {/* SEO Settings */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">SEO & Analytics</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Google Analytics ID"
                  value={siteSettings.googleAnalytics}
                  onChange={(e) => setSiteSettings(prev => ({ ...prev, googleAnalytics: e.target.value }))}
                  placeholder="G-XXXXXXXXXX"
                />
                <Input
                  label="Google Search Console"
                  value={siteSettings.googleSearchConsole}
                  onChange={(e) => setSiteSettings(prev => ({ ...prev, googleSearchConsole: e.target.value }))}
                  placeholder="Verification code"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Bing Webmaster"
                  value={siteSettings.bingWebmaster}
                  onChange={(e) => setSiteSettings(prev => ({ ...prev, bingWebmaster: e.target.value }))}
                  placeholder="Verification code"
                />
                <Input
                  label="Yandex Webmaster"
                  value={siteSettings.yandexWebmaster}
                  onChange={(e) => setSiteSettings(prev => ({ ...prev, yandexWebmaster: e.target.value }))}
                  placeholder="Verification code"
                />
              </div>
            </div>
          </Card>

          {/* Social Media */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">Social Media</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Facebook"
                value={siteSettings.socialMedia.facebook}
                onChange={(e) => setSiteSettings(prev => ({ 
                  ...prev, 
                  socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                }))}
                placeholder="https://facebook.com/yourpage"
              />
              <Input
                label="Twitter"
                value={siteSettings.socialMedia.twitter}
                onChange={(e) => setSiteSettings(prev => ({ 
                  ...prev, 
                  socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                }))}
                placeholder="https://twitter.com/youraccount"
              />
              <Input
                label="Instagram"
                value={siteSettings.socialMedia.instagram}
                onChange={(e) => setSiteSettings(prev => ({ 
                  ...prev, 
                  socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                }))}
                placeholder="https://instagram.com/youraccount"
              />
              <Input
                label="GitHub"
                value={siteSettings.socialMedia.github}
                onChange={(e) => setSiteSettings(prev => ({ 
                  ...prev, 
                  socialMedia: { ...prev.socialMedia, github: e.target.value }
                }))}
                placeholder="https://github.com/youraccount"
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ContentManagementPage;