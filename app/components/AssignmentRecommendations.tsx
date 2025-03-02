"use client";

import { useState, useEffect } from "react";
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
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        // Fetch assignments for the course
        const response = await fetch(
          `/api/py/assignments?course_id=${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch assignments");
        }

        const assignments: Assignment[] = await response.json();

        // Generate recommendations based on assignments
        const generatedRecommendations: Recommendation[] = [];

        // Filter assignments with due dates
        const now = new Date();
        const assignmentsWithDueDates = assignments.filter((a) => a.due_at);

        // Sort by due date (ascending)
        const sortedByDueDate = [...assignmentsWithDueDates].sort(
          (a, b) =>
            new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime()
        );

        // Sort by priority (descending)
        const sortedByPriority = [...assignments].sort(
          (a, b) => b.priority - a.priority
        );

        // Recommendation 1: Urgent assignments (due within 3 days)
        const urgentAssignments = sortedByDueDate
          .filter(
            (a) =>
              a.due_at &&
              new Date(a.due_at).getTime() - now.getTime() <
                3 * 24 * 60 * 60 * 1000
          )
          .slice(0, 3);

        if (urgentAssignments.length > 0) {
          generatedRecommendations.push({
            title: "Urgent Assignments",
            description:
              "These assignments are due soon and should be prioritized",
            assignments: urgentAssignments,
            icon: "🔥",
          });
        }

        // Recommendation 2: High priority assignments
        const highPriorityAssignments = sortedByPriority
          .filter((a) => a.priority > 7)
          .slice(0, 3);

        if (highPriorityAssignments.length > 0) {
          generatedRecommendations.push({
            title: "High Impact Assignments",
            description:
              "These assignments have the highest impact on your grade",
            assignments: highPriorityAssignments,
            icon: "⭐",
          });
        }

        // Recommendation 3: Quick wins (low points but easy to complete)
        const quickWins = assignments
          .filter((a) => a.points_possible < 10 && a.points_possible > 0)
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

        setRecommendations(generatedRecommendations);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError("Failed to generate assignment recommendations");
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [courseId, token]);

  if (loading) {
    return <LoadingSpinner message="Generating recommendations..." />;
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
