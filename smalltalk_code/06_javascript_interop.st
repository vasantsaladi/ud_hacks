"JavaScript Interoperability in Smalltalk"

"Accessing JavaScript global objects"
console := JS get:'console'.
math := JS get:'Math'.
document := JS get:'document'.

"Using JavaScript methods"
console log:'Hello from Smalltalk via JavaScript console!'.
randomNumber := math random.
console log:'Random number: ', randomNumber asString.

"Using JavaScript Math functions"
pi := math get:'PI'.
console log:'PI value: ', pi asString.
squareRoot := math sqrt: 16.
console log:'Square root of 16: ', squareRoot asString.

"Creating JavaScript objects"
jsObject := JS new.
jsObject set:'name' to:'John Doe'.
jsObject set:'age' to:30.
jsObject set:'greet' to:[:name | 'Hello, ', name, '!'].

"Accessing JavaScript object properties"
console log:'Name: ', (jsObject get:'name').
console log:'Age: ', (jsObject get:'age') asString.

"Calling JavaScript object methods"
greeting := jsObject call:'greet' with:#('World').
console log:greeting.

"Creating a JavaScript array"
jsArray := JS newArray.
jsArray push:'apple'.
jsArray push:'banana'.
jsArray push:'orange'.

"Accessing JavaScript array elements"
console log:'First fruit: ', (jsArray at:0).
console log:'Array length: ', (jsArray get:'length') asString.

"Iterating over a JavaScript array"
jsArray forEach:[:item :index |
    console log:'Item ', index asString, ': ', item.
].

"Executing arbitrary JavaScript code"
JS eval:'console.log("This is executed directly in JavaScript");'.

"Defining a Smalltalk function and exposing it to JavaScript"
factorial := [:n | n <= 1 ifTrue:[1] ifFalse:[n * (factorial value:(n-1))]].
JS set:'stFactorial' to:factorial.

"Now this function can be called from JavaScript as stFactorial(5)"
console log:'Factorial of 5 calculated in Smalltalk: ', (factorial value:5) asString. 