flowchart LR
    subgraph Frontend
      WEB[taskflow-web / Next.js]\nKanban page
    end

    subgraph API[taskflow-api / NestJS]
      PC[ProjectController]
      TC[TaskController]
      PS[ProjectService]
      TS[TaskService]
      PR[(ProjectRepository Port)]
      TR[(TaskRepository Port)]
      EB[(EventBus Port)]
      OPR[OrmProjectRepository\n(in-memory for phase 1)]
      OTR[OrmTaskRepository\n(in-memory for phase 1)]
      BUS[InMemoryEventBus]
      CH[ConsoleTaskEventHandler]
    end

    WEB -->|HTTP| PC
    WEB -->|HTTP| TC
    PC --> PS
    TC --> TS
    PS --> PR
    TS --> TR
    PS --> EB
    TS --> EB
    PR --> OPR
    TR --> OTR
    EB --> BUS
    BUS --> CH