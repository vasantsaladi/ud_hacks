"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import DashboardHeader from "@/app/components/DashboardHeader";
import LoadingSpinner from "@/app/components/LoadingSpinner";

interface Course {
  id: number;
  name: string;
  code: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function Chat() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your Canvas Assistant. How can I help you with your courses today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

        // Select first course by default if available
        if (data.length > 0 && !selectedCourse) {
          setSelectedCourse(data[0].id);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses");
        setLoading(false);
      }
    };

    fetchCourses();
  }, [isAuthenticated, router, token, selectedCourse]);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    // Add user message to chat
    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsProcessing(true);

    try {
      // Prepare context for the AI
      let context = "";
      if (selectedCourse) {
        // Get assignments for the selected course
        const assignmentsResponse = await fetch(
          `/api/py/assignments?course_id=${selectedCourse}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (assignmentsResponse.ok) {
          const assignments = await assignmentsResponse.json();
          context += `Course: ${
            courses.find((c) => c.id === selectedCourse)?.name ||
            "Selected Course"
          }\n`;
          context += "Assignments:\n";
          assignments.forEach((assignment: any) => {
            context += `- ${assignment.name} (Due: ${
              assignment.due_at
                ? new Date(assignment.due_at).toLocaleDateString()
                : "No due date"
            })\n`;
          });
        }
      }

      // Send message to AI endpoint
      const response = await fetch(`/api/py/gemini`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: `You are a helpful Canvas LMS assistant. The user is asking about their course work.
          
          Context about the user's courses:
          ${context}
          
          User question: ${inputMessage}
          
          Provide a helpful, concise response. If you don't know something specific, suggest where they might find that information in Canvas.`,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();

      // Add AI response to chat
      const assistantMessage: Message = {
        role: "assistant",
        content:
          data.text ||
          "I'm sorry, I couldn't process your request at this time.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Error sending message:", err);

      // Add error message
      const errorMessage: Message = {
        role: "assistant",
        content:
          "I'm sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading chat..." />;
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
          onClick={() => router.push("/dashboard")}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader />

      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Canvas Assistant Chat
          </h1>

          {/* Course selector */}
          <div className="w-64">
            <select
              value={selectedCourse || ""}
              onChange={(e) =>
                setSelectedCourse(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="" disabled>
                Select a course for context
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chat messages container */}
        <div className="flex-grow bg-white rounded-lg shadow-md p-4 mb-4 overflow-y-auto max-h-[calc(100vh-300px)]">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-3/4 rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === "user"
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message input */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask about your assignments, due dates, or course materials..."
            className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={isProcessing}
          />
          <button
            onClick={handleSendMessage}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-md ${
              isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white font-medium`}
          >
            {isProcessing ? "Sending..." : "Send"}
          </button>
        </div>
      </main>
    </div>
  );
}
