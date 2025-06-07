import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, Download, Edit, Eye, Globe, FileText, Image, Video, Plus, Trash2, Code, Palette, Layout, Settings, FolderPlus, File, Folder } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface ContentItem {
  id: string;
  type: 'page' | 'component' | 'asset' | 'style' | 'script';
  title: string;
  path: string;
  content: any;
  last_modified: string;
  status: 'published' | 'draft' | 'archived';
  parent_id?: string;
}

interface SiteStructure {
  pages: {
    [key: string]: {
      title: string;
      path: string;
      content: string;
      meta: {
        description: string;
        keywords: string;
        og_title: string;
        og_description: string;
        og_image: string;
      };
      layout: string;
      status: 'published' | 'draft';
      parent_id?: string;
    };
  };
  components: {
    [key: string]: {
      name: string;
      html: string;
      css: string;
      js: string;
      props: any;
    };
  };
  styles: {
    global: string;
    variables: {
      [key: string]: string;
    };
    themes: {
      [key: string]: {
        [key: string]: string;
      };
    };
  };
  assets: {
    [key: string]: {
      url: string;
      type: string;
      alt?: string;
      title?: string;
    };
  };
  navigation: {
    header: Array<{
      label: string;
      path: string;
      children?: Array<{
        label: string;
        path: string;
      }>;
    }>;
    footer: Array<{
      label: string;
      path: string;
    }>;
  };
  settings: {
    site_name: string;
    site_description: string;
    favicon: string;
    logo: string;
    contact_email: string;
    social_links: {
      [key: string]: string;
    };
    analytics: {
      google_analytics?: string;
      facebook_pixel?: string;
    };
    seo: {
      default_title: string;
      title_template: string;
      default_description: string;
    };
  };
}

