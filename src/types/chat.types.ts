export interface ChatRoom {
  id           : string;
  name         : string | null;
  isGroup      : boolean;
  createdBy    : string;
  createdAt    : string;
  avatarUrl    : string | null;
  description  : string | null;
  updatedAt    : string | null;
  isConfirmed  : boolean;
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
  status   : string;
}

export interface Message {
  id         : string;
  roomId     : string;
  senderId   : string;
  senderName : string;
  avatarUrl  : string | null;
  content    : string;
  messageType: string;
  fileUrl    : string | null;
  isDeleted  : boolean;
  sentAt     : string;
  isRead     : boolean;
  readBy     : Array<{ userId: string; readAt: string }>;
}

export interface ReadReceipt {
  messageId : string;
  userId    : string;
  readAt    : string;
}

export interface TypingUser {
  roomId : string;
  userId : string;
  userName: string;
}

export interface GroupDetail {
  id          : string;
  name        : string;
  description : string | null;
  avatarUrl   : string | null;
  createdBy   : string;
  createdAt   : string;
  updatedAt   : string | null;
  memberCount : number;
  isAdmin     : boolean;
  members     : GroupMember[];
}

export interface GroupMember {
  userId         : string;
  userName       : string;
  avatarUrl      : string | null;
  isOnline       : boolean;
  isAdmin        : boolean;
  joinedAt       : string;
  addedBy        : string | null;
  addedByUserName: string | null;
  status         : string;
}

export interface GroupInvitationDto {
  id               : number;
  roomId           : string;
  groupName        : string;
  groupAvatar      : string | null;
  invitedBy        : string;
  invitedByUserName: string;
  memberCount      : number;
  createdAt        : string;
}

export interface FriendRequestDto {
  id           : number;
  senderId     : string;
  senderName   : string;
  senderAvatar : string | null;
  senderOnline : boolean;
  status       : string;
  createdAt    : string;
}

export interface FriendDto {
  userId   : string;
  userName : string;
  avatarUrl: string | null;
  isOnline : boolean;
  lastSeen : string | null;
  roomId?  : string;
}

export interface MessageRequestDto {
  id           : number;
  senderId     : string;
  senderName   : string;
  senderAvatar : string | null;
  senderOnline : boolean;
  roomId       : string;
  status       : string;
  createdAt    : string;
}