"use client";

import React from "react";

interface Course {
  id: number;
  name: string;
  code: string;
}

interface FilterBarProps {
  courses: Course[];
  selectedCourse: number | null;
  setSelectedCourse: (courseId: number | null) => void;
  sortBy: "priority" | "due_date" | "points";
  setSortBy: (sortBy: "priority" | "due_date" | "points") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  courses,
  selectedCourse,
  setSelectedCourse,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Course Filter */}
        <div>
          <label
            htmlFor="course-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Course
          </label>
          <select
            id="course-filter"
            value={selectedCourse || ""}
            onChange={(e) =>
              setSelectedCourse(e.target.value ? Number(e.target.value) : null)
            }
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label
            htmlFor="sort-by"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Sort By
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "priority" | "due_date" | "points")
            }
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="priority">Priority</option>
            <option value="due_date">Due Date</option>
            <option value="points">Points</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Search
          </label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
