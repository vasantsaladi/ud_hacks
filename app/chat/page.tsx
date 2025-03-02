"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
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
  isTyping?: boolean;
}

interface SuggestionPanel {
  title: string;
  description: string;
  prompt: string;
  icon: JSX.Element;
}

interface FileUpload {
  file: File;
  preview: string;
  type: string;
  analysis?: string;
}

// Add this new interface for file analysis
interface FileAnalysisResponse {
  text: string;
  file_type: string;
  analysis: string;
}

// TypewriterMessage component
const TypewriterMessage = ({
  content,
  onComplete,
}: {
  content: string;
  onComplete: () => void;
}) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formattedContent, setFormattedContent] = useState<JSX.Element[]>([]);

  // Process the displayed content to format bold text
  useEffect(() => {
    const parts = displayedContent.split(/(\*\*.*?\*\*)/g);
    const formatted = parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        // Remove asterisks and wrap in bold tag
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
    setFormattedContent(formatted);
  }, [displayedContent]);

  useEffect(() => {
    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent((prev) => prev + content[currentIndex]);
        setCurrentIndex(currentIndex + 1);
      }, 30); // Adjust typing speed here (milliseconds)

      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [currentIndex, content, onComplete]);

  return <p className="whitespace-pre-wrap">{formattedContent}</p>;
};

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
  const [fileUpload, setFileUpload] = useState<FileUpload | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add suggestion panels data
  const suggestionPanels: SuggestionPanel[] = [
    {
      title: "Due This Week",
      description: "Check what assignments are due in the next 7 days",
      prompt:
        "What assignments are due in the next 7 days across all my courses?",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      title: "Assignment Status",
      description: "View completed and pending assignments",
      prompt:
        "Show me a summary of my completed and pending assignments for all courses.",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
    {
      title: "Course Overview",
      description: "Get a summary of all your courses",
      prompt: "Give me an overview of all my courses and their current status.",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    {
      title: "Grade Analysis",
      description: "Check your current grades and performance",
      prompt:
        "What are my current grades across all courses? Include any recent grade updates.",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

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

  // Modify handleFileSelect to show analysis in chat
  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type and size
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload an image (JPEG, PNG, GIF) or PDF file.");
      return;
    }

    if (file.size > maxSize) {
      alert("File size should be less than 5MB.");
      return;
    }

    // Create preview for images
    let preview = "";
    if (file.type.startsWith("image/")) {
      preview = URL.createObjectURL(file);
    }

    // Set initial file upload state
    setFileUpload({
      file,
      preview,
      type: file.type,
    });

    // Upload and analyze the file
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/py/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const uploadData = await uploadResponse.json();

      // Get file analysis
      const analysis = await analyzeFile(uploadData.file_url);

      // Update file upload state with analysis
      setFileUpload((prev) => ({
        ...prev!,
        analysis,
      }));

      // Add file upload message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: file.type.startsWith("image/")
            ? `![Uploaded Image](${preview})`
            : `📎 Uploaded: ${file.name}`,
          timestamp: new Date(),
        },
        {
          role: "assistant",
          content: `I've analyzed your ${
            file.type.startsWith("image/") ? "image" : "PDF"
          } file (${
            file.name
          }). Here's what I found:\n\n${analysis}\n\nYou can now type your question about this content, and I'll help you understand how it relates to your courses.`,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to process file. Please try again.");
    }
  };

  // Modify handleSendMessage to handle both file and text
  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !fileUpload) || isProcessing) return;

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
      // Add a temporary typing indicator message
      const typingMessage: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isTyping: true,
      };
      setMessages((prev) => [...prev, typingMessage]);

      // Prepare context for all courses
      let context = "Your enrolled courses and their assignments:\n\n";

      // Fetch assignments for all courses
      const assignmentsPromises = courses.map(async (course) => {
        try {
          const response = await fetch(
            `/api/py/assignments?course_id=${course.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

          if (response.ok) {
            const assignments = await response.json();
            let courseContext = `Course: ${course.name} (${course.code})\n`;
            courseContext += "Assignments:\n";
          assignments.forEach((assignment: any) => {
              courseContext += `- ${assignment.name} (Due: ${
              assignment.due_at
                ? new Date(assignment.due_at).toLocaleDateString()
                : "No due date"
            })\n`;
          });
            courseContext += "\n";
            return courseContext;
          }
          return "";
        } catch (error) {
          console.error(
            `Error fetching assignments for course ${course.id}:`,
            error
          );
          return "";
        }
      });

      const courseContexts = await Promise.all(assignmentsPromises);
      context += courseContexts.join("");

      // Send message to AI endpoint with file analysis if available
      const response = await fetch(`/api/py/gemini`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: `You are a helpful Canvas LMS assistant. The user is asking about their course work.
          
          Context about all of the user's courses:
          ${context}
          ${
            fileUpload?.analysis
              ? `\nFile Analysis:\n${fileUpload.analysis}\n`
              : ""
          }
          
          User question: ${inputMessage}
          
          Provide a helpful, concise response. Consider information from all available courses when answering. If the user has uploaded a file, relate their question to the file's content and its relevance to their courses. If you don't know something specific, suggest where they might find that information in Canvas.`,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();

      // Remove typing indicator and add the actual response
      setMessages((prev) => {
        const newMessages = prev.filter((msg) => !msg.isTyping);
        return [
          ...newMessages,
          {
            role: "assistant",
            content:
              data.text ||
              "I'm sorry, I couldn't process your request at this time.",
            timestamp: new Date(),
          },
        ];
      });

      // Clear the file upload after successful processing
      if (fileUpload) {
        setFileUpload(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);

      // Remove typing indicator and add error message
      setMessages((prev) => {
        const newMessages = prev.filter((msg) => !msg.isTyping);
        return [
          ...newMessages,
          {
            role: "assistant",
            content:
              "I'm sorry, I encountered an error processing your request. Please try again later.",
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Add function to handle suggestion clicks
  const handleSuggestionClick = async (prompt: string) => {
    if (isProcessing) return;

    // Add user message to chat
    const userMessage: Message = {
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Add a temporary typing indicator message
      const typingMessage: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isTyping: true,
      };
      setMessages((prev) => [...prev, typingMessage]);

      // Prepare context for all courses
      let context = "Your enrolled courses and their assignments:\n\n";

      // Fetch assignments for all courses
      const assignmentsPromises = courses.map(async (course) => {
        try {
          const response = await fetch(
            `/api/py/assignments?course_id=${course.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const assignments = await response.json();
            let courseContext = `Course: ${course.name} (${course.code})\n`;
            courseContext += "Assignments:\n";
            assignments.forEach((assignment: any) => {
              courseContext += `- ${assignment.name} (Due: ${
                assignment.due_at
                  ? new Date(assignment.due_at).toLocaleDateString()
                  : "No due date"
              })\n`;
            });
            courseContext += "\n";
            return courseContext;
          }
          return "";
        } catch (error) {
          console.error(
            `Error fetching assignments for course ${course.id}:`,
            error
          );
          return "";
        }
      });

      const courseContexts = await Promise.all(assignmentsPromises);
      context += courseContexts.join("");

      // Send message to AI endpoint
      const response = await fetch(`/api/py/gemini`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: `You are a helpful Canvas LMS assistant. The user is asking about their course work.
          
          Context about all of the user's courses:
          ${context}
          
          User question: ${prompt}
          
          Provide a helpful, concise response. Consider information from all available courses when answering. If you don't know something specific, suggest where they might find that information in Canvas.`,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();

      // Remove typing indicator and add the actual response
      setMessages((prev) => {
        const newMessages = prev.filter((msg) => !msg.isTyping);
        return [
          ...newMessages,
          {
        role: "assistant",
        content:
          data.text ||
          "I'm sorry, I couldn't process your request at this time.",
        timestamp: new Date(),
          },
        ];
      });
    } catch (err) {
      console.error("Error sending message:", err);

      // Remove typing indicator and add error message
      setMessages((prev) => {
        const newMessages = prev.filter((msg) => !msg.isTyping);
        return [
          ...newMessages,
          {
        role: "assistant",
        content:
          "I'm sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Add this function to handle file analysis
  const analyzeFile = async (fileUrl: string): Promise<string> => {
    try {
      const response = await fetch(`/api/py/analyze?file_url=${fileUrl}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to analyze file");
      }

      const analysisData: FileAnalysisResponse = await response.json();
      return analysisData.analysis;
    } catch (error) {
      console.error("Error analyzing file:", error);
      return "Could not analyze file content.";
    }
  };

  // Add this function to handle file upload
  const handleFileUpload = async () => {
    if (!fileUpload) return;

    const formData = new FormData();
    formData.append("file", fileUpload.file);

    try {
      const response = await fetch("/api/py/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();

      // Add the file preview or link to the chat
      const fileMessage: Message = {
        role: "user",
        content: fileUpload.type.startsWith("image/")
          ? `![Uploaded Image](${fileUpload.preview})`
          : `📎 Uploaded: ${fileUpload.file.name}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, fileMessage]);
      setFileUpload(null);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
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

          <div className="text-sm text-gray-600">
            {courses.length} Course{courses.length !== 1 ? "s" : ""} Loaded
          </div>
        </div>

        {/* Suggestion Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {suggestionPanels.map((panel, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(panel.prompt)}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-md transition-all duration-200 text-left group"
              disabled={isProcessing}
            >
              <div className="flex items-start space-x-3">
                <div className="text-blue-500 group-hover:text-blue-600 transition-colors">
                  {panel.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {panel.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {panel.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Chat messages container */}
        <div className="flex-grow bg-white rounded-lg shadow-md p-6 mb-4 overflow-y-auto max-h-[calc(100vh-300px)] border border-gray-100">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } animate-fade-in`}
              >
                <div
                  className={`max-w-3/4 rounded-2xl px-6 py-3 shadow-sm ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-50 text-gray-800 border border-gray-100"
                  }`}
                >
                  {/* Avatar and message content wrapper */}
                  <div className="flex items-start space-x-2">
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="flex-grow">
                      {message.role === "assistant" ? (
                        message.isTyping ? (
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            ></div>
                          </div>
                        ) : (
                          <TypewriterMessage
                            content={message.content}
                            onComplete={() => {
                              // You can add any post-typing effects here
                            }}
                          />
                        )
                      ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                  <p
                        className={`text-xs mt-2 ${
                      message.role === "user"
                        ? "text-blue-100"
                            : "text-gray-400"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message input */}
        <div className="flex items-start space-x-3 bg-white p-4 rounded-lg shadow-md border border-gray-100">
          {/* File upload button */}
          <div className="relative">
          <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/jpeg,image/png,image/gif,application/pdf"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Upload file"
            >
              <svg
                className="w-6 h-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </button>
          </div>

          {/* File preview if uploaded */}
          {fileUpload && (
            <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
              {fileUpload.type.startsWith("image/") ? (
                <img
                  src={fileUpload.preview}
                  alt="Preview"
                  className="h-8 w-8 object-cover rounded"
                />
              ) : (
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              )}
              <div className="ml-2">
                <div className="text-sm text-gray-600">
                  {fileUpload.file.name}
                </div>
                {fileUpload.analysis === undefined ? (
                  <div className="text-xs text-blue-500">Analyzing file...</div>
                ) : (
                  <div className="text-xs text-green-500">
                    Analysis complete - prompt suggested
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setFileUpload(null);
                  setInputMessage("");
                }}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          )}

          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (fileUpload) {
                  handleFileUpload();
                } else {
                  handleSendMessage();
                }
              }
            }}
            placeholder="Ask about your assignments, due dates, or course materials... (Press Enter to send, Shift+Enter for new line)"
            className="flex-grow rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[50px] p-4 resize-none bg-gray-50"
            disabled={isProcessing}
          />
          <button
            onClick={fileUpload ? handleFileUpload : handleSendMessage}
            disabled={isProcessing}
            className={`px-6 py-2 rounded-lg h-[50px] flex items-center justify-center min-w-[100px] transition-colors duration-200 ${
              isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white font-medium shadow-sm`}
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div
                  className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            ) : fileUpload ? (
              "Upload"
            ) : (
              "Send"
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
