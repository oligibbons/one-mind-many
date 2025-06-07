import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, Upload, Download, Edit, Eye, Globe, FileText, Image, Video, Plus, Trash2, 
  Code, Palette, Layout, Settings, FolderPlus, File, Folder, Monitor, Smartphone,
  Tablet, ExternalLink, Copy, RefreshCw, Database, Zap, Users, MessageSquare,
  Target, Clock, RotateCcw, Volume2, Search, ChevronDown, ChevronUp
} from 'lucide-react';
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

interface Component {
  id: string;
  name: string;
  html: string;
  css: string;
  js: string;
  props: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      default: any;
      description: string;
    };
  };
  category: string;
  preview_image?: string;
}

interface GameScreenConfig {
  layout: {
    panels: {
      narrative: { width: number; height: number; position: string; };
      environment: { width: number; height: number; position: string; };
      chat: { width: number; height: number; position: string; };
      actions: { width: number; height: number; position: string; };
      players: { width: number; height: number; position: string; };
      turnOrder: { width: number; height: number; position: string; };
    };
    responsive: {
      mobile: any;
      tablet: any;
      desktop: any;
    };
  };
  features: {
    narrativeLog: {
      enabled: boolean;
      autoScroll: boolean;
      maxEntries: number;
      showTimestamps: boolean;
      allowFiltering: boolean;
    };
    environmentImages: {
      enabled: boolean;
      stackSize: number;
      transitionEffect: string;
      allowZoom: boolean;
    };
    playerChat: {
      enabled: boolean;
      maxMessages: number;
      allowPrivateMessages: boolean;
      moderationEnabled: boolean;
    };
    actionPanel: {
      enabled: boolean;
      availableActions: string[];
      allowCustomActions: boolean;
      confirmationRequired: boolean;
    };
    turnOrderPredictor: {
      enabled: boolean;
      showConfidence: boolean;
      allowNotes: boolean;
    };
    pauseSystem: {
      enabled: boolean;
      requiresVote: boolean;
      timeoutDuration: number;
    };
  };
  styling: {
    theme: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    fonts: {
      primary: string;
      secondary: string;
      monospace: string;
    };
    animations: {
      enabled: boolean;
      duration: number;
      easing: string;
    };
  };
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
        canonical_url?: string;
        robots?: string;
      };
      layout: string;
      status: 'published' | 'draft';
      parent_id?: string;
      order: number;
      access_level: 'public' | 'authenticated' | 'admin';
      custom_css?: string;
      custom_js?: string;
    };
  };
  components: {
    [key: string]: Component;
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
    responsive: {
      breakpoints: {
        mobile: string;
        tablet: string;
        desktop: string;
        wide: string;
      };
      rules: {
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
      size: number;
      dimensions?: { width: number; height: number; };
      tags: string[];
    };
  };
  navigation: {
    header: Array<{
      id: string;
      label: string;
      path: string;
      icon?: string;
      order: number;
      access_level: 'public' | 'authenticated' | 'admin';
      children?: Array<{
        id: string;
        label: string;
        path: string;
        order: number;
      }>;
    }>;
    footer: Array<{
      id: string;
      label: string;
      path: string;
      order: number;
      column: number;
    }>;
    breadcrumbs: {
      enabled: boolean;
      separator: string;
      showHome: boolean;
    };
  };
  gameScreens: {
    [key: string]: GameScreenConfig;
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
      hotjar?: string;
      custom_scripts?: string;
    };
    seo: {
      default_title: string;
      title_template: string;
      default_description: string;
      default_keywords: string;
      sitemap_enabled: boolean;
      robots_txt: string;
    };
    performance: {
      cache_duration: number;
      compression_enabled: boolean;
      lazy_loading: boolean;
      cdn_enabled: boolean;
      cdn_url?: string;
    };
    security: {
      csrf_protection: boolean;
      rate_limiting: boolean;
      content_security_policy: string;
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
        content: '<div class="hero-section"><h1>Welcome to One Mind, Many</h1><p>The ultimate social deduction experience.</p><button class="cta-button">Start Playing</button></div>',
        meta: {
          description: 'One Mind, Many - The ultimate social deduction game',
          keywords: 'game, social deduction, multiplayer, AI',
          og_title: 'One Mind, Many',
          og_description: 'The ultimate social deduction experience',
          og_image: '/og-image.jpg',
          canonical_url: 'https://onemindmany.com/',
          robots: 'index, follow'
        },
        layout: 'default',
        status: 'published',
        order: 1,
        access_level: 'public'
      },
      about: {
        title: 'About',
        path: '/about',
        content: '<div class="about-section"><h1>About One Mind, Many</h1><p>Learn about our revolutionary social deduction game.</p></div>',
        meta: {
          description: 'Learn about One Mind, Many',
          keywords: 'about, game, story',
          og_title: 'About - One Mind, Many',
          og_description: 'Learn about our social deduction game',
          og_image: '/og-image.jpg'
        },
        layout: 'default',
        status: 'published',
        order: 2,
        access_level: 'public'
      }
    },
    components: {
      header: {
        id: 'header',
        name: 'Site Header',
        html: `<header class="site-header">
          <div class="container">
            <div class="logo">{{logo}}</div>
            <nav class="main-nav">{{navigation}}</nav>
            <div class="user-actions">{{user_menu}}</div>
          </div>
        </header>`,
        css: `.site-header {
          background: var(--primary-color);
          padding: 1rem 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .site-header .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }`,
        js: `// Header functionality
        document.addEventListener('DOMContentLoaded', function() {
          const header = document.querySelector('.site-header');
          window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
              header.classList.add('scrolled');
            } else {
              header.classList.remove('scrolled');
            }
          });
        });`,
        props: {
          logo: {
            type: 'string',
            default: '/logo.png',
            description: 'Logo image URL'
          },
          sticky: {
            type: 'boolean',
            default: true,
            description: 'Make header sticky on scroll'
          }
        },
        category: 'layout'
      },
      footer: {
        id: 'footer',
        name: 'Site Footer',
        html: `<footer class="site-footer">
          <div class="container">
            <div class="footer-content">
              <div class="footer-section">
                <h3>{{site_name}}</h3>
                <p>{{site_description}}</p>
              </div>
              <div class="footer-section">
                <h4>Quick Links</h4>
                {{footer_navigation}}
              </div>
              <div class="footer-section">
                <h4>Connect</h4>
                {{social_links}}
              </div>
            </div>
            <div class="footer-bottom">
              <p>&copy; {{current_year}} {{site_name}}. All rights reserved.</p>
            </div>
          </div>
        </footer>`,
        css: `.site-footer {
          background: var(--dark-color);
          color: var(--light-color);
          padding: 2rem 0 1rem;
        }
        .footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }`,
        js: '',
        props: {},
        category: 'layout'
      },
      gameCard: {
        id: 'gameCard',
        name: 'Game Card',
        html: `<div class="game-card">
          <div class="game-image">
            <img src="{{image}}" alt="{{title}}" />
          </div>
          <div class="game-content">
            <h3>{{title}}</h3>
            <p>{{description}}</p>
            <div class="game-meta">
              <span class="players">{{min_players}}-{{max_players}} players</span>
              <span class="difficulty">{{difficulty}}</span>
            </div>
            <button class="join-button">Join Game</button>
          </div>
        </div>`,
        css: `.game-card {
          background: var(--card-background);
          border-radius: 12px;
          overflow: hidden;
          transition: transform 0.3s ease;
        }
        .game-card:hover {
          transform: translateY(-4px);
        }`,
        js: '',
        props: {
          title: { type: 'string', default: 'Game Title', description: 'Game title' },
          description: { type: 'string', default: 'Game description', description: 'Game description' },
          image: { type: 'string', default: '/game-image.jpg', description: 'Game image URL' }
        },
        category: 'game'
      }
    },
    styles: {
      global: `:root {
        --primary-color: #D65F27;
        --secondary-color: #2C365E;
        --text-color: #F5E5C3;
        --background-color: #121212;
        --card-background: rgba(44, 54, 94, 0.4);
        --border-color: rgba(107, 85, 137, 0.3);
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Quicksand', system-ui, sans-serif;
        background: var(--background-color);
        color: var(--text-color);
        line-height: 1.6;
      }`,
      variables: {
        'primary-color': '#D65F27',
        'secondary-color': '#2C365E',
        'text-color': '#F5E5C3',
        'background-color': '#121212',
        'card-background': 'rgba(44, 54, 94, 0.4)',
        'border-color': 'rgba(107, 85, 137, 0.3)',
        'success-color': '#10B981',
        'warning-color': '#F59E0B',
        'error-color': '#EF4444'
      },
      themes: {
        dark: {
          'background-color': '#121212',
          'text-color': '#F5E5C3',
          'card-background': 'rgba(44, 54, 94, 0.4)'
        },
        light: {
          'background-color': '#FFFFFF',
          'text-color': '#333333',
          'card-background': '#F8F9FA'
        }
      },
      responsive: {
        breakpoints: {
          mobile: '480px',
          tablet: '768px',
          desktop: '1024px',
          wide: '1440px'
        },
        rules: {
          mobile: '@media (max-width: 480px) { .container { padding: 0 1rem; } }',
          tablet: '@media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }',
          desktop: '@media (min-width: 1024px) { .container { max-width: 1200px; } }'
        }
      }
    },
    assets: {
      logo: {
        url: '/OneMindMay Logo - long.png',
        type: 'image/png',
        alt: 'One Mind, Many Logo',
        title: 'One Mind, Many',
        size: 45678,
        dimensions: { width: 400, height: 100 },
        tags: ['logo', 'branding']
      },
      heroImage: {
        url: 'https://images.pexels.com/photos/2694344/pexels-photo-2694344.jpeg',
        type: 'image/jpeg',
        alt: 'Game Environment',
        title: 'Prison Corridor',
        size: 234567,
        dimensions: { width: 1920, height: 1080 },
        tags: ['hero', 'environment', 'game']
      }
    },
    navigation: {
      header: [
        { id: 'home', label: 'Home', path: '/', order: 1, access_level: 'public' },
        { id: 'about', label: 'About', path: '/about', order: 2, access_level: 'public' },
        { 
          id: 'game', 
          label: 'Game', 
          path: '/game', 
          order: 3, 
          access_level: 'authenticated',
          children: [
            { id: 'play', label: 'Play', path: '/game/play', order: 1 },
            { id: 'scenarios', label: 'Scenarios', path: '/game/scenarios', order: 2 },
            { id: 'friends', label: 'Friends', path: '/game/friends', order: 3 }
          ]
        }
      ],
      footer: [
        { id: 'privacy', label: 'Privacy Policy', path: '/privacy', order: 1, column: 1 },
        { id: 'terms', label: 'Terms of Service', path: '/terms', order: 2, column: 1 },
        { id: 'contact', label: 'Contact', path: '/contact', order: 3, column: 2 }
      ],
      breadcrumbs: {
        enabled: true,
        separator: '/',
        showHome: true
      }
    },
    gameScreens: {
      default: {
        layout: {
          panels: {
            narrative: { width: 33, height: 60, position: 'left' },
            environment: { width: 33, height: 40, position: 'left-top' },
            chat: { width: 33, height: 60, position: 'right' },
            actions: { width: 34, height: 60, position: 'center' },
            players: { width: 33, height: 40, position: 'right-top' },
            turnOrder: { width: 100, height: 15, position: 'top' }
          },
          responsive: {
            mobile: { layout: 'stacked' },
            tablet: { layout: 'two-column' },
            desktop: { layout: 'three-column' }
          }
        },
        features: {
          narrativeLog: {
            enabled: true,
            autoScroll: true,
            maxEntries: 100,
            showTimestamps: true,
            allowFiltering: true
          },
          environmentImages: {
            enabled: true,
            stackSize: 5,
            transitionEffect: 'fade',
            allowZoom: true
          },
          playerChat: {
            enabled: true,
            maxMessages: 50,
            allowPrivateMessages: false,
            moderationEnabled: true
          },
          actionPanel: {
            enabled: true,
            availableActions: ['move', 'search', 'interact', 'hide', 'sabotage', 'help'],
            allowCustomActions: false,
            confirmationRequired: true
          },
          turnOrderPredictor: {
            enabled: true,
            showConfidence: true,
            allowNotes: true
          },
          pauseSystem: {
            enabled: true,
            requiresVote: true,
            timeoutDuration: 300
          }
        },
        styling: {
          theme: 'dark',
          colors: {
            primary: '#D65F27',
            secondary: '#2C365E',
            accent: '#6B5589',
            background: '#121212',
            text: '#F5E5C3'
          },
          fonts: {
            primary: 'Quicksand',
            secondary: 'CustomHeading',
            monospace: 'Monaco'
          },
          animations: {
            enabled: true,
            duration: 300,
            easing: 'ease-in-out'
          }
        }
      }
    },
    settings: {
      site_name: 'One Mind, Many',
      site_description: 'The ultimate social deduction game',
      favicon: '/favicon.ico',
      logo: '/OneMindMay Logo - long.png',
      contact_email: 'contact@onemindmany.com',
      social_links: {
        twitter: 'https://twitter.com/onemindmany',
        github: 'https://github.com/onemindmany',
        discord: 'https://discord.gg/onemindmany'
      },
      analytics: {
        google_analytics: 'GA_MEASUREMENT_ID',
        facebook_pixel: 'FB_PIXEL_ID',
        hotjar: 'HOTJAR_ID'
      },
      seo: {
        default_title: 'One Mind, Many',
        title_template: '%s | One Mind, Many',
        default_description: 'The ultimate social deduction experience',
        default_keywords: 'game, social deduction, multiplayer, AI, strategy',
        sitemap_enabled: true,
        robots_txt: 'User-agent: *\nAllow: /'
      },
      performance: {
        cache_duration: 3600,
        compression_enabled: true,
        lazy_loading: true,
        cdn_enabled: false
      },
      security: {
        csrf_protection: true,
        rate_limiting: true,
        content_security_policy: "default-src 'self'; script-src 'self' 'unsafe-inline';"
      }
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'pages' | 'components' | 'styles' | 'assets' | 'navigation' | 'gameScreens' | 'settings'>('pages');
  const [selectedItem, setSelectedItem] = useState<string>('home');
  const [selectedComponent, setSelectedComponent] = useState<string>('header');
  const [selectedGameScreen, setSelectedGameScreen] = useState<string>('default');
  const [showEditor, setShowEditor] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [showNewComponentModal, setShowNewComponentModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [newPageData, setNewPageData] = useState({
    title: '',
    path: '',
    parent_id: '',
    access_level: 'public' as 'public' | 'authenticated' | 'admin'
  });
  const [newComponentData, setNewComponentData] = useState({
    name: '',
    category: 'layout',
    html: '',
    css: '',
    js: ''
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
          content: `<div class="page-content"><h1>${newPageData.title}</h1><p>New page content goes here.</p></div>`,
          meta: {
            description: `${newPageData.title} page`,
            keywords: '',
            og_title: newPageData.title,
            og_description: `${newPageData.title} page`,
            og_image: '/og-image.jpg'
          },
          layout: 'default',
          status: 'draft',
          parent_id: newPageData.parent_id || undefined,
          order: Object.keys(prev.pages).length + 1,
          access_level: newPageData.access_level
        }
      }
    }));
    
    setNewPageData({ title: '', path: '', parent_id: '', access_level: 'public' });
    setShowNewPageModal(false);
  };

  const handleCreateComponent = () => {
    if (!newComponentData.name) return;
    
    const componentId = newComponentData.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    setSiteStructure(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [componentId]: {
          id: componentId,
          name: newComponentData.name,
          html: newComponentData.html || '<div class="component">{{content}}</div>',
          css: newComponentData.css || '.component { padding: 1rem; }',
          js: newComponentData.js || '',
          props: {},
          category: newComponentData.category
        }
      }
    }));
    
    setNewComponentData({ name: '', category: 'layout', html: '', css: '', js: '' });
    setShowNewComponentModal(false);
  };

  const handleDeletePage = (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    
    setSiteStructure(prev => {
      const newPages = { ...prev.pages };
      delete newPages[pageId];
      return { ...prev, pages: newPages };
    });
  };

  const handleDeleteComponent = (componentId: string) => {
    if (!confirm('Are you sure you want to delete this component?')) return;
    
    setSiteStructure(prev => {
      const newComponents = { ...prev.components };
      delete newComponents[componentId];
      return { ...prev, components: newComponents };
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

  const updateComponent = (componentId: string, field: string, value: any) => {
    setSiteStructure(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [componentId]: {
          ...prev.components[componentId],
          [field]: value
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

  const updateNavigation = (section: 'header' | 'footer', value: any) => {
    setSiteStructure(prev => ({
      ...prev,
      navigation: {
        ...prev.navigation,
        [section]: value
      }
    }));
  };

  const updateGameScreen = (screenId: string, field: string, value: any) => {
    setSiteStructure(prev => ({
      ...prev,
      gameScreens: {
        ...prev.gameScreens,
        [screenId]: {
          ...prev.gameScreens[screenId],
          [field]: value
        }
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

  const addNavigationItem = (section: 'header' | 'footer') => {
    const newItem = section === 'header' 
      ? { 
          id: `nav_${Date.now()}`, 
          label: 'New Item', 
          path: '/', 
          order: siteStructure.navigation[section].length + 1, 
          access_level: 'public' as const 
        }
      : { 
          id: `nav_${Date.now()}`, 
          label: 'New Item', 
          path: '/', 
          order: siteStructure.navigation[section].length + 1, 
          column: 1 
        };
    
    updateNavigation(section, [...siteStructure.navigation[section], newItem]);
  };

  const removeNavigationItem = (section: 'header' | 'footer', index: number) => {
    const items = [...siteStructure.navigation[section]];
    items.splice(index, 1);
    updateNavigation(section, items);
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
    { id: 'gameScreens', label: 'Game Screens', icon: <Monitor size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Management System</h1>
          <p className="text-slate-400 mt-2">Complete website content and structure management</p>
        </div>
        
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setShowPreview(true)} leftIcon={<Eye size={18} />}>
            Preview
          </Button>
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
                    <div className="text-xs text-slate-400 capitalize">{page.status} • {page.access_level}</div>
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
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Access Level</label>
                      <select
                        value={siteStructure.pages[selectedItem].access_level}
                        onChange={(e) => updatePageContent(selectedItem, 'access_level', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                      >
                        <option value="public">Public</option>
                        <option value="authenticated">Authenticated Users</option>
                        <option value="admin">Admin Only</option>
                      </select>
                    </div>
                    <Input
                      label="Layout Template"
                      value={siteStructure.pages[selectedItem].layout}
                      onChange={(e) => updatePageContent(selectedItem, 'layout', e.target.value)}
                    />
                    <Input
                      label="Page Order"
                      type="number"
                      value={siteStructure.pages[selectedItem].order}
                      onChange={(e) => updatePageContent(selectedItem, 'order', parseInt(e.target.value))}
                    />
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Page Content</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">HTML Content</label>
                      <textarea
                        value={siteStructure.pages[selectedItem].content}
                        onChange={(e) => updatePageContent(selectedItem, 'content', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-64 font-mono text-sm"
                        placeholder="Enter HTML content..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Custom CSS (Optional)</label>
                      <textarea
                        value={siteStructure.pages[selectedItem].custom_css || ''}
                        onChange={(e) => updatePageContent(selectedItem, 'custom_css', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-32 font-mono text-sm"
                        placeholder="Page-specific CSS..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Custom JavaScript (Optional)</label>
                      <textarea
                        value={siteStructure.pages[selectedItem].custom_js || ''}
                        onChange={(e) => updatePageContent(selectedItem, 'custom_js', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-32 font-mono text-sm"
                        placeholder="Page-specific JavaScript..."
                      />
                    </div>
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
                      label="Canonical URL"
                      value={siteStructure.pages[selectedItem].meta.canonical_url || ''}
                      onChange={(e) => updatePageMeta(selectedItem, 'canonical_url', e.target.value)}
                    />
                    <Input
                      label="Robots Directive"
                      value={siteStructure.pages[selectedItem].meta.robots || ''}
                      onChange={(e) => updatePageMeta(selectedItem, 'robots', e.target.value)}
                      placeholder="index, follow"
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

      {/* Components Tab */}
      {selectedTab === 'components' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Components</h3>
              <Button size="sm" onClick={() => setShowNewComponentModal(true)} leftIcon={<Plus size={16} />}>
                New
              </Button>
            </div>
            <div className="space-y-2">
              {Object.entries(siteStructure.components).map(([componentId, component]) => (
                <div key={componentId} className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedComponent(componentId)}
                    className={`flex-1 text-left px-3 py-2 rounded-md transition-colors ${
                      selectedComponent === componentId
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center">
                      <Layout size={16} className="mr-2" />
                      {component.name}
                    </div>
                    <div className="text-xs text-slate-500 capitalize">{component.category}</div>
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteComponent(componentId)}
                    leftIcon={<Trash2 size={14} />}
                    className="ml-2"
                  >
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <div className="lg:col-span-3">
            {selectedComponent && siteStructure.components[selectedComponent] && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Component Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Component Name"
                      value={siteStructure.components[selectedComponent].name}
                      onChange={(e) => updateComponent(selectedComponent, 'name', e.target.value)}
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                      <select
                        value={siteStructure.components[selectedComponent].category}
                        onChange={(e) => updateComponent(selectedComponent, 'category', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                      >
                        <option value="layout">Layout</option>
                        <option value="navigation">Navigation</option>
                        <option value="content">Content</option>
                        <option value="form">Form</option>
                        <option value="game">Game</option>
                        <option value="ui">UI Element</option>
                      </select>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Component Code</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">HTML Template</label>
                      <textarea
                        value={siteStructure.components[selectedComponent].html}
                        onChange={(e) => updateComponent(selectedComponent, 'html', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-32 font-mono text-sm"
                        placeholder="HTML template with {{variables}}..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">CSS Styles</label>
                      <textarea
                        value={siteStructure.components[selectedComponent].css}
                        onChange={(e) => updateComponent(selectedComponent, 'css', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-32 font-mono text-sm"
                        placeholder="Component-specific CSS..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">JavaScript</label>
                      <textarea
                        value={siteStructure.components[selectedComponent].js}
                        onChange={(e) => updateComponent(selectedComponent, 'js', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-32 font-mono text-sm"
                        placeholder="Component JavaScript..."
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Component Properties</h3>
                  <div className="space-y-4">
                    {Object.entries(siteStructure.components[selectedComponent].props).map(([propName, prop]) => (
                      <div key={propName} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-800 rounded-lg">
                        <Input
                          label="Property Name"
                          value={propName}
                          onChange={(e) => {
                            const newProps = { ...siteStructure.components[selectedComponent].props };
                            delete newProps[propName];
                            newProps[e.target.value] = prop;
                            updateComponent(selectedComponent, 'props', newProps);
                          }}
                        />
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                          <select
                            value={prop.type}
                            onChange={(e) => updateComponent(selectedComponent, 'props', {
                              ...siteStructure.components[selectedComponent].props,
                              [propName]: { ...prop, type: e.target.value as any }
                            })}
                            className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
                          >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="array">Array</option>
                            <option value="object">Object</option>
                          </select>
                        </div>
                        <Input
                          label="Default Value"
                          value={prop.default}
                          onChange={(e) => updateComponent(selectedComponent, 'props', {
                            ...siteStructure.components[selectedComponent].props,
                            [propName]: { ...prop, default: e.target.value }
                          })}
                        />
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => updateComponent(selectedComponent, 'props', {
                        ...siteStructure.components[selectedComponent].props,
                        [`prop_${Date.now()}`]: { type: 'string', default: '', description: '' }
                      })}
                      leftIcon={<Plus size={16} />}
                    >
                      Add Property
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Tab */}
      {selectedTab === 'navigation' && (
        <div className="space-y-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Header Navigation</h3>
            <div className="space-y-4">
              {siteStructure.navigation.header.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-slate-800 rounded-lg">
                  <Input
                    label="Label"
                    value={item.label}
                    onChange={(e) => {
                      const newItems = [...siteStructure.navigation.header];
                      newItems[index] = { ...item, label: e.target.value };
                      updateNavigation('header', newItems);
                    }}
                  />
                  <Input
                    label="Path"
                    value={item.path}
                    onChange={(e) => {
                      const newItems = [...siteStructure.navigation.header];
                      newItems[index] = { ...item, path: e.target.value };
                      updateNavigation('header', newItems);
                    }}
                  />
                  <Input
                    label="Order"
                    type="number"
                    value={item.order}
                    onChange={(e) => {
                      const newItems = [...siteStructure.navigation.header];
                      newItems[index] = { ...item, order: parseInt(e.target.value) };
                      updateNavigation('header', newItems);
                    }}
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Access Level</label>
                    <select
                      value={item.access_level}
                      onChange={(e) => {
                        const newItems = [...siteStructure.navigation.header];
                        newItems[index] = { ...item, access_level: e.target.value as any };
                        updateNavigation('header', newItems);
                      }}
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
                    >
                      <option value="public">Public</option>
                      <option value="authenticated">Authenticated</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeNavigationItem('header', index)}
                      leftIcon={<Trash2 size={14} />}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => addNavigationItem('header')}
                leftIcon={<Plus size={16} />}
              >
                Add Header Item
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Footer Navigation</h3>
            <div className="space-y-4">
              {siteStructure.navigation.footer.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-800 rounded-lg">
                  <Input
                    label="Label"
                    value={item.label}
                    onChange={(e) => {
                      const newItems = [...siteStructure.navigation.footer];
                      newItems[index] = { ...item, label: e.target.value };
                      updateNavigation('footer', newItems);
                    }}
                  />
                  <Input
                    label="Path"
                    value={item.path}
                    onChange={(e) => {
                      const newItems = [...siteStructure.navigation.footer];
                      newItems[index] = { ...item, path: e.target.value };
                      updateNavigation('footer', newItems);
                    }}
                  />
                  <Input
                    label="Column"
                    type="number"
                    value={item.column}
                    onChange={(e) => {
                      const newItems = [...siteStructure.navigation.footer];
                      newItems[index] = { ...item, column: parseInt(e.target.value) };
                      updateNavigation('footer', newItems);
                    }}
                  />
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeNavigationItem('footer', index)}
                      leftIcon={<Trash2 size={14} />}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => addNavigationItem('footer')}
                leftIcon={<Plus size={16} />}
              >
                Add Footer Item
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Breadcrumb Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Enable Breadcrumbs</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={siteStructure.navigation.breadcrumbs.enabled}
                    onChange={(e) => setSiteStructure(prev => ({
                      ...prev,
                      navigation: {
                        ...prev.navigation,
                        breadcrumbs: {
                          ...prev.navigation.breadcrumbs,
                          enabled: e.target.checked
                        }
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
              <Input
                label="Separator"
                value={siteStructure.navigation.breadcrumbs.separator}
                onChange={(e) => setSiteStructure(prev => ({
                  ...prev,
                  navigation: {
                    ...prev.navigation,
                    breadcrumbs: {
                      ...prev.navigation.breadcrumbs,
                      separator: e.target.value
                    }
                  }
                }))}
              />
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Show Home</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={siteStructure.navigation.breadcrumbs.showHome}
                    onChange={(e) => setSiteStructure(prev => ({
                      ...prev,
                      navigation: {
                        ...prev.navigation,
                        breadcrumbs: {
                          ...prev.navigation.breadcrumbs,
                          showHome: e.target.checked
                        }
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Game Screens Tab */}
      {selectedTab === 'gameScreens' && (
        <div className="space-y-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Game Screen Configurations</h3>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedGameScreen}
                  onChange={(e) => setSelectedGameScreen(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                >
                  {Object.keys(siteStructure.gameScreens).map(screenId => (
                    <option key={screenId} value={screenId}>{screenId}</option>
                  ))}
                </select>
                <Button size="sm" leftIcon={<Plus size={16} />}>
                  New Screen
                </Button>
              </div>
            </div>

            {selectedGameScreen && siteStructure.gameScreens[selectedGameScreen] && (
              <div className="space-y-6">
                {/* Layout Configuration */}
                <div>
                  <h4 className="text-white font-medium mb-4">Panel Layout</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(siteStructure.gameScreens[selectedGameScreen].layout.panels).map(([panelName, panel]) => (
                      <div key={panelName} className="bg-slate-800 rounded-lg p-4">
                        <h5 className="text-white font-medium mb-3 capitalize">{panelName} Panel</h5>
                        <div className="space-y-2">
                          <Input
                            label="Width (%)"
                            type="number"
                            value={panel.width}
                            onChange={(e) => updateGameScreen(selectedGameScreen, 'layout', {
                              ...siteStructure.gameScreens[selectedGameScreen].layout,
                              panels: {
                                ...siteStructure.gameScreens[selectedGameScreen].layout.panels,
                                [panelName]: { ...panel, width: parseInt(e.target.value) }
                              }
                            })}
                          />
                          <Input
                            label="Height (%)"
                            type="number"
                            value={panel.height}
                            onChange={(e) => updateGameScreen(selectedGameScreen, 'layout', {
                              ...siteStructure.gameScreens[selectedGameScreen].layout,
                              panels: {
                                ...siteStructure.gameScreens[selectedGameScreen].layout.panels,
                                [panelName]: { ...panel, height: parseInt(e.target.value) }
                              }
                            })}
                          />
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Position</label>
                            <select
                              value={panel.position}
                              onChange={(e) => updateGameScreen(selectedGameScreen, 'layout', {
                                ...siteStructure.gameScreens[selectedGameScreen].layout,
                                panels: {
                                  ...siteStructure.gameScreens[selectedGameScreen].layout.panels,
                                  [panelName]: { ...panel, position: e.target.value }
                                }
                              })}
                              className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                              <option value="top">Top</option>
                              <option value="bottom">Bottom</option>
                              <option value="left-top">Left Top</option>
                              <option value="right-top">Right Top</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature Configuration */}
                <div>
                  <h4 className="text-white font-medium mb-4">Feature Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(siteStructure.gameScreens[selectedGameScreen].features).map(([featureName, feature]) => (
                      <div key={featureName} className="bg-slate-800 rounded-lg p-4">
                        <h5 className="text-white font-medium mb-3 capitalize">{featureName.replace(/([A-Z])/g, ' $1')}</h5>
                        <div className="space-y-3">
                          {Object.entries(feature).map(([settingName, settingValue]) => (
                            <div key={settingName}>
                              {typeof settingValue === 'boolean' ? (
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-300 text-sm capitalize">{settingName.replace(/([A-Z])/g, ' $1')}</span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={settingValue}
                                      onChange={(e) => updateGameScreen(selectedGameScreen, 'features', {
                                        ...siteStructure.gameScreens[selectedGameScreen].features,
                                        [featureName]: {
                                          ...feature,
                                          [settingName]: e.target.checked
                                        }
                                      })}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                  </label>
                                </div>
                              ) : typeof settingValue === 'number' ? (
                                <Input
                                  label={settingName.replace(/([A-Z])/g, ' $1')}
                                  type="number"
                                  value={settingValue}
                                  onChange={(e) => updateGameScreen(selectedGameScreen, 'features', {
                                    ...siteStructure.gameScreens[selectedGameScreen].features,
                                    [featureName]: {
                                      ...feature,
                                      [settingName]: parseInt(e.target.value)
                                    }
                                  })}
                                />
                              ) : Array.isArray(settingValue) ? (
                                <div>
                                  <label className="block text-sm font-medium text-slate-300 mb-2 capitalize">{settingName.replace(/([A-Z])/g, ' $1')}</label>
                                  <textarea
                                    value={settingValue.join(', ')}
                                    onChange={(e) => updateGameScreen(selectedGameScreen, 'features', {
                                      ...siteStructure.gameScreens[selectedGameScreen].features,
                                      [featureName]: {
                                        ...feature,
                                        [settingName]: e.target.value.split(', ').filter(Boolean)
                                      }
                                    })}
                                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 h-20 text-sm"
                                    placeholder="Comma-separated values"
                                  />
                                </div>
                              ) : (
                                <Input
                                  label={settingName.replace(/([A-Z])/g, ' $1')}
                                  value={settingValue}
                                  onChange={(e) => updateGameScreen(selectedGameScreen, 'features', {
                                    ...siteStructure.gameScreens[selectedGameScreen].features,
                                    [featureName]: {
                                      ...feature,
                                      [settingName]: e.target.value
                                    }
                                  })}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Styling Configuration */}
                <div>
                  <h4 className="text-white font-medium mb-4">Styling & Theme</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-800 rounded-lg p-4">
                      <h5 className="text-white font-medium mb-3">Colors</h5>
                      <div className="space-y-3">
                        {Object.entries(siteStructure.gameScreens[selectedGameScreen].styling.colors).map(([colorName, colorValue]) => (
                          <div key={colorName} className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={colorValue}
                              onChange={(e) => updateGameScreen(selectedGameScreen, 'styling', {
                                ...siteStructure.gameScreens[selectedGameScreen].styling,
                                colors: {
                                  ...siteStructure.gameScreens[selectedGameScreen].styling.colors,
                                  [colorName]: e.target.value
                                }
                              })}
                              className="w-12 h-8 rounded border border-slate-600"
                            />
                            <Input
                              label={colorName.replace(/([A-Z])/g, ' $1')}
                              value={colorValue}
                              onChange={(e) => updateGameScreen(selectedGameScreen, 'styling', {
                                ...siteStructure.gameScreens[selectedGameScreen].styling,
                                colors: {
                                  ...siteStructure.gameScreens[selectedGameScreen].styling.colors,
                                  [colorName]: e.target.value
                                }
                              })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-800 rounded-lg p-4">
                      <h5 className="text-white font-medium mb-3">Typography</h5>
                      <div className="space-y-3">
                        {Object.entries(siteStructure.gameScreens[selectedGameScreen].styling.fonts).map(([fontName, fontValue]) => (
                          <Input
                            key={fontName}
                            label={fontName.replace(/([A-Z])/g, ' $1')}
                            value={fontValue}
                            onChange={(e) => updateGameScreen(selectedGameScreen, 'styling', {
                              ...siteStructure.gameScreens[selectedGameScreen].styling,
                              fonts: {
                                ...siteStructure.gameScreens[selectedGameScreen].styling.fonts,
                                [fontName]: e.target.value
                              }
                            })}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-800 rounded-lg p-4">
                      <h5 className="text-white font-medium mb-3">Animations</h5>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Enable Animations</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={siteStructure.gameScreens[selectedGameScreen].styling.animations.enabled}
                              onChange={(e) => updateGameScreen(selectedGameScreen, 'styling', {
                                ...siteStructure.gameScreens[selectedGameScreen].styling,
                                animations: {
                                  ...siteStructure.gameScreens[selectedGameScreen].styling.animations,
                                  enabled: e.target.checked
                                }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                          </label>
                        </div>
                        <Input
                          label="Duration (ms)"
                          type="number"
                          value={siteStructure.gameScreens[selectedGameScreen].styling.animations.duration}
                          onChange={(e) => updateGameScreen(selectedGameScreen, 'styling', {
                            ...siteStructure.gameScreens[selectedGameScreen].styling,
                            animations: {
                              ...siteStructure.gameScreens[selectedGameScreen].styling.animations,
                              duration: parseInt(e.target.value)
                            }
                          })}
                        />
                        <Input
                          label="Easing"
                          value={siteStructure.gameScreens[selectedGameScreen].styling.animations.easing}
                          onChange={(e) => updateGameScreen(selectedGameScreen, 'styling', {
                            ...siteStructure.gameScreens[selectedGameScreen].styling,
                            animations: {
                              ...siteStructure.gameScreens[selectedGameScreen].styling.animations,
                              easing: e.target.value
                            }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
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
                <div key={key} className="flex items-center space-x-3">
                  {key.includes('color') && (
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => updateStyles('variables', {
                        ...siteStructure.styles.variables,
                        [key]: e.target.value
                      })}
                      className="w-12 h-8 rounded border border-slate-600"
                    />
                  )}
                  <Input
                    label={key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    value={value}
                    onChange={(e) => updateStyles('variables', {
                      ...siteStructure.styles.variables,
                      [key]: e.target.value
                    })}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Responsive Breakpoints</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-4">Breakpoints</h4>
                <div className="space-y-4">
                  {Object.entries(siteStructure.styles.responsive.breakpoints).map(([device, size]) => (
                    <Input
                      key={device}
                      label={device.charAt(0).toUpperCase() + device.slice(1)}
                      value={size}
                      onChange={(e) => updateStyles('responsive', {
                        ...siteStructure.styles.responsive,
                        breakpoints: {
                          ...siteStructure.styles.responsive.breakpoints,
                          [device]: e.target.value
                        }
                      })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-white font-medium mb-4">Responsive Rules</h4>
                <div className="space-y-4">
                  {Object.entries(siteStructure.styles.responsive.rules).map(([device, rule]) => (
                    <div key={device}>
                      <label className="block text-sm font-medium text-slate-300 mb-2 capitalize">{device}</label>
                      <textarea
                        value={rule}
                        onChange={(e) => updateStyles('responsive', {
                          ...siteStructure.styles.responsive,
                          rules: {
                            ...siteStructure.styles.responsive.rules,
                            [device]: e.target.value
                          }
                        })}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-20 font-mono text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
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
                      <div key={key} className="flex items-center space-x-3">
                        {key.includes('color') && (
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => updateStyles('themes', {
                              ...siteStructure.styles.themes,
                              [themeName]: {
                                ...theme,
                                [key]: e.target.value
                              }
                            })}
                            className="w-12 h-8 rounded border border-slate-600"
                          />
                        )}
                        <Input
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
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
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
                accept="image/*,video/*,audio/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(file => {
                    // Handle file upload
                    console.log('Uploading file:', file.name);
                  });
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
              {Object.entries(siteStructure.assets).map(([assetId, asset]) => (
                <div key={assetId} className="bg-slate-800/50 rounded-lg p-4">
                  <div className="aspect-square bg-slate-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {asset.type.startsWith('image/') ? (
                      <img src={asset.url} alt={asset.alt} className="w-full h-full object-cover" />
                    ) : (
                      <Image size={32} className="text-slate-500" />
                    )}
                  </div>
                  <h4 className="text-white font-medium mb-1 truncate">{asset.title || assetId}</h4>
                  <p className="text-sm text-slate-400 mb-2">{asset.type}</p>
                  <p className="text-xs text-slate-500 mb-3">{(asset.size / 1024).toFixed(1)} KB</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" leftIcon={<Eye size={14} />}>
                      View
                    </Button>
                    <Button variant="outline" size="sm" leftIcon={<Copy size={14} />}>
                      Copy URL
                    </Button>
                  </div>
                  <div className="mt-3">
                    <Input
                      label="Alt Text"
                      value={asset.alt || ''}
                      onChange={(e) => setSiteStructure(prev => ({
                        ...prev,
                        assets: {
                          ...prev.assets,
                          [assetId]: { ...asset, alt: e.target.value }
                        }
                      }))}
                      className="text-xs"
                    />
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
              <Input
                label="Default Keywords"
                value={siteStructure.settings.seo.default_keywords}
                onChange={(e) => updateSettings('seo', {
                  ...siteStructure.settings.seo,
                  default_keywords: e.target.value
                })}
              />
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Robots.txt</label>
                <textarea
                  value={siteStructure.settings.seo.robots_txt}
                  onChange={(e) => updateSettings('seo', {
                    ...siteStructure.settings.seo,
                    robots_txt: e.target.value
                  })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-32 font-mono text-sm"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Analytics & Tracking</h3>
            <div className="space-y-4">
              <Input
                label="Google Analytics ID"
                value={siteStructure.settings.analytics.google_analytics || ''}
                onChange={(e) => updateSettings('analytics', {
                  ...siteStructure.settings.analytics,
                  google_analytics: e.target.value
                })}
                placeholder="GA_MEASUREMENT_ID"
              />
              <Input
                label="Facebook Pixel ID"
                value={siteStructure.settings.analytics.facebook_pixel || ''}
                onChange={(e) => updateSettings('analytics', {
                  ...siteStructure.settings.analytics,
                  facebook_pixel: e.target.value
                })}
              />
              <Input
                label="Hotjar ID"
                value={siteStructure.settings.analytics.hotjar || ''}
                onChange={(e) => updateSettings('analytics', {
                  ...siteStructure.settings.analytics,
                  hotjar: e.target.value
                })}
              />
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Custom Scripts</label>
                <textarea
                  value={siteStructure.settings.analytics.custom_scripts || ''}
                  onChange={(e) => updateSettings('analytics', {
                    ...siteStructure.settings.analytics,
                    custom_scripts: e.target.value
                  })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-32 font-mono text-sm"
                  placeholder="Custom tracking scripts..."
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Performance & Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-white font-medium">Performance</h4>
                <Input
                  label="Cache Duration (seconds)"
                  type="number"
                  value={siteStructure.settings.performance.cache_duration}
                  onChange={(e) => updateSettings('performance', {
                    ...siteStructure.settings.performance,
                    cache_duration: parseInt(e.target.value)
                  })}
                />
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Enable Compression</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={siteStructure.settings.performance.compression_enabled}
                      onChange={(e) => updateSettings('performance', {
                        ...siteStructure.settings.performance,
                        compression_enabled: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Lazy Loading</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={siteStructure.settings.performance.lazy_loading}
                      onChange={(e) => updateSettings('performance', {
                        ...siteStructure.settings.performance,
                        lazy_loading: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-white font-medium">Security</h4>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">CSRF Protection</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={siteStructure.settings.security.csrf_protection}
                      onChange={(e) => updateSettings('security', {
                        ...siteStructure.settings.security,
                        csrf_protection: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Rate Limiting</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={siteStructure.settings.security.rate_limiting}
                      onChange={(e) => updateSettings('security', {
                        ...siteStructure.settings.security,
                        rate_limiting: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Content Security Policy</label>
                  <textarea
                    value={siteStructure.settings.security.content_security_policy}
                    onChange={(e) => updateSettings('security', {
                      ...siteStructure.settings.security,
                      content_security_policy: e.target.value
                    })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-20 font-mono text-sm"
                  />
                </div>
              </div>
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
                <label className="block text-sm font-medium text-slate-300 mb-2">Access Level</label>
                <select
                  value={newPageData.access_level}
                  onChange={(e) => setNewPageData(prev => ({ ...prev, access_level: e.target.value as any }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                >
                  <option value="public">Public</option>
                  <option value="authenticated">Authenticated Users</option>
                  <option value="admin">Admin Only</option>
                </select>
              </div>
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

      {/* New Component Modal */}
      {showNewComponentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-2xl">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Create New Component</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Component Name"
                  value={newComponentData.name}
                  onChange={(e) => setNewComponentData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Component"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <select
                    value={newComponentData.category}
                    onChange={(e) => setNewComponentData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                  >
                    <option value="layout">Layout</option>
                    <option value="navigation">Navigation</option>
                    <option value="content">Content</option>
                    <option value="form">Form</option>
                    <option value="game">Game</option>
                    <option value="ui">UI Element</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">HTML Template</label>
                <textarea
                  value={newComponentData.html}
                  onChange={(e) => setNewComponentData(prev => ({ ...prev, html: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-32 font-mono text-sm"
                  placeholder="<div class='component'>{{content}}</div>"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">CSS Styles</label>
                <textarea
                  value={newComponentData.css}
                  onChange={(e) => setNewComponentData(prev => ({ ...prev, css: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 h-32 font-mono text-sm"
                  placeholder=".component { padding: 1rem; }"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-4">
              <Button variant="outline" onClick={() => setShowNewComponentModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateComponent} leftIcon={<Plus size={18} />}>
                Create Component
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Website Preview</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-2 rounded ${previewDevice === 'mobile' ? 'bg-orange-500' : 'bg-slate-700'}`}
                  >
                    <Smartphone size={16} />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    className={`p-2 rounded ${previewDevice === 'tablet' ? 'bg-orange-500' : 'bg-slate-700'}`}
                  >
                    <Tablet size={16} />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-2 rounded ${previewDevice === 'desktop' ? 'bg-orange-500' : 'bg-slate-700'}`}
                  >
                    <Monitor size={16} />
                  </button>
                </div>
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 p-6">
              <div className={`mx-auto bg-white rounded-lg overflow-hidden ${
                previewDevice === 'mobile' ? 'w-80 h-[600px]' :
                previewDevice === 'tablet' ? 'w-[768px] h-[600px]' :
                'w-full h-full'
              }`}>
                <iframe
                  src="/"
                  className="w-full h-full"
                  title="Website Preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagementPage;