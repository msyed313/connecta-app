import axiosInstance from './axiosInstance';
import type { GroupDetail } from '../types/chat.types';

export const groupApi = {
  createGroup: async (data: {
    name       : string;
    description: string;
    memberIds  : string[];
  }): Promise<{ message: string; data: GroupDetail }> => {
    const res = await axiosInstance.post('/groups', data);
    return res.data;
  },

  getMyGroups: async (): Promise<GroupDetail[]> => {
    const res = await axiosInstance.get('/groups');
    return res.data;
  },

  getGroup: async (roomId: string): Promise<GroupDetail> => {
    const res = await axiosInstance.get(`/groups/${roomId}`);
    return res.data;
  },

  getInvitations: async () => {
    const res = await axiosInstance.get('/groups/invitations');
    return res.data;
  },

  respondInvitation: async (roomId: string, accept: boolean): Promise<{ message: string; data?: any }> => {
    const res = await axiosInstance.post('/groups/invitations/respond', { roomId, accept });
    return res.data;
  },

  updateGroup: async (roomId: string, data: {
    name?       : string;
    description?: string;
    avatarUrl?  : string;
  }): Promise<{ message: string; data: GroupDetail }> => {
    const res = await axiosInstance.put(`/groups/${roomId}`, data);
    return res.data;
  },

  addMembers: async (roomId: string, memberIds: string[]): Promise<{ message: string }> => {
    const res = await axiosInstance.post(`/groups/${roomId}/members`, { memberIds });
    return res.data;
  },

  removeMember: async (roomId: string, memberId: string): Promise<{ message: string }> => {
    const res = await axiosInstance.delete(`/groups/${roomId}/members/${memberId}`);
    return res.data;
  },

  leaveGroup: async (roomId: string): Promise<{ message: string }> => {
    const res = await axiosInstance.post(`/groups/${roomId}/leave`);
    return res.data;
  },

  makeAdmin: async (roomId: string, memberId: string): Promise<{ message: string }> => {
    const res = await axiosInstance.post(`/groups/${roomId}/admin/${memberId}`);
    return res.data;
  },

  removeAdmin: async (roomId: string, memberId: string): Promise<{ message: string }> => {
    const res = await axiosInstance.delete(`/groups/${roomId}/admin/${memberId}`);
    return res.data;
  },

  deleteGroup: async (roomId: string): Promise<{ message: string }> => {
    const res = await axiosInstance.delete(`/groups/${roomId}`);
    return res.data;
  },
};