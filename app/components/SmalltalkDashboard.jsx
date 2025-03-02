"use client";

import { useState, useEffect } from "react";

/**
 * SmalltalkDashboard component
 * Displays data from the Smalltalk data service
 */
export default function SmalltalkDashboard() {
  const [students, setStudents] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [averageCompletion, setAverageCompletion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [smalltalkCode, setSmalltalkCode] = useState("");
  const [codeResult, setCodeResult] = useState(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState(null);

  // Fetch data from the Smalltalk API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all students
        const studentsResponse = await fetch(
          "/api/smalltalk?action=getAllStudents"
        );
        const studentsData = await studentsResponse.json();

        // Fetch top students
        const topStudentsResponse = await fetch(
          "/api/smalltalk?action=getTopStudents&count=3"
        );
        const topStudentsData = await topStudentsResponse.json();

        // Fetch average completion
        const avgResponse = await fetch(
          "/api/smalltalk?action=getAverageCompletion"
        );
        const avgData = await avgResponse.json();

        // Update state
        setStudents(studentsData.data || []);
        setTopStudents(topStudentsData.data || []);
        setAverageCompletion(avgData.data || 0);
        setError(null);
      } catch (err) {
        console.error("Error fetching Smalltalk data:", err);
        setError("Failed to load data from Smalltalk service");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Run Smalltalk code
  const runSmalltalkCode = async () => {
    if (!smalltalkCode.trim()) return;

    try {
      setCodeLoading(true);
      setCodeError(null);

      const response = await fetch("/api/smalltalk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: smalltalkCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setCodeResult(data.result);
      } else {
        setCodeError(data.error || "Error running Smalltalk code");
      }
    } catch (err) {
      console.error("Error running Smalltalk code:", err);
      setCodeError("Failed to run Smalltalk code");
    } finally {
      setCodeLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading Smalltalk data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Smalltalk Dashboard</h2>

      {/* Average Completion */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Average Completion</h3>
        <div className="text-3xl font-bold text-blue-600">
          {averageCompletion.toFixed(1)}%
        </div>
      </div>

      {/* Top Students */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Top Performing Students</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topStudents.map((student) => (
            <div key={student.id} className="p-4 border rounded-lg">
              <div className="font-bold">{student.name}</div>
              <div>{student.course}</div>
              <div className="text-sm text-gray-600">
                Grade: {student.grade}
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{ width: `${student.completionPercentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-right mt-1">
                  {student.completionPercentage}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Students */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">All Students</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left">ID</th>
                <th className="py-2 px-4 text-left">Name</th>
                <th className="py-2 px-4 text-left">Course</th>
                <th className="py-2 px-4 text-left">Grade</th>
                <th className="py-2 px-4 text-left">Completion</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b">
                  <td className="py-2 px-4">{student.id}</td>
                  <td className="py-2 px-4">{student.name}</td>
                  <td className="py-2 px-4">{student.course}</td>
                  <td className="py-2 px-4">{student.grade}</td>
                  <td className="py-2 px-4">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${student.completionPercentage}%` }}
                        ></div>
                      </div>
                      <span>{student.completionPercentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smalltalk Code Runner */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Run Smalltalk Code</h3>
        <div className="mb-4">
          <textarea
            className="w-full p-2 border rounded-md font-mono"
            rows="5"
            value={smalltalkCode}
            onChange={(e) => setSmalltalkCode(e.target.value)}
            placeholder="Enter Smalltalk code here..."
          ></textarea>
        </div>
        <div className="mb-4">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            onClick={runSmalltalkCode}
            disabled={codeLoading || !smalltalkCode.trim()}
          >
            {codeLoading ? "Running..." : "Run Code"}
          </button>
        </div>

        {codeError && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
            {codeError}
          </div>
        )}

        {codeResult !== null && !codeError && (
          <div className="p-3 bg-gray-100 rounded-md">
            <h4 className="font-semibold mb-2">Result:</h4>
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {typeof codeResult === "object"
                ? JSON.stringify(codeResult, null, 2)
                : String(codeResult)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
