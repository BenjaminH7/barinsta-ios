import type { IgUser } from '../types/instagram';

export type RootStackParamList = {
  Tabs: undefined;
  Thread: { threadId: string; title: string };
  MessageRequests: undefined;
  StoryViewer: { userIds: string[]; startIndex: number; username: string };
  Profile: { userId: string; username: string };
};

export type TabParamList = {
  Messages: undefined;
  Stories: undefined;
  Search: undefined;
  Requests: undefined;
};

export type ReelTrayNavItem = {
  userId: string;
  user: IgUser;
};
