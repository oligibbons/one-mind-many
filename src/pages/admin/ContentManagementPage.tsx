import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, Download, Eye, Edit, Plus, Trash2, Globe, FileText } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { api } from '../../lib/api';

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

const ContentManagementPage = () => {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('homepage');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

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

  useEffect(() => {
    fetchContent();
  }, []);

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

      const response = await api.put('/api/admin/content', content);
      
      if (!response.ok) {
        throw new Error('Failed to save content');
      }

      setSuccess('Content saved successfully!');
      setEditingSection(null);
      
      // Refresh content
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

      const response = await api.post('/api/admin/content/publish');
      
      if (!response.ok) {
        throw new Error('Failed to publish content');
      }

      setSuccess('Content published successfully! Changes are now live.');
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

  const currentPage = pages.find(p => p.id === selectedPage);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading content..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Management</h1>
          <p className="text-slate-400 mt-2">Manage website content, pages, and navigation</p>
        </div>
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            leftIcon={<Eye size={18} />}
          >
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>
          
          <Button
            onClick={handleSaveContent}
            disabled={saving}
            isLoading={saving}
            leftIcon={<Save size={18} />}
          >
            Save Changes
          </Button>
          
          <Button
            onClick={handlePublishContent}
            disabled={saving}
            isLoading={saving}
            leftIcon={<Globe size={18} />}
            className="bg-green-600 hover:bg-green-700"
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Page Navigation */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Pages</h3>
            <nav className="space-y-2">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => setSelectedPage(page.id)}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    selectedPage === page.id
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FileText size={18} className="mr-3" />
                  <span className="font-medium">{page.name}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content Editor */}
        <div className="lg:col-span-3">
          {selectedPage === 'homepage' && (
            <div className="space-y-6">
              {/* Hero Section */}
              <Card className="p-6">
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
                  
                  <div className="grid grid-cols-2 gap-4">
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

              {/* Features Section */}
              <Card className="p-6">
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
              <Card className="p-6">
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

          {selectedPage === 'global' && (
            <div className="space-y-6">
              {/* Site Settings */}
              <Card className="p-6">
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
              <Card className="p-6">
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
      </div>

      {/* Preview Mode */}
      {previewMode && (
        <Card className="p-6 mt-8">
          <h2 className="text-xl font-bold text-white mb-6">Live Preview</h2>
          <div className="bg-slate-800/50 rounded-lg p-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">
                {content.homepage?.hero_title}
              </h1>
              <p className="text-xl text-slate-300 mb-2">
                {content.homepage?.hero_subtitle}
              </p>
              <p className="text-slate-400 mb-6">
                {content.homepage?.hero_description}
              </p>
              <div className="flex gap-4 justify-center">
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