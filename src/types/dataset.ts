export interface Conversation {
  from: 'system' | 'human' | 'gpt';
  value: string;
}

export interface DatasetItem {
  id: string;
  image: string;
  conversations: Conversation[];
}
