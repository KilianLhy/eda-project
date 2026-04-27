import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { RealtimeBroadcasterPort } from './realtime-broadcaster.port';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TaskRealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, RealtimeBroadcasterPort
{
  @WebSocketServer()
  server!: Server;

  handleConnection(_client: Socket): void {}

  handleDisconnect(_client: Socket): void {}

  @SubscribeMessage('project.join')
  handleProjectJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ): void {
    client.join(this.roomName(data.projectId));
  }

  @SubscribeMessage('project.leave')
  handleProjectLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ): void {
    client.leave(this.roomName(data.projectId));
  }

  broadcastToProject(
    projectId: string,
    eventName: string,
    payload: unknown,
  ): void {
    if (!this.server) {
      return;
    }

    this.server.to(this.roomName(projectId)).emit(eventName, payload);
  }

  private roomName(projectId: string): string {
    return `project:${projectId}`;
  }
}
