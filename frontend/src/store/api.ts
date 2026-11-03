import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
export type User = { id: string; email: string };
export type Project = {
  _id: string;
  title: string;
  description: string;
  taskCount: number;
  doneCount: number;
};
export type Task = {
  _id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  dueDate: string;
};
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
  tagTypes: ["User", "Projects", "Tasks"],
  endpoints: (b) => ({
    me: b.query<User, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),
    authenticate: b.mutation<
      User,
      { mode: string; email: string; password: string }
    >({
      query: ({ mode, ...body }) => ({
        url: `/auth/${mode}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    logout: b.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    projects: b.query<Project[], void>({
      query: () => "/projects",
      providesTags: ["Projects"],
    }),
    project: b.query<Project, string>({
      query: (id) => `/projects/${id}`,
      providesTags: ["Projects"],
    }),
    saveProject: b.mutation<
      Project,
      { id?: string; title: string; description: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/projects${id ? `/${id}` : ""}`,
        method: id ? "PATCH" : "POST",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    deleteProject: b.mutation<void, string>({
      query: (id) => ({ url: `/projects/${id}`, method: "DELETE" }),
      invalidatesTags: ["Projects", "Tasks"],
    }),
    tasks: b.query<Task[], { id: string; query: string }>({
      query: ({ id, query }) => `/projects/${id}/tasks?${query}`,
      providesTags: ["Tasks"],
    }),
    saveTask: b.mutation<
      Task,
      { projectId: string; id?: string; body: Partial<Omit<Task, "_id">> }
    >({
      query: ({ projectId, id, body }) => ({
        url: `/projects/${projectId}/tasks${id ? `/${id}` : ""}`,
        method: id ? "PATCH" : "POST",
        body,
      }),
      invalidatesTags: ["Tasks", "Projects"],
    }),
    deleteTask: b.mutation<void, { projectId: string; id: string }>({
      query: ({ projectId, id }) => ({
        url: `/projects/${projectId}/tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tasks", "Projects"],
    }),
  }),
});
export const {
  useMeQuery,
  useAuthenticateMutation,
  useLogoutMutation,
  useProjectsQuery,
  useProjectQuery,
  useSaveProjectMutation,
  useDeleteProjectMutation,
  useTasksQuery,
  useSaveTaskMutation,
  useDeleteTaskMutation,
} = api;
export function errorMessage(e: unknown): string {
  const err = e as { data?: { message?: string } };
  return err?.data?.message || "Unable to connect. Please try again.";
}
