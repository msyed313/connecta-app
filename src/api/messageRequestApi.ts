import axiosInstance from './axiosInstance';
import type { MessageRequestDto } from '../types/chat.types';

export const messageRequestApi = {
  startChat: async (targetUserId: string): Promise<{
    message: string;
    data: any;
    isRequest: boolean;
  }> => {
    const res = await axiosInstance.post('/message-requests/start', { targetUserId });
    return res.data;
  },

  getPendingRequests: async (): Promise<MessageRequestDto[]> => {
    const res = await axiosInstance.get('/message-requests');
    return res.data;
  },

  respondRequest: async (roomId: string, accept: boolean): Promise<{ message: string; data?: any }> => {
    const res = await axiosInstance.post('/message-requests/respond', { roomId, accept });
    return res.data;
  },
};