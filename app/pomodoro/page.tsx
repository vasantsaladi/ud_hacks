"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import DashboardHeader from "@/app/components/DashboardHeader";
import LoadingSpinner from "@/app/components/LoadingSpinner";

interface Assignment {
  id: number;
  name: string;
  due_at: string | null;
  points_possible: number;
  course_name: string;
  html_url: string;
  has_submitted_submissions?: boolean;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface TodoItem extends Assignment {
  isCompleted: boolean;
  estimatedPomodoros: number;
  completedPomodoros: number;
  urgencyLevel?: "high" | "medium" | "low";
}

export default function PomodoroPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [currentTask, setCurrentTask] = useState<TodoItem | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate urgency level based on due date
  const getUrgencyLevel = (
    dueDate: string | null
  ): "high" | "medium" | "low" => {
    if (!dueDate) return "low";
    const now = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDue <= 2) return "high";
    if (daysUntilDue <= 5) return "medium";
    return "low";
  };

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    // Fetch courses and assignments
    const fetchData = async () => {
      try {
        const coursesResponse = await fetch("/api/py/courses", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!coursesResponse.ok) throw new Error("Failed to fetch courses");
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);

        // Fetch assignments for each course
        const assignmentsPromises = coursesData.map(async (course: Course) => {
          const response = await fetch(
            `/api/py/assignments?course_id=${course.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!response.ok) return [];
          const assignments = await response.json();
          return assignments.map((assignment: Assignment) => ({
            ...assignment,
            course_name: course.name,
            isCompleted: false,
            estimatedPomodoros: 2, // Default estimate
            completedPomodoros: 0,
            urgencyLevel: getUrgencyLevel(assignment.due_at),
          }));
        });

        const allAssignments = await Promise.all(assignmentsPromises);
        const flattenedAssignments = allAssignments
          .flat()
          .filter(
            (assignment: TodoItem) => !assignment.has_submitted_submissions
          )
          .sort((a, b) => {
            if (!a.due_at) return 1;
            if (!b.due_at) return -1;
            return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
          });

        setTodoList(flattenedAssignments);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load assignments");
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, router, token]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleStartTimer = () => {
    if (!currentTask && todoList.length > 0) {
      setCurrentTask(todoList[0]);
    }
    setIsRunning(true);
  };

  const handlePauseTimer = () => {
    setIsRunning(false);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (currentTask) {
      if (!isBreak) {
        // Update completed pomodoros for the current task
        setTodoList((prev) =>
          prev.map((item) =>
            item.id === currentTask.id
              ? { ...item, completedPomodoros: item.completedPomodoros + 1 }
              : item
          )
        );
      }
    }
    setIsBreak((prev) => !prev);
    setTimeLeft(isBreak ? 25 * 60 : 5 * 60);
  };

  const handleTaskComplete = (taskId: number) => {
    setTodoList((prev) =>
      prev.map((item) =>
        item.id === taskId ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading Pomodoro Timer..." />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Left Section: Timer and Todo List */}
          <div className="flex-1">
            {/* Timer Section */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">
                  {isBreak ? "Break Time!" : "Focus Time"}
                </h2>
                <div className="text-6xl font-mono mb-8">
                  {formatTime(timeLeft)}
                </div>
                {currentTask && (
                  <div className="mb-6">
                    <p className="text-lg font-medium">Current Task:</p>
                    <p className="text-gray-600">{currentTask.name}</p>
                    <p className="text-sm text-gray-500">
                      {currentTask.course_name} • Due:{" "}
                      {currentTask.due_at
                        ? new Date(currentTask.due_at).toLocaleDateString()
                        : "No due date"}
                    </p>
                  </div>
                )}
                <div className="flex justify-center space-x-4">
                  {!isRunning ? (
                    <button
                      onClick={handleStartTimer}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={handlePauseTimer}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Pause
                    </button>
                  )}
                  <button
                    onClick={handleResetTimer}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Todo List Section */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Assignment Queue</h2>
              <div className="space-y-4">
                {todoList.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border ${
                      task.isCompleted
                        ? "bg-gray-50 border-gray-200"
                        : "bg-white border-gray-200 hover:border-blue-500"
                    } transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={task.isCompleted}
                          onChange={() => handleTaskComplete(task.id)}
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div
                          className={`${
                            task.isCompleted ? "text-gray-500 line-through" : ""
                          }`}
                        >
                          <h3 className="font-medium">{task.name}</h3>
                          <p className="text-sm text-gray-500">
                            {task.course_name} • Due:{" "}
                            {task.due_at
                              ? new Date(task.due_at).toLocaleDateString()
                              : "No due date"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                          Pomodoros: {task.completedPomodoros}/
                          {task.estimatedPomodoros}
                        </div>
                        <a
                          href={task.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
                {todoList.length === 0 && (
                  <p className="text-center text-gray-500">
                    No pending assignments. Great job! 🎉
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Section: Study Schedule */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Study Schedule</h2>
              <div className="space-y-6">
                {Object.entries(
                  todoList.reduce((acc, task) => {
                    if (!task.due_at || task.isCompleted) return acc;
                    const dueDate = new Date(task.due_at).toLocaleDateString();
                    if (!acc[dueDate]) acc[dueDate] = [];
                    acc[dueDate].push(task);
                    return acc;
                  }, {} as Record<string, TodoItem[]>)
                )
                  .sort(([dateA], [dateB]) => {
                    return (
                      new Date(dateA).getTime() - new Date(dateB).getTime()
                    );
                  })
                  .map(([date, tasks]) => (
                    <div key={date} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3 text-blue-600">
                        {new Date(date).toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </h3>
                      <div className="space-y-3">
                        {tasks.map((task) => {
                          const estimatedMinutes = task.estimatedPomodoros * 25;
                          const urgencyColor = {
                            high: "bg-red-100 text-red-800",
                            medium: "bg-yellow-100 text-yellow-800",
                            low: "bg-green-100 text-green-800",
                          }[task.urgencyLevel || "low"];

                          return (
                            <div
                              key={task.id}
                              className="bg-white rounded-md p-3 border border-gray-200"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-gray-900">
                                      {task.name}
                                    </h4>
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${urgencyColor}`}
                                    >
                                      {task.urgencyLevel}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    {task.course_name}
                                  </p>
                                  <p className="text-sm text-blue-500 mt-1">
                                    Recommended study time: {estimatedMinutes}{" "}
                                    minutes
                                    {task.urgencyLevel === "high" &&
                                      " (Focus on this!)"}
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {task.completedPomodoros}/
                                    {task.estimatedPomodoros} sessions
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    task.urgencyLevel === "high"
                                      ? "bg-red-600"
                                      : task.urgencyLevel === "medium"
                                      ? "bg-yellow-600"
                                      : "bg-green-600"
                                  }`}
                                  style={{
                                    width: `${
                                      (task.completedPomodoros /
                                        task.estimatedPomodoros) *
                                      100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                {todoList.filter((task) => !task.isCompleted && task.due_at)
                  .length === 0 && (
                  <p className="text-center text-gray-500">
                    No upcoming assignments to schedule. 🎉
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
