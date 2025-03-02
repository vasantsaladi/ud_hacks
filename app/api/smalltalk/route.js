import { NextResponse } from "next/server";

// Try to import the real bridge, fall back to mock if it fails
let smalltalkBridge;
try {
  smalltalkBridge = require("../../../smalltalk_code/smalltalk_bridge");
  console.log("Using real Smalltalk bridge");
} catch (error) {
  console.log("SmallBalloon not available, using mock bridge");
  smalltalkBridge = require("../../../smalltalk_code/smalltalk_bridge_mock");
}

/**
 * GET handler for /api/smalltalk
 * Returns data from the Smalltalk data service
 */
export async function GET(request) {
  try {
    // Get the search params
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "getAllStudents";
    const id = searchParams.get("id");
    const count = searchParams.get("count")
      ? parseInt(searchParams.get("count"))
      : 3;

    let result;

    // Call the appropriate method based on the action
    switch (action) {
      case "getStudentById":
        if (!id) {
          return NextResponse.json(
            { error: "Missing id parameter" },
            { status: 400 }
          );
        }
        result = await smalltalkBridge.getStudentById(parseInt(id));
        break;

      case "getTopStudents":
        result = await smalltalkBridge.getTopStudents(count);
        break;

      case "getAverageCompletion":
        result = await smalltalkBridge.getAverageCompletion();
        break;

      case "getAllStudents":
      default:
        result = await smalltalkBridge.getAllStudents();
        break;
    }

    // Return the result as JSON
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error in Smalltalk API route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for /api/smalltalk
 * Runs arbitrary Smalltalk code
 */
export async function POST(request) {
  try {
    // Get the request body
    const body = await request.json();

    // Check if code is provided
    if (!body.code) {
      return NextResponse.json(
        { error: "Missing code parameter" },
        { status: 400 }
      );
    }

    // Run the Smalltalk code
    const result = await smalltalkBridge.runSmalltalkCode(body.code);

    // Return the result as JSON
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error running Smalltalk code:", error);
    return NextResponse.json(
      { error: "Error running Smalltalk code" },
      { status: 500 }
    );
  }
}
