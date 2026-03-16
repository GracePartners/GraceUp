import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*'
  }
})
export class RealtimeGateway {

  @WebSocketServer()
  server!: Server;

  handleConnection(socket: Socket) {
    console.log('Client connected:', socket.id);
  }

  handleDisconnect(socket: Socket) {
    console.log('Client disconnected:', socket.id);
  }

  @SubscribeMessage('joinWorkspace')
  joinWorkspace(
    @MessageBody() workspaceId: string,
    @ConnectedSocket() socket: Socket
  ) {
    socket.join(workspaceId);
    console.log(`Socket ${socket.id} joined workspace ${workspaceId}`);
  }

  @SubscribeMessage('leaveWorkspace')
  leaveWorkspace(
    @MessageBody() workspaceId: string,
    @ConnectedSocket() socket: Socket
  ) {
    socket.leave(workspaceId);
    console.log(`Socket ${socket.id} left workspace ${workspaceId}`);
  }

  @OnEvent('task.moved')
  handleTaskMoved(data: any) {
    const { workspaceId } = data;
    this.server.to(workspaceId).emit('taskMoved', data);
  }

}