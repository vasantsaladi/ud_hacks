# Canvas Assistant

A comprehensive tool for Canvas LMS users to manage assignments, prioritize tasks, and get content summaries.

## Features

- Canvas OAuth authentication
- Assignment dashboard with priority indicators
- Content summarization using Gemini AI
- Analytics visualization
- Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS
- **Backend**: FastAPI
- **AI**: Google Gemini API
- **Authentication**: Canvas OAuth

## Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Canvas LMS developer credentials
- Google Gemini API key

### Backend Setup

1. Navigate to the API directory:

   ```
   cd api
   ```

2. Create a virtual environment:

   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on `.env.example` and add your credentials:

   ```
   cp .env.example .env
   ```

5. Start the FastAPI server:
   ```
   uvicorn index:app --reload
   ```

### Frontend Setup

1. Navigate to the app directory:

   ```
   cd app
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env.local` file with your Canvas OAuth credentials:

   ```
   NEXT_PUBLIC_CANVAS_CLIENT_ID=your_canvas_client_id
   NEXT_PUBLIC_CANVAS_REDIRECT_URI=http://localhost:3000/auth/callback
   ```

4. Start the Next.js development server:

   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Log in with your Canvas account
2. View your prioritized assignments on the dashboard
3. Click on assignments to see AI-generated summaries
4. Use filters to sort assignments by course, due date, or priority
5. View analytics for your courses and assignments

## API Documentation

The FastAPI backend provides comprehensive API documentation at `/api/py/docs`.

## License

MIT
