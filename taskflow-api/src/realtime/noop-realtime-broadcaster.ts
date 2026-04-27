import { Injectable } from '@nestjs/common';
import { RealtimeBroadcasterPort } from './realtime-broadcaster.port';

@Injectable()
export class NoopRealtimeBroadcaster implements RealtimeBroadcasterPort {
  broadcastToProject(
    _projectId: string,
    _eventName: string,
    _payload: unknown,
  ): void {
    // Intentionally empty for CLI/background contexts.
  }
}
