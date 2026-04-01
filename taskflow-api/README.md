# TaskFlow API (Prototype)

This minimal API implements:

- Audit trail on domain events (`task.created`, `task.moved`)
- Activity timeline feed
- Saved filtered views for task listing

## Run

```bash
cd taskflow-api
npm install
npm start
```

Server starts on `http://localhost:3001`.

## Quick demo (workspace: `demo-workspace`)

List tasks:

```bash
curl http://localhost:3001/workspaces/demo-workspace/tasks
```

Create a task:

```bash
curl -X POST http://localhost:3001/workspaces/demo-workspace/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Write ADR for timeline","assigneeId":"u3","actorId":"mso"}'
```

Move task:

```bash
curl -X PATCH http://localhost:3001/workspaces/demo-workspace/tasks/<TASK_ID>/status \
  -H "Content-Type: application/json" \
  -d '{"status":"In Progress","actorId":"mso"}'
```

Read activity timeline:

```bash
curl http://localhost:3001/workspaces/demo-workspace/timeline
```

Read audit trail:

```bash
curl http://localhost:3001/workspaces/demo-workspace/audit
```

Create a saved filtered view:

```bash
curl -X POST http://localhost:3001/workspaces/demo-workspace/views \
  -H "Content-Type: application/json" \
  -d '{"name":"My TODO tasks","createdBy":"mso","filters":{"status":"Todo","assigneeId":"u1"}}'
```

List saved views:

```bash
curl http://localhost:3001/workspaces/demo-workspace/views
```

Apply a saved view:

```bash
curl "http://localhost:3001/workspaces/demo-workspace/tasks?viewId=<VIEW_ID>"
```
