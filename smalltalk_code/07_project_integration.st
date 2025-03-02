"Project Integration Example"

"Define a simple data processing class for your project"
Object subclass: #DataProcessor
    instanceVariableNames: 'data results'
    classVariableNames: ''
    poolDictionaries: ''
    category: 'ProjectExample'.

"Define methods for the DataProcessor class"
DataProcessor methodsFor: 'initialization' stamp: 'user 5/1/2023 11:00' do: "
initialize
    super initialize.
    data := OrderedCollection new.
    results := OrderedCollection new.
".

DataProcessor methodsFor: 'accessing' stamp: 'user 5/1/2023 11:05' do: "
addData: anItem
    data add: anItem.
    
data
    ^data
    
results
    ^results
".

DataProcessor methodsFor: 'processing' stamp: 'user 5/1/2023 11:10' do: "
processData
    data do: [:item |
        results add: self processItem: item.
    ].
    ^results
    
processItem: anItem
    \"Process a single item - override in subclasses\"
    ^anItem
".

"Create a specific processor for your project"
DataProcessor subclass: #NumberProcessor
    instanceVariableNames: 'multiplier'
    classVariableNames: ''
    poolDictionaries: ''
    category: 'ProjectExample'.

"Define methods for the NumberProcessor class"
NumberProcessor methodsFor: 'initialization' stamp: 'user 5/1/2023 11:15' do: "
initialize
    super initialize.
    multiplier := 1.
    
multiplier: aNumber
    multiplier := aNumber.
".

NumberProcessor methodsFor: 'processing' stamp: 'user 5/1/2023 11:20' do: "
processItem: aNumber
    \"Multiply the number by the multiplier\"
    ^aNumber * multiplier
".

"Create an instance and use it"
processor := NumberProcessor new.
processor multiplier: 2.

"Add some test data"
processor addData: 1.
processor addData: 2.
processor addData: 3.
processor addData: 4.
processor addData: 5.

"Process the data"
results := processor processData.

"Output the results"
console := JS get:'console'.
console log:'Original data: ', processor data asString.
console log:'Processed results: ', results asString.

"Example of how this could integrate with a JavaScript application"
JS set:'smalltalkProcessor' to:processor.
JS eval:'
// Now we can use the Smalltalk processor from JavaScript
console.log("Accessing Smalltalk processor from JavaScript:");
console.log("Data:", smalltalkProcessor.data());
console.log("Results:", smalltalkProcessor.results());

// We can even add more data and process it
smalltalkProcessor.addData(6);
smalltalkProcessor.addData(7);
smalltalkProcessor.processData();
console.log("Updated results:", smalltalkProcessor.results());
'. 