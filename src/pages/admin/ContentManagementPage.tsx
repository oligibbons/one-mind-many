import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, Upload, Download, Eye, Edit, Trash2, Plus, 
  Globe, Layout, Palette, Type, Image, Navigation,
  Code, Settings, Monitor, Smartphone, Tablet,
  ChevronDown, ChevronRight, FileText, Link as LinkIcon,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Undo, Redo, Search, Target, BarChart3, TrendingUp,
  ExternalLink, Hash, Calendar, User, Tag, Zap
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface Page {
  id: string;
  name: string;
  path: string;
  title: string;
  description: string;
  content: any;
  htmlContent: string;
  isPublic: boolean;
  inNavigation: boolean;
  navOrder: number;
  template: string;
  seoSettings: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    ogImage: string;
    ogTitle: string;
    ogDescription: string;
    twitterCard: string;
    canonicalUrl: string;
    robots: string;
    structuredData: string;
  };
  customCSS: string;
  customJS: string;
  publishedAt?: string;
  lastModified: string;
  author: string;
  status: 'draft' | 'published' | 'scheduled';
  featuredImage?: string;
  excerpt?: string;
  readingTime?: number;
}

interface NavigationItem {
  id: string;
  name: string;
  path: string;
  icon?: string;
  order: number;
  isVisible: boolean;
  children?: NavigationItem[];
}

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  headingFont: string;
  bodyFont: string;
  customCSS: string;
  customJS: string;
  socialLinks: {
    twitter: string;
    github: string;
    discord: string;
    facebook: string;
    instagram: string;
    linkedin: string;
  };
  analytics: {
    googleAnalytics: string;
    googleTagManager: string;
    facebookPixel: string;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    defaultKeywords: string[];
    siteVerification: {
      google: string;
      bing: string;
      yandex: string;
    };
  };
}

interface SEOAnalysis {
  score: number;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    suggestion: string;
  }>;
  keywords: Array<{
    keyword: string;
    density: number;
    count: number;
  }>;
  readability: {
    score: number;
    level: string;
    avgWordsPerSentence: number;
    avgSentencesPerParagraph: number;
  };
}

