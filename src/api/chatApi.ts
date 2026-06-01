import axiosInstance from './axiosInstance';
import type { ChatRoom, Message } from '../types/chat.types';

export const chatApi = {

  // Get all rooms (sidebar)
  getMyRooms: async (): Promise<ChatRoom[]> => {
    const res = await axiosInstance.get('/chat/rooms');
    return res.data;
  },

  // Get single room
  getRoom: async (roomId: string): Promise<ChatRoom> => {
    const res = await axiosInstance.get(`/chat/room/${roomId}`);
    return res.data;
  },

  // Start direct chat
  createDirectRoom: async (targetUserId: string): Promise<{ message: string; data: ChatRoom }> => {
    const res = await axiosInstance.post('/chat/room/direct', { targetUserId });
    return res.data;
  },

  // Create group
  createGroupRoom: async (name: string, memberIds: string[]): Promise<{ message: string; data: ChatRoom }> => {
    const res = await axiosInstance.post('/chat/room/group', { name, memberIds });
    return res.data;
  },

  // Get messages
  getMessages: async (roomId: string, page = 1): Promise<Message[]> => {
    const res = await axiosInstance.get(`/chat/messages/${roomId}?page=${page}&pageSize=50`);
    return res.data;
  },

  // Send message
  sendMessage: async (roomId: string, content: string, messageType = 'text'): Promise<{ message: string; data: Message }> => {
    const res = await axiosInstance.post('/chat/message', { roomId, content, messageType });
    return res.data;
  },

  // Mark as read
  markAsRead: async (roomId: string) => {
    const res = await axiosInstance.post('/chat/read', { roomId });
    return res.data;
  },

  // Delete message
  deleteMessage: async (messageId: string) => {
    const res = await axiosInstance.delete(`/chat/message/${messageId}`);
    return res.data;
  },
};