export interface ChatRoom {
  id           : string;
  name         : string | null;
  isGroup      : boolean;
  createdBy    : string;
  createdAt    : string;
  lastMessage  : string | null;
  lastMessageAt: string | null;
  unreadCount  : number;
  members      : RoomMember[];
}

export interface RoomMember {
  userId   : string;
  userName : string;
  avatarUrl: string | null;
  isOnline : boolean;
  isAdmin  : boolean;
}

export interface Message {
  id         : string;
  roomId     : string;
  senderId   : string;
  senderName : string;
  avatarUrl  : string | null;
  content    : string | null;
  messageType: string;
  fileUrl    : string | null;
  isDeleted  : boolean;
  sentAt     : string;
  isRead     : boolean;
  readBy     : ReadReceipt[];
}

export interface ReadReceipt {
  userId  : string;
  userName: string;
  readAt  : string;
}

export interface TypingUser {
  roomId  : string;
  userId  : string;
  userName: string;
}