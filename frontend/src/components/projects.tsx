"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  CheckCheck,
  Folder,
  Plus,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  errorMessage,
  Project,
  useProjectsQuery,
  useSaveProjectMutation,
  useDeleteProjectMutation,
} from "@/store/api";
import Modal from "./modal";
export default function Projects() {
  const { data = [], isLoading, error, refetch } = useProjectsQuery();
  const [save, saving] = useSaveProjectMutation();
  const [remove, deleting] = useDeleteProjectMutation();
  const [editing, setEditing] = useState<Project | "new" | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const total = data.reduce((n, p) => n + p.taskCount, 0);
  const done = data.reduce((n, p) => n + p.doneCount, 0);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A CLEAR SPACE FOR WHAT’S NEXT</p>
          <h1>
            My projects<span className="accent">.</span>
          </h1>
          <p className="muted">
            Big picture, small steps. Keep everything moving.
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
          New project
        </button>
      </div>
      <div className="stats">
        <div>
          <span className="stat-icon">
            <Folder size={19} />
          </span>
          <div>
            <p>Total projects</p>
            <strong>{data.length.toString().padStart(2, "0")}</strong>
          </div>
        </div>
        <div>
          <span className="stat-icon lavender">
            <LayersIcon />
          </span>
          <div>
            <p>Open tasks</p>
            <strong>{(total - done).toString().padStart(2, "0")}</strong>
          </div>
        </div>
        <div>
          <span className="stat-icon green">
            <CheckCheck size={19} />
          </span>
          <div>
            <p>Tasks completed</p>
            <strong>{done.toString().padStart(2, "0")}</strong>
          </div>
        </div>
      </div>
      <div className="section-heading">
        <h2>
          All projects <span>{data.length}</span>
        </h2>
        <label className="search">
          <Search size={17} />
          <input
            aria-label="Search projects"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {isLoading ? (
        <div className="empty">Loading your projects…</div>
      ) : error ? (
        <div className="empty error" role="alert">
          {errorMessage(error)} <button onClick={refetch}>Retry</button>
        </div>
      ) : (
        <div className="project-grid">
          {data
            .filter((p) =>
              `${p.title} ${p.description}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((p, i) => (
              <article className="project-card" key={p._id}>
                <div className="card-top">
                  <span className={`folder-mark color-${i % 3}`}>
                    <Folder size={23} />
                  </span>
                  <div className="card-actions">
                    <button
                      className="icon-button"
                      aria-label={`Edit ${p.title}`}
                      onClick={() => {
                        setMessage("");
                        setEditing(p);
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Delete ${p.title}`}
                      onClick={() => {
                        setMessage("");
                        setDeletingProject(p);
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <Link className="project-title" href={`/projects/${p._id}`}>
                  <h3>{p.title}</h3>
                  <ArrowUpRight size={19} />
                </Link>
                <p className="project-description">
                  {p.description ||
                    "Every great project starts with a first step."}
                </p>
                <div className="progress-label">
                  <span>Progress</span>
                  <strong>
                    {p.taskCount
                      ? Math.round((p.doneCount / p.taskCount) * 100)
                      : 0}
                    %
                  </strong>
                </div>
                <div className="progress">
                  <span
                    style={{
                      width: `${p.taskCount ? (p.doneCount / p.taskCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="card-bottom">
                  <span>
                    <CheckCheck size={15} />
                    {p.doneCount} of {p.taskCount} tasks
                  </span>
                  <Link href={`/projects/${p._id}`}>View project →</Link>
                </div>
              </article>
            ))}
          <button
            className="new-card"
            onClick={() => {
              setMessage("");
              setEditing("new");
            }}
          >
            <span>
              <Plus size={24} />
            </span>
            <strong>Your next great idea</strong>
            <small>Create a new project</small>
          </button>
        </div>
      )}
      {!isLoading && !error && data.length === 0 && (
        <p className="muted">
          Your workspace is ready. Create your first project to get started.
        </p>
      )}
      {editing && (
        <Modal
          title={editing === "new" ? "Create a project" : "Edit project"}
          close={() => setEditing(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                await save({
                  id: editing === "new" ? undefined : editing._id,
                  title: String(f.get("title")),
                  description: String(f.get("description")),
                }).unwrap();
                setEditing(null);
              } catch (err) {
                setMessage(errorMessage(err));
              }
            }}
          >
            <label>
              Project title
              <input
                name="title"
                autoFocus
                required
                maxLength={120}
                defaultValue={editing === "new" ? "" : editing.title}
                placeholder="What are you working on?"
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                maxLength={2000}
                rows={4}
                defaultValue={editing === "new" ? "" : editing.description}
                placeholder="A little context for your big idea…"
              />
            </label>
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
                {saving.isLoading ? "Saving…" : "Save project"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deletingProject && (
        <Modal title="Delete project?" close={() => setDeletingProject(null)}>
          <p>
            This will permanently delete “{deletingProject.title}” and all its
            tasks.
          </p>
          {message && (
            <p className="error" role="alert">
              {message}
            </p>
          )}
          <div className="form-actions">
            <button onClick={() => setDeletingProject(null)}>Cancel</button>
            <button
              className="danger"
              disabled={deleting.isLoading}
              onClick={async () => {
                try {
                  await remove(deletingProject._id).unwrap();
                  setDeletingProject(null);
                } catch (err) {
                  setMessage(errorMessage(err));
                }
              }}
            >
              Delete project
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function LayersIcon() {
  return <span style={{ fontSize: 22 }}>≡</span>;
}
