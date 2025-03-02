/**
 * Example of running Smalltalk code from JavaScript using SmallBalloon
 */

// Import the SmallBalloon interpreter
const path = require("path");
const { STLoader } = require("../smallballoon/build/main/ts/STLoader");

// Create a new interpreter instance
const interpreter = new STLoader();

// Set up a JavaScript context with some useful objects and functions
const context = {
  // Provide access to Node.js console
  logger: console,

  // Add some utility functions
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,

  // Add some data
  sampleData: [1, 2, 3, 4, 5],

  // Add a callback function that will be called from Smalltalk
  processResult: (result) => {
    console.log("Result processed in JavaScript:", result);
    return `Processed: ${result}`;
  },
};

// Set the JavaScript context
interpreter.setJSContext(context);

// Run a simple Smalltalk code snippet
console.log("\n--- Running a simple Smalltalk code snippet ---");
interpreter.runSTCode(`
  | result |
  (JS get:'logger') log:'Hello from Smalltalk!'.
  
  result := (JS get:'add') value:10 value:5.
  (JS get:'logger') log:'10 + 5 = ', result asString.
  
  (JS get:'processResult') value:result.
`);

// Run a Smalltalk file
console.log("\n--- Running a Smalltalk file ---");
try {
  const filePath = path.resolve(__dirname, "01_hello_world.st");
  interpreter.runFile(filePath);
  console.log("Successfully ran 01_hello_world.st");
} catch (error) {
  console.error("Error running Smalltalk file:", error);
}

// Define a Smalltalk class and expose it to JavaScript
console.log(
  "\n--- Defining a Smalltalk class and exposing it to JavaScript ---"
);
interpreter.runSTCode(`
  "Define a Calculator class"
  Object subclass: #Calculator
    instanceVariableNames: ''
    classVariableNames: ''
    poolDictionaries: ''
    category: 'Examples'.
  
  "Define methods for the Calculator class"
  Calculator methodsFor: 'arithmetic' stamp: 'user 5/1/2023 12:00' do: "
  add: a and: b
    ^a + b
    
  subtract: a and: b
    ^a - b
    
  multiply: a and: b
    ^a * b
    
  divide: a and: b
    ^a / b
  ".
  
  "Create an instance and expose it to JavaScript"
  calc := Calculator new.
  JS set:'stCalculator' to:calc.
  
  (JS get:'logger') log:'Calculator object created and exposed to JavaScript'.
`);

// Use the Smalltalk calculator from JavaScript
console.log("\n--- Using the Smalltalk calculator from JavaScript ---");
const a = 15;
const b = 5;
console.log(`${a} + ${b} =`, interpreter.jsContext.stCalculator.add_and_(a, b));
console.log(
  `${a} - ${b} =`,
  interpreter.jsContext.stCalculator.subtract_and_(a, b)
);
console.log(
  `${a} * ${b} =`,
  interpreter.jsContext.stCalculator.multiply_and_(a, b)
);
console.log(
  `${a} / ${b} =`,
  interpreter.jsContext.stCalculator.divide_and_(a, b)
);

console.log("\nDone!");
