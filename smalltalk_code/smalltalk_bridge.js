/**
 * Smalltalk Bridge - Connects Smalltalk code with our Next.js application
 */

const path = require("path");
const { STLoader } = require("../smallballoon/build/main/ts/STLoader");

class SmalltalkBridge {
  constructor() {
    this.interpreter = new STLoader();
    this.initialized = false;
  }

  /**
   * Initialize the Smalltalk interpreter and load the data service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Set up the JavaScript context
      this.interpreter.setJSContext(global);

      // Load the data service
      const dataServicePath = path.resolve(__dirname, "data_service.st");
      this.interpreter.runFile(dataServicePath);

      this.initialized = true;
      console.log("Smalltalk bridge initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Smalltalk bridge:", error);
      throw error;
    }
  }

  /**
   * Get all students from the Smalltalk data service
   */
  async getAllStudents() {
    await this.initialize();

    try {
      // Convert the Smalltalk collection to a JavaScript array
      const studentsArray = global.smalltalkDataService.studentsAsJSON();

      // Convert to plain JavaScript objects
      return Array.from(studentsArray).map((student) => {
        const obj = {};
        for (const key of Object.getOwnPropertyNames(student)) {
          if (typeof student[key] !== "function") {
            obj[key] = student[key];
          }
        }
        return obj;
      });
    } catch (error) {
      console.error("Error getting students from Smalltalk:", error);
      return [];
    }
  }

  /**
   * Get a student by ID
   */
  async getStudentById(id) {
    await this.initialize();

    try {
      const student = global.smalltalkDataService.getStudentById_(id);
      if (!student) return null;

      // Convert to a plain JavaScript object
      const obj = {};
      for (const key in student) {
        if (typeof student[key] !== "function") {
          obj[key] = student[key];
        }
      }
      return obj;
    } catch (error) {
      console.error(
        `Error getting student with ID ${id} from Smalltalk:`,
        error
      );
      return null;
    }
  }

  /**
   * Get the top N students by completion percentage
   */
  async getTopStudents(count = 3) {
    await this.initialize();

    try {
      // Get top students from Smalltalk
      const topStudents = global.smalltalkDataService.getTopStudents_(count);

      // Convert to plain JavaScript objects
      return Array.from(topStudents).map((student) => {
        const obj = {};
        for (const key in student) {
          if (typeof student[key] !== "function") {
            obj[key] = student[key];
          }
        }
        return obj;
      });
    } catch (error) {
      console.error(
        `Error getting top ${count} students from Smalltalk:`,
        error
      );
      return [];
    }
  }

  /**
   * Get the average completion percentage
   */
  async getAverageCompletion() {
    await this.initialize();

    try {
      return global.smalltalkDataService.getAverageCompletion();
    } catch (error) {
      console.error("Error getting average completion from Smalltalk:", error);
      return 0;
    }
  }

  /**
   * Run arbitrary Smalltalk code and return the result
   */
  async runSmalltalkCode(code) {
    await this.initialize();

    try {
      return this.interpreter.runSTCode(code);
    } catch (error) {
      console.error("Error running Smalltalk code:", error);
      throw error;
    }
  }
}

// Create a singleton instance
const smalltalkBridge = new SmalltalkBridge();

module.exports = smalltalkBridge;
