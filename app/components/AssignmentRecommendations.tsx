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
      setTimeout(() => reject(new Error("Request timed out")), 3000)
    );

    try {
      // Fetch assignments for the course with optimized parameters
      const fetchPromise = fetch(
        `/api/py/assignments?course_id=${courseId}&skip_summarization=true&limit=10`,
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

    // Simple filtering for urgent assignments (due within 3 days)
    const urgentAssignments = assignments
      .filter(
        (a) =>
          a.due_at &&
          new Date(a.due_at).getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000
      )
      .slice(0, 3);

    if (urgentAssignments.length > 0) {
      generatedRecommendations.push({
        title: "Urgent Assignments",
        description: "These assignments are due soon and should be prioritized",
        assignments: urgentAssignments,
        icon: "🔥",
      });
    }

    // High priority assignments
    const highPriorityAssignments = [...assignments]
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, 3);

    if (highPriorityAssignments.length > 0) {
      generatedRecommendations.push({
        title: "High Impact Assignments",
        description: "These assignments have the highest impact on your grade",
        assignments: highPriorityAssignments,
        icon: "⭐",
      });
    }

    // Quick wins (low points but easy to complete)
    const quickWins = assignments
      .filter((a) => a.points_possible > 0 && a.points_possible < 10)
      .slice(0, 3);

    if (quickWins.length > 0) {
      generatedRecommendations.push({
        title: "Quick Wins",
        description:
          "These assignments can be completed quickly for easy points",
        assignments: quickWins,
        icon: "✅",
      });
    }

    return generatedRecommendations;
  }, [assignments]);

  useEffect(() => {
    if (courseId === undefined) return;
    fetchAssignments();
  }, [courseId, fetchAssignments]);

  if (loading) {
    return <LoadingSpinner message="Loading recommendations..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error: {error}</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700">
        <p className="font-medium">
          No recommendations available for this course.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">
        Smart Assignment Recommendations
      </h2>
      <div className="space-y-6">
        {recommendations.map((recommendation, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">{recommendation.icon}</div>
              <div>
                <h3 className="font-medium text-gray-800">
                  {recommendation.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {recommendation.description}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {recommendation.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {assignment.name}
                      </h4>
                      {assignment.due_at && (
                        <p className="text-sm text-gray-500">
                          Due:{" "}
                          {new Date(assignment.due_at).toLocaleDateString()} at{" "}
                          {new Date(assignment.due_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium bg-blue-100 text-blue-800 py-1 px-2 rounded">
                        {assignment.points_possible} pts
                      </span>
                      <span className="ml-2 text-sm font-medium bg-purple-100 text-purple-800 py-1 px-2 rounded">
                        Priority: {assignment.priority.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignmentRecommendations;
