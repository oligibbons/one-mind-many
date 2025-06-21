import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { inkService } from '../../services/InkService';

interface InkStoryRendererProps {
  gameId: string;
  storyJSON: string;
  onError?: (error: string) => void;
  className?: string;
}

const InkStoryRenderer = ({ gameId, storyJSON, onError, className = '' }: InkStoryRendererProps) => {
  const [storyText, setStoryText] = useState<string>('');
  const [choices, setChoices] = useState<{ text: string; index: number; tags: string[] }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  const storyContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize the Ink story
  useEffect(() => {
    const initStory = async () => {
      try {
        setLoading(true);
        
        // Initialize the story
        await inkService.initStory(storyJSON, gameId);
        
        // Continue the story to get initial content
        continueStory();
        
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing Ink story:', error);
        if (onError) {
          onError(error instanceof Error ? error.message : 'Failed to initialize Ink story');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (storyJSON && gameId && !initialized) {
      initStory();
    }
  }, [storyJSON, gameId, initialized, onError]);
  
  // Auto-scroll when new content is added
  useEffect(() => {
    if (storyContainerRef.current) {
      storyContainerRef.current.scrollTop = storyContainerRef.current.scrollHeight;
    }
  }, [storyText]);
  
  // Continue the story
  const continueStory = () => {
    try {
      // Continue the story until we can't anymore
      let text = '';
      while (inkService.continue()) {
        text += inkService.continue();
      }
      
      // Get current choices
      const currentChoices = inkService.getChoices();
      
      // Get current tags
      const currentTags = inkService.getCurrentTags();
      
      // Update state
      setStoryText(prev => prev + text);
      setChoices(currentChoices);
      setTags(currentTags);
    } catch (error) {
      console.error('Error continuing Ink story:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Failed to continue Ink story');
      }
    }
  };
  
  // Make a choice
  const makeChoice = (choiceIndex: number) => {
    try {
      inkService.choose(choiceIndex);
      continueStory();
    } catch (error) {
      console.error('Error making Ink choice:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Failed to make Ink choice');
      }
    }
  };
  
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col ${className}`}>
      {/* Story Text */}
      <div 
        ref={storyContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {storyText.split('\n').map((paragraph, index) => (
          paragraph.trim() ? (
            <motion.p
              key={index}
              className="text-slate-200 text-sm leading-relaxed body-font"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              {paragraph}
            </motion.p>
          ) : null
        ))}
      </div>
      
      {/* Choices */}
      {choices.length > 0 && (
        <div className="mt-4 space-y-2 p-4 border-t border-slate-800">
          <h4 className="text-md font-semibold text-white mb-2 custom-font">What will you do?</h4>
          {choices.map((choice) => (
            <motion.button
              key={choice.index}
              onClick={() => makeChoice(choice.index)}
              className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors game-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {choice.text}
            </motion.button>
          ))}
        </div>
      )}
      
      {/* Tags (for debugging) */}
      {tags.length > 0 && process.env.NODE_ENV === 'development' && (
        <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs text-slate-400">
          Tags: {tags.join(', ')}
        </div>
      )}
    </div>
  );
};

export default InkStoryRenderer;