import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogHandler } from './audit-log.handler';
import { EVENT_BUS } from '../shared/domain/event-bus.port';
import { PrismaService } from '../shared/infrastructure/prisma.service';
import { DomainEvent } from '../shared/domain/domain-event';

describe('AuditLogHandler', () => {
  let handler: AuditLogHandler;
  let eventBus: any;
  let prisma: any;

  beforeEach(async () => {
    const mockEventBus = { subscribe: jest.fn() };
    const mockPrisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogHandler,
        { provide: EVENT_BUS, useValue: mockEventBus },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    handler = module.get<AuditLogHandler>(AuditLogHandler);
    eventBus = mockEventBus;
    prisma = mockPrisma;
  });

  describe('onModuleInit', () => {
    it('should skip in CLI environment', () => {
      process.env.NODE_ENV = 'cli';
      handler.onModuleInit();
      process.env.NODE_ENV = 'test';

      expect(eventBus.subscribe).not.toHaveBeenCalled();
    });

    it('should subscribe to all tracked events', () => {
      process.env.NODE_ENV = 'development';
      handler.onModuleInit();

      const eventNames = [
        'project.created',
        'member.added',
        'task.created',
        'task.moved',
        'task.assigned',
      ];

      eventNames.forEach((eventName) => {
        expect(eventBus.subscribe).toHaveBeenCalledWith(
          eventName,
          expect.any(Function),
        );
      });
    });
  });

  describe('persist', () => {
    it('should persist task.created event to database', async () => {
      const event: DomainEvent = {
        name: 'task.created',
        payload: {
          taskId: 'task-1',
          projectId: 'proj-1',
        },
        occurredAt: new Date().toISOString(),
      };

      process.env.NODE_ENV = 'development';
      handler.onModuleInit();

      const callback = eventBus.subscribe.mock.calls.find(
        (call: any[]) => call[0] === 'task.created',
      )[1];
      await callback(event);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'Task',
          entityId: 'task-1',
          occurredAt: expect.any(Date),
          payload: expect.any(Object),
        }),
      });
    });

    it('should persist task.moved event with from/to status', async () => {
      const event: DomainEvent = {
        name: 'task.moved',
        payload: {
          taskId: 'task-1',
          projectId: 'proj-1',
          from: 'todo',
          to: 'in-progress',
        },
        occurredAt: new Date().toISOString(),
      };

      process.env.NODE_ENV = 'development';
      handler.onModuleInit();

      const callback = eventBus.subscribe.mock.calls.find(
        (call: any[]) => call[0] === 'task.moved',
      )[1];
      await callback(event);

      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });
});
