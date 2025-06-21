import { Story } from 'inkjs';
import { api } from '../lib/api';

// Types for external function calls
interface ExternalFunctionParams {
  functionName: string;
  args: any[];
}

class InkService {
  private story: Story | null = null;
  private storyContent: string = '';
  private gameId: string | null = null;
  
  // Initialize the Ink story with JSON content
  public async initStory(storyJSON: string, gameId: string): Promise<void> {
    try {
      this.storyContent = storyJSON;
      this.story = new Story(storyJSON);
      this.gameId = gameId;
      
      // Bind external functions
      this.bindExternalFunctions();
      
      console.log('Ink story initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Ink story:', error);
      throw error;
    }
  }
  
  // Continue the story and get the next chunk of text
  public continue(): string {
    if (!this.story) {
      throw new Error('Story not initialized');
    }
    
    if (!this.story.canContinue) {
      return '';
    }
    
    return this.story.Continue();
  }
  
  // Get current choices
  public getChoices(): { text: string; index: number; tags: string[] }[] {
    if (!this.story) {
      return [];
    }
    
    return this.story.currentChoices.map(choice => ({
      text: choice.text,
      index: choice.index,
      tags: choice.tags || []
    }));
  }
  
  // Make a choice
  public choose(choiceIndex: number): void {
    if (!this.story) {
      throw new Error('Story not initialized');
    }
    
    this.story.ChooseChoiceIndex(choiceIndex);
  }
  
  // Get current tags
  public getCurrentTags(): string[] {
    if (!this.story) {
      return [];
    }
    
    return this.story.currentTags;
  }
  
  // Get variable value
  public getVariable(variableName: string): any {
    if (!this.story) {
      throw new Error('Story not initialized');
    }
    
    return this.story.variablesState.GetVariableWithName(variableName);
  }
  
  // Set variable value
  public setVariable(variableName: string, value: any): void {
    if (!this.story) {
      throw new Error('Story not initialized');
    }
    
    this.story.variablesState.SetVariableWithName(variableName, value);
  }
  
  // Save story state
  public saveState(): string {
    if (!this.story) {
      throw new Error('Story not initialized');
    }
    
    return this.story.state.toJson();
  }
  
  // Load story state
  public loadState(savedState: string): void {
    if (!this.story) {
      throw new Error('Story not initialized');
    }
    
    this.story.state.LoadJson(savedState);
  }
  
  // Bind external functions to the story
  private bindExternalFunctions(): void {
    if (!this.story) {
      return;
    }
    
    // Get location data
    this.story.BindExternalFunction('get_location_data', async (locationId: string) => {
      return await this.callExternalFunction('get_location_data', [locationId]);
    });
    
    // Update object state
    this.story.BindExternalFunction('update_object_state', async (objectId: string, newState: string) => {
      return await this.callExternalFunction('update_object_state', [objectId, newState]);
    });
    
    // Add to inventory
    this.story.BindExternalFunction('add_to_inventory', async (itemId: string) => {
      return await this.callExternalFunction('add_to_inventory', [itemId]);
    });
    
    // Remove from inventory
    this.story.BindExternalFunction('remove_from_inventory', async (itemId: string) => {
      return await this.callExternalFunction('remove_from_inventory', [itemId]);
    });
    
    // Check if item is in inventory
    this.story.BindExternalFunction('has_item', async (itemId: string) => {
      return await this.callExternalFunction('has_item', [itemId]);
    });
    
    // Get character data
    this.story.BindExternalFunction('get_character_data', async (characterId: string) => {
      return await this.callExternalFunction('get_character_data', [characterId]);
    });
    
    // Update character state
    this.story.BindExternalFunction('update_character_state', async (characterId: string, property: string, value: any) => {
      return await this.callExternalFunction('update_character_state', [characterId, property, value]);
    });
    
    // Log narrative event
    this.story.BindExternalFunction('log_narrative', async (content: string, type: string = 'narrative') => {
      return await this.callExternalFunction('log_narrative', [content, type]);
    });
    
    // Get player role
    this.story.BindExternalFunction('get_player_role', async (playerId: string) => {
      return await this.callExternalFunction('get_player_role', [playerId]);
    });
    
    // Check if objective is complete
    this.story.BindExternalFunction('is_objective_complete', async (objectiveId: string) => {
      return await this.callExternalFunction('is_objective_complete', [objectiveId]);
    });
    
    // Complete objective
    this.story.BindExternalFunction('complete_objective', async (objectiveId: string) => {
      return await this.callExternalFunction('complete_objective', [objectiveId]);
    });
  }
  
  // Call external function via API
  private async callExternalFunction(functionName: string, args: any[]): Promise<any> {
    if (!this.gameId) {
      throw new Error('Game ID not set');
    }
    
    try {
      const params: ExternalFunctionParams = {
        functionName,
        args
      };
      
      const response = await api.post(`/api/game/${this.gameId}/ink-external-call`, params);
      
      if (!response.ok) {
        throw new Error(`External function call failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error(`Error calling external function ${functionName}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const inkService = new InkService();