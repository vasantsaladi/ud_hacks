"use client";

import { useState, useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface CourseInsightsProps {
  courseId: number;
  token: string;
}

interface Insight {
  title: string;
  description: string;
  type: "info" | "warning" | "success" | "tip";
  icon: string;
}

const CourseInsights: React.FC<CourseInsightsProps> = ({ courseId, token }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const generateInsights = async () => {
      setLoading(true);
      try {
        // Fetch course data
        const [assignmentsResponse, statisticsResponse] = await Promise.all([
          fetch(`/api/py/assignments?course_id=${courseId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`/api/py/course_statistics/${courseId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (!assignmentsResponse.ok || !statisticsResponse.ok) {
          throw new Error("Failed to fetch course data");
        }

        const assignments = await assignmentsResponse.json();
        const statistics = await statisticsResponse.json();

        // Generate insights based on the data
        const generatedInsights: Insight[] = [];

        // Insight 1: Upcoming deadlines
        const now = new Date();
        const upcomingAssignments = assignments
          .filter((a: any) => a.due_at && new Date(a.due_at) > now)
          .sort(
            (a: any, b: any) =>
              new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
          )
          .slice(0, 3);

        if (upcomingAssignments.length > 0) {
          generatedInsights.push({
            title: "Upcoming Deadlines",
            description: `You have ${
              upcomingAssignments.length
            } upcoming assignments. The next one is "${
              upcomingAssignments[0].name
            }" due on ${new Date(
              upcomingAssignments[0].due_at
            ).toLocaleDateString()}.`,
            type: "info",
            icon: "📅",
          });
        }

        // Insight 2: Course completion
        if (statistics.completion_percentage !== undefined) {
          const completionInsight: Insight = {
            title: "Course Progress",
            description: `You've completed ${statistics.completion_percentage.toFixed(
              1
            )}% of this course (${statistics.completed_assignments} out of ${
              statistics.total_assignments
            } assignments).`,
            type: statistics.completion_percentage > 75 ? "success" : "info",
            icon: "📊",
          };
          generatedInsights.push(completionInsight);
        }

        // Insight 3: Grade performance
        if (statistics.grade_percentage !== undefined) {
          let gradeType: "success" | "warning" | "info" = "info";
          if (statistics.grade_percentage >= 85) {
            gradeType = "success";
          } else if (statistics.grade_percentage < 70) {
            gradeType = "warning";
          }

          generatedInsights.push({
            title: "Grade Performance",
            description: `Your current grade is ${statistics.grade_percentage.toFixed(
              1
            )}%. ${
              gradeType === "success"
                ? "Great job maintaining a high grade!"
                : gradeType === "warning"
                ? "Consider focusing on improving your grade."
                : "Keep up the good work."
            }`,
            type: gradeType,
            icon: "🎓",
          });
        }

        // Insight 4: Past due assignments
        if (statistics.past_due_assignments > 0) {
          generatedInsights.push({
            title: "Past Due Assignments",
            description: `You have ${
              statistics.past_due_assignments
            } past due assignment${
              statistics.past_due_assignments === 1 ? "" : "s"
            }. Check if you can still submit them for partial credit.`,
            type: "warning",
            icon: "⏰",
          });
        }

        // Insight 5: Study tip
        generatedInsights.push({
          title: "Study Tip",
          description:
            "Breaking down assignments into smaller tasks can make them more manageable and reduce stress.",
          type: "tip",
          icon: "💡",
        });

        setInsights(generatedInsights);
        setLoading(false);
      } catch (err) {
        console.error("Error generating insights:", err);
        setError("Failed to generate course insights");
        setLoading(false);
      }
    };

    generateInsights();
  }, [courseId, token]);

  if (loading) {
    return <LoadingSpinner message="Generating insights..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error: {error}</p>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700">
        <p className="font-medium">No insights available for this course.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Course Insights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg shadow-sm border ${
              insight.type === "info"
                ? "bg-blue-50 border-blue-200"
                : insight.type === "warning"
                ? "bg-yellow-50 border-yellow-200"
                : insight.type === "success"
                ? "bg-green-50 border-green-200"
                : "bg-purple-50 border-purple-200"
            }`}
          >
            <div className="flex items-start">
              <div className="text-2xl mr-3">{insight.icon}</div>
              <div>
                <h3 className="font-medium text-gray-800">{insight.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {insight.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseInsights;
