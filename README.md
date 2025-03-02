# Canvas Assistant with Smalltalk Integration

## How We Used Smalltalk in Our Application

Our Canvas Assistant application integrates Smalltalk, a pioneering object-oriented programming language, to process and visualize student data. The integration demonstrates how a classic programming language can be seamlessly incorporated into a modern web application architecture.

### The Smalltalk Dashboard

![Smalltalk Dashboard](./public/smalltalk_dashboard.png)
_Note: The screenshot above shows our Smalltalk dashboard interface. If you're setting up this project, replace this with your own screenshot._

Our Smalltalk dashboard displays student data that is processed by Smalltalk code and served through a JavaScript bridge. The dashboard includes:

- **Average Completion Rate**: Calculated by Smalltalk code analyzing student submission data
- **Top Performing Students**: Determined through Smalltalk algorithms that evaluate grades and completion rates
- **All Students Table**: Comprehensive student data processed by Smalltalk
- **Interactive Smalltalk Code Runner**: Allows executing custom Smalltalk code directly from the browser

### Implementation Details

1. **Smalltalk Bridge**: We created a JavaScript bridge (`smalltalk_bridge.js`) that connects our Next.js application to the SmallBalloon Smalltalk interpreter.

2. **Fallback Mechanism**: We implemented a mock bridge (`smalltalk_bridge_mock.js`) that provides sample data when the SmallBalloon interpreter is unavailable, ensuring the application remains functional.

3. **API Integration**: Our API routes in `app/api/smalltalk/route.js` handle requests for Smalltalk-processed data, with automatic fallback to mock data when needed.

4. **Smalltalk Code**: The core data processing logic is written in Smalltalk (`data_service.st`), which is loaded and executed by the SmallBalloon interpreter.

5. **Bridge Initialization**: We created a dedicated script (`start_smalltalk.js`) to initialize and run the Smalltalk bridge as a separate process.

This integration showcases how legacy or specialized programming languages can be effectively utilized within modern web frameworks, providing unique capabilities while maintaining application reliability through appropriate fallback mechanisms.

## Smalltalk Integration in Canvas Assistant

## Overview

This project demonstrates the integration of Smalltalk, a classic object-oriented programming language, with a modern Next.js web application. The integration allows Smalltalk code to process student data and expose it through a JavaScript bridge to our web frontend.

## How It Works

![Smalltalk Dashboard](./public/smalltalk_dashboard.png)

### Architecture

1. **Smalltalk Code**: The core data processing logic is written in Smalltalk (`.st` files)
2. **SmallBalloon Interpreter**: We use SmallBalloon, a Smalltalk interpreter for JavaScript/TypeScript
3. **JavaScript Bridge**: A bridge connects the Smalltalk environment to our JavaScript code
4. **Next.js Frontend**: Displays the processed data in a modern web interface

### Key Components

- **`smalltalk_bridge.js`**: Connects JavaScript to the Smalltalk environment
- **`smalltalk_bridge_mock.js`**: Provides mock data when SmallBalloon is unavailable
- **`data_service.st`**: Smalltalk code that processes student data
- **`start_smalltalk.js`**: Script to initialize and run the Smalltalk bridge

## Features

The Smalltalk integration provides:

- Student data processing and analysis
- Performance metrics calculation
- Interactive Smalltalk code execution from the web interface

## Running the Application

### Prerequisites

- Node.js (v14+)
- SmallBalloon repository (optional - will fall back to mock data if unavailable)

### Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Clone SmallBalloon (optional):
   ```
   git clone https://github.com/your-username/SmallBalloon.git
   cd SmallBalloon
   npm install
   npm run build
   cd ..
   ```

### Running

Start the application with:

```
npm run dev
```

In a separate terminal, start the Smalltalk bridge:

```
npm run smalltalk
```

Visit http://localhost:3004/smalltalk to see the Smalltalk dashboard.

## Fallback Mechanism

If SmallBalloon is not available, the application automatically falls back to using mock data through `smalltalk_bridge_mock.js`. This ensures the application remains functional even without the Smalltalk interpreter.

## Extending the Smalltalk Integration

To add new Smalltalk functionality:

1. Add your Smalltalk code to `data_service.st`
2. Expose new methods in `smalltalk_bridge.js`
3. Add corresponding mock implementations in `smalltalk_bridge_mock.js`
4. Update the API routes in `app/api/smalltalk/route.js`

## Troubleshooting

- **Missing SmallBalloon**: The application will use mock data
- **File not found errors**: Ensure the Smalltalk files are in the correct location
- **Bridge initialization failures**: Check the console output from `npm run smalltalk`

## Learn More

- [Smalltalk Documentation](https://smalltalk.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [SmallBalloon Repository](https://github.com/your-username/SmallBalloon)

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