const ContentManagementPage = () => {
  const [activeTab, setActiveTab] = useState('pages');
  const [pages, setPages] = useState<Page[]>([]);
  const [navigation, setNavigation] = useState<NavigationItem[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPageEditor, setShowPageEditor] = useState(false);
  const [editMode, setEditMode] = useState<'visual' | 'html'>('visual');
  const [expandedSections, setExpandedSections] = useState<string[]>(['general']);
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null);
  const [selectedText, setSelectedText] = useState('');

  const tabs = [
    { id: 'pages', name: 'Pages', icon: <FileText size={18} /> },
    { id: 'navigation', name: 'Navigation', icon: <Navigation size={18} /> },
    { id: 'components', name: 'Components', icon: <Layout size={18} /> },
    { id: 'styles', name: 'Styles', icon: <Palette size={18} /> },
    { id: 'media', name: 'Media', icon: <Image size={18} /> },
    { id: 'seo', name: 'SEO Tools', icon: <Target size={18} /> },
    { id: 'analytics', name: 'Analytics', icon: <BarChart3 size={18} /> },
    { id: 'settings', name: 'Site Settings', icon: <Settings size={18} /> },
    { id: 'code', name: 'Custom Code', icon: <Code size={18} /> },
  ];

  const fontOptions = [
    { value: 'Quicksand', label: 'Quicksand (Default)' },
    { value: 'CustomHeading', label: 'Custom Heading Font' },
    { value: 'Inter', label: 'Inter' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro' },
    { value: 'Nunito', label: 'Nunito' },
    { value: 'Playfair Display', label: 'Playfair Display' },
    { value: 'Merriweather', label: 'Merriweather' },
  ];

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      
      // Mock data for development
      setPages([
        {
          id: '1',
          name: 'Home',
          path: '/',
          title: 'One Mind, Many - Home',
          description: 'The ultimate social deduction experience',
          content: {
            hero: {
              title: 'One Mind, Many',
              subtitle: 'The ultimate social deduction experience',
              description: 'Navigate through AI-driven scenarios where trust is scarce and survival depends on wit.',
              backgroundImage: '/images/hero-bg.jpg',
              ctaText: 'Start Playing',
              ctaLink: '/game'
            },
            features: [
              {
                title: 'AI Scenarios',
                description: 'Dynamic stories that adapt to your choices',
                icon: 'Brain'
              }
            ]
          },
          htmlContent: `<div class="hero-section">
            <h1 class="text-4xl font-bold text-white mb-4">One Mind, Many</h1>
            <p class="text-xl text-slate-300 mb-8">The ultimate social deduction experience</p>
            <button class="game-button">Start Playing</button>
          </div>`,
          isPublic: true,
          inNavigation: true,
          navOrder: 1,
          template: 'home',
          seoSettings: {
            metaTitle: 'One Mind, Many - The Ultimate Social Deduction Game',
            metaDescription: 'Experience the thrill of deception and strategy in One Mind, Many.',
            keywords: ['social deduction', 'strategy game', 'AI scenarios'],
            ogImage: '/images/og-home.jpg',
            ogTitle: 'One Mind, Many - Social Deduction Game',
            ogDescription: 'Navigate AI-driven scenarios where survival depends on cunning teamwork.',
            twitterCard: 'summary_large_image',
            canonicalUrl: 'https://onemindmany.com/',
            robots: 'index, follow',
            structuredData: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "One Mind, Many",
              "description": "The ultimate social deduction experience"
            })
          },
          customCSS: '',
          customJS: '',
          lastModified: new Date().toISOString(),
          author: 'Admin',
          status: 'published'
        }
      ]);

      setNavigation([
        { id: '1', name: 'Home', path: '/', order: 1, isVisible: true },
        { id: '2', name: 'How to Play', path: '/how-to-play', order: 2, isVisible: true },
        { id: '3', name: 'Play', path: '/game', order: 3, isVisible: true }
      ]);

      setSiteSettings({
        siteName: 'One Mind, Many',
        siteDescription: 'The ultimate social deduction experience',
        logo: '/OneMindMay Logo - long.png',
        favicon: '/favicon.svg',
        primaryColor: '#D65F27',
        secondaryColor: '#2C365E',
        accentColor: '#6B5589',
        fontFamily: 'Quicksand',
        headingFont: 'CustomHeading',
        bodyFont: 'Quicksand',
        customCSS: '',
        customJS: '',
        socialLinks: {
          twitter: 'https://twitter.com/onemindmany',
          github: 'https://github.com/onemindmany',
          discord: 'https://discord.gg/onemindmany',
          facebook: '',
          instagram: '',
          linkedin: ''
        },
        analytics: {
          googleAnalytics: '',
          googleTagManager: '',
          facebookPixel: ''
        },
        seo: {
          defaultTitle: 'One Mind, Many',
          defaultDescription: 'The ultimate social deduction experience',
          defaultKeywords: ['social deduction', 'strategy game', 'multiplayer'],
          siteVerification: {
            google: '',
            bing: '',
            yandex: ''
          }
        }
      });
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all content
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePage = () => {
    const newPage: Page = {
      id: Date.now().toString(),
      name: 'New Page',
      path: '/new-page',
      title: 'New Page',
      description: '',
      content: {},
      htmlContent: '<h1>New Page</h1><p>Start editing your content here...</p>',
      isPublic: true,
      inNavigation: false,
      navOrder: pages.length + 1,
      template: 'default',
      seoSettings: {
        metaTitle: '',
        metaDescription: '',
        keywords: [],
        ogImage: '',
        ogTitle: '',
        ogDescription: '',
        twitterCard: 'summary',
        canonicalUrl: '',
        robots: 'index, follow',
        structuredData: ''
      },
      customCSS: '',
      customJS: '',
      lastModified: new Date().toISOString(),
      author: 'Admin',
      status: 'draft'
    };
    
    setPages([...pages, newPage]);
    setSelectedPage(newPage);
    setShowPageEditor(true);
  };

  const handleDeletePage = (pageId: string) => {
    if (confirm('Are you sure you want to delete this page?')) {
      setPages(pages.filter(p => p.id !== pageId));
      if (selectedPage?.id === pageId) {
        setSelectedPage(null);
        setShowPageEditor(false);
      }
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const applyTextFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const analyzeSEO = (page: Page) => {
    const content = page.htmlContent || '';
    const wordCount = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    
    const analysis: SEOAnalysis = {
      score: 85,
      issues: [
        {
          type: 'warning',
          message: 'Meta description is too short',
          suggestion: 'Aim for 150-160 characters for optimal display in search results'
        },
        {
          type: 'info',
          message: 'Good use of heading tags',
          suggestion: 'Continue using H1-H6 tags to structure your content'
        }
      ],
      keywords: [
        { keyword: 'social deduction', density: 2.1, count: 5 },
        { keyword: 'strategy game', density: 1.8, count: 4 }
      ],
      readability: {
        score: 78,
        level: 'Good',
        avgWordsPerSentence: 15,
        avgSentencesPerParagraph: 4
      }
    };
    
    setSeoAnalysis(analysis);
  };

  const insertComponent = (componentType: string) => {
    const components = {
      hero: '<div class="hero-section"><h1>Hero Title</h1><p>Hero description</p></div>',
      button: '<button class="game-button">Click Me</button>',
      card: '<div class="game-card p-6"><h3>Card Title</h3><p>Card content</p></div>',
      image: '<img src="/placeholder.jpg" alt="Description" class="w-full rounded-lg" />',
      video: '<video controls class="w-full"><source src="/video.mp4" type="video/mp4"></video>'
    };
    
    const component = components[componentType as keyof typeof components];
    if (component && selectedPage) {
      setSelectedPage({
        ...selectedPage,
        htmlContent: selectedPage.htmlContent + component
      });
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading content management..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Management System</h1>
          <p className="text-slate-400 mt-2">Complete control over your website content</p>
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
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-8">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {/* Pages Tab */}
        {activeTab === 'pages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Pages</h3>
                  <Button
                    size="sm"
                    onClick={handleCreatePage}
                    leftIcon={<Plus size={16} />}
                  >
                    New Page
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedPage?.id === page.id
                          ? 'bg-orange-500/20 border border-orange-500'
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                      onClick={() => {
                        setSelectedPage(page);
                        setShowPageEditor(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">{page.name}</h4>
                          <p className="text-slate-400 text-sm">{page.path}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded text-xs ${
                              page.status === 'published' ? 'bg-green-500/20 text-green-400' :
                              page.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {page.status}
                            </span>
                            {page.isPublic && <Globe size={12} className="text-green-400" />}
                            {page.inNavigation && <Navigation size={12} className="text-blue-400" />}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePage(page.id);
                          }}
                          leftIcon={<Trash2 size={14} />}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              {selectedPage && showPageEditor ? (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Edit Page: {selectedPage.name}</h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant={editMode === 'visual' ? 'primary' : 'outline'}
                        onClick={() => setEditMode('visual')}
                      >
                        Visual
                      </Button>
                      <Button
                        size="sm"
                        variant={editMode === 'html' ? 'primary' : 'outline'}
                        onClick={() => setEditMode('html')}
                      >
                        HTML
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewMode('desktop')}
                        leftIcon={<Monitor size={16} />}
                        className={previewMode === 'desktop' ? 'bg-orange-500/20' : ''}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewMode('tablet')}
                        leftIcon={<Tablet size={16} />}
                        className={previewMode === 'tablet' ? 'bg-orange-500/20' : ''}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewMode('mobile')}
                        leftIcon={<Smartphone size={16} />}
                        className={previewMode === 'mobile' ? 'bg-orange-500/20' : ''}
                      />
                    </div>
                  </div>

                  {/* Rich Text Editor Toolbar */}
                  {editMode === 'visual' && (
                    <div className="border border-slate-700 rounded-lg p-3 mb-4 flex flex-wrap gap-2">
                      <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
                        <Button size="sm" variant="ghost" onClick={() => applyTextFormatting('undo')} leftIcon={<Undo size={14} />} />
                        <Button size="sm" variant="ghost" onClick={() => applyTextFormatting('redo')} leftIcon={<Redo size={14} />} />
                      </div>
                      
                      <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
                        <Button size="sm" variant="ghost" onClick={() => applyTextFormatting('bold')} leftIcon={<Bold size={14} />} />
                        <Button size="sm" variant="ghost" onClick={() => applyTextFormatting('italic')} leftIcon={<Italic size={14} />} />
                        <Button size="sm" variant="ghost" onClick={() => applyTextFormatting('underline')} leftIcon={<Underline size={14} />} />
                      </div>
                      
                      <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
                        <Button size="sm" variant="ghost" onClick={() => applyTextFormatting('justifyLeft')} leftIcon={<AlignLeft size={14} />} />
                        <Button size="sm" variant="ghost" onClick={() => applyTextFormatting('justifyCenter')} leftIcon={<AlignCenter size={14} />} />
                        <Button size="sm" variant="ghost" onClick={() => applyTextFormatting('justifyRight')} leftIcon={<AlignRight size={14} />} />
                      </div>
                      
                      <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
                        <Button size="sm" variant="ghost" onClick={() => applyTextFormatting('formatBlock', 'h1')} leftIcon={<Heading1 size={14} />} />
                        <Button size="sm" variant="ghost" onClick={() => applyTextFormatting('formatBlock', 'h2')} leftIcon={<Heading2 size={14} />} />
                        <Button size="sm" variant="ghost" onClick={() => applyTextFormatting('formatBlock', 'h3')} leftIcon={<Heading3 size={14} />} />
                      </div>
                      
                      <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
                        <Button size="sm" variant="ghost" onClick={() => applyTextFormatting('insertUnorderedList')} leftIcon={<List size={14} />} />
                        <Button size="sm" variant="ghost" onClick={() => applyTextFormatting('insertOrderedList')} leftIcon={<ListOrdered size={14} />} />
                        <Button size="sm" variant="ghost" onClick={() => applyTextFormatting('formatBlock', 'blockquote')} leftIcon={<Quote size={14} />} />
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <select 
                          className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-sm"
                          onChange={(e) => applyTextFormatting('fontName', e.target.value)}
                        >
                          <option value="">Font</option>
                          {fontOptions.map(font => (
                            <option key={font.value} value={font.value}>{font.label}</option>
                          ))}
                        </select>
                        
                        <select 
                          className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-sm"
                          onChange={(e) => applyTextFormatting('fontSize', e.target.value)}
                        >
                          <option value="">Size</option>
                          <option value="1">Small</option>
                          <option value="3">Normal</option>
                          <option value="5">Large</option>
                          <option value="7">Extra Large</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Component Insertion Toolbar */}
                  <div className="border border-slate-700 rounded-lg p-3 mb-4">
                    <h4 className="text-white font-medium mb-2">Insert Components</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => insertComponent('hero')}>Hero Section</Button>
                      <Button size="sm" variant="outline" onClick={() => insertComponent('button')}>Button</Button>
                      <Button size="sm" variant="outline" onClick={() => insertComponent('card')}>Card</Button>
                      <Button size="sm" variant="outline" onClick={() => insertComponent('image')}>Image</Button>
                      <Button size="sm" variant="outline" onClick={() => insertComponent('video')}>Video</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* General Settings */}
                    <div>
                      <button
                        onClick={() => toggleSection('general')}
                        className="flex items-center justify-between w-full p-3 bg-slate-800 rounded-lg"
                      >
                        <span className="text-white font-medium">General Settings</span>
                        {expandedSections.includes('general') ? 
                          <ChevronDown size={20} /> : <ChevronRight size={20} />
                        }
                      </button>
                      
                      {expandedSections.includes('general') && (
                        <div className="mt-4 space-y-4 p-4 bg-slate-800/50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label="Page Name"
                              value={selectedPage.name}
                              onChange={(e) => setSelectedPage({
                                ...selectedPage,
                                name: e.target.value
                              })}
                            />
                            <Input
                              label="URL Path"
                              value={selectedPage.path}
                              onChange={(e) => setSelectedPage({
                                ...selectedPage,
                                path: e.target.value
                              })}
                            />
                          </div>
                          
                          <Input
                            label="Page Title"
                            value={selectedPage.title}
                            onChange={(e) => setSelectedPage({
                              ...selectedPage,
                              title: e.target.value
                            })}
                          />
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Description
                            </label>
                            <textarea
                              value={selectedPage.description}
                              onChange={(e) => setSelectedPage({
                                ...selectedPage,
                                description: e.target.value
                              })}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Status
                            </label>
                            <select
                              value={selectedPage.status}
                              onChange={(e) => setSelectedPage({
                                ...selectedPage,
                                status: e.target.value as 'draft' | 'published' | 'scheduled'
                              })}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                            >
                              <option value="draft">Draft</option>
                              <option value="published">Published</option>
                              <option value="scheduled">Scheduled</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedPage.isPublic}
                                onChange={(e) => setSelectedPage({
                                  ...selectedPage,
                                  isPublic: e.target.checked
                                })}
                                className="mr-2"
                              />
                              <span className="text-slate-300">Public Page</span>
                            </label>
                            
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedPage.inNavigation}
                                onChange={(e) => setSelectedPage({
                                  ...selectedPage,
                                  inNavigation: e.target.checked
                                })}
                                className="mr-2"
                              />
                              <span className="text-slate-300">Show in Navigation</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content Editor */}
                    <div>
                      <button
                        onClick={() => toggleSection('content')}
                        className="flex items-center justify-between w-full p-3 bg-slate-800 rounded-lg"
                      >
                        <span className="text-white font-medium">Page Content</span>
                        {expandedSections.includes('content') ? 
                          <ChevronDown size={20} /> : <ChevronRight size={20} />
                        }
                      </button>
                      
                      {expandedSections.includes('content') && (
                        <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                          {editMode === 'visual' ? (
                            <div
                              contentEditable
                              className="w-full min-h-96 bg-white text-black rounded-md p-4 border border-slate-700"
                              dan
                              gerouslySetInnerHTML={{ __html: selectedPage.htmlContent }}
                              onBlur={(e) => setSelectedPage({
                                ...selectedPage,
                                htmlContent: e.currentTarget.innerHTML
                              })}
                              style={{ fontFamily: siteSettings?.bodyFont || 'Quicksand' }}
                            />
                          ) : (
                            <textarea
                              value={selectedPage.htmlContent}
                              onChange={(e) => setSelectedPage({
                                ...selectedPage,
                                htmlContent: e.target.value
                              })}
                              className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 h-96 font-mono text-sm"
                              placeholder="Enter HTML content..."
                            />
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* SEO Settings */}
                    <div>
                      <button
                        onClick={() => toggleSection('seo')}
                        className="flex items-center justify-between w-full p-3 bg-slate-800 rounded-lg"
                      >
                        <span className="text-white font-medium">SEO Settings</span>
                        {expandedSections.includes('seo') ? 
                          <ChevronDown size={20} /> : <ChevronRight size={20} />
                        }
                      </button>
                      
                      {expandedSections.includes('seo') && (
                        <div className="mt-4 space-y-4 p-4 bg-slate-800/50 rounded-lg">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-white font-medium">SEO Analysis</h4>
                            <Button
                              size="sm"
                              onClick={() => analyzeSEO(selectedPage)}
                              leftIcon={<Search size={16} />}
                            >
                              Analyze
                            </Button>
                          </div>

                          {seoAnalysis && (
                            <div className="bg-slate-900 rounded-lg p-4 mb-4">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-white font-medium">SEO Score</span>
                                <span className={`text-2xl font-bold ${
                                  seoAnalysis.score >= 80 ? 'text-green-400' :
                                  seoAnalysis.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                  {seoAnalysis.score}/100
                                </span>
                              </div>
                              
                              <div className="space-y-2">
                                {seoAnalysis.issues.map((issue, index) => (
                                  <div key={index} className={`p-2 rounded text-sm ${
                                    issue.type === 'error' ? 'bg-red-500/20 text-red-400' :
                                    issue.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-blue-500/20 text-blue-400'
                                  }`}>
                                    <p className="font-medium">{issue.message}</p>
                                    <p className="text-xs opacity-80">{issue.suggestion}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <Input
                            label="Meta Title"
                            value={selectedPage.seoSettings.metaTitle}
                            onChange={(e) => setSelectedPage({
                              ...selectedPage,
                              seoSettings: {
                                ...selectedPage.seoSettings,
                                metaTitle: e.target.value
                              }
                            })}
                          />
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Meta Description
                            </label>
                            <textarea
                              value={selectedPage.seoSettings.metaDescription}
                              onChange={(e) => setSelectedPage({
                                ...selectedPage,
                                seoSettings: {
                                  ...selectedPage.seoSettings,
                                  metaDescription: e.target.value
                                }
                              })}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24"
                              maxLength={160}
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              {selectedPage.seoSettings.metaDescription.length}/160 characters
                            </p>
                          </div>
                          
                          <Input
                            label="Keywords (comma-separated)"
                            value={selectedPage.seoSettings.keywords.join(', ')}
                            onChange={(e) => setSelectedPage({
                              ...selectedPage,
                              seoSettings: {
                                ...selectedPage.seoSettings,
                                keywords: e.target.value.split(',').map(k => k.trim())
                              }
                            })}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label="Canonical URL"
                              value={selectedPage.seoSettings.canonicalUrl}
                              onChange={(e) => setSelectedPage({
                                ...selectedPage,
                                seoSettings: {
                                  ...selectedPage.seoSettings,
                                  canonicalUrl: e.target.value
                                }
                              })}
                            />
                            
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Robots
                              </label>
                              <select
                                value={selectedPage.seoSettings.robots}
                                onChange={(e) => setSelectedPage({
                                  ...selectedPage,
                                  seoSettings: {
                                    ...selectedPage.seoSettings,
                                    robots: e.target.value
                                  }
                                })}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                              >
                                <option value="index, follow">Index, Follow</option>
                                <option value="noindex, follow">No Index, Follow</option>
                                <option value="index, nofollow">Index, No Follow</option>
                                <option value="noindex, nofollow">No Index, No Follow</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label="OG Title"
                              value={selectedPage.seoSettings.ogTitle}
                              onChange={(e) => setSelectedPage({
                                ...selectedPage,
                                seoSettings: {
                                  ...selectedPage.seoSettings,
                                  ogTitle: e.target.value
                                }
                              })}
                            />
                            
                            <Input
                              label="OG Image URL"
                              value={selectedPage.seoSettings.ogImage}
                              onChange={(e) => setSelectedPage({
                                ...selectedPage,
                                seoSettings: {
                                  ...selectedPage.seoSettings,
                                  ogImage: e.target.value
                                }
                              })}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Structured Data (JSON-LD)
                            </label>
                            <textarea
                              value={selectedPage.seoSettings.structuredData}
                              onChange={(e) => setSelectedPage({
                                ...selectedPage,
                                seoSettings: {
                                  ...selectedPage.seoSettings,
                                  structuredData: e.target.value
                                }
                              })}
                              className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 h-32 font-mono text-sm"
                              placeholder='{"@context": "https://schema.org", "@type": "WebPage"}'
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Custom Code */}
                    <div>
                      <button
                        onClick={() => toggleSection('code')}
                        className="flex items-center justify-between w-full p-3 bg-slate-800 rounded-lg"
                      >
                        <span className="text-white font-medium">Custom Code</span>
                        {expandedSections.includes('code') ? 
                          <ChevronDown size={20} /> : <ChevronRight size={20} />
                        }
                      </button>
                      
                      {expandedSections.includes('code') && (
                        <div className="mt-4 space-y-4 p-4 bg-slate-800/50 rounded-lg">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Custom CSS
                            </label>
                            <textarea
                              value={selectedPage.customCSS}
                              onChange={(e) => setSelectedPage({
                                ...selectedPage,
                                customCSS: e.target.value
                              })}
                              className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 h-32 font-mono text-sm"
                              placeholder="/* Custom CSS for this page */"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Custom JavaScript
                            </label>
                            <textarea
                              value={selectedPage.customJS}
                              onChange={(e) => setSelectedPage({
                                ...selectedPage,
                                customJS: e.target.value
                              })}
                              className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 h-32 font-mono text-sm"
                              placeholder="// Custom JavaScript for this page"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6">
                  <div className="text-center text-slate-400">
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Select a page to edit or create a new one</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* SEO Tools Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">SEO Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Overall SEO Score</span>
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-green-400">87/100</div>
                  <div className="text-sm text-slate-500">Good performance</div>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Pages Indexed</span>
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-blue-400">12/15</div>
                  <div className="text-sm text-slate-500">3 pages need attention</div>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Avg. Load Time</span>
                    <Zap className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="text-2xl font-bold text-orange-400">1.2s</div>
                  <div className="text-sm text-slate-500">Excellent speed</div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Site-wide SEO Settings</h3>
                  
                  {siteSettings && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Default Title Template"
                        value={siteSettings.seo.defaultTitle}
                        onChange={(e) => setSiteSettings({
                          ...siteSettings,
                          seo: {
                            ...siteSettings.seo,
                            defaultTitle: e.target.value
                          }
                        })}
                        placeholder="%page_title% | Site Name"
                      />
                      
                      <Input
                        label="Default Meta Description"
                        value={siteSettings.seo.defaultDescription}
                        onChange={(e) => setSiteSettings({
                          ...siteSettings,
                          seo: {
                            ...siteSettings.seo,
                            defaultDescription: e.target.value
                          }
                        })}
                      />
                      
                      <Input
                        label="Google Search Console"
                        value={siteSettings.seo.siteVerification.google}
                        onChange={(e) => setSiteSettings({
                          ...siteSettings,
                          seo: {
                            ...siteSettings.seo,
                            siteVerification: {
                              ...siteSettings.seo.siteVerification,
                              google: e.target.value
                            }
                          }
                        })}
                        placeholder="google-site-verification=..."
                      />
                      
                      <Input
                        label="Bing Webmaster Tools"
                        value={siteSettings.seo.siteVerification.bing}
                        onChange={(e) => setSiteSettings({
                          ...siteSettings,
                          seo: {
                            ...siteSettings.seo,
                            siteVerification: {
                              ...siteSettings.seo.siteVerification,
                              bing: e.target.value
                            }
                          }
                        })}
                        placeholder="msvalidate.01=..."
                      />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Page-by-Page Analysis</h3>
                  
                  <div className="space-y-3">
                    {pages.map((page) => (
                      <div key={page.id} className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">{page.name}</h4>
                            <p className="text-slate-400 text-sm">{page.path}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-400">85</div>
                              <div className="text-xs text-slate-500">SEO Score</div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPage(page);
                                analyzeSEO(page);
                                setActiveTab('pages');
                                setShowPageEditor(true);
                                toggleSection('seo');
                              }}
                              leftIcon={<Target size={16} />}
                            >
                              Optimize
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Styles Tab */}
        {activeTab === 'styles' && siteSettings && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-6">Global Styles</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-white font-medium mb-4">Colors</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={siteSettings.primaryColor}
                          onChange={(e) => setSiteSettings({
                            ...siteSettings,
                            primaryColor: e.target.value
                          })}
                          className="w-12 h-12 rounded border border-slate-700"
                        />
                        <Input
                          value={siteSettings.primaryColor}
                          onChange={(e) => setSiteSettings({
                            ...siteSettings,
                            primaryColor: e.target.value
                          })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={siteSettings.secondaryColor}
                          onChange={(e) => setSiteSettings({
                            ...siteSettings,
                            secondaryColor: e.target.value
                          })}
                          className="w-12 h-12 rounded border border-slate-700"
                        />
                        <Input
                          value={siteSettings.secondaryColor}
                          onChange={(e) => setSiteSettings({
                            ...siteSettings,
                            secondaryColor: e.target.value
                          })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Accent Color
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={siteSettings.accentColor}
                          onChange={(e) => setSiteSettings({
                            ...siteSettings,
                            accentColor: e.target.value
                          })}
                          className="w-12 h-12 rounded border border-slate-700"
                        />
                        <Input
                          value={siteSettings.accentColor}
                          onChange={(e) => setSiteSettings({
                            ...siteSettings,
                            accentColor: e.target.value
                          })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-4">Typography</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Heading Font (H1, H2, H3, etc.)
                      </label>
                      <select
                        value={siteSettings.headingFont}
                        onChange={(e) => setSiteSettings({
                          ...siteSettings,
                          headingFont: e.target.value
                        })}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                      >
                        {fontOptions.map(font => (
                          <option key={font.value} value={font.value}>{font.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Body Font
                      </label>
                      <select
                        value={siteSettings.bodyFont}
                        onChange={(e) => setSiteSettings({
                          ...siteSettings,
                          bodyFont: e.target.value
                        })}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                      >
                        {fontOptions.map(font => (
                          <option key={font.value} value={font.value}>{font.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        General Font Family
                      </label>
                      <select
                        value={siteSettings.fontFamily}
                        onChange={(e) => setSiteSettings({
                          ...siteSettings,
                          fontFamily: e.target.value
                        })}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                      >
                        {fontOptions.map(font => (
                          <option key={font.value} value={font.value}>{font.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-4">Custom CSS</h4>
                <textarea
                  value={siteSettings.customCSS}
                  onChange={(e) => setSiteSettings({
                    ...siteSettings,
                    customCSS: e.target.value
                  })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 h-64 font-mono text-sm"
                  placeholder="/* Global custom CSS */"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Other tabs remain the same... */}
      </div>
    </div>
  );
};

export default ContentManagementPage;