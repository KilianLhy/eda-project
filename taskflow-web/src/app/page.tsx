"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TaskStatus = "todo" | "in-progress" | "done";

type Task = {
  id: string;
  title: string;
  statusValue: TaskStatus;
  projectId: string;
  assigneeId: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const DEMO_PROJECT_NAME = "Phase 1 Demo";

const nextStatus: Record<TaskStatus, TaskStatus> = {
  todo: "in-progress",
  "in-progress": "done",
  done: "in-progress",
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const loadTasks = useCallback(async (targetProjectId: string) => {
    const response = await fetch(`${API_URL}/tasks?projectId=${targetProjectId}`);
    const data = (await response.json()) as Task[];
    console.log(`Loaded ${data.length} tasks for project ${targetProjectId}:`, data);
    setTasks(data);
  }, []);

  const ensureProjectThenLoad = useCallback(async () => {
    try {
      const projectsRes = await fetch(`${API_URL}/projects`);
      const projects = (await projectsRes.json()) as Array<{ id: string; name: string }>;
      console.log("Available projects:", projects);
      const existingProject = projects.find((project) => project.name === DEMO_PROJECT_NAME);

      if (existingProject) {
        console.log("Found existing project", existingProject.id);
        setProjectId(existingProject.id);
        await loadTasks(existingProject.id);
        return;
      }

      console.log("Creating new project", DEMO_PROJECT_NAME);
      const createdResponse = await fetch(`${API_URL}/projects`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-user-id": "frontend-demo",
          },
          body: JSON.stringify({ name: DEMO_PROJECT_NAME }),
        });

      const createdProject = (await createdResponse.json()) as { id: string };
      console.log("Created project", createdProject.id);
      setProjectId(createdProject.id);
      await loadTasks(createdProject.id);
    } catch (err) {
      console.error("Init error:", err);
      setError("Impossible de contacter l'API. Verifie taskflow-api sur localhost:3000.");
    }
  }, [loadTasks]);

  const initializeRef = useRef(false);

  useEffect(() => {
    if (initializeRef.current) {
      return;
    }

    initializeRef.current = true;

    (async () => {
      void ensureProjectThenLoad();
    })();
  }, []);

  async function createTask() {
    if (!title.trim() || !projectId) {
      console.warn("Cannot create task: missing title or projectId", { title, projectId });
      return;
    }

    console.log("Creating task:", { projectId, title });

    const response = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-id": "frontend-demo",
      },
      body: JSON.stringify({
        projectId,
        title,
      }),
    });

    const created = await response.json();
    console.log("Task created response:", created);

    setTitle("");
    await loadTasks(projectId);
  }

  async function moveTask(task: Task) {
    await fetch(`${API_URL}/tasks/${task.id}/move`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-user-id": "frontend-demo",
      },
      body: JSON.stringify({
        status: nextStatus[task.statusValue],
      }),
    });

    if (projectId) {
      await loadTasks(projectId);
    }
  }

  const columns = useMemo(
    () => [
      { key: "todo" as const, label: "Todo", color: "var(--todo)" },
      { key: "in-progress" as const, label: "In Progress", color: "var(--progress)" },
      { key: "done" as const, label: "Done", color: "var(--done)" },
    ],
    [],
  );

  return (
    <main>
      <section style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>TaskFlow - Phase 1</h1>
        <p style={{ opacity: 0.8, marginBottom: "1rem" }}>
          Vue Kanban minimale avec creation et transition des taches.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nouvelle tache"
            style={{
              flex: "1 1 280px",
              padding: "0.7rem 0.8rem",
              border: "1px solid var(--line)",
              borderRadius: "0.65rem",
              background: "var(--card)",
            }}
          />
          <button
            onClick={createTask}
            style={{
              border: "1px solid transparent",
              borderRadius: "0.65rem",
              padding: "0.7rem 1rem",
              background: "var(--accent)",
              color: "white",
              cursor: "pointer",
            }}
          >
            Creer une tache
          </button>
        </div>
      </section>

      {error ? (
        <p style={{ color: "#932b2b", marginBottom: "1rem" }}>{error}</p>
      ) : null}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem",
        }}
      >
        {columns.map((column) => (
          <article
            key={column.key}
            style={{
              background: column.color,
              border: "1px solid var(--line)",
              borderRadius: "0.9rem",
              padding: "0.85rem",
              minHeight: "320px",
            }}
          >
            <h2 style={{ marginBottom: "0.8rem", fontSize: "1.1rem" }}>{column.label}</h2>
            <div style={{ display: "grid", gap: "0.65rem" }}>
              {tasks
                .filter((task) => task.statusValue === column.key)
                .map((task) => (
                  <div
                    key={task.id}
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--line)",
                      borderRadius: "0.6rem",
                      padding: "0.7rem",
                      display: "grid",
                      gap: "0.55rem",
                    }}
                  >
                    <strong>{task.title}</strong>
                    <button
                      onClick={() => moveTask(task)}
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: "0.5rem",
                        padding: "0.45rem 0.6rem",
                        background: "#fff",
                        cursor: "pointer",
                        justifySelf: "start",
                      }}
                    >
                      Deplacer vers {nextStatus[task.statusValue]}
                    </button>
                  </div>
                ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
