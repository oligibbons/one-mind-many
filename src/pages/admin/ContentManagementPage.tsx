import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, Upload, Download, Eye, Edit, Trash2, Plus, 
  Globe, Layout, Palette, Type, Image, Navigation,
  Code, Settings, Monitor, Smartphone, Tablet,
  ChevronDown, ChevronRight, FileText, Link as LinkIcon
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
  isPublic: boolean;
  inNavigation: boolean;
  navOrder: number;
  template: string;
  seoSettings: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    ogImage: string;
  };
  customCSS: string;
  customJS: string;
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
  fontFamily: string;
  customCSS: string;
  customJS: string;
  socialLinks: {
    twitter: string;
    github: string;
    discord: string;
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
  const [expandedSections, setExpandedSections] = useState<string[]>(['general']);

  const tabs = [
    { id: 'pages', name: 'Pages', icon: <FileText size={18} /> },
    { id: 'navigation', name: 'Navigation', icon: <Navigation size={18} /> },
    { id: 'components', name: 'Components', icon: <Layout size={18} /> },
    { id: 'styles', name: 'Styles', icon: <Palette size={18} /> },
    { id: 'media', name: 'Media', icon: <Image size={18} /> },
    { id: 'settings', name: 'Site Settings', icon: <Settings size={18} /> },
    { id: 'code', name: 'Custom Code', icon: <Code size={18} /> },
  ];

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      
      // Fetch pages
      const pagesResponse = await fetch('/api/admin/content/pages', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Fetch navigation
      const navResponse = await fetch('/api/admin/content/navigation', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Fetch site settings
      const settingsResponse = await fetch('/api/admin/content/settings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        setPages(pagesData);
      } else {
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
              ]
            },
            isPublic: true,
            inNavigation: true,
            navOrder: 1,
            template: 'home',
            seoSettings: {
              metaTitle: 'One Mind, Many - The Ultimate Social Deduction Game',
              metaDescription: 'Experience the thrill of deception and strategy in One Mind, Many. Navigate AI-driven scenarios where survival depends on cunning teamwork.',
              keywords: ['social deduction', 'strategy game', 'AI scenarios', 'multiplayer'],
              ogImage: '/images/og-home.jpg'
            },
            customCSS: '',
            customJS: ''
          },
          {
            id: '2',
            name: 'How to Play',
            path: '/how-to-play',
            title: 'How to Play - One Mind, Many',
            description: 'Learn the rules and master the game',
            content: {
              sections: [
                {
                  title: 'Game Overview',
                  content: 'In One Mind, Many, deception meets strategy...'
                },
                {
                  title: 'Player Roles',
                  content: 'There are three main roles in the game...'
                }
              ]
            },
            isPublic: true,
            inNavigation: true,
            navOrder: 2,
            template: 'rules',
            seoSettings: {
              metaTitle: 'How to Play One Mind, Many - Rules and Guide',
              metaDescription: 'Master the art of deception and strategy. Learn the complete rules and gameplay mechanics of One Mind, Many.',
              keywords: ['game rules', 'how to play', 'strategy guide', 'tutorial'],
              ogImage: '/images/og-rules.jpg'
            },
            customCSS: '',
            customJS: ''
          },
          {
            id: '3',
            name: 'Game',
            path: '/game',
            title: 'Play - One Mind, Many',
            description: 'Enter the game lobby',
            content: {},
            isPublic: false,
            inNavigation: true,
            navOrder: 3,
            template: 'game',
            seoSettings: {
              metaTitle: 'Play One Mind, Many',
              metaDescription: 'Join or create a game lobby and start playing One Mind, Many.',
              keywords: ['play game', 'game lobby', 'multiplayer'],
              ogImage: '/images/og-game.jpg'
            },
            customCSS: '',
            customJS: ''
          }
        ]);
      }

      if (navResponse.ok) {
        const navData = await navResponse.json();
        setNavigation(navData);
      } else {
        // Mock navigation data
        setNavigation([
          { id: '1', name: 'Home', path: '/', order: 1, isVisible: true },
          { id: '2', name: 'How to Play', path: '/how-to-play', order: 2, isVisible: true },
          { id: '3', name: 'Play', path: '/game', order: 3, isVisible: true },
          { id: '4', name: 'Friends', path: '/game/friends', order: 4, isVisible: true },
          { id: '5', name: 'Settings', path: '/game/settings', order: 5, isVisible: true }
        ]);
      }

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSiteSettings(settingsData);
      } else {
        // Mock site settings
        setSiteSettings({
          siteName: 'One Mind, Many',
          siteDescription: 'The ultimate social deduction experience',
          logo: '/OneMindMay Logo - long.png',
          favicon: '/favicon.svg',
          primaryColor: '#D65F27',
          secondaryColor: '#2C365E',
          fontFamily: 'Quicksand',
          customCSS: '',
          customJS: '',
          socialLinks: {
            twitter: 'https://twitter.com/onemindmany',
            github: 'https://github.com/onemindmany',
            discord: 'https://discord.gg/onemindmany'
          }
        });
      }
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
      await Promise.all([
        fetch('/api/admin/content/pages', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(pages)
        }),
        fetch('/api/admin/content/navigation', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(navigation)
        }),
        fetch('/api/admin/content/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(siteSettings)
        })
      ]);
      
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
      isPublic: true,
      inNavigation: false,
      navOrder: pages.length + 1,
      template: 'default',
      seoSettings: {
        metaTitle: '',
        metaDescription: '',
        keywords: [],
        ogImage: ''
      },
      customCSS: '',
      customJS: ''
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

  const updateNavigation = (navItems: NavigationItem[]) => {
    setNavigation(navItems);
  };

  const addToNavigation = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page && !navigation.find(n => n.path === page.path)) {
      const newNavItem: NavigationItem = {
        id: Date.now().toString(),
        name: page.name,
        path: page.path,
        order: navigation.length + 1,
        isVisible: true
      };
      setNavigation([...navigation, newNavItem]);
      
      // Update page to be in navigation
      setPages(pages.map(p => 
        p.id === pageId ? { ...p, inNavigation: true } : p
      ));
    }
  };

  const removeFromNavigation = (navId: string) => {
    const navItem = navigation.find(n => n.id === navId);
    if (navItem) {
      setNavigation(navigation.filter(n => n.id !== navId));
      
      // Update page to not be in navigation
      const page = pages.find(p => p.path === navItem.path);
      if (page) {
        setPages(pages.map(p => 
          p.id === page.id ? { ...p, inNavigation: false } : p
        ));
      }
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading content management..." />;
  }

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
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
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
                        </div>
                        <div className="flex items-center space-x-2">
                          {page.isPublic && <Globe size={16} className="text-green-400" />}
                          {page.inNavigation && <Navigation size={16} className="text-blue-400" />}
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
                            />
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

        {/* Navigation Tab */}
        {activeTab === 'navigation' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Navigation Management</h3>
              <Button
                onClick={() => {
                  const availablePages = pages.filter(p => !navigation.find(n => n.path === p.path));
                  if (availablePages.length > 0) {
                    addToNavigation(availablePages[0].id);
                  }
                }}
                leftIcon={<Plus size={16} />}
              >
                Add Page to Navigation
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-white font-medium mb-4">Current Navigation</h4>
                <div className="space-y-2">
                  {navigation
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Navigation size={16} className="text-blue-400" />
                            <span className="text-white">{item.name}</span>
                          </div>
                          <span className="text-slate-400 text-sm">{item.path}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={item.isVisible}
                              onChange={(e) => {
                                const updatedNav = navigation.map(n =>
                                  n.id === item.id ? { ...n, isVisible: e.target.checked } : n
                                );
                                setNavigation(updatedNav);
                              }}
                              className="mr-2"
                            />
                            <span className="text-slate-300 text-sm">Visible</span>
                          </label>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromNavigation(item.id)}
                            leftIcon={<Trash2 size={14} />}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-4">Available Pages</h4>
                <div className="space-y-2">
                  {pages
                    .filter(page => !navigation.find(n => n.path === page.path))
                    .map((page) => (
                      <div
                        key={page.id}
                        className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                      >
                        <div>
                          <span className="text-white">{page.name}</span>
                          <span className="text-slate-400 text-sm ml-2">{page.path}</span>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => addToNavigation(page.id)}
                          leftIcon={<Plus size={14} />}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Components Tab */}
        {activeTab === 'components' && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-6">Component Library</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Hero Component */}
              <div className="p-4 bg-slate-800 rounded-lg">
                <h4 className="text-white font-medium mb-2">Hero Section</h4>
                <p className="text-slate-400 text-sm mb-4">Main banner with title, subtitle, and CTA</p>
                <div className="space-y-2">
                  <Input placeholder="Hero Title" />
                  <Input placeholder="Hero Subtitle" />
                  <Input placeholder="CTA Text" />
                </div>
              </div>
              
              {/* Features Component */}
              <div className="p-4 bg-slate-800 rounded-lg">
                <h4 className="text-white font-medium mb-2">Features Grid</h4>
                <p className="text-slate-400 text-sm mb-4">Grid of feature cards with icons</p>
                <Button size="sm" className="w-full">Configure Features</Button>
              </div>
              
              {/* Stats Component */}
              <div className="p-4 bg-slate-800 rounded-lg">
                <h4 className="text-white font-medium mb-2">Stats Section</h4>
                <p className="text-slate-400 text-sm mb-4">Display key statistics and metrics</p>
                <Button size="sm" className="w-full">Configure Stats</Button>
              </div>
            </div>
          </Card>
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
                  </div>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-4">Typography</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Font Family
                    </label>
                    <select
                      value={siteSettings.fontFamily}
                      onChange={(e) => setSiteSettings({
                        ...siteSettings,
                        fontFamily: e.target.value
                      })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                    >
                      <option value="Quicksand">Quicksand</option>
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Poppins">Poppins</option>
                    </select>
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

        {/* Media Tab */}
        {activeTab === 'media' && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-6">Media Library</h3>
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center">
              <Upload size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400 mb-4">Upload images, videos, and other media files</p>
              <Button leftIcon={<Upload size={16} />}>
                Upload Media
              </Button>
            </div>
          </Card>
        )}

        {/* Site Settings Tab */}
        {activeTab === 'settings' && siteSettings && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-6">Site Settings</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Site Name"
                  value={siteSettings.siteName}
                  onChange={(e) => setSiteSettings({
                    ...siteSettings,
                    siteName: e.target.value
                  })}
                />
                
                <Input
                  label="Logo URL"
                  value={siteSettings.logo}
                  onChange={(e) => setSiteSettings({
                    ...siteSettings,
                    logo: e.target.value
                  })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Site Description
                </label>
                <textarea
                  value={siteSettings.siteDescription}
                  onChange={(e) => setSiteSettings({
                    ...siteSettings,
                    siteDescription: e.target.value
                  })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24"
                />
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-4">Social Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Twitter"
                    value={siteSettings.socialLinks.twitter}
                    onChange={(e) => setSiteSettings({
                      ...siteSettings,
                      socialLinks: {
                        ...siteSettings.socialLinks,
                        twitter: e.target.value
                      }
                    })}
                  />
                  
                  <Input
                    label="GitHub"
                    value={siteSettings.socialLinks.github}
                    onChange={(e) => setSiteSettings({
                      ...siteSettings,
                      socialLinks: {
                        ...siteSettings.socialLinks,
                        github: e.target.value
                      }
                    })}
                  />
                  
                  <Input
                    label="Discord"
                    value={siteSettings.socialLinks.discord}
                    onChange={(e) => setSiteSettings({
                      ...siteSettings,
                      socialLinks: {
                        ...siteSettings.socialLinks,
                        discord: e.target.value
                      }
                    })}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Custom Code Tab */}
        {activeTab === 'code' && siteSettings && (
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-6">Custom Code</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Global Custom CSS
                </label>
                <textarea
                  value={siteSettings.customCSS}
                  onChange={(e) => setSiteSettings({
                    ...siteSettings,
                    customCSS: e.target.value
                  })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 h-64 font-mono text-sm"
                  placeholder="/* Global custom CSS applied to all pages */"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Global Custom JavaScript
                </label>
                <textarea
                  value={siteSettings.customJS}
                  onChange={(e) => setSiteSettings({
                    ...siteSettings,
                    customJS: e.target.value
                  })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 h-64 font-mono text-sm"
                  placeholder="// Global custom JavaScript applied to all pages"
                />
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ContentManagementPage;