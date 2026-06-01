import { useEffect, useRef } from 'react';
import * as signalR          from '@microsoft/signalr';
import { useChatStore }      from '../store/chatStore';
import type { Message, ChatRoom } from '../types/chat.types';

export function useSignalR() {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7283/Services/Shared/chat', {
        // ← must match app.MapHub<ChatHub>("/Services/Shared/chat")
        accessTokenFactory: () => localStorage.getItem('accessToken') ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // ── New message ────────────────────────────────────
    connection.on('NewMessage', (data: any) => {
      const message: Message = {
        id         : data.messageId ?? data.id,
        roomId     : data.roomId,
        senderId   : data.senderId,
        senderName : data.senderName,
        avatarUrl  : data.avatarUrl  ?? null,
        content    : data.content,
        messageType: data.messageType ?? 'text',
        fileUrl    : data.fileUrl    ?? null,
        isDeleted  : false,
        sentAt     : data.sentAt,
        isRead     : false,
        readBy     : []
      };
      useChatStore.getState().addMessage(message);
    });

    // ── Message read ───────────────────────────────────
    connection.on('MessageRead', (data: {
      roomId: string; messageId: string; userId: string;
    }) => {
      useChatStore.getState().markRoomAsRead(data.roomId, data.userId);
    });

    // ── Typing indicator ───────────────────────────────
    connection.on('UserTyping', (data: {
      roomId: string; userId: string; userName: string; isTyping: boolean;
    }) => {
      const { setTyping, clearTyping } = useChatStore.getState();
      if (data.isTyping) {
        setTyping({ roomId: data.roomId, userId: data.userId, userName: data.userName });
        setTimeout(() => clearTyping(data.roomId, data.userId), 3000);
      } else {
        clearTyping(data.roomId, data.userId);
      }
    });

    // ── New room ───────────────────────────────────────
    connection.on('NewRoom', (room: ChatRoom) => {
      useChatStore.getState().addRoom(room);
    });

    // ── Online status ──────────────────────────────────
    connection.on('UserOnline', (data: { userId: string; isOnline: boolean }) => {
      const { rooms, setRooms } = useChatStore.getState();
      const updated = rooms.map(room => ({
        ...room,
        members: room.members.map(m =>
          m.userId === data.userId
            ? { ...m, isOnline: data.isOnline }
            : m
        )
      }));
      setRooms(updated);
    });

    // ── Connection state changes ───────────────────────
    connection.onreconnecting(() =>
      console.log('🔄 SignalR reconnecting...'));

    connection.onreconnected(() =>
      console.log('✅ SignalR reconnected'));

    connection.onclose(() =>
      console.log('❌ SignalR connection closed'));

    // Start
    connection.start()
      .then(() => console.log('✅ SignalR connected'))
      .catch(err => console.error('❌ SignalR error:', err));

    connectionRef.current = connection;

    return () => { connection.stop(); };
  }, []);

  const joinRoom = async (roomId: string) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected)
      await connectionRef.current.invoke('JoinRoom', roomId);
  };

  const sendTyping = async (roomId: string, isTyping: boolean) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected)
      await connectionRef.current.invoke('SendTyping', roomId, isTyping);
  };

  return { joinRoom, sendTyping };
}