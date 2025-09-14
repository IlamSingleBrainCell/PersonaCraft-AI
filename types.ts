export interface Persona {
  name: string;
  description: string;
}

export interface ChatMessageFile {
  name:string;
  type: string;
  data: string; // base64 data URL
}

export interface Source {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  files?: ChatMessageFile[];
  sources?: Source[];
  suggestedQuestions?: string[];
}

export interface Artifact {
  id: string;
  title: string;
  content: string;
}

export interface User {
  name: string;
  avatarUrl: string;
  provider: 'google' | 'github';
}
