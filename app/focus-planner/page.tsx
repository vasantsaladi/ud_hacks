"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button, message, Spin } from "antd";
import Card from "antd/lib/card";
import Progress from "antd/lib/progress";
import Statistic from "antd/lib/statistic";
import Empty from "antd/lib/empty";
import List from "antd/lib/list";
import Divider from "antd/lib/divider";
import Space from "antd/lib/space";
import Tag from "antd/lib/tag";
import { ClockCircleOutlined, PlayCircleOutlined, PauseCircleOutlined, 
         ReloadOutlined, CheckCircleOutlined, BellOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import DashboardHeader from "@/app/components/DashboardHeader";
import LoadingSpinner from "@/app/components/LoadingSpinner";

// Types
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

interface Task {
  id: number;
  name: string;
  course_name: string;
  description: string;
  estimated_duration: number; // in minutes
  due_at: string | null;
  priority: number;
  completed: boolean;
}

// Main component
export default function SimpleFocusPlanner() {
  // Router
  const router = useRouter();
  
  // Auth
  const { isAuthenticated } = useAuth();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  
  // Assignments state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);
  
  // Task list
  const [dailyTasks, setDailyTasks] = useState<Task[]>([]);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  
  // Pomodoro Timer state - Fixed optimal settings
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerType, setTimerType] = useState<'work' | 'short_break' | 'long_break'>('work');
  const [timerProgress, setTimerProgress] = useState(100);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  
  // Fixed optimal Pomodoro settings
  const pomodoroSettings = {
    work_duration: 25, // 25 minutes work
    short_break: 5,    // 5 minutes short break
    long_break: 15,    // 15 minutes long break
    sessions_before_long_break: 4  // Long break after 4 work sessions
  };
  
  // Timer refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimeRef = useRef<number>(pomodoroSettings.work_duration * 60);
  
  // Authentication effect
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        message.error("Please log in to access the Focus Planner");
        router.push("/");
      } else {
        setIsAuthChecked(true);
        // Fetch assignments when authenticated
        fetchAssignments();
      }
    };
    
    checkAuth();
  }, [isAuthenticated, router]);
  
  // Fetch assignments from API
  const fetchAssignments = useCallback(async () => {
    setIsLoadingAssignments(true);
    setAssignmentsError(null);
    
    try {
      // Get Canvas token from localStorage
      const canvasToken = localStorage.getItem("canvasToken");
      
      if (!canvasToken) {
        setAssignmentsError("Authentication token not found. Please log in again.");
        router.push("/");
        return;
      }
      
      const response = await axios.get("/api/py/assignments", {
        headers: {
          user_token: canvasToken
        }
      });
      
      console.log("Fetched assignments:", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setAssignments(response.data);
        
        // Auto-generate daily tasks from assignments
        generateDailyTasks(response.data);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setAssignmentsError("Failed to load assignments. Please try again later.");
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [router]);
  
  // Generate daily tasks from assignments
  const generateDailyTasks = (assignmentsList: Assignment[]) => {
    setIsGeneratingTasks(true);
    
    try {
      // Sort assignments by due date and priority
      const sortedAssignments = [...assignmentsList].sort((a, b) => {
        // First sort by due date (null due dates go to the end)
        if (!a.due_at && b.due_at) return 1;
        if (a.due_at && !b.due_at) return -1;
        if (a.due_at && b.due_at) {
          const dateA = dayjs(a.due_at);
          const dateB = dayjs(b.due_at);
          if (dateA.isBefore(dateB)) return -1;
          if (dateA.isAfter(dateB)) return 1;
        }
        
        // Then sort by priority (higher priority first)
        const priorityA = a.priority || 5;
        const priorityB = b.priority || 5;
        return priorityB - priorityA;
      });
      
      // Take top 5 assignments for today's tasks
      const topAssignments = sortedAssignments.slice(0, 5);
      
      // Convert assignments to tasks
      const tasks: Task[] = topAssignments.map(assignment => ({
        id: assignment.id,
        name: assignment.name,
        course_name: assignment.course_name,
        description: assignment.description || "No description available",
        estimated_duration: Math.max(25, Math.min(50, Math.round((assignment.points_possible || 10) * 5))), // Base duration on points, between 25-50 minutes
        due_at: assignment.due_at,
        priority: assignment.priority || 5,
        completed: false
      }));
      
      setDailyTasks(tasks);
    } catch (error) {
      console.error("Error generating daily tasks:", error);
      message.error("Failed to generate daily tasks");
    } finally {
      setIsGeneratingTasks(false);
    }
  };
  
  // Timer effects
  useEffect(() => {
    // Update progress bar
    const total = 
      timerType === 'work' ? pomodoroSettings.work_duration * 60 :
      timerType === 'short_break' ? pomodoroSettings.short_break * 60 :
      pomodoroSettings.long_break * 60;
    
    totalTimeRef.current = total;
    setTimerProgress(Math.floor((timeRemaining / total) * 100));
    
    // Sound when timer completes
    if (timeRemaining === 0 && timerRef.current) {
      // Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log("Error playing sound:", e));
      
      // Clear timer
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsTimerRunning(false);
      
      // Switch timer type
      if (timerType === 'work') {
        // Increment completed sessions
        const newSessionsCompleted = sessionsCompleted + 1;
        setSessionsCompleted(newSessionsCompleted);
        
        // Determine next break type
        if (newSessionsCompleted % pomodoroSettings.sessions_before_long_break === 0) {
          // Time for a long break
          setTimerType('long_break');
          setTimeRemaining(pomodoroSettings.long_break * 60);
          message.success("Work session complete! Time for a long break.");
        } else {
          // Time for a short break
          setTimerType('short_break');
          setTimeRemaining(pomodoroSettings.short_break * 60);
          message.success("Work session complete! Time for a short break.");
        }
        
        // Mark current task as completed if we've done enough sessions for it
        if (dailyTasks.length > 0 && currentTaskIndex < dailyTasks.length) {
          const task = dailyTasks[currentTaskIndex];
          const sessionsNeeded = Math.ceil(task.estimated_duration / pomodoroSettings.work_duration);
          
          if (newSessionsCompleted % sessionsNeeded === 0) {
            // Mark task as completed
            const updatedTasks = [...dailyTasks];
            updatedTasks[currentTaskIndex] = {
              ...updatedTasks[currentTaskIndex],
              completed: true
            };
            setDailyTasks(updatedTasks);
            
            // Move to next task
            if (currentTaskIndex < dailyTasks.length - 1) {
              setCurrentTaskIndex(currentTaskIndex + 1);
            }
          }
        }
      } else {
        // Break is over, back to work
        setTimerType('work');
        setTimeRemaining(pomodoroSettings.work_duration * 60);
        message.info("Break time is over. Let's get back to work!");
      }
    }
  }, [timeRemaining, timerType, sessionsCompleted, pomodoroSettings, dailyTasks, currentTaskIndex]);
  
  // Start/stop timer
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => Math.max(0, prevTime - 1));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerRunning]);
  
  // Format time function
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Timer controls
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };
  
  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsTimerRunning(false);
    
    // Reset to current timer type duration
    if (timerType === 'work') {
      setTimeRemaining(pomodoroSettings.work_duration * 60);
    } else if (timerType === 'short_break') {
      setTimeRemaining(pomodoroSettings.short_break * 60);
    } else {
      setTimeRemaining(pomodoroSettings.long_break * 60);
    }
  };
  
  const skipTimer = () => {
    // Force timer to complete
    setTimeRemaining(0);
  };
  
  // Handle task completion toggle
  const toggleTaskCompletion = (taskIndex: number) => {
    const updatedTasks = [...dailyTasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      completed: !updatedTasks[taskIndex].completed
    };
    setDailyTasks(updatedTasks);
    
    if (!updatedTasks[taskIndex].completed && taskIndex !== currentTaskIndex) {
      setCurrentTaskIndex(taskIndex);
    }
  };
  
  // If auth is not checked yet, show loading spinner
  if (!isAuthChecked) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="focus-planner-container">
      <div className="focus-planner-header">
        <h1>Focus Planner</h1>
        <p>Optimize your study time with the Pomodoro Technique</p>
      </div>
      
      <div className="focus-planner-content">
        <div className="focus-planner-layout">
          {/* Left side: To-Do List */}
          <div className="task-list-container">
            <Card 
              title={<span><BellOutlined /> Today's Study Tasks</span>}
              className="tasks-card"
              loading={isGeneratingTasks || isLoadingAssignments}
            >
              {dailyTasks.length > 0 ? (
                <List
                  itemLayout="vertical"
                  dataSource={dailyTasks}
                  renderItem={(task: Task, index: number) => (
                    <List.Item
                      key={task.id}
                      className={`task-item ${index === currentTaskIndex ? 'active-task' : ''} ${task.completed ? 'completed-task' : ''}`}
                      onClick={() => !task.completed && setCurrentTaskIndex(index)}
                      actions={[
                        <Button 
                          key="complete" 
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            toggleTaskCompletion(index);
                          }}
                          type={task.completed ? "primary" : "default"}
                        >
                          {task.completed ? "Completed" : "Mark Complete"}
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <div className="task-header">
                            <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                              {task.name}
                            </span>
                            <Tag color={task.priority > 7 ? 'red' : task.priority > 4 ? 'orange' : 'green'}>
                              Priority: {task.priority}
                            </Tag>
                          </div>
                        }
                        description={
                          <div className="task-meta">
                            <div><strong>Course:</strong> {task.course_name}</div>
                            <div><strong>Estimated time:</strong> {task.estimated_duration} minutes</div>
                            {task.due_at && (
                              <div>
                                <strong>Due:</strong> {dayjs(task.due_at).format('MMM DD, YYYY')}
                              </div>
                            )}
                          </div>
                        }
                      />
                      <div className="task-description">
                        {task.description}
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty 
                  description={
                    assignmentsError ? 
                      <div>
                        {assignmentsError}
                        <div style={{ marginTop: '16px' }}>
                          <Button type="primary" onClick={fetchAssignments}>Retry</Button>
                        </div>
                      </div>
                    : "No tasks for today. Enjoy your day off!"
                  } 
                />
              )}
            </Card>
          </div>
          
          {/* Right side: Pomodoro Timer */}
          <div className="pomodoro-container">
            <Card 
              title={<span><ClockCircleOutlined /> Pomodoro Timer</span>}
              className="pomodoro-card"
            >
              <div className="timer-container">
                <div className="current-technique">
                  <h3>Optimal Pomodoro Technique</h3>
                  <p>25 minutes work, 5 minutes short break</p>
                  <p>After 4 work sessions, take a 15 minute long break</p>
                </div>
                
                <div className="timer-progress">
                  <Progress
                    type="circle"
                    percent={timerProgress}
                    format={() => formatTime(timeRemaining)}
                    status={timerType === 'work' ? 'active' : 'success'}
                    width={200}
                  />
                  <div className="timer-type">
                    {timerType === 'work' ? 'Work Session' : timerType === 'short_break' ? 'Short Break' : 'Long Break'}
                  </div>
                </div>
                
                <Space className="timer-controls">
                  <Button 
                    type="primary" 
                    size="large" 
                    onClick={toggleTimer} 
                    icon={isTimerRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  >
                    {isTimerRunning ? 'Pause' : 'Start'}
                  </Button>
                  <Button 
                    size="large" 
                    onClick={resetTimer} 
                    icon={<ReloadOutlined />}
                  >
                    Reset
                  </Button>
                  <Button 
                    size="large" 
                    onClick={skipTimer} 
                    icon={<ClockCircleOutlined />}
                  >
                    Skip
                  </Button>
                </Space>
                
                <Divider />
                
                <div className="session-stats">
                  <Statistic 
                    title="Sessions Completed" 
                    value={sessionsCompleted} 
                    prefix={<CheckCircleOutlined />} 
                  />
                  
                  {dailyTasks.length > 0 && currentTaskIndex < dailyTasks.length && (
                    <div className="current-task-info">
                      <h3>Current Task</h3>
                      <div className="current-task-name">
                        {dailyTasks[currentTaskIndex].name}
                      </div>
                      <div className="current-task-course">
                        {dailyTasks[currentTaskIndex].course_name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .focus-planner-container {
          padding: 24px;
        }

        .focus-planner-header {
          margin-bottom: 24px;
        }

        .focus-planner-header h1 {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .focus-planner-header p {
          color: #666;
        }
        
        .focus-planner-layout {
          display: flex;
          gap: 24px;
          margin-top: 24px;
        }
        
        .task-list-container {
          flex: 1;
        }
        
        .pomodoro-container {
          flex: 1;
        }
        
        .active-task {
          border-left: 4px solid #1890ff;
          padding-left: 12px;
          background-color: #f0f8ff;
        }
        
        .completed-task {
          opacity: 0.7;
          background-color: #f6ffed;
        }
        
        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .task-meta {
          margin: 8px 0;
        }
        
        .task-description {
          margin-top: 8px;
          color: #595959;
        }
        
        .timer-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
        }
        
        .timer-progress {
          margin: 24px 0;
          text-align: center;
        }
        
        .timer-type {
          margin-top: 16px;
          font-size: 18px;
          font-weight: bold;
        }
        
        .timer-controls {
          margin: 24px 0;
        }
        
        .session-stats {
          width: 100%;
          text-align: center;
          margin-top: 16px;
        }
        
        .current-task-info {
          margin-top: 24px;
          padding: 16px;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          background-color: #fafafa;
        }
        
        .current-task-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .current-technique {
          text-align: center;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}