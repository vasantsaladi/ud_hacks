"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import AssignmentCard from "@/app/components/AssignmentCard";
import DashboardHeader from "@/app/components/DashboardHeader";
import FilterBar from "@/app/components/FilterBar";
import LoadingSpinner from "@/app/components/LoadingSpinner";

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
        const response = await fetch(`/api/py/courses?token=${token}`);
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
      try {
        const response = await fetch(`/api/py/assignments?token=${token}`);
        if (!response.ok) {
          throw new Error("Failed to fetch assignments");
        }
        const data = await response.json();
        setAssignments(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching assignments:", err);
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
      // Filter by course
      if (selectedCourse && assignment.course_id !== selectedCourse) {
        return false;
      }

      // Filter by search query
      if (
        searchQuery &&
        !assignment.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by selected criteria
      if (sortBy === "priority") {
        return (b.priority || 0) - (a.priority || 0);
      } else if (sortBy === "due_date") {
        if (!a.due_at) return 1;
        if (!b.due_at) return -1;
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      } else if (sortBy === "points") {
        return (b.points_possible || 0) - (a.points_possible || 0);
      }
      return 0;
    });

  if (loading) {
    return <LoadingSpinner message="Loading your assignments..." />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          onClick={() => router.push("/")}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <FilterBar
          courses={courses}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          sortBy={sortBy}
          setSortBy={setSortBy}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.length > 0 ? (
            filteredAssignments.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <h3 className="text-xl font-semibold text-gray-700">
                No assignments found
              </h3>
              <p className="text-gray-500 mt-2">
                Try adjusting your filters or check back later
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
