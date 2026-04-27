export const REALTIME_BROADCASTER = Symbol('REALTIME_BROADCASTER');

export interface RealtimeBroadcasterPort {
  broadcastToProject(
    projectId: string,
    eventName: string,
    payload: unknown,
  ): void;
}