const ContentManagementPage = () => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [siteStructure, setSiteStructure] = useState<SiteStructure>({
    pages: {
      home: {
        title: 'Home',
        path: '/',
        content: '<h1>Welcome to One Mind, Many</h1><p>The ultimate social deduction experience.</p>',
        meta: {
          description: 'One Mind, Many - The ultimate social deduction game',
          keywords: 'game, social deduction, multiplayer, AI',
          og_title: 'One Mind, Many',
          og_description: 'The ultimate social deduction experience',
          og_image: '/og-image.jpg'
        },
        layout: 'default',
        status: 'published'
      },
      about: {
        title: 'About',
        path: '/about',
        content: '<h1>About One Mind, Many</h1><p>Learn about our game.</p>',
        meta: {
          description: 'Learn about One Mind, Many',
          keywords: 'about, game, story',
          og_title: 'About - One Mind, Many',
          og_description: 'Learn about our social deduction game',
          og_image: '/og-image.jpg'
        },
        layout: 'default',
        status: 'published'
      }
    },
    components: {
      header: {
        name: 'Header',
        html: '<header class="site-header"><nav>{{navigation}}</nav></header>',
        css: '.site-header { background: var(--primary-color); }',
        js: '',
        props: {}
      }
    },
    styles: {
      global: ':root { --primary-color: #D65F27; --secondary-color: #2C365E; }',
      variables: {
        'primary-color': '#D65F27',
        'secondary-color': '#2C365E',
        'text-color': '#F5E5C3',
        'background-color': '#121212'
      },
      themes: {
        dark: {
          'background-color': '#121212',
          'text-color': '#F5E5C3'
        },
        light: {
          'background-color': '#FFFFFF',
          'text-color': '#333333'
        }
      }
    },
    assets: {},
    navigation: {
      header: [
        { label: 'Home', path: '/' },
        { label: 'About', path: '/about' },
        { label: 'Game', path: '/game' }
      ],
      footer: [
        { label: 'Privacy', path: '/privacy' },
        { label: 'Terms', path: '/terms' }
      ]
    },
    settings: {
      site_name: 'One Mind, Many',
      site_description: 'The ultimate social deduction game',
      favicon: '/favicon.ico',
      logo: '/logo.png',
      contact_email: 'contact@onemindmany.com',
      social_links: {
        twitter: 'https://twitter.com/onemindmany',
        github: 'https://github.com/onemindmany'
      },
      analytics: {},
      seo: {
        default_title: 'One Mind, Many',
        title_template: '%s | One Mind, Many',
        default_description: 'The ultimate social deduction experience'
      }
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'pages' | 'components' | 'styles' | 'assets' | 'navigation' | 'settings'>('pages');
  const [selectedItem, setSelectedItem] = useState<string>('home');
  const [showEditor, setShowEditor] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageData, setNewPageData] = useState({
    title: '',
    path: '',
    parent_id: ''
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      // Mock data loading
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching content:', error);
      setLoading(false);
    }
  };

  const handleSaveContent = async () => {
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(siteStructure)
      });

      if (!response.ok) throw new Error('Failed to save content');
      alert('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content');
    }
  };

  const handlePublishContent = async () => {
    try {
      const response = await fetch('/api/admin/content/publish', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to publish content');
      alert('Content published successfully!');
    } catch (error) {
      console.error('Error publishing content:', error);
      alert('Failed to publish content');
    }
  };

  const handleCreatePage = () => {
    if (!newPageData.title || !newPageData.path) return;
    
    const pageId = newPageData.path.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    setSiteStructure(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pageId]: {
          title: newPageData.title,
          path: newPageData.path,
          content: `<h1>${newPageData.title}</h1><p>New page content.</p>`,
          meta: {
            description: `${newPageData.title} page`,
            keywords: '',
            og_title: newPageData.title,
            og_description: `${newPageData.title} page`,
            og_image: '/og-image.jpg'
          },
          layout: 'default',
          status: 'draft',
          parent_id: newPageData.parent_id || undefined
        }
      }
    }));
    
    setNewPageData({ title: '', path: '', parent_id: '' });
    setShowNewPageModal(false);
  };

  const handleDeletePage = (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    
    setSiteStructure(prev => {
      const newPages = { ...prev.pages };
      delete newPages[pageId];
      return { ...prev, pages: newPages };
    });
  };

  const updatePageContent = (pageId: string, field: string, value: any) => {
    setSiteStructure(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pageId]: {
          ...prev.pages[pageId],
          [field]: value
        }
      }
    }));
  };

  const updatePageMeta = (pageId: string, field: string, value: string) => {
    setSiteStructure(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pageId]: {
          ...prev.pages[pageId],
          meta: {
            ...prev.pages[pageId].meta,
            [field]: value
          }
        }
      }
    }));
  };

  const updateStyles = (field: string, value: any) => {
    setSiteStructure(prev => ({
      ...prev,
      styles: {
        ...prev.styles,
        [field]: value
      }
    }));
  };

  const updateSettings = (field: string, value: any) => {
    setSiteStructure(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading content management..." />;
  }

  const tabs = [
    { id: 'pages', label: 'Pages', icon: <FileText size={18} /> },
    { id: 'components', label: 'Components', icon: <Layout size={18} /> },
    { id: 'styles', label: 'Styles', icon: <Palette size={18} /> },
    { id: 'assets', label: 'Assets', icon: <Image size={18} /> },
    { id: 'navigation', label: 'Navigation', icon: <Folder size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Management System</h1>
          <p className="text-slate-400 mt-2">Comprehensive website content and structure management</p>
        </div>
        
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleSaveContent} leftIcon={<Save size={18} />}>
            Save Changes
          </Button>
          <Button onClick={handlePublishContent} leftIcon={<Globe size={18} />}>
            Publish Live
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedTab === tab.id
                ? 'bg-orange-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tab.icon}
            <span className="ml-2">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Pages Tab */}
      {selectedTab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Pages</h3>
              <Button size="sm" onClick={() => setShowNewPageModal(true)} leftIcon={<Plus size={16} />}>
                New
              </Button>
            </div>
            <div className="space-y-2">
              {Object.entries(siteStructure.pages).map(([pageId, page]) => (
                <div key={pageId} className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedItem(pageId)}
                    className={`flex-1 text-left px-3 py-2 rounded-md transition-colors ${
                      selectedItem === pageId
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center">
                      <File size={16} className="mr-2" />
                      {page.title}
                    </div>
                    <div className="text-xs text-slate-500">{page.path}</div>
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePage(pageId)}
                    leftIcon={<Trash2 size={14} />}
                    className="ml-2"
                  >
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <div className="lg:col-span-3">
            {selectedItem && siteStructure.pages[selectedItem] && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Page Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Page Title"
                      value={siteStructure.pages[selectedItem].title}
                      onChange={(e) => updatePageContent(selectedItem, 'title', e.target.value)}
                    />
                    <Input
                      label="URL Path"
                      value={siteStructure.pages[selectedItem].path}
                      onChange={(e) => updatePageContent(selectedItem, 'path', e.target.value)}
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                      <select
                        value={siteStructure.pages[selectedItem].status}
                        onChange={(e) => updatePageContent(selectedItem, 'status', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                    <Input
                      label="Layout Template"
                      value={siteStructure.pages[selectedItem].layout}
                      onChange={(e) => updatePageContent(selectedItem, 'layout', e.target.value)}
                    />
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Page Content</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">HTML Content</label>
                    <textarea
                      value={siteStructure.pages[selectedItem].content}
                      onChange={(e) => updatePageContent(selectedItem, 'content', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-64 font-mono text-sm"
                      placeholder="Enter HTML content..."
                    />
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">SEO & Meta Data</h3>
                  <div className="space-y-4">
                    <Input
                      label="Meta Description"
                      value={siteStructure.pages[selectedItem].meta.description}
                      onChange={(e) => updatePageMeta(selectedItem, 'description', e.target.value)}
                    />
                    <Input
                      label="Keywords"
                      value={siteStructure.pages[selectedItem].meta.keywords}
                      onChange={(e) => updatePageMeta(selectedItem, 'keywords', e.target.value)}
                    />
                    <Input
                      label="Open Graph Title"
                      value={siteStructure.pages[selectedItem].meta.og_title}
                      onChange={(e) => updatePageMeta(selectedItem, 'og_title', e.target.value)}
                    />
                    <Input
                      label="Open Graph Description"
                      value={siteStructure.pages[selectedItem].meta.og_description}
                      onChange={(e) => updatePageMeta(selectedItem, 'og_description', e.target.value)}
                    />
                    <Input
                      label="Open Graph Image"
                      value={siteStructure.pages[selectedItem].meta.og_image}
                      onChange={(e) => updatePageMeta(selectedItem, 'og_image', e.target.value)}
                    />
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Styles Tab */}
      {selectedTab === 'styles' && (
        <div className="space-y-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Global CSS</h3>
            <textarea
              value={siteStructure.styles.global}
              onChange={(e) => updateStyles('global', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-64 font-mono text-sm"
              placeholder="Enter global CSS..."
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">CSS Variables</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(siteStructure.styles.variables).map(([key, value]) => (
                <Input
                  key={key}
                  label={key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  value={value}
                  onChange={(e) => updateStyles('variables', {
                    ...siteStructure.styles.variables,
                    [key]: e.target.value
                  })}
                />
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Theme Management</h3>
            <div className="space-y-6">
              {Object.entries(siteStructure.styles.themes).map(([themeName, theme]) => (
                <div key={themeName} className="border border-slate-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-4 capitalize">{themeName} Theme</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(theme).map(([key, value]) => (
                      <Input
                        key={key}
                        label={key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        value={value}
                        onChange={(e) => updateStyles('themes', {
                          ...siteStructure.styles.themes,
                          [themeName]: {
                            ...theme,
                            [key]: e.target.value
                          }
                        })}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {selectedTab === 'settings' && (
        <div className="space-y-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">General Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Site Name"
                value={siteStructure.settings.site_name}
                onChange={(e) => updateSettings('site_name', e.target.value)}
              />
              <Input
                label="Contact Email"
                value={siteStructure.settings.contact_email}
                onChange={(e) => updateSettings('contact_email', e.target.value)}
              />
              <Input
                label="Favicon URL"
                value={siteStructure.settings.favicon}
                onChange={(e) => updateSettings('favicon', e.target.value)}
              />
              <Input
                label="Logo URL"
                value={siteStructure.settings.logo}
                onChange={(e) => updateSettings('logo', e.target.value)}
              />
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Site Description</label>
              <textarea
                value={siteStructure.settings.site_description}
                onChange={(e) => updateSettings('site_description', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24"
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">SEO Settings</h3>
            <div className="space-y-4">
              <Input
                label="Default Title"
                value={siteStructure.settings.seo.default_title}
                onChange={(e) => updateSettings('seo', {
                  ...siteStructure.settings.seo,
                  default_title: e.target.value
                })}
              />
              <Input
                label="Title Template"
                value={siteStructure.settings.seo.title_template}
                onChange={(e) => updateSettings('seo', {
                  ...siteStructure.settings.seo,
                  title_template: e.target.value
                })}
                placeholder="%s | Site Name"
              />
              <Input
                label="Default Description"
                value={siteStructure.settings.seo.default_description}
                onChange={(e) => updateSettings('seo', {
                  ...siteStructure.settings.seo,
                  default_description: e.target.value
                })}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(siteStructure.settings.social_links).map(([platform, url]) => (
                <Input
                  key={platform}
                  label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  value={url}
                  onChange={(e) => updateSettings('social_links', {
                    ...siteStructure.settings.social_links,
                    [platform]: e.target.value
                  })}
                />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* New Page Modal */}
      {showNewPageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-md">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Create New Page</h2>
            </div>
            <div className="p-6 space-y-4">
              <Input
                label="Page Title"
                value={newPageData.title}
                onChange={(e) => setNewPageData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="About Us"
              />
              <Input
                label="URL Path"
                value={newPageData.path}
                onChange={(e) => setNewPageData(prev => ({ ...prev, path: e.target.value }))}
                placeholder="/about"
              />
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Parent Page (Optional)</label>
                <select
                  value={newPageData.parent_id}
                  onChange={(e) => setNewPageData(prev => ({ ...prev, parent_id: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                >
                  <option value="">No Parent</option>
                  {Object.entries(siteStructure.pages).map(([pageId, page]) => (
                    <option key={pageId} value={pageId}>{page.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-4">
              <Button variant="outline" onClick={() => setShowNewPageModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePage} leftIcon={<Plus size={18} />}>
                Create Page
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagementPage;