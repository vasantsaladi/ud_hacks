from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
import os
from datetime import datetime, timedelta
import google.generativeai as genai
from dotenv import load_dotenv
import asyncio
from canvasapi import Canvas
import time
from functools import lru_cache

# Load environment variables from both root and api directories
load_dotenv()  # Load from root .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))  # Load from api/.env file

# Debug: Print API key (partially masked)
api_key = os.getenv("GEMINI_API_KEY", "")
if api_key:
    masked_key = api_key[:4] + "*" * (len(api_key) - 8) + api_key[-4:] if len(api_key) > 8 else "****"
    print(f"Gemini API Key found: {masked_key}")
else:
    print("Gemini API Key not found!")

# Initialize Gemini API
try:
    genai.configure(api_key=api_key)
    print("Gemini API configured successfully")
except Exception as e:
    print(f"Error configuring Gemini API: {e}")

# Create FastAPI instance with custom docs and openapi url
app = FastAPI(
    title="Canvas Assistant API",
    description="API for Canvas LMS integration with content summarization and prioritization",
    version="1.0.0",
    docs_url="/api/py/docs", 
    openapi_url="/api/py/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Canvas API base URL
CANVAS_API_BASE_URL = "https://canvas.instructure.com/api/v1"
# Get Canvas API token from environment
CANVAS_API_TOKEN = os.getenv("CANVAS_API_TOKEN", "")

# Models
class Assignment(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    due_at: Optional[datetime] = None
    points_possible: Optional[float] = None
    course_id: int
    course_name: str
    priority: Optional[int] = None
    summary: Optional[str] = None

class Course(BaseModel):
    id: int
    name: str
    code: str
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None

class GeminiRequest(BaseModel):
    prompt: str
    max_tokens: Optional[int] = 1024
    temperature: Optional[float] = 0.7

class GeminiResponse(BaseModel):
    text: str

class SummarizeRequest(BaseModel):
    content: str
    max_tokens: Optional[int] = 1024
    temperature: Optional[float] = 0.7

class UserProfile(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    primary_email: Optional[str] = None
    login_id: Optional[str] = None

class StudyTimeData(BaseModel):
    day: str
    hours: float
    productivity: float

class StudyPattern(BaseModel):
    most_productive_day: str
    most_productive_time: str
    average_session_length: float
    recommended_session_length: float
    recommended_break_interval: int

class StudyTimeAnalytics(BaseModel):
    study_sessions: List[StudyTimeData]
    study_pattern: StudyPattern

# Helper functions
async def get_canvas_client():
    """Create an HTTP client with Canvas authorization headers using the API token"""
    return httpx.AsyncClient(
        headers={"Authorization": f"Bearer {CANVAS_API_TOKEN}"}
    )

def get_canvas_instance(token: str):
    """Create a Canvas instance using the canvasapi library"""
    return Canvas(CANVAS_API_BASE_URL, token)

# Simple in-memory cache for assignments
assignment_cache = {}
assignment_cache_expiry = {}
CACHE_TTL_SECONDS = 300  # 5 minutes cache TTL

@app.get("/api/py/assignments", response_model=List[Assignment])
async def get_assignments(
    course_id: Optional[int] = None,
    skip_summarization: bool = True,
    limit: int = 100,
    offset: int = 0
):
    """Get assignments with prioritization and optional summarization"""
    try:
        # Check cache first if we have a course_id
        cache_key = f"assignments_{course_id}_{skip_summarization}"
        current_time = time.time()
        
        if cache_key in assignment_cache and assignment_cache_expiry.get(cache_key, 0) > current_time:
            # Return cached assignments with pagination
            cached_assignments = assignment_cache[cache_key]
            return cached_assignments[offset:offset+limit]
        
        async with await get_canvas_client() as client:
            # Get courses if course_id not specified
            if not course_id:
                courses_response = await client.get(f"{CANVAS_API_BASE_URL}/courses?enrollment_state=active")
                if courses_response.status_code != 200:
                    raise HTTPException(status_code=courses_response.status_code, detail="Failed to fetch courses")
                courses = courses_response.json()
            else:
                courses = [{"id": course_id}]
            
            all_assignments = []
            
            # Get assignments for each course
            for course in courses:
                course_id = course["id"]
                
                # Get course details and assignments in parallel
                course_task = client.get(f"{CANVAS_API_BASE_URL}/courses/{course_id}")
                assignments_task = client.get(
                    f"{CANVAS_API_BASE_URL}/courses/{course_id}/assignments?include[]=submission"
                )
                
                course_response, assignments_response = await asyncio.gather(course_task, assignments_task)
                
                if course_response.status_code != 200 or assignments_response.status_code != 200:
                    continue  # Skip if can't get course details or assignments
                
                course_details = course_response.json()
                assignments = assignments_response.json()
                
                for assignment in assignments:
                    # Skip completed assignments
                    submission = assignment.get("submission", {})
                    if submission and submission.get("workflow_state") == "submitted":
                        continue
                    
                    # Calculate priority (simplified)
                    priority = calculate_basic_priority(assignment)
                    
                    # Only summarize if explicitly requested
                    description = assignment.get("description", "")
                    summary = ""
                    if not skip_summarization and description:
                        summary = fallback_summarize(description)  # Use fast fallback by default
                    
                    all_assignments.append(
                        Assignment(
                            id=assignment["id"],
                            name=assignment["name"],
                            description=description,
                            due_at=datetime.fromisoformat(assignment["due_at"].replace("Z", "+00:00")) if assignment.get("due_at") else None,
                            points_possible=assignment.get("points_possible"),
                            course_id=course_id,
                            course_name=course_details["name"],
                            priority=priority,
                            summary=summary
                        )
                    )
            
            # Sort by priority (descending)
            all_assignments.sort(key=lambda x: x.priority or 0, reverse=True)
            
            # Cache the results
            if course_id:  # Only cache if we're filtering by course
                assignment_cache[cache_key] = all_assignments
                assignment_cache_expiry[cache_key] = current_time + CACHE_TTL_SECONDS
            
            # Return paginated results
            return all_assignments[offset:offset+limit]
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching assignments: {str(e)}")

# Simplified priority calculation for speed
def calculate_basic_priority(assignment: Dict[str, Any]) -> int:
    """Calculate basic priority based on due date and points"""
    # Simple priority algorithm - optimized for speed
    priority = 0
    
    # Due date factor - closer due dates get higher priority
    if assignment.get("due_at"):
        due_date = datetime.fromisoformat(assignment["due_at"].replace("Z", "+00:00"))
        days_until_due = (due_date - datetime.now().astimezone()).days
        
        if days_until_due < 1:
            priority += 10  # Due very soon
        elif days_until_due < 3:
            priority += 8   # Due soon
        elif days_until_due < 7:
            priority += 5   # Due this week
        else:
            priority += 2   # Due later
    
    # Points factor - higher points get higher priority
    points = assignment.get("points_possible", 0)
    if points:
        if points > 100:
            priority += 5
        elif points > 50:
            priority += 3
        elif points > 20:
            priority += 2
        else:
            priority += 1
    
    return priority

def fallback_summarize(content: str) -> str:
    """Simple fallback summarization when API is unavailable"""
    # Take the first 200 characters as a simple summary
    if len(content) <= 200:
        return content
    
    # Find the first period after 100 characters to end the summary naturally
    cutoff = min(200, len(content))
    period_pos = content.find('.', 100, cutoff)
    if period_pos > 0:
        return content[:period_pos+1] + " [...]"
    else:
        return content[:cutoff] + " [...]"

async def summarize_content(content: str) -> str:
    """Summarize content using Gemini API or fallback to simple summarization"""
    if not content or len(content) < 100:
        return content
    
    # Use fallback summarization by default to avoid API errors
    # Only try Gemini if explicitly enabled
    if os.getenv("USE_GEMINI_SUMMARIZATION", "false").lower() != "true":
        return fallback_summarize(content)
    
    try:
        # Use the same model as in gemini_endpoint
        model_name = "models/gemini-1.5-flash"
        print(f"Attempting to use model for summarization: {model_name}")
        
        model = genai.GenerativeModel(model_name)
        prompt = f"Summarize the following assignment description concisely, highlighting key requirements and deadlines:\n\n{content}"
        response = model.generate_content(prompt)
        
        # Check response format and extract text
        if hasattr(response, 'text'):
            return response.text
        elif hasattr(response, 'parts') and response.parts:
            return ''.join(part.text for part in response.parts if hasattr(part, 'text'))
        else:
            print(f"Unexpected response type: {type(response)}")
            # Return a fallback summary if we can't parse the response
            return fallback_summarize(content)
    except Exception as e:
        print(f"Gemini API error in summarization: {e}")
        return fallback_summarize(content)  # Always use fallback on any error

@app.get("/api/py/assignment/{assignment_id}/summary")
async def get_assignment_summary(assignment_id: int, course_id: int):
    """Get summary for a specific assignment"""
    try:
        async with await get_canvas_client() as client:
            response = await client.get(
                f"{CANVAS_API_BASE_URL}/courses/{course_id}/assignments/{assignment_id}"
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch assignment")
                
            assignment = response.json()
            description = assignment.get("description", "")
            
            if not description:
                return {"summary": "No description available"}
                
            summary = await summarize_content(description)
            return {"summary": summary}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error summarizing assignment: {str(e)}")

@app.get("/api/py/analytics/{course_id}")
async def get_course_analytics(course_id: int):
    """Get analytics data for visualization"""
    try:
        async with await get_canvas_client() as client:
            # Get assignments
            assignments_response = await client.get(
                f"{CANVAS_API_BASE_URL}/courses/{course_id}/assignments"
            )
            if assignments_response.status_code != 200:
                raise HTTPException(status_code=assignments_response.status_code, detail="Failed to fetch assignments")
            
            assignments = assignments_response.json()
            
            # Process data for visualization
            analytics_data = {
                "assignment_completion": [],
                "grade_distribution": {},
                "time_spent": []
            }
            
            # Try to get submissions, but continue even if it fails
            submissions = []
            try:
                submissions_response = await client.get(
                    f"{CANVAS_API_BASE_URL}/courses/{course_id}/students/submissions"
                )
                if submissions_response.status_code == 200:
                    submissions = submissions_response.json()
            except Exception as sub_err:
                print(f"Warning: Could not fetch submissions: {sub_err}")
                # Continue without submissions data
            
            # Process assignments and submissions
            for assignment in assignments:
                assignment_id = assignment["id"]
                
                # Only process submissions if we have them
                if submissions:
                    try:
                        assignment_submissions = [s for s in submissions if s.get("assignment_id") == assignment_id]
                        
                        completion_rate = len([s for s in assignment_submissions if s.get("workflow_state") == "submitted"]) / max(1, len(assignment_submissions))
                        
                        analytics_data["assignment_completion"].append({
                            "assignment_name": assignment["name"],
                            "completion_rate": completion_rate
                        })
                        
                        # Grade distribution
                        grades = [s.get("score", 0) for s in assignment_submissions if s.get("score") is not None]
                        if grades:
                            analytics_data["grade_distribution"][assignment["name"]] = {
                                "min": min(grades),
                                "max": max(grades),
                                "avg": sum(grades) / len(grades)
                            }
                    except Exception as proc_err:
                        print(f"Warning: Error processing assignment {assignment_id}: {proc_err}")
                        # Continue with next assignment
                else:
                    # If no submissions data, add placeholder data
                    analytics_data["assignment_completion"].append({
                        "assignment_name": assignment["name"],
                        "completion_rate": 0
                    })
            
            return analytics_data
            
    except Exception as e:
        print(f"Error in analytics endpoint: {str(e)}")
        # Return empty data structure instead of error
        return {
            "assignment_completion": [],
            "grade_distribution": {},
            "time_spent": []
        }

@app.get("/api/py/course_statistics/{course_id}")
async def get_course_statistics(course_id: int):
    """Get detailed statistics for a specific course"""
    try:
        async with await get_canvas_client() as client:
            # Get course details
            course_response = await client.get(
                f"{CANVAS_API_BASE_URL}/courses/{course_id}"
            )
            if course_response.status_code != 200:
                raise HTTPException(status_code=course_response.status_code, detail="Failed to fetch course details")
            
            course = course_response.json()
            
            # Get assignments
            assignments_response = await client.get(
                f"{CANVAS_API_BASE_URL}/courses/{course_id}/assignments"
            )
            if assignments_response.status_code != 200:
                raise HTTPException(status_code=assignments_response.status_code, detail="Failed to fetch assignments")
            
            assignments = assignments_response.json()
            
            # Get submissions if available
            submissions = []
            try:
                submissions_response = await client.get(
                    f"{CANVAS_API_BASE_URL}/courses/{course_id}/students/submissions"
                )
                if submissions_response.status_code == 200:
                    submissions = submissions_response.json()
            except:
                # Continue even if submissions can't be fetched
                pass
            
            # Calculate statistics
            total_assignments = len(assignments)
            completed_assignments = 0
            upcoming_assignments = 0
            past_due_assignments = 0
            total_points = 0
            earned_points = 0
            
            now = datetime.now().astimezone()
            
            for assignment in assignments:
                # Check if there's a due date
                if assignment.get("due_at"):
                    due_date = datetime.fromisoformat(assignment["due_at"].replace("Z", "+00:00"))
                    if due_date < now:
                        past_due_assignments += 1
                    else:
                        upcoming_assignments += 1
                
                # Add to total points
                if assignment.get("points_possible"):
                    total_points += assignment["points_possible"]
                
                # Check if completed
                assignment_submissions = [s for s in submissions if s.get("assignment_id") == assignment["id"]]
                if assignment_submissions and any(s.get("workflow_state") == "submitted" for s in assignment_submissions):
                    completed_assignments += 1
                    # Add to earned points if graded
                    for submission in assignment_submissions:
                        if submission.get("score") is not None:
                            earned_points += submission["score"]
            
            # Calculate grade percentage if possible
            grade_percentage = (earned_points / total_points * 100) if total_points > 0 else 0
            
            # Prepare statistics response
            statistics = {
                "course_name": course.get("name", ""),
                "course_code": course.get("course_code", ""),
                "total_assignments": total_assignments,
                "completed_assignments": completed_assignments,
                "completion_percentage": (completed_assignments / total_assignments * 100) if total_assignments > 0 else 0,
                "upcoming_assignments": upcoming_assignments,
                "past_due_assignments": past_due_assignments,
                "total_points": total_points,
                "earned_points": earned_points,
                "grade_percentage": grade_percentage,
                "assignments_by_type": {},  # Group assignments by type if available
                "time_distribution": {}  # Time distribution of assignments if available
            }
            
            # Group assignments by type if available
            for assignment in assignments:
                assignment_type = assignment.get("submission_types", [""])[0]
                if assignment_type:
                    if assignment_type not in statistics["assignments_by_type"]:
                        statistics["assignments_by_type"][assignment_type] = 0
                    statistics["assignments_by_type"][assignment_type] += 1
            
            # Calculate time distribution (e.g., assignments due by day of week)
            days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            for day in days_of_week:
                statistics["time_distribution"][day] = 0
            
            for assignment in assignments:
                if assignment.get("due_at"):
                    due_date = datetime.fromisoformat(assignment["due_at"].replace("Z", "+00:00"))
                    day_of_week = days_of_week[due_date.weekday()]
                    statistics["time_distribution"][day_of_week] += 1
            
            return statistics
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching course statistics: {str(e)}")

@app.post("/api/py/gemini", response_model=GeminiResponse)
async def gemini_endpoint(request: GeminiRequest):
    """
    Generate text using Google's Gemini AI model.
    
    - **prompt**: The text prompt to send to Gemini
    - **max_tokens**: Maximum number of tokens to generate (default: 1024)
    - **temperature**: Controls randomness (0.0-1.0, default: 0.7)
    
    Requires GEMINI_API_KEY environment variable to be set.
    """
    try:
        # Try with a model that's available in the list
        model_name = "models/gemini-1.5-flash"  # Using one of the available models from the list
        print(f"Attempting to use model: {model_name}")
        
        model = genai.GenerativeModel(model_name)
        
        # Generate content
        response = model.generate_content(
            request.prompt,
            generation_config={
                "max_output_tokens": request.max_tokens,
                "temperature": request.temperature
            }
        )
        
        # Extract text from response
        if hasattr(response, 'text'):
            return GeminiResponse(text=response.text)
        elif hasattr(response, 'parts') and response.parts:
            text = ''.join(part.text for part in response.parts if hasattr(part, 'text'))
            return GeminiResponse(text=text)
        else:
            return GeminiResponse(text="Unable to generate response")
    except Exception as e:
        print(f"Gemini API error: {e}")
        return GeminiResponse(text=f"Error: {str(e)}")

@app.post("/api/py/summarize", response_model=GeminiResponse)
async def summarize_content_endpoint(request: SummarizeRequest):
    """
    Summarize content using Google's Gemini AI model.
    
    - **content**: The text content to summarize
    - **max_tokens**: Maximum number of tokens to generate (default: 1024)
    - **temperature**: Controls randomness (0.0-1.0, default: 0.7)
    
    Requires GEMINI_API_KEY environment variable to be set.
    """
    try:
        # Use the same model as in gemini_endpoint
        model_name = "models/gemini-1.5-flash"
        print(f"Attempting to use model for summarization: {model_name}")
        
        model = genai.GenerativeModel(model_name)
        
        # Create a prompt for summarization
        prompt = f"Please summarize the following content concisely:\n\n{request.content}"
        
        # Generate summary
        response = model.generate_content(
            prompt,
            generation_config={
                "max_output_tokens": request.max_tokens,
                "temperature": request.temperature
            }
        )
        
        # Extract text from response
        if hasattr(response, 'text'):
            return GeminiResponse(text=response.text)
        elif hasattr(response, 'parts') and response.parts:
            text = ''.join(part.text for part in response.parts if hasattr(part, 'text'))
            return GeminiResponse(text=text)
        else:
            # Fallback to simple summarization
            summary = fallback_summarize(request.content)
            return GeminiResponse(text=summary)
    except Exception as e:
        print(f"Gemini API error in summarization: {e}")
        # Fallback to simple summarization on error
        summary = fallback_summarize(request.content)
        return GeminiResponse(text=summary)

@app.get("/api/py/models")
async def list_models():
    """
    List available Gemini AI models.
    
    Requires GEMINI_API_KEY environment variable to be set.
    """
    try:
        # List available models
        models = genai.list_models()
        model_names = [model.name for model in models]
        print("Available models:")
        for name in model_names:
            print(f"- {name}")
        return {"models": model_names}
    except Exception as e:
        print(f"Error listing models: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing models: {str(e)}")

@app.get("/api/py/user/profile", response_model=UserProfile)
async def get_user_profile(token: str):
    """
    Get the user's profile information from Canvas.
    
    This endpoint uses the canvasapi library to retrieve the user's profile information.
    
    - **token**: Canvas API token
    
    Returns the user's profile information.
    """
    try:
        # Get Canvas instance
        canvas = get_canvas_instance(token)
        
        # Get current user
        user = canvas.get_current_user()
        
        # Return user profile
        return UserProfile(
            id=user.id,
            name=user.name,
            email=getattr(user, 'email', None),
            avatar_url=getattr(user, 'avatar_url', None),
            bio=getattr(user, 'bio', None),
            primary_email=getattr(user, 'primary_email', None),
            login_id=getattr(user, 'login_id', None)
        )
    except Exception as e:
        print(f"Error getting user profile: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting user profile: {str(e)}")

@app.get("/api/py/study_time_analytics/{course_id}", response_model=StudyTimeAnalytics)
async def get_study_time_analytics(course_id: int):
    """
    Get study time analytics for a specific course.
    This endpoint provides data about study patterns and recommendations.
    """
    try:
        # In a real implementation, this would fetch actual data from a database
        # For demo purposes, we'll generate mock data
        
        # Generate mock study session data
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        mock_sessions = []
        
        for day in days:
            # Generate random hours between 1-4
            hours = 1 + (hash(f"{course_id}-{day}") % 100) / 33  # Deterministic randomness based on course_id
            # Generate random productivity score between 60-100
            productivity = 60 + (hash(f"{course_id}-{day}-prod") % 100) / 2.5
            
            mock_sessions.append(StudyTimeData(
                day=day,
                hours=hours,
                productivity=productivity
            ))
        
        # Calculate study patterns from the sessions
        sorted_sessions = sorted(mock_sessions, key=lambda x: x.productivity, reverse=True)
        most_productive_day = sorted_sessions[0].day
        
        # Deterministic time selection based on course_id
        times = ["Morning", "Afternoon", "Evening"]
        most_productive_time = times[hash(str(course_id)) % 3]
        
        average_session_length = sum(session.hours for session in mock_sessions) / len(mock_sessions)
        
        study_pattern = StudyPattern(
            most_productive_day=most_productive_day,
            most_productive_time=most_productive_time,
            average_session_length=average_session_length,
            recommended_session_length=min(2.5, average_session_length * 1.2),
            recommended_break_interval=25 + (hash(str(course_id)) % 15)
        )
        
        return StudyTimeAnalytics(
            study_sessions=mock_sessions,
            study_pattern=study_pattern
        )
        
    except Exception as e:
        print(f"Error getting study time analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get study time analytics: {str(e)}")

@app.get("/api/py/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

@app.get("/api/py/helloFastApi")
def hello_fast_api():
    return {"message": "Hello from FastAPI"}

@app.get("/api/py/courses", response_model=List[Course])
async def get_courses():
    """Get list of courses for the authenticated user"""
    try:
        async with await get_canvas_client() as client:
            response = await client.get(f"{CANVAS_API_BASE_URL}/courses?enrollment_state=active")
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch courses")
                
            courses_data = response.json()
            return [
                Course(
                    id=course["id"],
                    name=course["name"],
                    code=course.get("course_code", ""),
                    start_at=datetime.fromisoformat(course["start_at"].replace("Z", "+00:00")) if course.get("start_at") else None,
                    end_at=datetime.fromisoformat(course["end_at"].replace("Z", "+00:00")) if course.get("end_at") else None
                )
                for course in courses_data
                if not course.get("access_restricted_by_date", False)
            ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching courses: {str(e)}")