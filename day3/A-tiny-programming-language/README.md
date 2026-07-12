# ⚡ MiniLang

A simple programming language with variables, loops, conditions, and an interpreter. Built in pure JavaScript.

## 🎯 Features

- **Variables**: `let x = 10`
- **Print**: `print "Hello World"`
- **If/Else**: `if x > 5 { print "Big" } else { print "Small" }`
- **While Loops**: `while i < 10 { print i }`
- **For Loops**: `for i = 1 to 10 { print i }`
- **Arithmetic**: `+ - * / %`
- **Comparisons**: `== != < > <= >=`
- **Comments**: `# This is a comment`

## 🚀 Try It

### Online
Open `index.html` in your browser to use the web-based interpreter.

### Run Code
```javascript
const result = MiniLang.run(`
    let x = 5
    let y = 10
    print x + y
`);
console.log(result.output); // ["15"]