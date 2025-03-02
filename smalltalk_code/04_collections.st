"Collections in Smalltalk"

"Arrays"
fruits := #('apple' 'banana' 'orange' 'grape' 'kiwi').
(JS get:'console') log:'Fruits array: ', fruits asString.

"Accessing array elements (1-based indexing)"
(JS get:'console') log:'First fruit: ', (fruits at: 1).
(JS get:'console') log:'Third fruit: ', (fruits at: 3).

"Iterating over an array"
fruits do: [:fruit |
    (JS get:'console') log:'Fruit: ', fruit.
].

"Ordered Collections (similar to dynamic arrays)"
numbers := OrderedCollection new.
numbers add: 10; add: 20; add: 30; add: 40; add: 50.
(JS get:'console') log:'Numbers collection: ', numbers asString.

"Adding and removing elements"
numbers addFirst: 5.
numbers addLast: 55.
numbers removeFirst.
numbers removeLast.
(JS get:'console') log:'Modified numbers: ', numbers asString.

"Dictionaries (key-value pairs)"
person := Dictionary new.
person at: 'name' put: 'John Doe'.
person at: 'age' put: 30.
person at: 'city' put: 'New York'.
(JS get:'console') log:'Person dictionary: ', person asString.

"Accessing dictionary values"
(JS get:'console') log:'Name: ', (person at: 'name').
(JS get:'console') log:'Age: ', (person at: 'age') asString.

"Iterating over a dictionary"
person keysAndValuesDo: [:key :value |
    (JS get:'console') log:key, ': ', value asString.
]. 