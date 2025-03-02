"Smalltalk Data Service for our application"

"Define a DataService class"
Object subclass: #DataService
    instanceVariableNames: 'data'
    classVariableNames: ''
    poolDictionaries: ''
    category: 'AppServices'.

"Define methods for the DataService class"
DataService methodsFor: 'initialization' stamp: 'user 3/2/2025 15:30' do: "
initialize
    super initialize.
    data := OrderedCollection new.
    self generateSampleData.
".

DataService methodsFor: 'data generation' stamp: 'user 3/2/2025 15:35' do: "
generateSampleData
    \"Generate some sample student data\"
    data add: (Dictionary new
        at: 'id' put: 1;
        at: 'name' put: 'John Smith';
        at: 'course' put: 'Computer Science';
        at: 'grade' put: 'A';
        at: 'completionPercentage' put: 92;
        yourself).
        
    data add: (Dictionary new
        at: 'id' put: 2;
        at: 'name' put: 'Emily Johnson';
        at: 'course' put: 'Mathematics';
        at: 'grade' put: 'B+';
        at: 'completionPercentage' put: 85;
        yourself).
        
    data add: (Dictionary new
        at: 'id' put: 3;
        at: 'name' put: 'Michael Brown';
        at: 'course' put: 'Physics';
        at: 'grade' put: 'A-';
        at: 'completionPercentage' put: 88;
        yourself).
        
    data add: (Dictionary new
        at: 'id' put: 4;
        at: 'name' put: 'Sarah Davis';
        at: 'course' put: 'Chemistry';
        at: 'grade' put: 'B';
        at: 'completionPercentage' put: 78;
        yourself).
        
    data add: (Dictionary new
        at: 'id' put: 5;
        at: 'name' put: 'David Wilson';
        at: 'course' put: 'Biology';
        at: 'grade' put: 'A+';
        at: 'completionPercentage' put: 96;
        yourself).
".

DataService methodsFor: 'accessing' stamp: 'user 3/2/2025 15:40' do: "
getAllStudents
    \"Return all student data\"
    ^data
    
getStudentById: id
    \"Find a student by ID\"
    ^data detect: [:student | (student at: 'id') = id] ifNone: [nil]
    
getTopStudents: count
    \"Get the top N students by completion percentage\"
    | sorted |
    sorted := data asSortedCollection: [:a :b | (a at: 'completionPercentage') > (b at: 'completionPercentage')].
    ^sorted first: (count min: sorted size)
    
getAverageCompletion
    \"Calculate the average completion percentage\"
    | sum |
    sum := 0.
    data do: [:student | sum := sum + (student at: 'completionPercentage')].
    ^sum / data size
".

DataService methodsFor: 'json conversion' stamp: 'user 3/2/2025 15:45' do: "
studentsAsJSON
    \"Convert student data to JSON format\"
    | jsonArray |
    jsonArray := JS newArray.
    data do: [:student |
        | jsonObj |
        jsonObj := JS new.
        student keysAndValuesDo: [:key :value |
            jsonObj set: key to: value
        ].
        jsonArray push: jsonObj.
    ].
    ^jsonArray
".

"Create an instance and expose it to JavaScript"
dataService := DataService new.
JS set: 'smalltalkDataService' to: dataService.

"Return the data service instance"
dataService 