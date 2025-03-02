"use client";

import { useEffect, useState, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import AssignmentCard from "@/app/components/AssignmentCard";
import DashboardHeader from "@/app/components/DashboardHeader";
import FilterBar from "@/app/components/FilterBar";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import Link from "next/link";
import dynamic from "next/dynamic";

// Define the assignments limit constant
const ASSIGNMENTS_LIMIT = 20;

// Use dynamic import with error handling instead of lazy
const AssignmentRecommendations = dynamic(
  () =>
    import("@/app/components/AssignmentRecommendations").catch((err) => {
      console.error("Error loading AssignmentRecommendations:", err);
      return () => (
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
              Failed to load recommendations
            </h3>
            <p className="text-gray-500">Please try refreshing the page</p>
          </div>
        </div>
      );
    }),
  {
    loading: () => (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    ),
    ssr: false,
  }
);

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

interface Course {
  id: number;
  name: string;
  code: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);

  // Filter states
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"priority" | "due_date" | "points">(
    "priority"
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    // Fetch courses
    const fetchCourses = async () => {
      try {
        const response = await fetch(`/api/py/courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }
        const data = await response.json();
        setCourses(data);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses");
      }
    };

    // Fetch assignments
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/py/assignments?skip_summarization=false&limit=${ASSIGNMENTS_LIMIT}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch assignments");
        }
        const data = await response.json();
        setAssignments(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching assignments:", error);
        setError("Failed to load assignments");
        setLoading(false);
      }
    };

    fetchCourses();
    fetchAssignments();
  }, [isAuthenticated, router, token]);

  // Filter and sort assignments
  const filteredAssignments = assignments
    .filter((assignment) => {
      // Filter by course if selected
      if (selectedCourse && assignment.course_id !== selectedCourse) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          assignment.name.toLowerCase().includes(query) ||
          assignment.course_name.toLowerCase().includes(query) ||
          (assignment.description &&
            assignment.description.toLowerCase().includes(query))
        );
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by selected criteria
      if (sortBy === "priority") {
        return (b.priority || 0) - (a.priority || 0);
      } else if (sortBy === "due_date") {
        const dateA = a.due_at ? new Date(a.due_at).getTime() : Infinity;
        const dateB = b.due_at ? new Date(b.due_at).getTime() : Infinity;
        return dateA - dateB;
      } else {
        // Sort by points
        return (b.points_possible || 0) - (a.points_possible || 0);
      }
    });

  // Group assignments by course
  const assignmentsByCourse = filteredAssignments.reduce((acc, assignment) => {
    const courseId = assignment.course_id;
    if (!acc[courseId]) {
      acc[courseId] = [];
    }
    acc[courseId].push(assignment);
    return acc;
  }, {} as Record<number, Assignment[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Canvas Dashboard</h1>
          <div className="text-gray-600">Showing your favorite courses</div>
          <Link
            href="/profile"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Profile
          </Link>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Assignment Dashboard
          </h2>
          {!loading && (
            <span className="text-gray-500">
              {filteredAssignments.length} assignments found
            </span>
          )}
        </div>

        <FilterBar
          courses={courses}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          sortBy={sortBy}
          setSortBy={setSortBy}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        ) : Object.keys(assignmentsByCourse).length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="flex justify-center mb-4">
              <svg
                className="w-16 h-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No assignments found
            </h3>
            <p className="text-gray-600">
              {selectedCourse
                ? "No assignments found for this favorite course. Check back later."
                : "No assignments found for your favorite courses. Try starring more courses in Canvas."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(assignmentsByCourse).map(
              ([courseId, courseAssignments]) => (
                <div
                  key={courseId}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    {courseAssignments[0].course_name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courseAssignments.map((assignment) => (
                      <AssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          {/* Use the dynamic component directly without Suspense */}
          <AssignmentRecommendations
            courseId={selectedCourse || 0}
            token={token || ""}
          />
        </div>
      </main>
    </div>
  );
}
