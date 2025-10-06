"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Task, TaskStatus, TaskPriority, TaskCategory, Crop } from "@/types";
import {
  usePullToRefresh,
  useIsMobile,
  useMobileGestures,
} from "@/hooks/useMobileGestures";
import hapticFeedback from "@/utils/haptics";

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

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (user) {
      fetchTasks();
      fetchCrops();
    }
  }, [user, isLoaded, router, filters, fetchTasks]);

  const pullToRefresh = usePullToRefresh<HTMLDivElement>({
    onRefresh: async () => {
      await Promise.all([fetchTasks(), fetchCrops()]);
    },
    threshold: 80,
  });

  const fetchCrops = async () => {
    try {
      const response = await fetch("/api/crops");
      const data = await response.json();

      if (data.success) {
        setCrops(data.data);
      }
    } catch (error) {
      console.error("Error fetching crops:", error);
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
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          dueDate: formData.dueDate,
          priority: formData.priority,
          category: formData.category,
          cropId: formData.cropId || undefined,
        }),
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
          cropId: cropFilter || "",
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

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "complete",
          completedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTasks(
          tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: TaskStatus.COMPLETED,
                  completedAt: new Date(),
                }
              : task
          )
        );
      } else {
        setError(data.error || "Failed to complete task");
      }
    } catch {
      setError("Error completing task");
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

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200";
      case TaskPriority.MEDIUM:
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200";
      case TaskPriority.LOW:
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200";
      default:
        return "bg-gray-100 dark:bg-gray-700/30 text-gray-800 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200";
      case TaskStatus.CANCELLED:
        return "bg-gray-100 dark:bg-gray-700/30 text-gray-800 dark:text-gray-200";
      default:
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200";
    }
  };

  const isOverdue = (dueDate: Date, status: TaskStatus) => {
    return status !== TaskStatus.COMPLETED && new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center text-gray-900 dark:text-gray-100">
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-8 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
          Loading...
        </div>
      }
    >
      <div
        ref={isMobile ? pullToRefresh.elementRef : null}
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-900/20 overflow-auto"
      >
        {isMobile && pullToRefresh.refreshIndicator}
        <div className="content-container py-4 sm:py-6 lg:py-8 mobile-header-spacing">
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white text-2xl">✅</span>
                </div>
                <div>
                  <h1 className="text-display text-gray-900 dark:text-gray-100">
                    Task Management
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Organize and track your farming tasks and activities
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-enhanced bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-lg hover:shadow-xl"
              >
                <span className="mr-2">➕</span>
                Add New Task
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded">
                {error}
              </div>
            )}

            {/* Filters */}
            <div className="mb-6 lg:mb-8 card-mobile">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm">🔍</span>
                </div>
                <h2 className="text-heading text-gray-900 dark:text-gray-100">
                  Filters
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="input-mobile"
                  >
                    <option value="">All Statuses</option>
                    {Object.values(TaskStatus).map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) =>
                      setFilters({ ...filters, priority: e.target.value })
                    }
                    className="input-mobile"
                  >
                    <option value="">All Priorities</option>
                    {Object.values(TaskPriority).map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      setFilters({ ...filters, category: e.target.value })
                    }
                    className="input-mobile"
                  >
                    <option value="">All Categories</option>
                    {Object.values(TaskCategory).map((category) => (
                      <option key={category} value={category}>
                        {category.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Crop
                  </label>
                  <select
                    value={filters.cropId}
                    onChange={(e) =>
                      setFilters({ ...filters, cropId: e.target.value })
                    }
                    className="input-mobile"
                  >
                    <option value="">All Crops</option>
                    {crops.map((crop) => (
                      <option key={crop.id} value={crop.id}>
                        {crop.name} {crop.variety && `(${crop.variety})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.overdue}
                      onChange={(e) =>
                        setFilters({ ...filters, overdue: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Overdue Only
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Create Task Form */}
            {showCreateForm && (
              <div className="mb-8 card-enhanced p-6 fade-in">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-sm">✅</span>
                  </div>
                  <h2 className="text-heading text-gray-900 dark:text-gray-100">
                    Add New Task
                  </h2>
                </div>
                <form onSubmit={handleCreateTask} className="form-mobile">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Task Title *
                      </label>
                      <Input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        required
                        placeholder="e.g., Water tomatoes"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Due Date *
                      </label>
                      <Input
                        type="datetime-local"
                        value={formData.dueDate}
                        onChange={(e) =>
                          setFormData({ ...formData, dueDate: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            priority: e.target.value as unknown as TaskPriority,
                          })
                        }
                        className="input-mobile"
                      >
                        {Object.values(TaskPriority).map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            category: e.target.value as TaskCategory,
                          })
                        }
                        className="input-mobile"
                      >
                        {Object.values(TaskCategory).map((category) => (
                          <option key={category} value={category}>
                            {category.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Associated Crop
                      </label>
                      <select
                        value={formData.cropId}
                        onChange={(e) =>
                          setFormData({ ...formData, cropId: e.target.value })
                        }
                        className="input-mobile"
                      >
                        <option value="">No specific crop</option>
                        {crops.map((crop) => (
                          <option key={crop.id} value={crop.id}>
                            {crop.name} {crop.variety && `(${crop.variety})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="input-mobile"
                      placeholder="Task description..."
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3 sm:gap-0">
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="btn-enhanced bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-blue-500 shadow-sm hover:shadow disabled:opacity-50 w-full sm:w-auto touch-target"
                    >
                      {formLoading ? "Creating..." : "Create Task"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="btn-enhanced bg-gray-500 text-white hover:bg-gray-600 dark:hover:bg-gray-500 focus:ring-gray-500 shadow-sm hover:shadow w-full sm:w-auto touch-target"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tasks List */}
            {tasks.length === 0 ? (
              <div className="card-enhanced p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No tasks found
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Create your first task to start managing your farm activities!
                </p>
              </div>
            ) : (
              <div className="grid-mobile-adaptive">
                {tasks.map((task) => {
                  const daysUntilDue = getDaysUntilDue(task.dueDate);
                  const overdue = isOverdue(task.dueDate, task.status);
                  const associatedCrop = task.cropId
                    ? crops.find((c) => c.id === task.cropId)
                    : null;

                  const TaskCard = () => {
                    const swipeRef = useMobileGestures<HTMLDivElement>({
                      onSwipeLeft: () => {
                        if (task.status !== TaskStatus.COMPLETED && isMobile) {
                          hapticFeedback.success();
                          handleCompleteTask(task.id);
                        }
                      },
                      onSwipeRight: () => {
                        if (isMobile) {
                          hapticFeedback.impact();
                          handleDeleteTask(task.id);
                        }
                      },
                      minDistance: 100,
                    });

                    return (
                      <div
                        ref={swipeRef}
                        key={task.id}
                        className={`card-mobile stagger-item fade-in ${
                          overdue
                            ? "ring-2 ring-red-200 dark:ring-red-800 bg-red-50 dark:bg-red-900/10"
                            : "hover:scale-105"
                        } transition-all duration-200 ${isMobile ? "relative select-none" : ""}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                task.priority === TaskPriority.HIGH
                                  ? "bg-gradient-to-br from-red-400 to-red-600"
                                  : task.priority === TaskPriority.MEDIUM
                                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                                    : "bg-gradient-to-br from-green-400 to-green-600"
                              }`}
                            >
                              <span className="text-white text-lg">
                                {task.category === TaskCategory.IRRIGATION
                                  ? "💧"
                                  : task.category === TaskCategory.FERTILIZATION
                                    ? "🌿"
                                    : task.category ===
                                        TaskCategory.PEST_CONTROL
                                      ? "🐛"
                                      : task.category ===
                                          TaskCategory.HARVESTING
                                        ? "🌾"
                                        : task.category ===
                                            TaskCategory.PLANTING
                                          ? "🌱"
                                          : "🔧"}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                              Priority
                            </span>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                              Status
                            </span>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}
                            >
                              {task.status.replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                              Due Date
                            </span>
                            <div className="text-right">
                              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                              {overdue ? (
                                <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                                  Overdue by {Math.abs(daysUntilDue)} days
                                </div>
                              ) : daysUntilDue <= 3 ? (
                                <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                  Due in {daysUntilDue} days
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Due in {daysUntilDue} days
                                </div>
                              )}
                            </div>
                          </div>
                          {associatedCrop && (
                            <div className="flex justify-between items-center py-1">
                              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                Crop
                              </span>
                              <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 truncate">
                                {associatedCrop.name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Mobile swipe hint */}
                        {isMobile && (
                          <div className="text-xs text-center text-gray-400 dark:text-gray-500 pb-2 border-t border-gray-200 dark:border-gray-600 mt-4 pt-2">
                            ← Swipe right to delete • Swipe left to complete →
                          </div>
                        )}

                        <div className="flex gap-2">
                          {task.status !== TaskStatus.COMPLETED && (
                            <button
                              onClick={() => {
                                hapticFeedback.tap();
                                handleCompleteTask(task.id);
                              }}
                              className="flex-1 btn-enhanced bg-green-600 text-white hover:bg-green-700 dark:hover:bg-green-600 focus:ring-green-500 text-xs sm:text-sm py-2 touch-target"
                            >
                              <span className="mr-1 text-sm">✓</span>
                              <span className="hidden sm:inline">Complete</span>
                              <span className="sm:hidden">Done</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              hapticFeedback.tap();
                              handleDeleteTask(task.id);
                            }}
                            className="btn-enhanced bg-red-500 text-white hover:bg-red-600 dark:hover:bg-red-500 focus:ring-red-500 text-sm py-2 px-3 touch-target"
                            aria-label="Delete task"
                          >
                            <span className="text-sm">🗑️</span>
                          </button>
                        </div>
                      </div>
                    );
                  };

                  return <TaskCard key={task.id} />;
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Suspense>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-8 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
          Loading...
        </div>
      }
    >
      <TasksPageContent />
    </Suspense>
  );
}
