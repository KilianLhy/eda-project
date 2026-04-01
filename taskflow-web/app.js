const workspaceId = "demo-workspace";
const actorId = "mso";
const baseUrl = "";

let activeViewId = "";

const tasksEl = document.getElementById("tasks");
const timelineEl = document.getElementById("timeline");
const auditEl = document.getElementById("audit");
const viewPickerEl = document.getElementById("view-picker");

function renderList(element, rows, rowRenderer) {
  element.innerHTML = "";
  if (rows.length === 0) {
    element.innerHTML = "<li>No data yet.</li>";
    return;
  }
  rows.forEach((row) => {
    const li = document.createElement("li");
    li.innerHTML = rowRenderer(row);
    element.appendChild(li);
  });
}

async function api(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.message ?? "Request failed");
  }
  return response.json();
}

async function loadTasks() {
  const query = activeViewId ? `?viewId=${activeViewId}` : "";
  const tasks = await api(`/workspaces/${workspaceId}/tasks${query}`);
  renderList(
    tasksEl,
    tasks,
    (task) =>
      `<strong>${task.title}</strong><br>${task.status}<br><span class="muted">assignee: ${
        task.assigneeId ?? "-"
      }</span>`
  );
}

async function loadTimeline() {
  const timeline = await api(`/workspaces/${workspaceId}/timeline?limit=15`);
  renderList(
    timelineEl,
    timeline,
    (event) =>
      `<strong>${event.text}</strong><br><span class="muted">${event.timestamp} by ${event.actorId}</span>`
  );
}

async function loadAudit() {
  const entries = await api(`/workspaces/${workspaceId}/audit?limit=15`);
  renderList(
    auditEl,
    entries,
    (entry) =>
      `<strong>${entry.eventType}</strong> (task ${entry.taskId})<br><span class="muted">${entry.timestamp} by ${entry.actorId}</span>`
  );
}

async function loadViews() {
  const views = await api(`/workspaces/${workspaceId}/views`);
  viewPickerEl.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "Select a saved view";
  viewPickerEl.appendChild(empty);
  views.forEach((view) => {
    const option = document.createElement("option");
    option.value = view.id;
    option.textContent = `${view.name} (${JSON.stringify(view.filters)})`;
    viewPickerEl.appendChild(option);
  });
}

async function refreshAll() {
  await Promise.all([loadTasks(), loadTimeline(), loadAudit(), loadViews()]);
}

document.getElementById("task-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = document.getElementById("task-title").value.trim();
  const assigneeId = document.getElementById("task-assignee").value.trim();
  await api(`/workspaces/${workspaceId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      assigneeId: assigneeId || null,
      actorId
    })
  });
  event.target.reset();
  await refreshAll();
});

document.getElementById("view-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("view-name").value.trim();
  const status = document.getElementById("view-status").value;
  const assigneeId = document.getElementById("view-assignee").value.trim();
  await api(`/workspaces/${workspaceId}/views`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      createdBy: actorId,
      filters: {
        status: status || undefined,
        assigneeId: assigneeId || undefined
      }
    })
  });
  event.target.reset();
  await loadViews();
});

document.getElementById("apply-view").addEventListener("click", async () => {
  activeViewId = viewPickerEl.value;
  await loadTasks();
});

document.getElementById("clear-view").addEventListener("click", async () => {
  activeViewId = "";
  viewPickerEl.value = "";
  await loadTasks();
});

refreshAll().catch((error) => {
  console.error(error);
});
