"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

type TaskStatus = "todo" | "in-progress" | "done";

type Task = {
  id: string;
  title: string;
  statusValue: TaskStatus;
  projectId: string;
  assigneeId: string | null;
};

type ProjectMember = {
  id: string;
  email: string;
};

type Project = {
  id: string;
  name: string;
};

type Notification = {
  id: string;
  type: "task.assigned" | "task.moved";
  message: string;
  timestamp: number;
  read: boolean;
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
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("demo@taskflow.local");
  const [password, setPassword] = useState("demo1234");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifyCenter, setShowNotifyCenter] = useState(false);
  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  const authorizedFetch = useCallback(
    async (url: string, options?: RequestInit) => {
      if (!token) {
        throw new Error("Missing token");
      }

      return fetch(url, {
        ...options,
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(options?.headers ?? {}),
        },
      });
    },
    [token],
  );

  const addNotification = useCallback((message: string, type: "task.assigned" | "task.moved") => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications((prev) => [notification, ...prev]);
    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notification.id)
      );
    }, 5000);
  }, []);

  const loadMembers = useCallback(async (targetProjectId: string) => {
    try {
      const response = await authorizedFetch(
        `${API_URL}/api/v1/projects/${targetProjectId}/members`,
      );
      if (response.ok) {
        const data = (await response.json()) as ProjectMember[];
        setMembers(data);
      }
    } catch {
      // Silently fail if endpoint not available yet
    }
  }, [authorizedFetch]);

  const loadTasks = useCallback(async (targetProjectId: string) => {
    const response = await authorizedFetch(
      `${API_URL}/api/v1/tasks?projectId=${targetProjectId}`,
    );
    const data = (await response.json()) as Task[];
    setTasks(data);
  }, [authorizedFetch]);

  const loadProjects = useCallback(async () => {
    try {
      if (!token) {
        return;
      }
      setLoadingProjects(true);
      const projectsRes = await authorizedFetch(`${API_URL}/api/v1/projects`);
      const projectsList = (await projectsRes.json()) as Project[];
      setProjects(projectsList);
      setError(null);
    } catch (err) {
      setError("Impossible de charger les projets.");
    } finally {
      setLoadingProjects(false);
    }
  }, [authorizedFetch, token]);

  const selectProject = async (id: string) => {
    setProjectId(id);
    await loadTasks(id);
    await loadMembers(id);
  };

  const createProject = async () => {
    if (!newProjectName.trim()) {
      setError("Entrez un nom pour le projet");
      return;
    }

    try {
      setCreatingProject(true);
      const response = await authorizedFetch(`${API_URL}/api/v1/projects`, {
        method: "POST",
        body: JSON.stringify({ name: newProjectName }),
      });

      if (!response.ok) {
        setError("Erreur lors de la création du projet");
        return;
      }

      const newProject = (await response.json()) as Project;
      setNewProjectName("");
      setError(null);
      
      // Reload projects and select the new one
      await loadProjects();
      await selectProject(newProject.id);
    } catch (err) {
      setError("Impossible de créer le projet");
    } finally {
      setCreatingProject(false);
    }
  };

  const authenticate = async () => {
    try {
      const endpoint = authMode === "login" ? "login" : "register";
      const response = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError("Echec d'authentification");
        return;
      }

      const data = (await response.json()) as {
        accessToken: string;
      };

      localStorage.setItem("taskflow.token", data.accessToken);
      setToken(data.accessToken);
      setError(null);
    } catch {
      setError("Impossible de contacter l'API.");
    }
  }

  const initializeRef = useRef(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("taskflow.token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (!token || initializeRef.current) {
      return;
    }

    initializeRef.current = true;
    void loadProjects();
  }, [token, loadProjects]);

  useEffect(() => {
    if (!token || !projectId) {
      return;
    }

    const socket = io(API_URL, {
      transports: ["websocket"],
    });

    socket.emit("project.join", { projectId });
    
    socket.on("task.moved", (data) => {
      void loadTasks(projectId);
      addNotification(`Tâche déplacée: "${data.taskTitle}" → ${data.newStatus}`, "task.moved");
    });

    socket.on("task.assigned", (data) => {
      void loadTasks(projectId);
      addNotification(`Vous avez été assigné à: "${data.taskTitle}"`, "task.assigned");
    });

    return () => {
      socket.emit("project.leave", { projectId });
      socket.disconnect();
    };
  }, [token, projectId, loadTasks, addNotification]);

  async function createTask() {
    if (!title.trim() || !projectId) {
      return;
    }

    const response = await authorizedFetch(`${API_URL}/api/v1/tasks`, {
      method: "POST",
      body: JSON.stringify({
        projectId,
        title,
      }),
    });

    if (!response.ok) {
      setError("Creation de tache impossible");
      return;
    }

    setTitle("");
    await loadTasks(projectId);
  }

  async function moveTask(task: Task) {
    await authorizedFetch(`${API_URL}/api/v1/tasks/${task.id}/move`, {
      method: "PATCH",
      body: JSON.stringify({
        status: nextStatus[task.statusValue],
      }),
    });

    if (projectId) {
      await loadTasks(projectId);
    }
  }

  async function assignTask(taskId: string, assigneeId: string) {
    try {
      const response = await authorizedFetch(`${API_URL}/api/v1/tasks/${taskId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ assigneeId }),
      });

      if (response.ok && projectId) {
        setSelectedTaskForAssign(null);
        await loadTasks(projectId);
      } else {
        setError("Impossible d'assigner la tâche");
      }
    } catch {
      setError("Erreur lors de l'assignation");
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche?")) {
      return;
    }

    try {
      const response = await authorizedFetch(`${API_URL}/api/v1/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok && projectId) {
        await loadTasks(projectId);
      } else {
        setError("Impossible de supprimer la tâche");
      }
    } catch {
      setError("Erreur lors de la suppression");
    }
  }

  const columns = useMemo(
    () => [
      { key: "todo" as const, label: "À faire", icon: "" },
      { key: "in-progress" as const, label: "En cours", icon: "" },
      { key: "done" as const, label: "Terminé", icon: "" },
    ],
    [],
  );

  if (!token) {
    return (
      <main style={{ padding: "4rem 1rem", background: "#f5f7fa", minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <section style={{ maxWidth: "420px", margin: "0 auto", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "0.5rem", color: "#1a1a1a" }}>
              TaskFlow
            </h1>
            <p style={{ color: "#666", fontSize: "1rem" }}>Gestion de projets collaborative</p>
          </div>

          {error && (
            <div style={{ padding: "1rem", background: "#fee", border: "1px solid #fcc", borderRadius: "0.5rem", marginBottom: "1rem", color: "#c33" }}>
              {error}
            </div>
          )}

          <div style={{ background: "white", padding: "2rem", borderRadius: "0.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "grid", gap: "1rem", marginBottom: "1rem" }}>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Adresse email"
                style={{
                  padding: "0.75rem 1rem",
                  border: "1px solid #ddd",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                }}
              />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mot de passe"
                type="password"
                style={{
                  padding: "0.75rem 1rem",
                  border: "1px solid #ddd",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                }}
              />
            </div>

            <button
              onClick={authenticate}
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                background: "#0066cc",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                marginBottom: "0.75rem",
              }}
            >
              {authMode === "login" ? "Se connecter" : "S'inscrire"}
            </button>

            <button
              onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                background: "white",
                color: "#0066cc",
                border: "1px solid #0066cc",
                borderRadius: "0.5rem",
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              {authMode === "login" ? "Créer un compte" : "Retour à la connexion"}
            </button>

            <p style={{ fontSize: "0.85rem", color: "#999", marginTop: "1rem", textAlign: "center" }}>
              Démo: demo@taskflow.local / demo1234
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!projectId) {
    return (
      <main style={{ padding: "4rem 1rem", background: "#f5f7fa", minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <section style={{ maxWidth: "600px", margin: "0 auto", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "0.5rem", color: "#1a1a1a" }}>
              TaskFlow
            </h1>
            <p style={{ color: "#666", fontSize: "1rem" }}>Sélectionnez un projet</p>
          </div>

          {error && (
            <div style={{ padding: "1rem", background: "#fee", border: "1px solid #fcc", borderRadius: "0.5rem", marginBottom: "1rem", color: "#c33" }}>
              {error}
            </div>
          )}

          <div style={{ background: "white", padding: "2rem", borderRadius: "0.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            {loadingProjects ? (
              <p style={{ color: "#666", textAlign: "center" }}>Chargement des projets...</p>
            ) : projects.length > 0 ? (
              <div style={{ display: "grid", gap: "1rem" }}>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => void selectProject(project.id)}
                    style={{
                      padding: "1rem",
                      background: "white",
                      border: "1px solid #ddd",
                      borderRadius: "0.5rem",
                      fontSize: "1rem",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f9f9f9";
                      e.currentTarget.style.borderColor = "#0066cc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = "#ddd";
                    }}
                  >
                    <div style={{ fontWeight: "600", color: "#1a1a1a" }}>{project.name}</div>
                    <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }}>ID: {project.id}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#666", marginBottom: "1.5rem" }}>Aucun projet disponible</p>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Nom du nouveau projet"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void createProject();
                      }
                    }}
                    style={{
                      padding: "0.75rem 1rem",
                      border: "1px solid #ddd",
                      borderRadius: "0.5rem",
                      fontSize: "1rem",
                    }}
                  />
                  <button
                    onClick={() => void createProject()}
                    disabled={creatingProject}
                    style={{
                      padding: "0.75rem 1rem",
                      background: "#0066cc",
                      color: "white",
                      border: "none",
                      borderRadius: "0.5rem",
                      fontSize: "1rem",
                      fontWeight: "600",
                      cursor: creatingProject ? "not-allowed" : "pointer",
                      opacity: creatingProject ? 0.6 : 1,
                    }}
                  >
                    {creatingProject ? "Création en cours..." : "Créer un projet"}
                  </button>
                </div>
              </div>
            )}
            
            <button
              onClick={() => {
                localStorage.removeItem("taskflow.token");
                setToken(null);
                setProjectId(null);
                setProjects([]);
                setError(null);
              }}
              style={{
                marginTop: "2rem",
                width: "100%",
                padding: "0.75rem 1rem",
                background: "white",
                color: "#666",
                border: "1px solid #ddd",
                borderRadius: "0.5rem",
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              Se déconnecter
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem 1rem", background: "#f5f7fa", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2.2rem", fontWeight: "700", marginBottom: "0.3rem", color: "#1a1a1a" }}>
              TaskFlow
            </h1>
            <p style={{ color: "#666", fontSize: "0.95rem", marginBottom: "0.5rem" }}>
              Kanban collaboratif avec synchronisation temps réel
            </p>
            {members.length > 0 && (
              <div style={{ fontSize: "0.9rem", color: "#0066cc", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span>👥</span>
                <span>{members.length} membre{members.length > 1 ? "s" : ""} en ligne</span>
              </div>
            )}
          </div>

          {/* Top Right Actions */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <button
              onClick={() => setShowNotifyCenter(!showNotifyCenter)}
              style={{
                position: "relative",
                padding: "0.75rem 1rem",
                border: "1px solid #ddd",
                borderRadius: "0.5rem",
                background: "white",
                cursor: "pointer",
                fontSize: "1.3rem",
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Notifications
              {notifications.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    background: "#dc3545",
                    color: "white",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: "700",
                  }}
                >
                  {notifications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("taskflow.token");
                window.location.reload();
              }}
              style={{
                padding: "0.75rem 1rem",
                background: "#f5f5f5",
                color: "#1a1a1a",
                border: "1px solid #ddd",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: "500",
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Notification Center */}
        {showNotifyCenter && (
          <div
            style={{
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "0.75rem",
              padding: "1.5rem",
              marginBottom: "2rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "1rem", color: "#1a1a1a" }}>
              Centre de notifications
            </h3>
            {notifications.length === 0 ? (
              <p style={{ color: "#999", textAlign: "center", padding: "2rem 0" }}>
                Aucune notification pour le moment
              </p>
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: "1rem",
                      background: notif.type === "task.assigned" ? "#e3f2fd" : "#f0f0f0",
                      borderLeft: `4px solid ${notif.type === "task.assigned" ? "#2196F3" : "#666"}`,
                      borderRadius: "0.4rem",
                      fontSize: "0.95rem",
                    }}
                  >
                    <div style={{ fontWeight: "600", marginBottom: "0.3rem", color: "#1a1a1a" }}>
                      {notif.type === "task.assigned" ? "📌 Assignation" : "🔄 Déplacement"}
                    </div>
                    <div style={{ color: "#333", marginBottom: "0.3rem" }}>{notif.message}</div>
                    <div style={{ fontSize: "0.8rem", color: "#999" }}>
                      {new Date(notif.timestamp).toLocaleTimeString("fr-FR")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{ padding: "1rem", background: "#fee", border: "1px solid #fcc", borderRadius: "0.5rem", marginBottom: "1.5rem", color: "#c33" }}>
            {error}
          </div>
        )}

        {/* Create Task */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "0.75rem", marginBottom: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Créer une nouvelle tâche..."
              style={{
                flex: "1 1 280px",
                padding: "0.75rem 1rem",
                border: "1px solid #ddd",
                borderRadius: "0.5rem",
                fontSize: "1rem",
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") createTask();
              }}
            />
            <button
              onClick={createTask}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              ➕ Créer
            </button>
          </div>
        </div>

        {/* Toast Notifications */}
        {notifications.length > 0 && (
          <div style={{ position: "fixed", top: "2rem", right: "2rem", zIndex: 1000 }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  marginBottom: "1rem",
                  padding: "1rem 1.25rem",
                  borderRadius: "0.5rem",
                  color: "white",
                  background: notif.type === "task.assigned" ? "#28a745" : "#0066cc",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  maxWidth: "350px",
                  animation: "slideIn 0.3s ease",
                }}
              >
                <strong>{notif.type === "task.assigned" ? "📌" : "🔄"}</strong> {notif.message}
              </div>
            ))}
          </div>
        )}

        {/* Kanban Columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.statusValue === column.key);
            return (
              <div
                key={column.key}
                style={{
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "600px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <div style={{ padding: "1.5rem", background: "#f9f9f9", borderBottom: "1px solid #ddd" }}>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: "600", color: "#1a1a1a", margin: "0" }}>
                    {column.icon} {column.label}
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "#999", margin: "0.25rem 0 0 0" }}>
                    {columnTasks.length} tâche{columnTasks.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {columnTasks.length === 0 ? (
                    <div style={{ color: "#ccc", textAlign: "center", padding: "2rem 1rem", fontSize: "0.9rem" }}>
                      Aucune tâche
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const assignee = members.find((m) => m.id === task.assigneeId);
                      return (
                        <div
                          key={task.id}
                          style={{
                            background: "#fafafa",
                            border: "1px solid #e0e0e0",
                            borderRadius: "0.5rem",
                            padding: "1rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                          }}
                        >
                          <div>
                            <p style={{ fontWeight: "600", color: "#1a1a1a", margin: "0 0 0.5rem 0", fontSize: "0.95rem", lineHeight: "1.4" }}>
                              {task.title}
                            </p>
                            {assignee && (
                              <span style={{ fontSize: "0.8rem", color: "#0066cc", background: "#e3f2fd", padding: "0.25rem 0.5rem", borderRadius: "0.3rem", display: "inline-block" }}>
                                👤 {assignee.email.split("@")[0]}
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                            <button
                              onClick={() => moveTask(task)}
                              style={{
                                flex: 1,
                                minWidth: "80px",
                                padding: "0.5rem 0.75rem",
                                border: "1px solid #ddd",
                                background: "white",
                                borderRadius: "0.4rem",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                fontWeight: "500",
                                transition: "all 0.2s",
                              }}
                            >
                              Suivant
                            </button>

                            {members.length > 0 && (
                              <div style={{ position: "relative", flex: 1, minWidth: "80px" }}>
                                <button
                                  onClick={() =>
                                    setSelectedTaskForAssign(
                                      selectedTaskForAssign === task.id ? null : task.id,
                                    )
                                  }
                                  style={{
                                    width: "100%",
                                    padding: "0.5rem 0.75rem",
                                    border: "1px solid #ddd",
                                    background: assignee ? "#e3f2fd" : "white",
                                    borderRadius: "0.4rem",
                                    cursor: "pointer",
                                    fontSize: "0.85rem",
                                    fontWeight: "500",
                                    transition: "all 0.2s",
                                  }}
                                >
                                  👤 Assigner
                                </button>
                                {selectedTaskForAssign === task.id && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "100%",
                                      left: 0,
                                      right: 0,
                                      background: "white",
                                      border: "1px solid #ddd",
                                      borderRadius: "0.4rem",
                                      marginTop: "0.5rem",
                                      zIndex: 100,
                                      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                                    }}
                                  >
                                    {members.map((member) => (
                                      <button
                                        key={member.id}
                                        onClick={() => assignTask(task.id, member.id)}
                                        style={{
                                          display: "block",
                                          width: "100%",
                                          padding: "0.75rem",
                                          border: "none",
                                          background: task.assigneeId === member.id ? "#e3f2fd" : "transparent",
                                          textAlign: "left",
                                          cursor: "pointer",
                                          fontSize: "0.85rem",
                                          transition: "background 0.2s",
                                        }}
                                      >
                                        {task.assigneeId === member.id && "✓ "}
                                        {member.email}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            <button
                              onClick={() => deleteTask(task.id)}
                              style={{
                                padding: "0.5rem 0.75rem",
                                border: "1px solid #ddd",
                                background: "white",
                                borderRadius: "0.4rem",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                fontWeight: "500",
                                color: "#c33",
                                transition: "all 0.2s",
                              }}
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
