"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Task, TaskStatus, TaskPriority, TaskCategory, Crop } from "@/types";
import { usePullToRefresh, useIsMobile } from "@/hooks/useMobileGestures";
import {
  PageHeader,
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
  FarmButton,
  FarmBadge,
  LoadingState,
  EmptyState,
} from "@/components/ui/farm-theme";
import { CheckSquare, Plus, Filter, Calendar, AlertCircle } from "lucide-react";

function TasksPageContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cropFilter = searchParams.get("crop");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    category: "",
    cropId: cropFilter || "",
    overdue: false,
  });
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    dueDate: string;
    priority: TaskPriority;
    category: TaskCategory;
    cropId: string;
  }>({
    title: "",
    description: "",
    dueDate: "",
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.MAINTENANCE,
    cropId: cropFilter || "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const isMobile = useIsMobile();

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.priority) params.append("priority", filters.priority);
      if (filters.category) params.append("category", filters.category);
      if (filters.cropId) params.append("cropId", filters.cropId);
      if (filters.overdue) params.append("overdue", "true");

      const response = await fetch(`/api/tasks?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTasks(data.data);
      } else {
        setError("Failed to fetch tasks");
      }
    } catch {
      setError("Error fetching tasks");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCrops = useCallback(async () => {
    try {
      const response = await fetch("/api/crops");
      const data = await response.json();
      if (data.success) {
        setCrops(data.data);
      }
    } catch {
      console.error("Failed to fetch crops");
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }
    fetchTasks();
    fetchCrops();
  }, [user, isLoaded, router, fetchTasks, fetchCrops]);

  const pullToRefresh = usePullToRefresh<HTMLDivElement>({
    onRefresh: fetchTasks,
    threshold: 80,
  });

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return <FarmBadge variant="error">High</FarmBadge>;
      case TaskPriority.MEDIUM:
        return <FarmBadge variant="warning">Medium</FarmBadge>;
      case TaskPriority.LOW:
        return <FarmBadge variant="success">Low</FarmBadge>;
      default:
        return <FarmBadge variant="neutral">{priority}</FarmBadge>;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return <FarmBadge variant="success">Completed</FarmBadge>;
      case TaskStatus.IN_PROGRESS:
        return <FarmBadge variant="info">In Progress</FarmBadge>;
      case TaskStatus.CANCELLED:
        return <FarmBadge variant="neutral">Cancelled</FarmBadge>;
      default:
        return <FarmBadge variant="warning">Pending</FarmBadge>;
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setTasks([data.data, ...tasks]);
        setShowCreateForm(false);
        setFormData({
          title: "",
          description: "",
          dueDate: "",
          priority: TaskPriority.MEDIUM,
          category: TaskCategory.MAINTENANCE,
          cropId: "",
        });
      } else {
        setError(data.error || "Failed to create task");
      }
    } catch {
      setError("Error creating task");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setTasks(tasks.filter((task) => task.id !== taskId));
      } else {
        setError(data.error || "Failed to delete task");
      }
    } catch {
      setError("Error deleting task");
    }
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string | Date) => {
    return new Date(dueDate) < new Date();
  };

  if (!isLoaded || loading) {
    return <LoadingState message="Loading tasks..." />;
  }

  return (
    <div
      ref={isMobile ? pullToRefresh.elementRef : null}
      className="page-container"
    >
      {isMobile && pullToRefresh.refreshIndicator}
      <div className="content-container padding-responsive-lg mobile-header-spacing content-spacing">
        <PageHeader
          title="Task Management"
          description="Organize and track your farming tasks and activities"
          icon={<CheckSquare className="w-6 h-6" />}
          actions={
            <FarmButton
              variant="success"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-4 h-4" />
              Add New Task
            </FarmButton>
          }
        />

        {error && (
          <div className="farm-card border-destructive/20 bg-destructive/5">
            <div className="flex-center gap-content padding-responsive">
              <div className="flex-center w-10 h-10 bg-destructive/10 rounded-full">
                <span className="text-destructive text-lg">⚠️</span>
              </div>
              <span className="text-destructive font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Create Task Form */}
        {showCreateForm && (
          <FarmCard>
            <FarmCardHeader
              title="Add New Task"
              description="Create a new task for your farm activities"
            />
            <FarmCardContent>
              <form onSubmit={handleCreateTask} className="farm-form">
                <div className="farm-grid grid-cols-1 md:grid-cols-2">
                  <div>
                    <label className="farm-label">Task Title *</label>
                    <Input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="e.g., Water tomatoes"
                    />
                  </div>
                  <div>
                    <label className="farm-label">Due Date *</label>
                    <Input
                      type="date"
                      required
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="farm-label">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: e.target.value as TaskPriority,
                        })
                      }
                      className="farm-input"
                    >
                      <option value={TaskPriority.LOW}>Low</option>
                      <option value={TaskPriority.MEDIUM}>Medium</option>
                      <option value={TaskPriority.HIGH}>High</option>
                    </select>
                  </div>
                  <div>
                    <label className="farm-label">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as TaskCategory,
                        })
                      }
                      className="farm-input"
                    >
                      <option value={TaskCategory.MAINTENANCE}>
                        Maintenance
                      </option>
                      <option value={TaskCategory.PLANTING}>Planting</option>
                      <option value={TaskCategory.HARVESTING}>
                        Harvesting
                      </option>
                      <option value={TaskCategory.IRRIGATION}>
                        Irrigation
                      </option>
                      <option value={TaskCategory.FERTILIZATION}>
                        Fertilizing
                      </option>
                      <option value={TaskCategory.PEST_CONTROL}>
                        Pest Control
                      </option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="farm-label">Crop (Optional)</label>
                    <select
                      value={formData.cropId}
                      onChange={(e) =>
                        setFormData({ ...formData, cropId: e.target.value })
                      }
                      className="farm-input"
                    >
                      <option value="">Select a crop</option>
                      {crops.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {crop.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="farm-label">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Task details..."
                      className="farm-input min-h-[100px]"
                    />
                  </div>
                </div>
                <div className="action-buttons">
                  <FarmButton
                    type="submit"
                    variant="success"
                    disabled={formLoading}
                  >
                    {formLoading ? "Creating..." : "Create Task"}
                  </FarmButton>
                  <FarmButton
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </FarmButton>
                </div>
              </form>
            </FarmCardContent>
          </FarmCard>
        )}

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="text-4xl" />}
            title="No Tasks Found"
            description="Add your first task to get started with farm task management!"
            action={
              <FarmButton
                variant="success"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Task
              </FarmButton>
            }
          />
        ) : (
          <div className="farm-grid-auto">
            {tasks.map((task) => (
              <FarmCard
                key={task.id}
                interactive
                onClick={() => router.push(`/tasks/${task.id}`)}
              >
                <FarmCardHeader
                  title={task.title}
                  description={task.description || "Task"}
                  badge={getStatusBadge(task.status)}
                />
                <FarmCardContent>
                  <div className="farm-card-content">
                    <div className="flex-between py-2">
                      <div className="icon-text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="farm-text-muted">Due Date</span>
                      </div>
                      <span
                        className={`farm-text-body font-semibold ${
                          isOverdue(task.dueDate) ? "text-destructive" : ""
                        }`}
                      >
                        {formatDate(task.dueDate)}
                        {isOverdue(task.dueDate) && " (Overdue)"}
                      </span>
                    </div>
                    <div className="flex-between py-2">
                      <span className="farm-text-muted">Priority</span>
                      {getPriorityBadge(task.priority)}
                    </div>
                    <div className="flex-between py-2">
                      <span className="farm-text-muted">Category</span>
                      <span className="farm-text-body font-semibold">
                        {task.category.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="farm-card-section">
                    <div className="action-buttons-sm">
                      <FarmButton
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/tasks/${task.id}`);
                        }}
                      >
                        View Details
                      </FarmButton>
                      <FarmButton
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                      >
                        Delete
                      </FarmButton>
                    </div>
                  </div>
                </FarmCardContent>
              </FarmCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading tasks..." />}>
      <TasksPageContent />
    </Suspense>
  );
}
