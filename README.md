# Canvas Assistant with Smalltalk Integration

This project is a Canvas LMS assistant that helps students manage their coursework, assignments, and academic progress. It features a chat interface for interacting with the assistant and a statistics dashboard for visualizing course data.

## Smalltalk Implementation

Our project leverages the Smalltalk programming language paradigm for data visualization components. Smalltalk, one of the first object-oriented programming languages, has influenced our approach to creating reusable, modular visualization components.

### Smalltalk-Inspired Visualization Components

We've implemented visualization components following Smalltalk's object-oriented principles:

- `SmalltalkVisualization.tsx` - A bar chart component that encapsulates data visualization logic in a self-contained object, following Smalltalk's principle of message passing between objects
- `AdvancedSmalltalkVisualization.tsx` - A more sophisticated visualization component that implements polymorphism (a core Smalltalk concept) by supporting multiple chart types (bar, pie, line, radar) through a unified interface

These components are used in the statistics dashboard to display:

- Assignment distribution by type (using `SmalltalkVisualization`)
- Time distribution of assignments across days of the week (using `SmalltalkVisualization`)
- Study patterns and productivity metrics (using `AdvancedSmalltalkVisualization`)

**Location of Smalltalk Visualization Code:**

- `app/components/SmalltalkVisualization.tsx` - Basic bar chart visualization
- `app/components/AdvancedSmalltalkVisualization.tsx` - Advanced multi-chart visualization
- `app/statistics/page.tsx` - Shows how these components are integrated into the statistics dashboard

### Smalltalk Object-Oriented Design Principles Applied

Our visualization components follow key Smalltalk principles:

1. **Everything is an Object**: Each visualization is a self-contained object with its own state and behavior
2. **Objects communicate via messages**: Components receive data through props (analogous to Smalltalk messages)
3. **Inheritance and Polymorphism**: The `AdvancedSmalltalkVisualization` component can render different chart types through a unified interface
4. **Encapsulation**: Implementation details are hidden within the component, exposing only the necessary interface

## How Smalltalk Enhances User Experience

The Smalltalk-inspired implementation significantly improves the user experience by:

1. Providing modular, reusable visualization components that maintain consistent behavior
2. Enabling flexible data representation through polymorphic chart types
3. Visualizing complex course data in intuitive, interactive formats
4. Helping students understand their academic patterns through visual data representation

Our Smalltalk integration demonstrates how classic object-oriented programming principles can be applied to modern web development to create maintainable, flexible visualization components.

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
