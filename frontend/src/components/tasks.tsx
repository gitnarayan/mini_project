"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  ArrowLeft,
  ListTodo,
} from "lucide-react";
import {
  Task,
  errorMessage,
  useProjectQuery,
  useTasksQuery,
  useSaveTaskMutation,
  useDeleteTaskMutation,
} from "@/store/api";
import Modal from "./modal";
export default function Tasks({ projectId }: { projectId: string }) {
  const { data: project, error: projectError } = useProjectQuery(projectId);
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("dueDate:asc");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const query = new URLSearchParams({
    sortBy: sort.split(":")[0],
    order: sort.split(":")[1],
    ...(status ? { status } : {}),
    ...(dueFrom ? { dueFrom } : {}),
    ...(dueTo ? { dueTo } : {}),
  }).toString();
  const {
    data: tasks = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useTasksQuery({ id: projectId, query });
  const [save, saving] = useSaveTaskMutation();
  const [remove, deleting] = useDeleteTaskMutation();
  const [editing, setEditing] = useState<Task | "new" | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [message, setMessage] = useState("");
  if (projectError)
    return (
      <div className="empty">
        <p role="alert">{errorMessage(projectError)}</p>
        <Link href="/projects">Back to projects</Link>
      </div>
    );
  return (
    <>
      <Link className="back-link" href="/projects">
        <ArrowLeft size={16} />
        All projects
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">MAKE THE NEXT STEP COUNT</p>
          <h1>{project?.title || "Your project"}</h1>
          <p className="muted">
            {project?.description ||
              "Turn your plans into progress, one task at a time."}
          </p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setMessage("");
            setEditing("new");
          }}
        >
          <Plus size={18} />
          Add task
        </button>
      </div>
      <div className="task-panel">
        <div className="section-heading">
          <h2>
            Project tasks <span>{tasks.length}</span>
          </h2>
          <small className="muted" aria-live="polite">
            {isFetching ? "Updating…" : "Your next steps, in one place"}
          </small>
        </div>
        <div className="filters">
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </label>
          <label>
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="dueDate:asc">Due date · earliest</option>
              <option value="dueDate:desc">Due date · latest</option>
              <option value="status:asc">Status · to do first</option>
              <option value="status:desc">Status · done first</option>
            </select>
          </label>
          <label>
            Due from
            <input
              type="date"
              value={dueFrom}
              max={dueTo || undefined}
              onChange={(e) => setDueFrom(e.target.value)}
            />
          </label>
          <label>
            Due to
            <input
              type="date"
              value={dueTo}
              min={dueFrom || undefined}
              onChange={(e) => setDueTo(e.target.value)}
            />
          </label>
        </div>
        {!editing && !deletingTask && message && (
          <p role="alert" className="error">
            {message}
          </p>
        )}
        {isLoading ? (
          <div className="empty">Loading tasks…</div>
        ) : error ? (
          <div className="empty">
            <p className="error" role="alert">
              {errorMessage(error)}
            </p>
            <button onClick={refetch}>Retry</button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty">
            <ListTodo size={38} />
            <h3>
              {status || dueFrom || dueTo
                ? "No tasks match these filters"
                : "A fresh start for your project"}
            </h3>
            <p className="muted">
              {status || dueFrom || dueTo
                ? "Try changing the filters to see more tasks."
                : "Add your first task and take the next step."}
            </p>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((t) => (
              <article className="task-row" key={t._id}>
                <div className={`task-dot ${t.status}`} />
                <div className="task-copy">
                  <h3 className={t.status === "done" ? "completed" : ""}>
                    {t.title}
                  </h3>
                  <p>{t.description || "No description"}</p>
                </div>
                <select
                  aria-label={`Status for ${t.title}`}
                  className={`status-select ${t.status}`}
                  value={t.status}
                  disabled={saving.isLoading}
                  onChange={async (e) => {
                    setMessage("");
                    try {
                      await save({
                        projectId,
                        id: t._id,
                        body: { status: e.target.value as Task["status"] },
                      }).unwrap();
                    } catch (err) {
                      setMessage(errorMessage(err));
                    }
                  }}
                >
                  <option value="todo">To do</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Done</option>
                </select>
                <span className="task-date">
                  <CalendarDays size={15} />
                  {t.dueDate}
                </span>
                <div className="card-actions">
                  <button
                    className="icon-button"
                    aria-label={`Edit ${t.title}`}
                    onClick={() => {
                      setMessage("");
                      setEditing(t);
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Delete ${t.title}`}
                    onClick={() => {
                      setMessage("");
                      setDeletingTask(t);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {editing && (
        <Modal
          title={editing === "new" ? "Add a task" : "Edit task"}
          close={() => setEditing(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                await save({
                  projectId,
                  id: editing === "new" ? undefined : editing._id,
                  body: {
                    title: String(f.get("title")),
                    description: String(f.get("description")),
                    status: String(f.get("status")) as Task["status"],
                    dueDate: String(f.get("dueDate")),
                  },
                }).unwrap();
                setEditing(null);
              } catch (err) {
                setMessage(errorMessage(err));
              }
            }}
          >
            <label>
              Task title
              <input
                name="title"
                autoFocus
                required
                maxLength={120}
                defaultValue={editing === "new" ? "" : editing.title}
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                rows={3}
                maxLength={2000}
                defaultValue={editing === "new" ? "" : editing.description}
              />
            </label>
            <div className="form-columns">
              <label>
                Status
                <select
                  name="status"
                  defaultValue={editing === "new" ? "todo" : editing.status}
                >
                  <option value="todo">To do</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </label>
              <label>
                Due date
                <input
                  type="date"
                  name="dueDate"
                  required
                  defaultValue={editing === "new" ? "" : editing.dueDate}
                />
              </label>
            </div>
            {message && (
              <p className="error" role="alert">
                {message}
              </p>
            )}
            <div className="form-actions">
              <button type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="primary" disabled={saving.isLoading}>
                {saving.isLoading ? "Saving…" : "Save task"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deletingTask && (
        <Modal title="Delete task?" close={() => setDeletingTask(null)}>
          <p>Permanently delete “{deletingTask.title}”?</p>
          {message && (
            <p className="error" role="alert">
              {message}
            </p>
          )}
          <div className="form-actions">
            <button onClick={() => setDeletingTask(null)}>Cancel</button>
            <button
              className="danger"
              disabled={deleting.isLoading}
              onClick={async () => {
                try {
                  await remove({ projectId, id: deletingTask._id }).unwrap();
                  setDeletingTask(null);
                } catch (err) {
                  setMessage(errorMessage(err));
                }
              }}
            >
              Delete task
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
