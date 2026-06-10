import axiosInstance from './axiosInstance';
import type { ChatRoom, Message } from '../types/chat.types';

export const chatApi = {
  // Get all rooms
  getMyRooms: async (): Promise<ChatRoom[]> => {
    const res = await axiosInstance.get('/chat/rooms');
    return res.data;
  },

  // Get room by ID
  getRoom: async (roomId: string): Promise<ChatRoom> => {
    const res = await axiosInstance.get(`/chat/room/${roomId}`);
    return res.data;
  },

  // Create direct room
  createDirectRoom: async (targetUserId: string): Promise<{ data: ChatRoom }> => {
    const res = await axiosInstance.post('/chat/room/direct', { targetUserId });
    return res.data;
  },

  // Get messages
  getMessages: async (roomId: string, page: number = 1, pageSize: number = 50): Promise<Message[]> => {
    const res = await axiosInstance.get(`/chat/messages/${roomId}`, {
      params: { page, pageSize }
    });
    return res.data;
  },

  // Send message — FIX: Accept object instead of string
  sendMessage: async (roomId: string, dto: { content: string; messageType?: string; fileUrl?: string }): Promise<{ data: Message }> => {
    const res = await axiosInstance.post('/chat/message', {
      roomId,
      ...dto,
      messageType: dto.messageType || 'text'
    });
    return res.data;
  },

  // Mark as read
  markAsRead: async (roomId: string): Promise<{ message: string }> => {
    const res = await axiosInstance.post('/chat/read', { roomId });
    return res.data;
  },

  // Delete message
  deleteMessage: async (messageId: string): Promise<{ message: string }> => {
    const res = await axiosInstance.delete(`/chat/message/${messageId}`);
    return res.data;
  },
};