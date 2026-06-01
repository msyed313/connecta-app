import { create } from 'zustand';
import type { ChatRoom, Message, TypingUser } from '../types/chat.types';

interface ChatStore {
  rooms          : ChatRoom[];
  activeRoomId   : string | null;
  messages       : Record<string, Message[]>;
  typingUsers    : TypingUser[];

  setRooms       : (rooms: ChatRoom[]) => void;
  addRoom        : (room: ChatRoom)    => void;
  updateRoom     : (room: ChatRoom)    => void;
  setActiveRoom  : (roomId: string | null) => void;

  setMessages    : (roomId: string, messages: Message[]) => void;
  addMessage     : (message: Message)  => void;
  deleteMessage  : (messageId: string, roomId: string) => void;
  markRoomAsRead : (roomId: string, userId: string) => void;

  setTyping      : (user: TypingUser)  => void;
  clearTyping    : (roomId: string, userId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  rooms        : [],
  activeRoomId : null,
  messages     : {},
  typingUsers  : [],

  setRooms: (rooms) => set({ rooms }),

  addRoom: (room) => set((s) => ({
    rooms: [room, ...s.rooms.filter(r => r.id !== room.id)]
  })),

  updateRoom: (room) => set((s) => ({
    rooms: s.rooms.map(r => r.id === room.id ? room : r)
  })),

  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

  setMessages: (roomId, messages) => set((s) => ({
    messages: { ...s.messages, [roomId]: messages }
  })),

  addMessage: (message) => set((s) => {
    const existing = s.messages[message.roomId] ?? [];
    const isDuplicate = existing.some(m => m.id === message.id);
    if (isDuplicate) return s;

    // Update last message in room
    const updatedRooms = s.rooms.map(r =>
      r.id === message.roomId
        ? { ...r, lastMessage: message.content, lastMessageAt: message.sentAt }
        : r
    );

    return {
      messages: {
        ...s.messages,
        [message.roomId]: [...existing, message]
      },
      rooms: updatedRooms
    };
  }),

  deleteMessage: (messageId, roomId) => set((s) => ({
    messages: {
      ...s.messages,
      [roomId]: (s.messages[roomId] ?? []).map(m =>
        m.id === messageId ? { ...m, isDeleted: true, content: null } : m
      )
    }
  })),

  markRoomAsRead: (roomId, userId) => set((s) => ({
    messages: {
      ...s.messages,
      [roomId]: (s.messages[roomId] ?? []).map(m => ({
        ...m,
        isRead: true,
        readBy: m.readBy.some(r => r.userId === userId)
          ? m.readBy
          : [...m.readBy, { userId, userName: '', readAt: new Date().toISOString() }]
      }))
    },
    rooms: s.rooms.map(r =>
      r.id === roomId ? { ...r, unreadCount: 0 } : r
    )
  })),

  setTyping: (user) => set((s) => ({
    typingUsers: [
      ...s.typingUsers.filter(t => !(t.roomId === user.roomId && t.userId === user.userId)),
      user
    ]
  })),

  clearTyping: (roomId, userId) => set((s) => ({
    typingUsers: s.typingUsers.filter(
      t => !(t.roomId === roomId && t.userId === userId)
    )
  })),
}));