import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, Upload, Download, Eye, EyeOff, Globe, FileText, 
  Settings, Palette, Code, Monitor, Smartphone, Tablet,
  Plus, Edit, Trash2, RefreshCw
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useContent } from '../../contexts/ContentContext';
import { api } from '../../lib/api';

interface ContentPage {
  id: string;
  name: string;
  title: string;
  description: string;
  html_content?: string;
  meta_title?: string;
  meta_description?: string;
  last_updated: string;
}

const ContentManagementPage = () => {
  const { content, loading: contentLoading, refreshContent } = useContent();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'pages' | 'global' | 'html'>('pages');
  const [selectedPage, setSelectedPage] = useState<string>('homepage');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // Content state
  const [pageContent, setPageContent] = useState<any>({});
  const [globalContent, setGlobalContent] = useState<any>({});
  const [htmlContent, setHtmlContent] = useState<string>('');
  
  // Available pages
  const [pages] = useState<ContentPage[]>([
    {
      id: 'homepage',
      name: 'Homepage',
      title: 'Home Page',
      description: 'Main landing page content',
      html_content: '',
      last_updated: new Date().toISOString()
    },
    {
      id: 'howtoplay',
      name: 'How to Play',
      title: 'How to Play Page',
      description: 'Game rules and instructions',
      html_content: '',
      last_updated: new Date().toISOString()
    },
    {
      id: 'about',
      name: 'About',
      title: 'About Page',
      description: 'About the game and team',
      html_content: '',
      last_updated: new Date().toISOString()
    }
  ]);

  useEffect(() => {
    if (!contentLoading && content) {
      setPageContent(content);
      setGlobalContent(content.global || {});
      
      // Set HTML content for the selected page
      const currentPage = content[selectedPage];
      if (currentPage && currentPage.html_content) {
        setHtmlContent(currentPage.html_content);
      } else {
        // Generate default HTML content based on page type
        setHtmlContent(generateDefaultHtml(selectedPage, currentPage));
      }
    }
  }, [content, contentLoading, selectedPage]);

  const generateDefaultHtml = (pageId: string, pageData: any) => {
    switch (pageId) {
      case 'homepage':
        return `<div class="homepage-content">
  <section class="hero-section">
    <h1 class="hero-title">${pageData?.hero_title || 'One Mind, Many'}</h1>
    <p class="hero-description">${pageData?.hero_description || 'The ultimate social deduction experience'}</p>
    <div class="hero-actions">
      <button class="cta-primary">${pageData?.hero_cta_primary || 'Start Playing'}</button>
      <button class="cta-secondary">${pageData?.hero_cta_secondary || 'How to Play'}</button>
    </div>
  </section>
  
  <section class="features-section">
    <h2>Why Players Love It</h2>
    <div class="features-grid">
      ${pageData?.features?.map((feature: any) => `
        <div class="feature-card">
          <h3>${feature.title}</h3>
          <p>${feature.description}</p>
        </div>
      `).join('') || ''}
    </div>
  </section>
  
  <section class="stats-section">
    <div class="stats-grid">
      ${pageData?.stats?.map((stat: any) => `
        <div class="stat-card">
          <div class="stat-value">${stat.value}</div>
          <div class="stat-label">${stat.label}</div>
        </div>
      `).join('') || ''}
    </div>
  </section>
</div>`;

      case 'howtoplay':
        return `<div class="how-to-play-content">
  <section class="intro-section">
    <h1>${pageData?.page_title || 'How to Play'}</h1>
    <p class="intro-text">${pageData?.page_description || 'Master the art of deception and strategy in One Mind, Many.'}</p>
  </section>
  
  <section class="rules-section">
    <h2>Game Rules</h2>
    <div class="rules-content">
      <p>Learn the fundamental rules of One Mind, Many and become a master strategist.</p>
      
      <h3>Basic Gameplay</h3>
      <ul>
        <li>Each player controls a shared character</li>
        <li>Players program actions secretly each turn</li>
        <li>Actions are resolved in turn order</li>
        <li>Trust no one - anyone could be the saboteur</li>
      </ul>
      
      <h3>Player Roles</h3>
      <div class="roles-grid">
        <div class="role-card">
          <h4>Collaborator</h4>
          <p>Work with the team to achieve objectives</p>
        </div>
        <div class="role-card">
          <h4>Rogue</h4>
          <p>Look out for yourself above all else</p>
        </div>
        <div class="role-card">
          <h4>Saboteur</h4>
          <p>Secretly undermine the group's efforts</p>
        </div>
      </div>
    </div>
  </section>
  
  <section class="quick-start">
    <h2>Quick Start Guide</h2>
    <ol>
      <li>Join or create a game lobby</li>
      <li>Learn your secret role and objectives</li>
      <li>Program actions and choose intentions</li>
      <li>Work toward your goals while staying hidden</li>
    </ol>
  </section>
</div>`;

      case 'about':
        return `<div class="about-content">
  <section class="intro-section">
    <h1>About One Mind, Many</h1>
    <p class="intro-text">A revolutionary social deduction game that combines strategy, psychology, and AI-driven storytelling.</p>
  </section>
  
  <section class="story-section">
    <h2>Our Story</h2>
    <p>One Mind, Many was born from a passion for creating meaningful social gaming experiences. We believe that the best games bring people together, challenge their minds, and create lasting memories.</p>
    
    <p>Our team of game designers, developers, and AI specialists have crafted an experience that adapts to every group of players, ensuring no two games are ever the same.</p>
  </section>
  
  <section class="features-section">
    <h2>What Makes Us Different</h2>
    <div class="features-list">
      <div class="feature">
        <h3>AI-Driven Narratives</h3>
        <p>Our advanced AI creates dynamic stories that respond to player actions in real-time.</p>
      </div>
      <div class="feature">
        <h3>Psychological Gameplay</h3>
        <p>Every game is a battle of wits where reading people is just as important as strategy.</p>
      </div>
      <div class="feature">
        <h3>Endless Replayability</h3>
        <p>With procedurally generated scenarios and adaptive AI, every session feels fresh.</p>
      </div>
    </div>
  </section>
  
  <section class="team-section">
    <h2>Our Team</h2>
    <p>We're a passionate group of creators dedicated to pushing the boundaries of social gaming.</p>
  </section>
</div>`;

      default:
        return `<div class="page-content">
  <h1>Page Content</h1>
  <p>This is the default content for this page. Edit this HTML to customize the page content.</p>
</div>`;
    }
  };

  const handleSaveContent = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      let contentToSave = { ...pageContent };

      if (activeTab === 'html') {
        // Update the HTML content for the selected page
        contentToSave = {
          ...contentToSave,
          [selectedPage]: {
            ...contentToSave[selectedPage],
            html_content: htmlContent
          }
        };
      } else if (activeTab === 'global') {
        contentToSave = {
          ...contentToSave,
          global: globalContent
        };
      }

      const response = await api.put('/api/admin/content', contentToSave);

      if (!response.ok) {
        throw new Error('Failed to save content');
      }

      setSuccess('Content saved successfully!');
      await refreshContent();
    } catch (error) {
      console.error('Error saving content:', error);
      setError('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishContent = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await api.post('/api/admin/content/publish');

      if (!response.ok) {
        throw new Error('Failed to publish content');
      }

      setSuccess('Content published successfully!');
    } catch (error) {
      console.error('Error publishing content:', error);
      setError('Failed to publish content');
    } finally {
      setLoading(false);
    }
  };

  const handlePageContentChange = (field: string, value: any) => {
    setPageContent((prev: any) => ({
      ...prev,
      [selectedPage]: {
        ...prev[selectedPage],
        [field]: value
      }
    }));
  };

  const handleArrayFieldChange = (field: string, index: number, subField: string, value: any) => {
    setPageContent((prev: any) => {
      const currentPage = prev[selectedPage] || {};
      const currentArray = currentPage[field] || [];
      const newArray = [...currentArray];
      
      if (!newArray[index]) {
        newArray[index] = {};
      }
      
      newArray[index] = {
        ...newArray[index],
        [subField]: value
      };

      return {
        ...prev,
        [selectedPage]: {
          ...currentPage,
          [field]: newArray
        }
      };
    });
  };

  const addArrayItem = (field: string) => {
    setPageContent((prev: any) => {
      const currentPage = prev[selectedPage] || {};
      const currentArray = currentPage[field] || [];
      
      let newItem = {};
      if (field === 'features') {
        newItem = { title: '', description: '', icon: 'Brain' };
      } else if (field === 'stats') {
        newItem = { label: '', value: '', icon: 'Users' };
      }

      return {
        ...prev,
        [selectedPage]: {
          ...currentPage,
          [field]: [...currentArray, newItem]
        }
      };
    });
  };

  const removeArrayItem = (field: string, index: number) => {
    setPageContent((prev: any) => {
      const currentPage = prev[selectedPage] || {};
      const currentArray = currentPage[field] || [];
      const newArray = currentArray.filter((_: any, i: number) => i !== index);

      return {
        ...prev,
        [selectedPage]: {
          ...currentPage,
          [field]: newArray
        }
      };
    });
  };

  if (contentLoading) {
    return <LoadingSpinner fullScreen text="Loading content..." />;
  }

  const currentPageData = pageContent[selectedPage] || {};

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white custom-font">Content Management</h1>
          <p className="text-slate-400 mt-2 body-font">Manage website content, pages, and global settings</p>
        </div>
        
        <div className="flex gap-2 md:gap-4">
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={18} />}
            onClick={refreshContent}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            leftIcon={<Download size={18} />}
            disabled={loading}
          >
            Export
          </Button>
          <Button
            variant="outline"
            leftIcon={<Upload size={18} />}
            disabled={loading}
          >
            Import
          </Button>
          <Button
            onClick={handleSaveContent}
            isLoading={saving}
            leftIcon={<Save size={18} />}
            className="game-button"
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <p className="text-red-500 body-font">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg">
          <p className="text-green-500 body-font">{success}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-slate-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('pages')}
              className={`py-2 px-1 border-b-2 font-medium text-sm custom-font transition-colors ${
                activeTab === 'pages'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Page Content
            </button>
            <button
              onClick={() => setActiveTab('global')}
              className={`py-2 px-1 border-b-2 font-medium text-sm custom-font transition-colors ${
                activeTab === 'global'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Global Settings
            </button>
            <button
              onClick={() => setActiveTab('html')}
              className={`py-2 px-1 border-b-2 font-medium text-sm custom-font transition-colors ${
                activeTab === 'html'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Code className="w-4 h-4 inline mr-2" />
              HTML Editor
            </button>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 game-card">
            <h3 className="text-lg font-bold text-white mb-4 custom-font">Pages</h3>
            <div className="space-y-2">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => setSelectedPage(page.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedPage === page.id
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'text-slate-300 hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <div className="font-medium custom-font">{page.name}</div>
                  <div className="text-xs text-slate-400 mt-1 body-font">{page.description}</div>
                </button>
              ))}
            </div>

            {activeTab === 'html' && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <h4 className="text-sm font-bold text-white mb-3 custom-font">Preview</h4>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-slate-300'}`}
                  >
                    <Monitor size={16} />
                  </button>
                  <button
                    onClick={() => setPreviewMode('tablet')}
                    className={`p-2 rounded ${previewMode === 'tablet' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-slate-300'}`}
                  >
                    <Tablet size={16} />
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-slate-300'}`}
                  >
                    <Smartphone size={16} />
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  leftIcon={showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                  className="w-full"
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'pages' && (
            <Card className="p-6 game-card">
              <h2 className="text-xl font-bold text-white mb-6 custom-font">
                Edit {pages.find(p => p.id === selectedPage)?.name} Content
              </h2>

              <div className="space-y-6">
                {selectedPage === 'homepage' && (
                  <>
                    {/* Hero Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white custom-font">Hero Section</h3>
                      <Input
                        label="Hero Title"
                        value={currentPageData.hero_title || ''}
                        onChange={(e) => handlePageContentChange('hero_title', e.target.value)}
                        placeholder="One Mind, Many"
                      />
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 custom-font">Hero Description</label>
                        <textarea
                          value={currentPageData.hero_description || ''}
                          onChange={(e) => handlePageContentChange('hero_description', e.target.value)}
                          placeholder="The ultimate social deduction experience..."
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24 body-font focus:border-orange-500 focus:ring-orange-500/20"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Primary CTA Button"
                          value={currentPageData.hero_cta_primary || ''}
                          onChange={(e) => handlePageContentChange('hero_cta_primary', e.target.value)}
                          placeholder="Start Playing"
                        />
                        <Input
                          label="Secondary CTA Button"
                          value={currentPageData.hero_cta_secondary || ''}
                          onChange={(e) => handlePageContentChange('hero_cta_secondary', e.target.value)}
                          placeholder="How to Play"
                        />
                      </div>
                    </div>

                    {/* Features Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white custom-font">Features</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addArrayItem('features')}
                          leftIcon={<Plus size={16} />}
                        >
                          Add Feature
                        </Button>
                      </div>
                      {(currentPageData.features || []).map((feature: any, index: number) => (
                        <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-sm font-medium text-slate-300 custom-font">Feature {index + 1}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeArrayItem('features', index)}
                              leftIcon={<Trash2 size={14} />}
                              className="text-red-400 hover:text-red-300"
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input
                              label="Title"
                              value={feature.title || ''}
                              onChange={(e) => handleArrayFieldChange('features', index, 'title', e.target.value)}
                              placeholder="Feature title"
                            />
                            <Input
                              label="Icon"
                              value={feature.icon || ''}
                              onChange={(e) => handleArrayFieldChange('features', index, 'icon', e.target.value)}
                              placeholder="Brain"
                            />
                            <div className="md:col-span-1">
                              <label className="block text-sm font-medium text-slate-300 mb-2 custom-font">Description</label>
                              <textarea
                                value={feature.description || ''}
                                onChange={(e) => handleArrayFieldChange('features', index, 'description', e.target.value)}
                                placeholder="Feature description"
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-20 text-sm body-font focus:border-orange-500 focus:ring-orange-500/20"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Stats Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white custom-font">Statistics</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addArrayItem('stats')}
                          leftIcon={<Plus size={16} />}
                        >
                          Add Stat
                        </Button>
                      </div>
                      {(currentPageData.stats || []).map((stat: any, index: number) => (
                        <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-sm font-medium text-slate-300 custom-font">Stat {index + 1}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeArrayItem('stats', index)}
                              leftIcon={<Trash2 size={14} />}
                              className="text-red-400 hover:text-red-300"
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input
                              label="Label"
                              value={stat.label || ''}
                              onChange={(e) => handleArrayFieldChange('stats', index, 'label', e.target.value)}
                              placeholder="Active Players"
                            />
                            <Input
                              label="Value"
                              value={stat.value || ''}
                              onChange={(e) => handleArrayFieldChange('stats', index, 'value', e.target.value)}
                              placeholder="12,847"
                            />
                            <Input
                              label="Icon"
                              value={stat.icon || ''}
                              onChange={(e) => handleArrayFieldChange('stats', index, 'icon', e.target.value)}
                              placeholder="Users"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Final CTA Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white custom-font">Final Call-to-Action</h3>
                      <Input
                        label="CTA Title"
                        value={currentPageData.final_cta_title || ''}
                        onChange={(e) => handlePageContentChange('final_cta_title', e.target.value)}
                        placeholder="Your Next Adventure Awaits"
                      />
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 custom-font">CTA Description</label>
                        <textarea
                          value={currentPageData.final_cta_description || ''}
                          onChange={(e) => handlePageContentChange('final_cta_description', e.target.value)}
                          placeholder="Free to play. Easy to learn. Impossible to master."
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-20 body-font focus:border-orange-500 focus:ring-orange-500/20"
                        />
                      </div>
                      <Input
                        label="CTA Button Text"
                        value={currentPageData.final_cta_button || ''}
                        onChange={(e) => handlePageContentChange('final_cta_button', e.target.value)}
                        placeholder="Start Your Journey"
                      />
                    </div>
                  </>
                )}

                {selectedPage === 'howtoplay' && (
                  <>
                    <Input
                      label="Page Title"
                      value={currentPageData.page_title || ''}
                      onChange={(e) => handlePageContentChange('page_title', e.target.value)}
                      placeholder="How to Play"
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2 custom-font">Page Description</label>
                      <textarea
                        value={currentPageData.page_description || ''}
                        onChange={(e) => handlePageContentChange('page_description', e.target.value)}
                        placeholder="Master the art of deception and strategy..."
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24 body-font focus:border-orange-500 focus:ring-orange-500/20"
                      />
                    </div>
                  </>
                )}

                {selectedPage === 'about' && (
                  <>
                    <Input
                      label="Page Title"
                      value={currentPageData.page_title || ''}
                      onChange={(e) => handlePageContentChange('page_title', e.target.value)}
                      placeholder="About One Mind, Many"
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2 custom-font">Page Description</label>
                      <textarea
                        value={currentPageData.page_description || ''}
                        onChange={(e) => handlePageContentChange('page_description', e.target.value)}
                        placeholder="Learn about our game and team..."
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24 body-font focus:border-orange-500 focus:ring-orange-500/20"
                      />
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'global' && (
            <Card className="p-6 game-card">
              <h2 className="text-xl font-bold text-white mb-6 custom-font">Global Settings</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Site Name"
                    value={globalContent.site_name || ''}
                    onChange={(e) => setGlobalContent(prev => ({ ...prev, site_name: e.target.value }))}
                    placeholder="One Mind, Many"
                  />
                  <Input
                    label="Contact Email"
                    value={globalContent.contact_email || ''}
                    onChange={(e) => setGlobalContent(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="contact@onemindmany.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 custom-font">Site Description</label>
                  <textarea
                    value={globalContent.site_description || ''}
                    onChange={(e) => setGlobalContent(prev => ({ ...prev, site_description: e.target.value }))}
                    placeholder="The ultimate social deduction game"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-24 body-font focus:border-orange-500 focus:ring-orange-500/20"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white custom-font">Social Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="GitHub URL"
                      value={globalContent.social_links?.github || ''}
                      onChange={(e) => setGlobalContent(prev => ({
                        ...prev,
                        social_links: { ...prev.social_links, github: e.target.value }
                      }))}
                      placeholder="https://github.com/..."
                    />
                    <Input
                      label="Twitter URL"
                      value={globalContent.social_links?.twitter || ''}
                      onChange={(e) => setGlobalContent(prev => ({
                        ...prev,
                        social_links: { ...prev.social_links, twitter: e.target.value }
                      }))}
                      placeholder="https://twitter.com/..."
                    />
                    <Input
                      label="Discord URL"
                      value={globalContent.social_links?.discord || ''}
                      onChange={(e) => setGlobalContent(prev => ({
                        ...prev,
                        social_links: { ...prev.social_links, discord: e.target.value }
                      }))}
                      placeholder="https://discord.gg/..."
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'html' && (
            <div className="space-y-6">
              <Card className="p-6 game-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white custom-font">
                    HTML Editor - {pages.find(p => p.id === selectedPage)?.name}
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHtmlContent(generateDefaultHtml(selectedPage, currentPageData))}
                      leftIcon={<RefreshCw size={16} />}
                    >
                      Reset to Default
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 custom-font">
                    HTML Content
                  </label>
                  <textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="Enter HTML content..."
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-96 font-mono text-sm body-font focus:border-orange-500 focus:ring-orange-500/20 custom-scrollbar"
                  />
                  <p className="text-xs text-slate-400 mt-2 body-font">
                    Use standard HTML tags and CSS classes. The content will be styled with the site's theme.
                  </p>
                </div>
              </Card>

              {showPreview && (
                <Card className="p-6 game-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white custom-font">Preview</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400 body-font">
                        {previewMode.charAt(0).toUpperCase() + previewMode.slice(1)} View
                      </span>
                    </div>
                  </div>
                  
                  <div className={`border border-slate-700 rounded-lg overflow-hidden ${
                    previewMode === 'mobile' ? 'max-w-sm mx-auto' :
                    previewMode === 'tablet' ? 'max-w-2xl mx-auto' :
                    'w-full'
                  }`}>
                    <div className="bg-white text-black p-6 min-h-[400px]">
                      <div 
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                        className="prose prose-slate max-w-none"
                      />
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Publish Section */}
      <Card className="p-6 mt-8 game-card">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-white custom-font">Publish Changes</h3>
            <p className="text-slate-400 body-font">Deploy your content changes to the live website</p>
          </div>
          <Button
            onClick={handlePublishContent}
            isLoading={loading}
            leftIcon={<Globe size={18} />}
            className="game-button"
          >
            Publish to Live Site
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ContentManagementPage;