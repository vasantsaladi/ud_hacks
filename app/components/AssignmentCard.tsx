"use client";

import React, { useState } from "react";
import { format } from "date-fns";

interface Assignment {
  id: number;
  name: string;
  description: string | null;
  due_at: string | null;
  points_possible: number | null;
  course_id: number;
  course_name: string;
  priority: number | null;
  summary: string | null;
}

interface AssignmentCardProps {
  assignment: Assignment;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(assignment.summary);

  // Determine priority color
  const getPriorityColor = (priority: number | null) => {
    if (!priority) return "bg-gray-200";
    if (priority >= 10) return "bg-red-500";
    if (priority >= 7) return "bg-orange-500";
    if (priority >= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPriorityLabel = (priority: number | null) => {
    if (!priority) return "No Priority";
    if (priority >= 10) return "Urgent";
    if (priority >= 7) return "High";
    if (priority >= 4) return "Medium";
    return "Low";
  };

  // Format due date
  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return "No due date";
    return format(new Date(dueDate), "MMM d, yyyy h:mm a");
  };

  // Load summary if not already loaded
  const loadSummary = async () => {
    if (summary || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/py/assignment/${
          assignment.id
        }/summary?token=${localStorage.getItem("canvas_token")}&course_id=${
          assignment.course_id
        }`
      );
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Error loading summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSummary = () => {
    if (!showSummary && !summary) {
      loadSummary();
    }
    setShowSummary(!showSummary);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Priority indicator */}
      <div className={`h-2 ${getPriorityColor(assignment.priority)}`}></div>

      <div className="p-5">
        {/* Course name */}
        <div className="text-sm text-gray-500 mb-1">
          {assignment.course_name}
        </div>

        {/* Assignment name */}
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {assignment.name}
        </h3>

        {/* Due date and points */}
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-gray-600">
            Due: {formatDueDate(assignment.due_at)}
          </div>
          <div className="text-sm font-medium">
            {assignment.points_possible
              ? `${assignment.points_possible} pts`
              : "No points"}
          </div>
        </div>

        {/* Priority badge */}
        <div className="flex items-center mb-4">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
              assignment.priority
            )} text-white`}
          >
            {getPriorityLabel(assignment.priority)}
          </span>
        </div>

        {/* Summary toggle button */}
        <button
          onClick={toggleSummary}
          className="w-full py-2 px-4 border border-blue-500 rounded-md text-blue-500 hover:bg-blue-50 transition-colors duration-200 flex justify-center items-center"
        >
          {isLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></span>
          ) : null}
          {showSummary ? "Hide Summary" : "Show Summary"}
        </button>

        {/* Summary content */}
        {showSummary && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            {summary ? (
              <p className="text-sm text-gray-700">{summary}</p>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No summary available
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentCard;
