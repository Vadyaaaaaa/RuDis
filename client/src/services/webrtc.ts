// WebRTC сервис для голосовых звонков
export class WebRTCService {
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private socket: any;
  private currentChannelId: string | null = null;

  constructor(socket: any) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    // Получение предложения от другого пользователя
    this.socket.on('call-offer', async (data: { from: string; offer: RTCSessionDescriptionInit; channelId: string }) => {
      await this.handleOffer(data.from, data.offer, data.channelId);
    });

    // Получение ответа на предложение
    this.socket.on('call-answer', async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      await this.handleAnswer(data.from, data.answer);
    });

    // Получение ICE кандидата
    this.socket.on('ice-candidate', async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      await this.handleIceCandidate(data.from, data.candidate);
    });

    // Пользователь присоединился к звонку
    this.socket.on('user-joined-call', (data: { userId: string; username: string }) => {
      console.log('Пользователь присоединился:', data.username);
    });

    // Пользователь покинул звонок
    this.socket.on('user-left-call', (data: { userId: string }) => {
      this.handleUserLeft(data.userId);
    });
  }

  async startCall(channelId: string): Promise<void> {
    try {
      this.currentChannelId = channelId;
      
      // Получаем доступ к микрофону
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // Уведомляем сервер о начале звонка
      this.socket.emit('start-call', { channelId });

      // Создаем предложение для других пользователей
      const usersInCall = await this.getUsersInCall(channelId);
      const currentUserId = (this.socket as any).userId || (this.socket as any).id;
      
      for (const userId of usersInCall) {
        if (userId !== currentUserId) {
          await this.createOffer(userId, channelId);
        }
      }
    } catch (error) {
      console.error('Ошибка начала звонка:', error);
      throw error;
    }
  }

  async joinCall(channelId: string): Promise<void> {
    try {
      this.currentChannelId = channelId;
      
      // Получаем доступ к микрофону
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // Уведомляем сервер о присоединении к звонку
      this.socket.emit('join-call', { channelId });
    } catch (error) {
      console.error('Ошибка присоединения к звонку:', error);
      throw error;
    }
  }

  async endCall(): Promise<void> {
    // Закрываем все соединения
    this.peerConnections.forEach((pc) => {
      pc.close();
    });
    this.peerConnections.clear();
    this.remoteStreams.clear();

    // Останавливаем локальный поток
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Уведомляем сервер
    if (this.currentChannelId) {
      this.socket.emit('leave-call', { channelId: this.currentChannelId });
      this.currentChannelId = null;
    }
  }

  toggleMute(): boolean {
    if (!this.localStream) return false;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  isMuted(): boolean {
    if (!this.localStream) return true;
    const audioTrack = this.localStream.getAudioTracks()[0];
    return !audioTrack?.enabled;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStreams(): Map<string, MediaStream> {
    return this.remoteStreams;
  }

  private async createOffer(userId: string, channelId: string): Promise<void> {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Добавляем локальный поток
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Обработка удаленного потока
    pc.ontrack = (event) => {
      this.remoteStreams.set(userId, event.streams[0]);
    };

    // Обработка ICE кандидатов
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          to: userId,
          candidate: event.candidate,
          channelId,
        });
      }
    };

    this.peerConnections.set(userId, pc);

    // Создаем предложение
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Отправляем предложение
    this.socket.emit('call-offer', {
      to: userId,
      offer: pc.localDescription,
      channelId,
    });
  }

  private async handleOffer(
    from: string,
    offer: RTCSessionDescriptionInit,
    channelId: string
  ): Promise<void> {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Добавляем локальный поток
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Обработка удаленного потока
    pc.ontrack = (event) => {
      this.remoteStreams.set(from, event.streams[0]);
    };

    // Обработка ICE кандидатов
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          to: from,
          candidate: event.candidate,
          channelId,
        });
      }
    };

    this.peerConnections.set(from, pc);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Отправляем ответ
    this.socket.emit('call-answer', {
      to: from,
      answer: pc.localDescription,
      channelId,
    });
  }

  private async handleAnswer(from: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(from);
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  private async handleIceCandidate(from: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnections.get(from);
    if (!pc) return;

    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  private handleUserLeft(userId: string): void {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }
    this.remoteStreams.delete(userId);
  }

  private async getUsersInCall(channelId: string): Promise<string[]> {
    return new Promise((resolve) => {
      this.socket.emit('get-call-users', channelId, (users: string[]) => {
        resolve(users);
      });
    });
  }
}

