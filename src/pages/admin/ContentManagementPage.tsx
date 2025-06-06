import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, Download, Edit, Eye, Globe, FileText, Image, Video } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface ContentItem {
  id: string;
  type: 'page' | 'scenario' | 'asset' | 'copy';
  title: string;
  path: string;
  content: any;
  last_modified: string;
  status: 'published' | 'draft' | 'archived';
}

interface SiteContent {
  pages: {
    homepage: {
      hero_title: string;
      hero_subtitle: string;
      hero_description: string;
      features: Array<{
        title: string;
        description: string;
        icon: string;
      }>;
    };
    about: {
      title: string;
      content: string;
    };
    privacy: {
      title: string;
      content: string;
    };
    terms: {
      title: string;
      content: string;
    };
  };
  global: {
    site_name: string;
    site_description: string;
    contact_email: string;
    social_links: {
      twitter: string;
      github: string;
    };
  };
}

const ContentManagementPage = () => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent>({
    pages: {
      homepage: {
        hero_title: 'One Mind, Many',
        hero_subtitle: 'The ultimate social deduction experience',
        hero_description: 'Navigate through AI-driven scenarios where trust is scarce and survival depends on wit.',
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
      about: {
        title: 'About One Mind, Many',
        content: 'One Mind, Many is a revolutionary social deduction game that combines AI-driven storytelling with intense psychological gameplay.'
      },
      privacy: {
        title: 'Privacy Policy',
        content: 'Your privacy is important to us. This policy explains how we collect, use, and protect your information.'
      },
      terms: {
        title: 'Terms of Service',
        content: 'By using our service, you agree to these terms and conditions.'
      }
    },
    global: {
      site_name: 'One Mind, Many',
      site_description: 'The ultimate social deduction game',
      contact_email: 'contact@onemindmany.com',
      social_links: {
        twitter: 'https://twitter.com/onemindmany',
        github: 'https://github.com/onemindmany'
      }
    }
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'pages' | 'assets' | 'global'>('pages');
  const [selectedPage, setSelectedPage] = useState<string>('homepage');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      // Mock data - replace with actual API call
      setContentItems([
        {
          id: '1',
          type: 'page',
          title: 'Homepage',
          path: '/',
          content: {},
          last_modified: '2024-01-15T10:30:00Z',
          status: 'published'
        },
        {
          id: '2',
          type: 'asset',
          title: 'Hero Background',
          path: '/assets/hero-bg.jpg',
          content: {},
          last_modified: '2024-01-14T15:45:00Z',
          status: 'published'
        }
      ]);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
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
        body: JSON.stringify(siteContent)
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

  const handleUploadAsset = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/assets/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload asset');

      const result = await response.json();
      alert(`Asset uploaded: ${result.url}`);
      fetchContent();
    } catch (error) {
      console.error('Error uploading asset:', error);
      alert('Failed to upload asset');
    }
  };

  const updatePageContent = (page: string, field: string, value: any) => {
    setSiteContent(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        [page]: {
          ...prev.pages[page as keyof typeof prev.pages],
          [field]: value
        }
      }
    }));
  };

  const updateGlobalContent = (field: string, value: any) => {
    setSiteContent(prev => ({
      ...prev,
      global: {
        ...prev.global,
        [field]: value
      }
    }));
  };

  const addFeature = () => {
    setSiteContent(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        homepage: {
          ...prev.pages.homepage,
          features: [
            ...prev.pages.homepage.features,
            { title: '', description: '', icon: 'Star' }
          ]
        }
      }
    }));
  };

  const updateFeature = (index: number, field: string, value: string) => {
    setSiteContent(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        homepage: {
          ...prev.pages.homepage,
          features: prev.pages.homepage.features.map((feature, i) =>
            i === index ? { ...feature, [field]: value } : feature
          )
        }
      }
    }));
  };

  const removeFeature = (index: number) => {
    setSiteContent(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        homepage: {
          ...prev.pages.homepage,
          features: prev.pages.homepage.features.filter((_, i) => i !== index)
        }
      }
    }));
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading content..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Management</h1>
          <p className="text-slate-400 mt-2">Manage site content, assets, and copy</p>
        </div>
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleSaveContent}
            leftIcon={<Save size={18} />}
          >
            Save Changes
          </Button>
          
          <Button
            onClick={handlePublishContent}
            leftIcon={<Globe size={18} />}
          >
            Publish Live
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8">
        {[
          { id: 'pages', label: 'Pages', icon: <FileText size={18} /> },
          { id: 'assets', label: 'Assets', icon: <Image size={18} /> },
          { id: 'global', label: 'Global', icon: <Globe size={18} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
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
          {/* Page Selector */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Pages</h3>
            <div className="space-y-2">
              {Object.keys(siteContent.pages).map((page) => (
                <button
                  key={page}
                  onClick={() => setSelectedPage(page)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedPage === page
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {page.charAt(0).toUpperCase() + page.slice(1)}
                </button>
              ))}
            </div>
          </Card>

          {/* Page Editor */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-6">
                Edit {selectedPage.charAt(0).toUpperCase() + selectedPage.slice(1)}
              </h3>

              {selectedPage === 'homepage' && (
                <div className="space-y-6">
                  <Input
                    label="Hero Title"
                    value={siteContent.pages.homepage.hero_title}
                    onChange={(e) => updatePageContent('homepage', 'hero_title', e.target.value)}
                  />
                  
                  <Input
                    label="Hero Subtitle"
                    value={siteContent.pages.homepage.hero_subtitle}
                    onChange={(e) => updatePageContent('homepage', 'hero_subtitle', e.target.value)}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Hero Description</label>
                    <textarea
                      value={siteContent.pages.homepage.hero_description}
                      onChange={(e) => updatePageContent('homepage', 'hero_description', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-white">Features</h4>
                      <Button size="sm" onClick={addFeature}>Add Feature</Button>
                    </div>
                    
                    <div className="space-y-4">
                      {siteContent.pages.homepage.features.map((feature, index) => (
                        <div key={index} className="bg-slate-800/50 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <Input
                              label="Title"
                              value={feature.title}
                              onChange={(e) => updateFeature(index, 'title', e.target.value)}
                            />
                            
                            <Input
                              label="Icon"
                              value={feature.icon}
                              onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                            />
                            
                            <div className="flex items-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFeature(index)}
                                className="text-red-400"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                          
                          <textarea
                            placeholder="Feature description"
                            value={feature.description}
                            onChange={(e) => updateFeature(index, 'description', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-20"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(selectedPage === 'about' || selectedPage === 'privacy' || selectedPage === 'terms') && (
                <div className="space-y-6">
                  <Input
                    label="Title"
                    value={siteContent.pages[selectedPage as keyof typeof siteContent.pages].title}
                    onChange={(e) => updatePageContent(selectedPage, 'title', e.target.value)}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
                    <textarea
                      value={siteContent.pages[selectedPage as keyof typeof siteContent.pages].content}
                      onChange={(e) => updatePageContent(selectedPage, 'content', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-64"
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Assets Tab */}
      {selectedTab === 'assets' && (
        <div className="space-y-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Upload Assets</h3>
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center">
              <Upload size={48} className="mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400 mb-4">Drag and drop files here, or click to select</p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(handleUploadAsset);
                }}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button as="span" leftIcon={<Upload size={18} />}>
                  Select Files
                </Button>
              </label>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Asset Library</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {contentItems
                .filter(item => item.type === 'asset')
                .map((asset) => (
                  <div key={asset.id} className="bg-slate-800/50 rounded-lg p-4">
                    <div className="aspect-square bg-slate-700 rounded-lg mb-3 flex items-center justify-center">
                      <Image size={32} className="text-slate-500" />
                    </div>
                    <h4 className="text-white font-medium mb-1">{asset.title}</h4>
                    <p className="text-sm text-slate-400">{asset.path}</p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" leftIcon={<Eye size={14} />}>
                        View
                      </Button>
                      <Button variant="outline" size="sm" leftIcon={<Download size={14} />}>
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* Global Tab */}
      {selectedTab === 'global' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Global Settings</h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Site Name"
                value={siteContent.global.site_name}
                onChange={(e) => updateGlobalContent('site_name', e.target.value)}
              />
              
              <Input
                label="Contact Email"
                type="email"
                value={siteContent.global.contact_email}
                onChange={(e) => updateGlobalContent('contact_email', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Site Description</label>
              <textarea
                value={siteContent.global.site_description}
                onChange={(e) => updateGlobalContent('site_description', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24"
              />
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Social Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Twitter URL"
                  value={siteContent.global.social_links.twitter}
                  onChange={(e) => updateGlobalContent('social_links', {
                    ...siteContent.global.social_links,
                    twitter: e.target.value
                  })}
                />
                
                <Input
                  label="GitHub URL"
                  value={siteContent.global.social_links.github}
                  onChange={(e) => updateGlobalContent('social_links', {
                    ...siteContent.global.social_links,
                    github: e.target.value
                  })}
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ContentManagementPage;