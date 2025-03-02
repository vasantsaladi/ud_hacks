/**
 * Start Smalltalk Bridge Server
 *
 * This script initializes the Smalltalk bridge and keeps it running
 * so it can be used by the Next.js application.
 */

const smalltalkBridge = require("./smalltalk_bridge");

async function startSmalltalkBridge() {
  try {
    console.log("Initializing Smalltalk bridge...");
    await smalltalkBridge.initialize();

    console.log("Smalltalk bridge initialized successfully!");
    console.log("Running a test query...");

    // Run a test query to make sure everything is working
    const students = await smalltalkBridge.getAllStudents();
    console.log(`Retrieved ${students.length} students from Smalltalk`);

    console.log("\nSmalltalk bridge is now running and ready to use.");
    console.log("Press Ctrl+C to stop the server.");

    // Keep the process running
    setInterval(() => {}, 1000);
  } catch (error) {
    console.error("Failed to initialize Smalltalk bridge:", error);
    console.log("Falling back to mock bridge...");

    // You can add code here to start the mock bridge if needed
    process.exit(1);
  }
}

// Start the Smalltalk bridge
startSmalltalkBridge();
