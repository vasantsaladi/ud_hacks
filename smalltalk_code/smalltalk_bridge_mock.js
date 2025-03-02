/**
 * Mock Smalltalk Bridge - Provides sample data without requiring SmallBalloon
 * Use this when you don't have SmallBalloon available
 */

class SmalltalkBridgeMock {
  constructor() {
    this.initialized = false;
    this.sampleData = [
      {
        id: 1,
        name: "John Smith",
        course: "Computer Science",
        grade: "A",
        completionPercentage: 92,
      },
      {
        id: 2,
        name: "Emily Johnson",
        course: "Mathematics",
        grade: "B+",
        completionPercentage: 85,
      },
      {
        id: 3,
        name: "Michael Brown",
        course: "Physics",
        grade: "A-",
        completionPercentage: 88,
      },
      {
        id: 4,
        name: "Sarah Davis",
        course: "Chemistry",
        grade: "B",
        completionPercentage: 78,
      },
      {
        id: 5,
        name: "David Wilson",
        course: "Biology",
        grade: "A+",
        completionPercentage: 96,
      },
    ];
  }

  /**
   * Initialize the mock bridge
   */
  async initialize() {
    if (this.initialized) return;

    console.log("Mock Smalltalk bridge initialized successfully");
    this.initialized = true;
  }

  /**
   * Get all students
   */
  async getAllStudents() {
    await this.initialize();
    return [...this.sampleData];
  }

  /**
   * Get a student by ID
   */
  async getStudentById(id) {
    await this.initialize();
    return this.sampleData.find((student) => student.id === id) || null;
  }

  /**
   * Get the top N students by completion percentage
   */
  async getTopStudents(count = 3) {
    await this.initialize();

    // Sort by completion percentage (descending)
    const sorted = [...this.sampleData].sort(
      (a, b) => b.completionPercentage - a.completionPercentage
    );

    // Return the top N students
    return sorted.slice(0, Math.min(count, sorted.length));
  }

  /**
   * Get the average completion percentage
   */
  async getAverageCompletion() {
    await this.initialize();

    const sum = this.sampleData.reduce(
      (acc, student) => acc + student.completionPercentage,
      0
    );

    return sum / this.sampleData.length;
  }

  /**
   * Run arbitrary Smalltalk code
   */
  async runSmalltalkCode(code) {
    await this.initialize();

    console.log("Mock execution of Smalltalk code:", code);

    // Return a mock result based on the code
    if (code.includes("getAllStudents")) {
      return this.sampleData;
    } else if (code.includes("getTopStudents")) {
      return await this.getTopStudents(3);
    } else if (code.includes("getAverageCompletion")) {
      return await this.getAverageCompletion();
    } else if (code.includes("add") || code.includes("+")) {
      return "Result of addition: 42";
    } else {
      return "Code executed successfully (mock result)";
    }
  }
}

// Create a singleton instance
const smalltalkBridgeMock = new SmalltalkBridgeMock();

module.exports = smalltalkBridgeMock;
