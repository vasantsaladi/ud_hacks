# Smalltalk Code Examples

This directory contains various Smalltalk code examples that demonstrate the language features and how they can be integrated with JavaScript/TypeScript projects using the [SmallBalloon](https://github.com/fwcd/smallballoon) interpreter.

## Examples

1. **01_hello_world.st** - Basic Hello World program
2. **02_variables_and_operations.st** - Variables and basic operations
3. **03_control_structures.st** - Control structures (conditionals and loops)
4. **04_collections.st** - Collections (arrays, ordered collections, dictionaries)
5. **05_object_oriented.st** - Object-oriented programming concepts
6. **06_javascript_interop.st** - JavaScript interoperability
7. **07_project_integration.st** - Example of integrating Smalltalk with a project

## Running the Examples

To run these examples, you need to have SmallBalloon set up. Follow these steps:

1. Make sure you have Node.js installed
2. Navigate to the SmallBalloon directory:
   ```
   cd ../smallballoon
   ```
3. Run the example using the SmallBalloon interpreter:
   ```
   npm run main -- ../smalltalk_code/01_hello_world.st
   ```

Replace `01_hello_world.st` with the name of the example you want to run.

## Integrating with Your Project

There are several ways to integrate Smalltalk code with your JavaScript/TypeScript project:

### 1. Running Smalltalk Code from JavaScript

```javascript
const { STLoader } = require("smallballoon");

// Create a new interpreter instance
const interpreter = new STLoader();

// Run Smalltalk code directly
interpreter.runSTCode('Transcript show:"Hello from Smalltalk!"');

// Run a Smalltalk file
interpreter.runFile("path/to/your/smalltalk/file.st");
```

### 2. Exposing JavaScript Objects to Smalltalk

```javascript
const { STLoader } = require("smallballoon");

// Create a new interpreter instance
const interpreter = new STLoader();

// Create a context with JavaScript objects and functions
const context = {
  logger: console,
  add: (a, b) => a + b,
  multiply: (a, b) => a * b,
  data: [1, 2, 3, 4, 5],
};

// Set the JavaScript context
interpreter.setJSContext(context);

// Now you can access these objects in Smalltalk code
interpreter.runSTCode(`
  (JS get:'logger') log:'Hello from Smalltalk!'.
  sum := (JS get:'add') value:5 value:3.
  (JS get:'logger') log:'5 + 3 = ', sum asString.
`);
```

### 3. Exposing Smalltalk Objects to JavaScript

```javascript
const { STLoader } = require("smallballoon");

// Create a new interpreter instance
const interpreter = new STLoader();

// Run Smalltalk code that defines objects and exposes them to JavaScript
interpreter.runSTCode(`
  "Define a calculator object"
  calculator := Dictionary new.
  calculator at:'add' put:[:a :b | a + b].
  calculator at:'subtract' put:[:a :b | a - b].
  calculator at:'multiply' put:[:a :b | a * b].
  calculator at:'divide' put:[:a :b | a / b].
  
  "Expose it to JavaScript"
  JS set:'stCalculator' to:calculator.
`);

// Now you can use the Smalltalk calculator from JavaScript
const result = interpreter.jsContext.stCalculator.add(10, 5);
console.log("10 + 5 =", result); // Output: 10 + 5 = 15
```

## Notes on Compatibility

Not all Smalltalk features may be fully supported by SmallBalloon. If you encounter issues, check the [SmallBalloon documentation](https://github.com/fwcd/smallballoon) for limitations and workarounds.

The JavaScript interoperability features are specific to SmallBalloon and may not work in other Smalltalk implementations.
