from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
import os
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Gemini API
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
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

# Helper functions
async def get_canvas_client():
    """Create an HTTP client with Canvas authorization headers using the API token"""
    return httpx.AsyncClient(
        headers={"Authorization": f"Bearer {CANVAS_API_TOKEN}"}
    )

def calculate_priority(assignment: Dict[str, Any]) -> int:
    """Calculate priority based on due date, points, and other factors"""
    # Simple priority algorithm - can be enhanced
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

async def summarize_content(content: str) -> str:
    """Summarize content using Gemini API"""
    if not content or len(content) < 100:
        return content
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"Summarize the following assignment description concisely, highlighting key requirements and deadlines:\n\n{content}"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error summarizing content: {e}")
        return "Summary unavailable"

# Endpoints
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

@app.get("/api/py/assignments", response_model=List[Assignment])
async def get_assignments(course_id: Optional[int] = None):
    """Get assignments with prioritization and summarization"""
    try:
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
                
                # Get course details
                course_response = await client.get(f"{CANVAS_API_BASE_URL}/courses/{course_id}")
                if course_response.status_code != 200:
                    continue  # Skip if can't get course details
                course_details = course_response.json()
                
                # Get assignments
                assignments_response = await client.get(
                    f"{CANVAS_API_BASE_URL}/courses/{course_id}/assignments?include[]=submission"
                )
                if assignments_response.status_code != 200:
                    continue  # Skip if can't get assignments
                
                assignments = assignments_response.json()
                
                for assignment in assignments:
                    # Skip completed assignments
                    submission = assignment.get("submission", {})
                    if submission and submission.get("workflow_state") == "submitted":
                        continue
                    
                    # Calculate priority
                    priority = calculate_priority(assignment)
                    
                    # Summarize description if available
                    description = assignment.get("description", "")
                    summary = await summarize_content(description) if description else ""
                    
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
            return all_assignments
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching assignments: {str(e)}")

@app.get("/api/py/assignment/{assignment_id}/summary")
async def get_assignment_summary(assignment_id: int, course_id: int):
    """Get a summary of an assignment description using Gemini API"""
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
            
            # Get submissions
            submissions_response = await client.get(
                f"{CANVAS_API_BASE_URL}/courses/{course_id}/students/submissions"
            )
            if submissions_response.status_code != 200:
                raise HTTPException(status_code=submissions_response.status_code, detail="Failed to fetch submissions")
            
            submissions = submissions_response.json()
            
            # Process data for visualization
            analytics_data = {
                "assignment_completion": [],
                "grade_distribution": {},
                "time_spent": []
            }
            
            # Process assignments and submissions
            for assignment in assignments:
                assignment_id = assignment["id"]
                assignment_submissions = [s for s in submissions if s["assignment_id"] == assignment_id]
                
                completion_rate = len([s for s in assignment_submissions if s["workflow_state"] == "submitted"]) / max(1, len(assignment_submissions))
                
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
            
            return analytics_data
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching analytics: {str(e)}")