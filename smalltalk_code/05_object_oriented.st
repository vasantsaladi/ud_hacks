"Object-Oriented Programming in Smalltalk"

"Define a Person class"
Object subclass: #Person
    instanceVariableNames: 'name age'
    classVariableNames: ''
    poolDictionaries: ''
    category: 'Examples'.

"Define methods for the Person class"
Person methodsFor: 'accessing' stamp: 'user 5/1/2023 10:00' do: "
name
    ^name

name: aString
    name := aString

age
    ^age

age: anInteger
    age := anInteger
".

Person methodsFor: 'printing' stamp: 'user 5/1/2023 10:05' do: "
printString
    ^'Person(name: ', name, ', age: ', age asString, ')'
".

"Create instances of Person"
john := Person new.
john name: 'John Doe'.
john age: 30.

jane := Person new.
jane name: 'Jane Smith'.
jane age: 25.

"Print person information"
(JS get:'console') log:(john printString).
(JS get:'console') log:(jane printString).

"Define a Student class that inherits from Person"
Person subclass: #Student
    instanceVariableNames: 'studentId courses'
    classVariableNames: ''
    poolDictionaries: ''
    category: 'Examples'.

"Define methods for the Student class"
Student methodsFor: 'accessing' stamp: 'user 5/1/2023 10:15' do: "
studentId
    ^studentId

studentId: aString
    studentId := aString

courses
    courses ifNil: [courses := OrderedCollection new].
    ^courses

addCourse: aCourse
    self courses add: aCourse
".

Student methodsFor: 'printing' stamp: 'user 5/1/2023 10:20' do: "
printString
    ^'Student(name: ', name, ', age: ', age asString, 
      ', studentId: ', studentId, ', courses: ', self courses asString, ')'
".

"Create an instance of Student"
bob := Student new.
bob name: 'Bob Johnson'.
bob age: 20.
bob studentId: 'S12345'.
bob addCourse: 'Mathematics'.
bob addCourse: 'Computer Science'.
bob addCourse: 'Physics'.

"Print student information"
(JS get:'console') log:(bob printString). 