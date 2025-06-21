declare module 'inkjs' {
  export class Story {
    constructor(jsonString: string);
    
    // Core methods
    public Continue(): string;
    public CanContinue(): boolean;
    public currentChoices: Choice[];
    public currentText: string;
    public currentTags: string[];
    public ChooseChoiceIndex(choiceIdx: number): void;
    
    // Variable access
    public variablesState: {
      [key: string]: any;
      GetVariableWithName(name: string): any;
      SetVariableWithName(name: string, value: any): void;
    };
    
    // External functions
    public BindExternalFunction(
      funcName: string, 
      func: (...args: any[]) => any, 
      lookaheadSafe?: boolean
    ): void;
    
    // Saving and loading
    public state: {
      toJson(): string;
      LoadJson(json: string): void;
      VisitCountAtPathString(pathString: string): number;
    };
    
    // Observers
    public ObserveVariable(variableName: string, observer: (variableName: string, newValue: any) => void): void;
    
    // Tags
    public TagsForContentAtPath(path: string): string[];
    public TagsAtStart(): string[];
    
    // Evaluation
    public EvaluateFunction(functionName: string, ...args: any[]): any;
  }
  
  export class Choice {
    public text: string;
    public index: number;
    public originalThreadIndex: number;
    public targetPath: string;
    public sourcePath: string;
    public isInvisibleDefault: boolean;
    public tags: string[];
  }
}