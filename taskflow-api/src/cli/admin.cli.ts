import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ProjectService } from '../project/application/project.service';
import { TaskService } from '../task/application/task.service';

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const projectService = app.get(ProjectService);
  const taskService = app.get(TaskService);

  const [command, ...args] = process.argv.slice(2);

  try {
    if (command === 'create-project') {
      const [name] = args;
      if (!name) {
        throw new Error('Usage: admin:cli create-project "Project Name"');
      }

      const project = await projectService.createProject(name, 'cli-admin');
      console.log(JSON.stringify(project, null, 2));
      return;
    }

    if (command === 'create-task') {
      const [projectId, title] = args;
      if (!projectId || !title) {
        throw new Error(
          'Usage: admin:cli create-task <projectId> "Task title"',
        );
      }

      const task = await taskService.createTask({
        projectId,
        title,
        actorId: 'cli-admin',
      });

      console.log(JSON.stringify(task, null, 2));
      return;
    }

    if (command === 'seed-demo') {
      const [projectNameArg] = args;
      const projectName = projectNameArg || 'CLI Demo Project';
      const project = await projectService.createProject(
        projectName,
        'cli-admin',
      );

      const todo = await taskService.createTask({
        projectId: project.id,
        title: 'Backlog refinement',
        actorId: 'cli-admin',
      });
      const inProgress = await taskService.createTask({
        projectId: project.id,
        title: 'Implement JWT auth',
        actorId: 'cli-admin',
      });
      await taskService.moveTask(inProgress.id, 'in-progress', 'cli-admin');

      const done = await taskService.createTask({
        projectId: project.id,
        title: 'Setup Docker compose',
        actorId: 'cli-admin',
      });
      await taskService.moveTask(done.id, 'in-progress', 'cli-admin');
      await taskService.moveTask(done.id, 'done', 'cli-admin');

      console.log(
        JSON.stringify(
          {
            project,
            tasks: [todo, inProgress, done],
          },
          null,
          2,
        ),
      );
      return;
    }

    console.log('Commands: create-project, create-task, seed-demo');
  } finally {
    await app.close();
  }
}

void run();
