/**
 * API client for Lead Management backend (Laravel)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function getAuthHeaders(omitContentType = false): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    ...(omitContentType ? {} : { "Content-Type": "application/json" }),
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { omitContentType?: boolean } = {}
): Promise<T> {
  const { omitContentType, ...fetchOptions } = options;
  const isFormData = typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;
  const shouldOmitContentType = omitContentType || isFormData;
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers = { ...getAuthHeaders(shouldOmitContentType), ...(fetchOptions.headers as Record<string, string> | undefined) };
  if (isFormData && "Content-Type" in headers) {
    delete (headers as Record<string, string>)["Content-Type"];
  }
  const res = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    let errMsg = `API Error: ${res.status}`;
    try {
      const err = JSON.parse(text) as { message?: string; errors?: Record<string, string[]> };
      if (err?.message) errMsg = err.message;
      if (err?.errors && typeof err.errors === "object") {
        const first = Object.values(err.errors).flat()[0];
        if (first) errMsg = first;
      }
    } catch {
      if (text?.length < 200) errMsg = text || errMsg;
    }
    throw new Error(errMsg);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function getApiHealth(signal?: AbortSignal) {
  return apiFetch<{ status: string; message: string; timestamp: string }>("/health", { signal });
}

export type DashboardStats = {
  is_admin: boolean;
  widgets: {
    total_leads: number;
    new_today: number;
    today_follow_ups: number;
    unassigned: number;
    my_leads: number;
    today_tasks: number;
    overdue_tasks: number;
    today_reminders: number;
    overdue_reminders: number;
    interested: number;
    demo_scheduled: number;
    conversion_rate: number;
  };
  pipeline: { id: number; name: string; slug: string; color: string | null; count: number }[];
  sources: { id: number; name: string; slug: string; count: number; pct: number }[];
};

export const dashboardApi = {
  stats: (signal?: AbortSignal) =>
    apiFetch<DashboardStats>("/dashboard/stats", { signal }),
};

// User Management API
export const usersApi = {
  list: (params?: { search?: string; role_id?: number; status?: string; page?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.role_id) sp.set("role_id", String(params.role_id));
    if (params?.status) sp.set("status", params.status);
    if (params?.page) sp.set("page", String(params.page));
    return apiFetch<{ data: User[]; total: number; current_page: number; last_page: number }>(`/users?${sp}`);
  },
  get: (id: number) => apiFetch<User>(`/users/${id}`),
  create: (data: CreateUserInput) =>
    apiFetch<User>("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: UpdateUserInput) =>
    apiFetch<User>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) =>
    apiFetch<void>(`/users/${id}`, { method: "DELETE" }),
};

export const rolesApi = {
  list: (params?: { search?: string; page?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.page) sp.set("page", String(params.page));
    return apiFetch<{ data: Role[]; total: number; current_page: number; last_page: number }>(`/roles?${sp}`);
  },
  get: (id: number) => apiFetch<Role & { permissions: Permission[] }>(`/roles/${id}`),
  create: (data: CreateRoleInput) =>
    apiFetch<Role>("/roles", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: UpdateRoleInput) =>
    apiFetch<Role>(`/roles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) =>
    apiFetch<void>(`/roles/${id}`, { method: "DELETE" }),
};

export const permissionsApi = {
  list: (params?: { search?: string; module?: string; page?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.module) sp.set("module", params.module);
    if (params?.page) sp.set("page", String(params.page));
    return apiFetch<{ data: Permission[]; total: number; current_page: number; last_page: number }>(`/permissions?${sp}`);
  },
  get: (id: number) => apiFetch<Permission>(`/permissions/${id}`),
  create: (data: CreatePermissionInput) =>
    apiFetch<Permission>("/permissions", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: UpdatePermissionInput) =>
    apiFetch<Permission>(`/permissions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) =>
    apiFetch<void>(`/permissions/${id}`, { method: "DELETE" }),
};

// Leads API
export type ApiLeadConversation = {
  id: number;
  remark: string | null;
  created_at: string;
  next_followup_date?: string | null;
  next_followup_time?: string | null;
  call_status?: { name: string } | null;
  new_stage?: { name: string } | null;
  previous_stage?: { name: string } | null;
};

export type ApiLead = {
  id: number;
  library_name: string;
  owner_name: string | null;
  contact_number: string;
  alternate_contact?: string | null;
  email?: string | null;
  total_seats?: number | null;
  no_of_branches?: number | null;
  working_since_year?: number | null;
  interested_for?: string | null;
  subscription_type?: string | null;
  demo_type?: string | null;
  demo_datetime?: string | null;
  lead_stage?: { id: number; name: string; slug: string; color?: string | null } | null;
  lead_source?: { id: number; name: string; slug: string } | null;
  city?: { id: number; name: string; state?: { id: number; name: string } } | null;
  assigned_to?: number | null;
  assignedTo?: { id: number; name: string } | null;
  assigned_user_name?: string | null;
  tags?: { id: number; name: string }[];
  conversations?: ApiLeadConversation[];
  reminders?: { id: number; title?: string; remind_at?: string }[];
  created_at: string;
  updated_at: string;
};

export type LeadListResponse = {
  data: ApiLead[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export const leadsApi = {
  list: (
    params?: {
      search?: string;
      stage_id?: number;
      source_id?: number;
      city_id?: number;
      assigned_to?: number;
      view?: string;
      per_page?: number;
      page?: number;
    },
    signal?: AbortSignal
  ) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.stage_id) sp.set("stage_id", String(params.stage_id));
    if (params?.source_id) sp.set("source_id", String(params.source_id));
    if (params?.city_id) sp.set("city_id", String(params.city_id));
    if (params?.assigned_to) sp.set("assigned_to", String(params.assigned_to));
    if (params?.view) sp.set("view", params.view);
    if (params?.per_page) sp.set("per_page", String(params.per_page));
    if (params?.page) sp.set("page", String(params.page));
    return apiFetch<LeadListResponse>(`/leads?${sp}`, { signal });
  },
  locations: (signal?: AbortSignal) =>
    apiFetch<{ id: number; location: string }[]>("/leads/locations", { signal }),
  get: (id: number, signal?: AbortSignal) =>
    apiFetch<ApiLead>(`/leads/${id}`, { ...(signal && { signal }) }),
  create: (data: {
    library_name?: string;
    library?: string;
    owner_name?: string;
    owner?: string;
    contact_number?: string;
    contact?: string;
    stage?: string;
    stage_id?: number | null;
    source?: string;
    source_id?: number | null;
    assigned_to?: number | string | null;
    city_id?: number | null;
    state?: string;
    city?: string;
    tags?: string[];
  }) =>
    apiFetch<ApiLead>("/leads", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (
    id: number,
    data: Partial<{
      library_name: string;
      library: string;
      owner_name: string;
      owner: string;
      contact_number: string;
      contact: string;
      stage: string;
      stage_id: number | null;
      source: string;
      source_id: number | null;
      assigned_to: number | string | null;
      city_id: number | null;
      state: string;
      city: string;
      tags: string[];
    }>
  ) =>
    apiFetch<ApiLead>(`/leads/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiFetch<void>(`/leads/${id}`, { method: "DELETE" }),
  import: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<{
      message: string;
      import_id: number;
      total_records: number;
      success_records: number;
      failed_records: number;
    }>("/leads/import", {
      method: "POST",
      body: formData,
    });
  },
  addConversation: (leadId: number, data: {
    call_status?: string;
    call_status_id?: number;
    remark?: string;
    new_stage?: string;
    new_stage_id?: number;
    next_followup_date?: string;
    next_followup_time?: string;
    tags?: string;
  }) =>
    apiFetch<ApiLead>(`/leads/${leadId}/conversations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export type ApiReminder = {
  id: number;
  lead_id: number;
  user_id: number;
  reminder_date: string;
  reminder_time: string | null;
  note: string | null;
  status: string;
  lead?: { id: number; library_name: string; contact_number: string };
  user?: { id: number; name: string };
};

export type ApiTask = {
  id: number;
  lead_id: number | null;
  assigned_to: number;
  created_by: number;
  title: string;
  description: string | null;
  task_type: string | null;
  due_date: string | null;
  status: string;
  lead?: { id: number; library_name: string; contact_number: string };
  assignedTo?: { id: number; name: string };
};

export const remindersApi = {
  list: (params?: { today?: boolean; overdue?: boolean; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.today) sp.set("today", "1");
    if (params?.overdue) sp.set("overdue", "1");
    if (params?.limit) sp.set("limit", String(params.limit));
    return apiFetch<ApiReminder[]>(`/reminders${sp.toString() ? `?${sp}` : ""}`);
  },
  listToday: (limit?: number) =>
    apiFetch<ApiReminder[]>(`/reminders?today=1${limit ? `&limit=${limit}` : ""}`),
  listOverdue: (limit?: number) =>
    apiFetch<ApiReminder[]>(`/reminders?overdue=1${limit ? `&limit=${limit}` : ""}`),
  createForLead: (leadId: number, data: { reminder_date: string; reminder_time?: string; note?: string }) =>
    apiFetch<ApiReminder>(`/leads/${leadId}/reminders`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ reminder_date: string; reminder_time?: string; note?: string; status: string }>) =>
    apiFetch<ApiReminder>(`/reminders/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/reminders/${id}`, { method: "DELETE" }),
};

export const tasksApi = {
  list: (params?: { search?: string; status?: string; task_type?: string; per_page?: number; page?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.status) sp.set("status", params.status);
    if (params?.task_type) sp.set("task_type", params.task_type);
    if (params?.per_page) sp.set("per_page", String(params.per_page));
    if (params?.page) sp.set("page", String(params.page));
    return apiFetch<{ data: ApiTask[]; total: number; current_page: number; last_page: number }>(`/tasks?${sp}`);
  },
  create: (data: { lead_id?: number; title: string; description?: string; task_type?: string; due_date?: string; assigned_to?: number }) =>
    apiFetch<ApiTask>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  createForLead: (leadId: number, data: { title: string; description?: string; task_type?: string; due_date?: string }) =>
    apiFetch<ApiTask>(`/leads/${leadId}/tasks`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ title: string; description?: string; task_type?: string; due_date?: string; status: string }>) =>
    apiFetch<ApiTask>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/tasks/${id}`, { method: "DELETE" }),
};

export const listsApi = {
  roles: () => apiFetch<{ id: number; name: string; slug: string }[]>("/roles-list"),
  permissions: () =>
    apiFetch<{ id: number; name: string; slug: string; module: string | null }[]>("/permissions-list"),
  countries: () => apiFetch<{ id: number; name: string; code: string | null }[]>("/countries-list"),
  leadStages: () => apiFetch<{ id: number; name: string; slug: string; color?: string | null }[]>("/lead-stages-list"),
  leadSources: () => apiFetch<{ id: number; name: string; slug: string }[]>("/lead-sources-list"),
  callStatuses: () => apiFetch<{ id: number; name: string; slug: string }[]>("/call-status-list"),
  users: () => apiFetch<{ id: number; name: string; email: string }[]>("/users-list"),
  tags: () => apiFetch<{ id: number; name: string }[]>("/tags-list"),
  states: (countryId?: number) => {
    const sp = new URLSearchParams();
    if (countryId) sp.set("country_id", String(countryId));
    return apiFetch<{ id: number; name: string; code: string | null; country_id: number }[]>(`/states-list?${sp}`);
  },
  cities: (stateId?: number) => {
    const sp = new URLSearchParams();
    if (stateId) sp.set("state_id", String(stateId));
    return apiFetch<{ id: number; name: string; state_id: number }[]>(`/cities-list?${sp}`);
  },
};

export const leadStagesApi = {
  list: (params?: { search?: string; page?: number; per_page?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.per_page) sp.set("per_page", String(params.per_page));
    return apiFetch<{ data: { id: number; name: string; slug: string; stage_order: number; color: string | null; is_closed: boolean }[]; total: number }>(`/lead-stages?${sp}`);
  },
  create: (data: { name: string; slug?: string; stage_order?: number; color?: string; is_closed?: boolean }) =>
    apiFetch<{ id: number; name: string; slug: string; stage_order: number; color: string | null; is_closed: boolean }>("/lead-stages", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ name: string; slug: string; stage_order: number; color: string; is_closed: boolean }>) =>
    apiFetch<{ id: number; name: string; slug: string; stage_order: number; color: string | null; is_closed: boolean }>(`/lead-stages/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/lead-stages/${id}`, { method: "DELETE" }),
};

export const leadSourcesApi = {
  list: (params?: { search?: string; page?: number; per_page?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.per_page) sp.set("per_page", String(params.per_page));
    return apiFetch<{ data: { id: number; name: string; slug: string; status: string }[]; total: number }>(`/lead-sources?${sp}`);
  },
  create: (data: { name: string; slug?: string; status?: string }) =>
    apiFetch<{ id: number; name: string; slug: string; status: string }>("/lead-sources", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ name: string; slug: string; status: string }>) =>
    apiFetch<{ id: number; name: string; slug: string; status: string }>(`/lead-sources/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/lead-sources/${id}`, { method: "DELETE" }),
};

export const callStatusesApi = {
  list: (params?: { search?: string; page?: number; per_page?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.per_page) sp.set("per_page", String(params.per_page));
    return apiFetch<{ data: { id: number; name: string; slug: string; is_connected: boolean }[]; total: number }>(`/call-status?${sp}`);
  },
  create: (data: { name: string; slug?: string; is_connected?: boolean }) =>
    apiFetch<{ id: number; name: string; slug: string; is_connected: boolean }>("/call-status", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ name: string; slug: string; is_connected: boolean }>) =>
    apiFetch<{ id: number; name: string; slug: string; is_connected: boolean }>(`/call-status/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/call-status/${id}`, { method: "DELETE" }),
};

export const tagsApi = {
  list: (params?: { search?: string; page?: number; per_page?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.per_page) sp.set("per_page", String(params.per_page));
    return apiFetch<{ data: { id: number; name: string; color: string | null }[]; total: number }>(`/tags?${sp}`);
  },
  create: (data: { name: string; color?: string }) =>
    apiFetch<{ id: number; name: string; color: string | null }>("/tags", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ name: string; color: string }>) =>
    apiFetch<{ id: number; name: string; color: string | null }>(`/tags/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/tags/${id}`, { method: "DELETE" }),
};

// Country, State, City API
export type Country = { id: number; name: string; code: string | null; phone_code: string | null; is_active: boolean };
export type State = { id: number; name: string; code: string | null; country_id: number; is_active: boolean; country?: Country };
export type City = { id: number; name: string; state_id: number; is_active: boolean; state?: State & { country?: Country } };

export const countriesApi = {
  list: (params?: { search?: string; page?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.page) sp.set("page", String(params.page));
    return apiFetch<{ data: Country[]; total: number; current_page: number; last_page: number }>(`/countries?${sp}`);
  },
  get: (id: number) => apiFetch<Country>(`/countries/${id}`),
  create: (data: { name: string; code?: string; phone_code?: string; is_active?: boolean }) =>
    apiFetch<Country>("/countries", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ name: string; code: string; phone_code: string; is_active: boolean }>) =>
    apiFetch<Country>(`/countries/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/countries/${id}`, { method: "DELETE" }),
};

export const statesApi = {
  list: (params?: { search?: string; country_id?: number; page?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.country_id) sp.set("country_id", String(params.country_id));
    if (params?.page) sp.set("page", String(params.page));
    return apiFetch<{ data: State[]; total: number; current_page: number; last_page: number }>(`/states?${sp}`);
  },
  get: (id: number) => apiFetch<State>(`/states/${id}`),
  create: (data: { name: string; country_id: number; code?: string; is_active?: boolean }) =>
    apiFetch<State>("/states", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ name: string; country_id: number; code: string; is_active: boolean }>) =>
    apiFetch<State>(`/states/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/states/${id}`, { method: "DELETE" }),
};

export const citiesApi = {
  list: (params?: { search?: string; state_id?: number; country_id?: number; page?: number; per_page?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.state_id) sp.set("state_id", String(params.state_id));
    if (params?.country_id) sp.set("country_id", String(params.country_id));
    if (params?.page) sp.set("page", String(params.page));
    if (params?.per_page) sp.set("per_page", String(params.per_page));
    return apiFetch<{ data: City[]; total: number; current_page: number; last_page: number }>(`/cities?${sp}`);
  },
  get: (id: number) => apiFetch<City>(`/cities/${id}`),
  create: (data: { name: string; state_id: number; is_active?: boolean }) =>
    apiFetch<City>("/cities", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<{ name: string; state_id: number; is_active: boolean }>) =>
    apiFetch<City>(`/cities/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => apiFetch<void>(`/cities/${id}`, { method: "DELETE" }),
};

// Types
export type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role_id: number | null;
  role: { id: number; name: string; slug: string } | null;
  status: string;
  created_at: string;
};

export type Role = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  users_count?: number;
  permissions?: Permission[];
};

export type Permission = {
  id: number;
  name: string;
  slug: string;
  module: string | null;
};

export type CreateUserInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  role_id?: number | null;
  status?: string;
};

export type UpdateUserInput = Partial<CreateUserInput> & { password?: string; password_confirmation?: string };

export type CreateRoleInput = {
  name: string;
  slug: string;
  description?: string;
  permission_ids?: number[];
};

export type UpdateRoleInput = Partial<CreateRoleInput>;

export type CreatePermissionInput = {
  name: string;
  slug: string;
  module?: string;
};

export type UpdatePermissionInput = Partial<CreatePermissionInput>;
