"Control structures in Smalltalk"

"Conditional statements using ifTrue:ifFalse:"
x := 10.
(x > 5)
    ifTrue: [(JS get:'console') log:'x is greater than 5']
    ifFalse: [(JS get:'console') log:'x is not greater than 5'].

"Another way to write conditionals"
y := 3.
result := (y > 5)
    ifTrue: ['y is greater than 5']
    ifFalse: ['y is not greater than 5'].
(JS get:'console') log:result.

"Loops using whileTrue:"
i := 1.
[i <= 5] whileTrue: [
    (JS get:'console') log:'Loop iteration: ', i asString.
    i := i + 1.
].

"Loops using timesRepeat:"
5 timesRepeat: [
    (JS get:'console') log:'This will be printed 5 times'.
].

"Iterating over a range using to:do:"
1 to: 5 do: [:j |
    (JS get:'console') log:'Counting: ', j asString.
].

"Iterating with a step using to:by:do:"
1 to: 10 by: 2 do: [:k |
    (JS get:'console') log:'Odd numbers: ', k asString.
]. 