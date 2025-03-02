import React from "react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "medium" | "large";
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading...",
  size = "medium",
}) => {
  // Size classes based on the size prop
  const sizeClasses = {
    small: "w-8 h-8 border-t-2",
    medium: "w-12 h-12 border-t-3",
    large: "w-16 h-16 border-t-4",
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={`${sizeClasses[size]} border-blue-500 border-solid rounded-full animate-spin`}
      ></div>
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
