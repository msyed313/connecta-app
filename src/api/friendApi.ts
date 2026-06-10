import axiosInstance from './axiosInstance';
import type { FriendRequestDto, FriendDto } from '../types/chat.types';

export const friendApi = {
  getFriends: async (): Promise<FriendDto[]> => {
    const res = await axiosInstance.get('/friends');
    return res.data;
  },

  getPendingRequests: async (): Promise<FriendRequestDto[]> => {
    const res = await axiosInstance.get('/friends/requests');
    return res.data;
  },

  getStatus: async (userId: string): Promise<{ status: string }> => {
    const res = await axiosInstance.get(`/friends/status/${userId}`);
    return res.data;
  },

  sendRequest: async (receiverId: string): Promise<{ message: string }> => {
    const res = await axiosInstance.post('/friends/request', { receiverId });
    return res.data;
  },

  respondRequest: async (requestId: number, accept: boolean): Promise<{ message: string; data?: FriendDto }> => {
    const res = await axiosInstance.post('/friends/respond', { requestId, accept });
    return res.data;
  },

  blockUser: async (targetId: string): Promise<{ message: string }> => {
    const res = await axiosInstance.post(`/friends/block/${targetId}`);
    return res.data;
  },

  unblockUser: async (targetId: string): Promise<{ message: string }> => {
    const res = await axiosInstance.post(`/friends/unblock/${targetId}`);
    return res.data;
  },
};