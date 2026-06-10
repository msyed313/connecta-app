import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useChatStore } from '../store/chatStore';
import type { Message, ChatRoom } from '../types/chat.types';
import toast from 'react-hot-toast';

export function useSignalR() {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7283/Services/Shared/chat', {
        accessTokenFactory: () => localStorage.getItem('accessToken') ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // ── New message ────────────────────────────────────
    connection.on('NewMessage', (data: any) => {
      const messageId = data.messageId ?? data.id;
      
      // Prevent duplicate message processing
      if (processedMessageIds.current.has(messageId)) {
        return;
      }
      processedMessageIds.current.add(messageId);

      const message: Message = {
        id: messageId,
        roomId: data.roomId,
        senderId: data.senderId,
        senderName: data.senderName,
        avatarUrl: data.avatarUrl ?? null,
        content: data.content,
        messageType: data.messageType ?? 'text',
        fileUrl: data.fileUrl ?? null,
        isDeleted: false,
        sentAt: data.sentAt,
        isRead: false,
        readBy: []
      };

      const store = useChatStore.getState();
      
      // Only increment unread if NOT in active room
      if (store.activeRoomId !== data.roomId) {
        store.addMessage(message);
        toast(`💬 New message from ${data.senderName}`, {
          duration: 3000,
          style: {
            background: '#1a1a26',
            color: '#e8e8f0',
            border: '1px solid rgba(108,99,255,0.3)',
            borderRadius: '12px',
            fontSize: '13px',
          }
        });
      } else {
        // In active room — add message but don't increment unread
        const { messages } = store;
        store.setMessages(data.roomId, [
          ...(messages[data.roomId] || []),
          message
        ]);
      }
    });

    // ── Message read ───────────────────────────────────
    connection.on('MessageRead', (data: { roomId: string; messageId: string; userId: string }) => {
      const store = useChatStore.getState();
      
      // Update messages to mark as read
      const messages = store.messages[data.roomId] || [];
      const updatedMessages = messages.map(m =>
        m.id === data.messageId ? { ...m, isRead: true } : m
      );
      store.setMessages(data.roomId, updatedMessages);

      // Don't reset unread count here — let the read receipt do it
    });

    // ── Typing indicator ───────────────────────────────
    connection.on('UserTyping', (data: { roomId: string; userId: string; userName: string; isTyping: boolean }) => {
      const { setTyping, clearTyping } = useChatStore.getState();
      if (data.isTyping) {
        setTyping({ roomId: data.roomId, userId: data.userId, userName: data.userName });
        setTimeout(() => clearTyping(data.roomId, data.userId), 3000);
      } else {
        clearTyping(data.roomId, data.userId);
      }
    });

    // ── New room ────────────────────────────────────────
    connection.on('NewRoom', (room: ChatRoom) => {
      useChatStore.getState().addRoom(room);
    });

    // ── Online status ───────────────────────────────────
    connection.on('UserOnline', (data: { userId: string; isOnline: boolean }) => {
      const { rooms, setRooms } = useChatStore.getState();
      const updated = rooms.map(room => ({
        ...room,
        members: room.members.map(m =>
          m.userId === data.userId ? { ...m, isOnline: data.isOnline } : m
        )
      }));
      setRooms(updated);
    });

    // ── Group invitation ────────────────────────────────
    connection.on('GroupInvitation', (invitation: any) => {
      window.dispatchEvent(new CustomEvent('newGroupInvitation', { detail: invitation }));
      toast(`📩 Group invitation: ${invitation.groupName}`, {
        duration: 5000,
        style: {
          background: '#1a1a26',
          color: '#e8e8f0',
          border: '1px solid rgba(108,99,255,0.3)',
          borderRadius: '12px',
          fontSize: '13px',
        }
      });
    });

    // ── Group events ────────────────────────────────────
    connection.on('GroupEvent', (data: any) => {
      const { rooms, setRooms, activeRoomId, setActiveRoom, addRoom, updateRoom } = useChatStore.getState();

      switch (data.eventType) {
        case 'GroupCreated':
        case 'AddedToGroup':
        case 'MemberJoined':
          if (data.data) addRoom(data.data);
          break;

        case 'GroupUpdated':
          if (data.data) updateRoom(data.data);
          break;

        case 'MemberAdded':
          if (data.data) updateRoom(data.data);
          break;

        case 'MemberRemoved':
          const afterRemove = rooms.map(r =>
            r.id === data.roomId
              ? { ...r, members: r.members.filter(m => m.userId !== data.userId) }
              : r
          );
          setRooms(afterRemove);
          break;

        case 'RemovedFromGroup':
          const withoutRemoved = rooms.filter(r => r.id !== data.roomId);
          setRooms(withoutRemoved);
          if (activeRoomId === data.roomId) setActiveRoom(null);
          toast.error('You were removed from the group.');
          break;

        case 'MemberLeft':
          const afterLeft = rooms.map(r =>
            r.id === data.roomId
              ? { ...r, members: r.members.filter(m => m.userId !== data.userId) }
              : r
          );
          setRooms(afterLeft);
          break;

        case 'GroupDeleted':
          const withoutDeleted = rooms.filter(r => r.id !== data.roomId);
          setRooms(withoutDeleted);
          if (activeRoomId === data.roomId) setActiveRoom(null);
          toast.error('This group was deleted.');
          break;

        case 'AdminChanged':
          const withAdmin = rooms.map(r =>
            r.id === data.roomId
              ? {
                  ...r,
                  members: r.members.map(m =>
                    m.userId === data.userId
                      ? { ...m, isAdmin: data.data?.action === 'promoted' }
                      : m
                  )
                }
              : r
          );
          setRooms(withAdmin);
          break;

        case 'InvitationDeclined':
          toast(`❌ ${data.userName} declined the group invitation.`);
          break;
      }
    });

    // ── Friend request ──────────────────────────────────
    connection.on('FriendRequest', (data: any) => {
      window.dispatchEvent(new CustomEvent('newFriendRequest', { detail: data }));
      toast(`👥 ${data.senderName} sent you a friend request`, {
        duration: 5000,
        style: {
          background: '#1a1a26',
          color: '#e8e8f0',
          border: '1px solid rgba(108,99,255,0.3)',
          borderRadius: '12px',
          fontSize: '13px',
        }
      });
    });

    // ── Friend request accepted ─────────────────────────
    connection.on('FriendRequestAccepted', (data: any) => {
      toast(`✅ ${data.userName} accepted your friend request!`, {
        style: {
          background: '#1a1a26',
          color: '#e8e8f0',
          border: '1px solid rgba(76,175,80,0.3)',
          borderRadius: '12px',
          fontSize: '13px',
        }
      });
    });

    // ── Message request ─────────────────────────────────
    connection.on('MessageRequest', (data: any) => {
      window.dispatchEvent(new CustomEvent('newMessageRequest', { detail: data }));
      toast(`💬 ${data.senderName} wants to message you`, {
        duration: 5000,
        style: {
          background: '#1a1a26',
          color: '#e8e8f0',
          border: '1px solid rgba(251,146,60,0.3)',
          borderRadius: '12px',
          fontSize: '13px',
        }
      });
    });

    // ── Message request accepted ────────────────────────
    connection.on('MessageRequestAccepted', (data: any) => {
      if (data.data) {
        useChatStore.getState().addRoom(data.data);
      }
      toast(`✅ ${data.userName} accepted your message request!`);
    });

    connection.onreconnecting(() => console.log('🔄 SignalR reconnecting...'));
    connection.onreconnected(() => console.log('✅ SignalR reconnected'));
    connection.onclose(() => console.log('❌ SignalR connection closed'));

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