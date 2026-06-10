import { create } from 'zustand';
import type { ChatRoom, Message, TypingUser } from '../types/chat.types';

interface ChatStoreState {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  messages: { [roomId: string]: Message[] };
  typingUsers: TypingUser[];

  setRooms: (rooms: ChatRoom[]) => void;
  addRoom: (room: ChatRoom) => void;
  updateRoom: (room: any) => void;
  setActiveRoom: (roomId: string | null) => void;
  setMessages: (roomId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  deleteMessage: (roomId: string, messageId: string) => void;
  markRoomAsRead: (roomId: string, userId: string) => void;
  updateRoomUnreadCount: (roomId: string, count: number) => void;
  setTyping: (user: TypingUser) => void;
  clearTyping: (roomId: string, userId: string) => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
  rooms: [],
  activeRoomId: null,
  messages: {},
  typingUsers: [],

  setRooms: (rooms) => set({ rooms }),

  addRoom: (room) =>
    set((state) => ({
      rooms: [room, ...state.rooms],
    })),

  updateRoom: (room) =>
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === room.id ? room : r)),
    })),

  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

  setMessages: (roomId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: messages,
      },
    })),

  addMessage: (message) =>
    set((state) => {
      const { activeRoomId } = state;
      const isInActiveRoom = message.roomId === activeRoomId;

      return {
        messages: {
          ...state.messages,
          [message.roomId]: [...(state.messages[message.roomId] || []), message],
        },
        rooms: state.rooms.map((r) =>
          r.id === message.roomId && message.senderId !== activeRoomId && !isInActiveRoom
            ? { ...r, unreadCount: (r.unreadCount || 0) + 1 }
            : r
        ),
      };
    }),

  deleteMessage: (roomId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: state.messages[roomId].filter((m) => m.id !== messageId),
      },
    })),

  markRoomAsRead: (roomId) =>
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId ? { ...r, unreadCount: 0 } : r
      ),
      messages: {
        ...state.messages,
        [roomId]: (state.messages[roomId] || []).map((msg) => ({
          ...msg,
          isRead: true,
        })),
      },
    })),

  updateRoomUnreadCount: (roomId, count) =>
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId ? { ...r, unreadCount: Math.max(0, count) } : r
      ),
    })),

  setTyping: (user) =>
    set((state) => ({
      typingUsers: [
        ...state.typingUsers.filter((u) => u.userId !== user.userId),
        user,
      ],
    })),

  clearTyping: (roomId, userId) =>
    set((state) => ({
      typingUsers: state.typingUsers.filter(
        (u) => !(u.roomId === roomId && u.userId === userId)
      ),
    })),
}));