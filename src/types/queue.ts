export interface Token {
  id: string;
  number: number;
  citizenName: string;
  citizenId: string;
  timeSlot: string;
  estimatedTime: string;
  status: 'waiting' | 'serving' | 'completed' | 'no-show';
  counter?: number;
  priority: boolean;
  createdAt: Date;
}

export interface QueueStats {
  totalTokens: number;
  currentlyServing: number;
  averageWaitTime: number;
  completedToday: number;
}

export interface Counter {
  id: number;
  name: string;
  currentToken?: Token;
  isActive: boolean;
  officerName: string;
}