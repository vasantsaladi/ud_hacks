"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface AssignmentRecommendationsProps {
  courseId: number;
  token: string;
}

interface Assignment {
  id: number;
  name: string;
  description: string;
  due_at: string | null;
  points_possible: number;
  priority: number;
  course_id: number;
  course_name: string;
}

interface Recommendation {
  title: string;
  description: string;
  assignments: Assignment[];
  icon: string;
  color: string;
}

const AssignmentRecommendations: React.FC<AssignmentRecommendationsProps> = ({
  courseId,
  token,
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use memoized fetch function to prevent unnecessary re-renders
  const fetchAssignments = useCallback(async () => {
    setLoading(true);

    // Add a timeout to prevent hanging forever
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), 5000)
    );

    try {
      // Fetch assignments for the course with optimized parameters
      const fetchPromise = fetch(
        `/api/py/assignments?course_id=${courseId}&skip_summarization=true&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Race between fetch and timeout
      const response = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as Response;

      if (!response.ok) {
        throw new Error("Failed to fetch assignments");
      }

      const data: Assignment[] = await response.json();
      setAssignments(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError("Failed to generate assignment recommendations");
      setLoading(false);
    }
  }, [courseId, token]);

  // Generate recommendations using memoization to avoid recalculating on every render
  const recommendations = useMemo(() => {
    if (assignments.length === 0) return [];

    const generatedRecommendations: Recommendation[] = [];
    const now = new Date();

    // Create a copy of assignments to work with
    const assignmentsCopy = [...assignments];

    // Track which assignments have been used
    const usedAssignmentIds = new Set<number>();

    // Urgent assignments (due within 3 days)
    const urgentAssignments = assignmentsCopy
      .filter(
        (a) =>
          a.due_at &&
          new Date(a.due_at).getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000
      )
      .sort((a, b) => {
        // Sort by due date (ascending)
        if (!a.due_at) return 1;
        if (!b.due_at) return -1;
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      })
      .slice(0, 3);

    if (urgentAssignments.length > 0) {
      // Mark these assignments as used
      urgentAssignments.forEach((a) => usedAssignmentIds.add(a.id));

      generatedRecommendations.push({
        title: "Urgent Assignments",
        description: "These assignments are due soon and should be prioritized",
        assignments: urgentAssignments,
        icon: "🔥",
        color: "red",
      });
    }

    // High impact assignments (high points and not already in urgent)
    const highImpactAssignments = assignmentsCopy
      .filter((a) => !usedAssignmentIds.has(a.id) && a.points_possible > 10)
      .sort((a, b) => (b.points_possible || 0) - (a.points_possible || 0))
      .slice(0, 3);

    if (highImpactAssignments.length > 0) {
      // Mark these assignments as used
      highImpactAssignments.forEach((a) => usedAssignmentIds.add(a.id));

      generatedRecommendations.push({
        title: "High Impact Assignments",
        description: "These assignments have the highest impact on your grade",
        assignments: highImpactAssignments,
        icon: "⭐",
        color: "amber",
      });
    }

    // Quick wins (low points, not already used, and can be completed quickly)
    const quickWins = assignmentsCopy
      .filter(
        (a) =>
          !usedAssignmentIds.has(a.id) &&
          a.points_possible > 0 &&
          a.points_possible <= 10
      )
      .sort((a, b) => (a.points_possible || 0) - (b.points_possible || 0))
      .slice(0, 3);

    if (quickWins.length > 0) {
      generatedRecommendations.push({
        title: "Quick Wins",
        description:
          "These assignments can be completed quickly for easy points",
        assignments: quickWins,
        icon: "✅",
        color: "green",
      });
    }

    return generatedRecommendations;
  }, [assignments]);

  useEffect(() => {
    if (courseId === undefined) return;
    fetchAssignments();
  }, [courseId, fetchAssignments]);

  // Format due date for display
  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return "No due date";
    const date = new Date(dueDate);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Calculate days remaining until due date
  const getDaysRemaining = (dueDate: string | null) => {
    if (!dueDate) return null;

    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Get CSS classes for recommendation color
  const getColorClasses = (color: string) => {
    switch (color) {
      case "red":
        return {
          bg: "bg-red-50",
          border: "border-red-100",
          icon: "bg-red-100 text-red-600",
          title: "text-red-800",
        };
      case "amber":
        return {
          bg: "bg-amber-50",
          border: "border-amber-100",
          icon: "bg-amber-100 text-amber-600",
          title: "text-amber-800",
        };
      case "green":
        return {
          bg: "bg-green-50",
          border: "border-green-100",
          icon: "bg-green-100 text-green-600",
          title: "text-green-800",
        };
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-100",
          icon: "bg-blue-100 text-blue-600",
          title: "text-blue-800",
        };
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner message="Generating smart recommendations..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Recommendation Error
          </h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Recommendations
          </h3>
          <p className="text-gray-500">
            We don't have any recommendations for you at this time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              ></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            Smart Assignment Recommendations
          </h2>
        </div>

        {recommendations.map((recommendation, index) => {
          const colorClasses = getColorClasses(recommendation.color);

          return (
            <div
              key={index}
              className={`mb-6 rounded-lg overflow-hidden ${colorClasses.bg} ${colorClasses.border} border`}
            >
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <div
                    className={`w-8 h-8 rounded-full ${colorClasses.icon} flex items-center justify-center mr-3 text-lg`}
                  >
                    {recommendation.icon}
                  </div>
                  <h3 className={`text-lg font-semibold ${colorClasses.title}`}>
                    {recommendation.title}
                  </h3>
                </div>

                <p className="text-gray-600 text-sm mb-4">
                  {recommendation.description}
                </p>

                <div className="space-y-3">
                  {recommendation.assignments.map((assignment) => {
                    const daysRemaining = getDaysRemaining(assignment.due_at);
                    let dueLabel = "";
                    let dueClass = "";

                    if (daysRemaining !== null) {
                      if (daysRemaining < 0) {
                        dueLabel = "Overdue";
                        dueClass = "text-red-600 font-medium";
                      } else if (daysRemaining === 0) {
                        dueLabel = "Due today";
                        dueClass = "text-orange-600 font-medium";
                      } else if (daysRemaining === 1) {
                        dueLabel = "Due tomorrow";
                        dueClass = "text-orange-600 font-medium";
                      } else if (daysRemaining <= 3) {
                        dueLabel = `${daysRemaining} days left`;
                        dueClass = "text-orange-600 font-medium";
                      } else {
                        dueLabel = `${daysRemaining} days left`;
                        dueClass = "text-green-600 font-medium";
                      }
                    }

                    return (
                      <div
                        key={assignment.id}
                        className="bg-white border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-800 line-clamp-1">
                              {assignment.name}
                            </h4>
                            <span className="text-xs font-medium bg-blue-100 text-blue-800 py-1 px-2 rounded ml-2 whitespace-nowrap">
                              {assignment.points_possible} pts
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center text-gray-500">
                              <svg
                                className="h-3 w-3 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {formatDueDate(assignment.due_at)}
                            </div>

                            {dueLabel && (
                              <span className={`text-xs ${dueClass}`}>
                                {dueLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssignmentRecommendations;
