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
  token: string;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  token,
}) => {
  const [showSummary, setShowSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(assignment.summary);

  // Determine priority color
  const getPriorityColor = (priority: number | null) => {
    if (!priority) return "bg-gray-200 text-gray-700";
    if (priority >= 10) return "bg-red-100 text-red-800 border-red-300";
    if (priority >= 7) return "bg-orange-100 text-orange-800 border-orange-300";
    if (priority >= 4) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  const getPriorityBorderColor = (priority: number | null) => {
    if (!priority) return "border-gray-200";
    if (priority >= 10) return "border-red-400";
    if (priority >= 7) return "border-orange-400";
    if (priority >= 4) return "border-yellow-400";
    return "border-green-400";
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

  // Calculate days remaining
  const getDaysRemaining = (dueDate: string | null) => {
    if (!dueDate) return null;

    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const daysRemaining = getDaysRemaining(assignment.due_at);

  // Get days remaining text and style
  const getDaysRemainingText = () => {
    if (daysRemaining === null) return null;

    if (daysRemaining < 0) {
      return { text: "Overdue", className: "text-red-600 font-medium" };
    } else if (daysRemaining === 0) {
      return { text: "Due today", className: "text-orange-600 font-medium" };
    } else if (daysRemaining === 1) {
      return { text: "Due tomorrow", className: "text-orange-600 font-medium" };
    } else if (daysRemaining <= 3) {
      return {
        text: `${daysRemaining} days left`,
        className: "text-orange-600 font-medium",
      };
    } else {
      return {
        text: `${daysRemaining} days left`,
        className: "text-green-600 font-medium",
      };
    }
  };

  const daysRemainingInfo = getDaysRemainingText();

  // Load summary if not already loaded
  const loadSummary = async () => {
    if (summary || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/py/assignment/${assignment.id}/summary?course_id=${assignment.course_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      } else {
        console.error(
          "Error loading summary: API returned status",
          response.status
        );
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
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 ${getPriorityBorderColor(
        assignment.priority
      )}`}
    >
      <div className="p-5">
        {/* Course name and points badge */}
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {assignment.course_name}
          </div>
          <div className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {assignment.points_possible
              ? `${assignment.points_possible} pts`
              : "No points"}
          </div>
        </div>

        {/* Assignment name */}
        <h3 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">
          {assignment.name}
        </h3>

        {/* Due date and priority */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center">
            <svg
              className="w-4 h-4 text-gray-500 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm text-gray-600">
              {formatDueDate(assignment.due_at)}
            </span>
          </div>

          {daysRemainingInfo && (
            <div className={`text-sm ${daysRemainingInfo.className}`}>
              {daysRemainingInfo.text}
            </div>
          )}
        </div>

        {/* Priority badge */}
        <div className="flex items-center mb-4">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
              assignment.priority
            )}`}
          >
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            {getPriorityLabel(assignment.priority)}
          </span>
        </div>

        {/* Summary toggle button */}
        <button
          onClick={toggleSummary}
          className="w-full py-2 px-4 border border-blue-500 rounded-md text-blue-600 hover:bg-blue-50 transition-colors duration-200 flex justify-center items-center font-medium"
        >
          {isLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></span>
          ) : (
            <svg
              className={`w-4 h-4 mr-2 transition-transform duration-200 ${
                showSummary ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
          {showSummary ? "Hide Details" : "Show Details"}
        </button>

        {/* Summary content */}
        {showSummary && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200 animate-fadeIn">
            <h4 className="font-medium text-gray-700 mb-2">
              Assignment Summary
            </h4>
            {summary ? (
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {summary}
              </p>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-4">
                <span className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                <span className="ml-2 text-sm text-gray-500">
                  Generating AI summary...
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No summary available. Try refreshing the page.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentCard;
