import { Test, TestingModule } from '@nestjs/testing';
import { TaskNotificationHandler } from './task-notification.handler';
import { EVENT_BUS } from '../shared/domain/event-bus.port';
import { PrismaService } from '../shared/infrastructure/prisma.service';
import { PROJECT_REPOSITORY } from '../project/domain/project.repository';
import {
  EMAIL_NOTIFICATION_CHANNEL,
  IN_APP_NOTIFICATION_CHANNEL,
} from './notification.tokens';
import { DomainEvent } from '../shared/domain/domain-event';
import { Project } from '../project/domain/project.entity';

describe('TaskNotificationHandler', () => {
  let handler: TaskNotificationHandler;
  let eventBus: any;
  let prisma: any;
  let projectRepository: any;
  let emailChannel: any;
  let inAppChannel: any;

  beforeEach(async () => {
    const mockEventBus = { subscribe: jest.fn() };
    const mockPrisma = {
      notificationPreference: {
        findUnique: jest.fn().mockResolvedValue({
          userId: 'user-1',
          emailEnabled: true,
          inAppEnabled: true,
        }),
      },
    };
    const mockProjectRepository = {
      findById: jest.fn(),
    };
    const mockEmailChannel = {
      channelName: 'email' as const,
      send: jest.fn().mockResolvedValue(undefined),
    };
    const mockInAppChannel = {
      channelName: 'in-app' as const,
      send: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskNotificationHandler,
        { provide: EVENT_BUS, useValue: mockEventBus },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PROJECT_REPOSITORY, useValue: mockProjectRepository },
        { provide: EMAIL_NOTIFICATION_CHANNEL, useValue: mockEmailChannel },
        { provide: IN_APP_NOTIFICATION_CHANNEL, useValue: mockInAppChannel },
      ],
    }).compile();

    handler = module.get<TaskNotificationHandler>(TaskNotificationHandler);
    eventBus = mockEventBus;
    prisma = mockPrisma;
    projectRepository = mockProjectRepository;
    emailChannel = mockEmailChannel;
    inAppChannel = mockInAppChannel;
  });

  describe('onModuleInit', () => {
    it('should skip in CLI environment', () => {
      process.env.NODE_ENV = 'cli';
      handler.onModuleInit();
      process.env.NODE_ENV = 'test';

      expect(eventBus.subscribe).not.toHaveBeenCalled();
    });

    it('should subscribe to task.assigned, task.moved and member.added events', () => {
      process.env.NODE_ENV = 'development';
      handler.onModuleInit();

      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'task.assigned',
        expect.any(Function),
      );
      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'task.moved',
        expect.any(Function),
      );
      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'member.added',
        expect.any(Function),
      );
    });
  });
});
