"Variables and basic operations in Smalltalk"

"Variable assignment"
x := 10.
y := 20.

"Basic arithmetic"
sum := x + y.
difference := y - x.
product := x * y.
quotient := y / x.

"Output results"
(JS get:'console') log:'x = ', x asString.
(JS get:'console') log:'y = ', y asString.
(JS get:'console') log:'sum = ', sum asString.
(JS get:'console') log:'difference = ', difference asString.
(JS get:'console') log:'product = ', product asString.
(JS get:'console') log:'quotient = ', quotient asString.

"String operations"
firstName := 'John'.
lastName := 'Doe'.
fullName := firstName, ' ', lastName.
(JS get:'console') log:'Full name: ', fullName.

"Boolean operations"
a := true.
b := false.
(JS get:'console') log:'a AND b: ', (a & b) asString.
(JS get:'console') log:'a OR b: ', (a | b) asString.
(JS get:'console') log:'NOT a: ', a not asString. 