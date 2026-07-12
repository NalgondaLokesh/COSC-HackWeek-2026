# Fibonacci Sequence

let a = 0
let b = 1
let n = 10

print "Fibonacci sequence:"
print a
print b

for i = 1 to n - 2 {
    let c = a + b
    print c
    a = b
    b = c
}