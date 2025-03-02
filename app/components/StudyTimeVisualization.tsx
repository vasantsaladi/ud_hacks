"use client";

import { useState, useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface StudyTimeVisualizationProps {
  courseId: number;
  token: string;
}

interface StudySession {
  day: string;
  hours: number;
  productivity: number;
}

interface StudyPattern {
  most_productive_day: string;
  most_productive_time: string;
  average_session_length: number;
  recommended_session_length: number;
  recommended_break_interval: number;
}

interface StudyTimeAnalytics {
  study_sessions: StudySession[];
  study_pattern: StudyPattern;
}

const StudyTimeVisualization: React.FC<StudyTimeVisualizationProps> = ({
  courseId,
  token,
}) => {
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [studyPattern, setStudyPattern] = useState<StudyPattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const fetchStudyData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/py/study_time_analytics/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch study time analytics");
        }

        const data: StudyTimeAnalytics = await response.json();
        setStudySessions(data.study_sessions);
        setStudyPattern(data.study_pattern);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching study data:", err);
        setError("Failed to load study time data");
        setLoading(false);
      }
    };

    fetchStudyData();
  }, [courseId, token]);

  if (loading) {
    return <LoadingSpinner message="Analyzing study patterns..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error: {error}</p>
      </div>
    );
  }

  // Find the maximum hours to normalize the chart
  const maxHours = Math.max(...studySessions.map((session) => session.hours));

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Study Time Analysis</h2>

      {/* Weekly study hours chart */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-700 mb-3">
          Weekly Study Hours
        </h3>
        <div className="flex items-end space-x-2 h-40">
          {studySessions.map((session, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-blue-500 rounded-t"
                style={{
                  height: `${(session.hours / maxHours) * 100}%`,
                  backgroundColor: `rgba(59, 130, 246, ${
                    0.5 + session.productivity / 200
                  })`,
                }}
              ></div>
              <div className="text-xs mt-1 text-gray-600">
                {session.day.substring(0, 3)}
              </div>
              <div className="text-xs font-medium">
                {session.hours.toFixed(1)}h
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Study pattern insights */}
      {studyPattern && (
        <div className="border-t pt-4">
          <h3 className="text-md font-medium text-gray-700 mb-3">
            Study Pattern Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800">
                Productivity Insights
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>
                  • Most productive day:{" "}
                  <span className="font-medium">
                    {studyPattern.most_productive_day}
                  </span>
                </li>
                <li>
                  • Most productive time:{" "}
                  <span className="font-medium">
                    {studyPattern.most_productive_time}
                  </span>
                </li>
                <li>
                  • Average session:{" "}
                  <span className="font-medium">
                    {studyPattern.average_session_length.toFixed(1)} hours
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800">Recommendations</h4>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>
                  • Optimal session length:{" "}
                  <span className="font-medium">
                    {studyPattern.recommended_session_length.toFixed(1)} hours
                  </span>
                </li>
                <li>
                  • Take breaks every{" "}
                  <span className="font-medium">
                    {studyPattern.recommended_break_interval} minutes
                  </span>
                </li>
                <li>
                  • Try to study more on{" "}
                  <span className="font-medium">
                    {studyPattern.most_productive_day}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500 italic">
        <p>
          Note: This visualization uses simulated data for demonstration
          purposes.
        </p>
      </div>
    </div>
  );
};

export default StudyTimeVisualization;
