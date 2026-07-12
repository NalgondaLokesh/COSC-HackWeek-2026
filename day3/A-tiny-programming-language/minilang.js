// ============================================================
//  MiniLang - A Simple Programming Language
//  Features: Variables, Loops, Conditions, Functions
//  Author: Built for demonstration
// ============================================================

// ─── TOKENIZER (Lexer) ─────────
class Tokenizer {
    constructor(code) {
        this.code = code;
        this.pos = 0;
        this.tokens = [];
        this.keywords = ['let', 'print', 'if', 'else', 'while', 'for', 'to', 'true', 'false'];
        this.operators = ['==', '!=', '>=', '<=', '=', '+', '-', '*', '/', '%', '<', '>'];
    }

    tokenize() {
        while (this.pos < this.code.length) {
            const ch = this.code[this.pos];
            
            // Skip whitespace
            if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
                this.pos++;
                continue;
            }
            
            // Comments
            if (ch === '#') {
                while (this.pos < this.code.length && this.code[this.pos] !== '\n') {
                    this.pos++;
                }
                continue;
            }
            
            // String literals
            if (ch === '"') {
                let str = '';
                this.pos++;
                while (this.pos < this.code.length && this.code[this.pos] !== '"') {
                    str += this.code[this.pos];
                    this.pos++;
                }
                this.pos++;
                this.tokens.push({ type: 'STRING', value: str });
                continue;
            }
            
            // Number literals
            if (ch >= '0' && ch <= '9') {
                let num = '';
                while (this.pos < this.code.length && (this.code[this.pos] >= '0' && this.code[this.pos] <= '9' || this.code[this.pos] === '.')) {
                    num += this.code[this.pos];
                    this.pos++;
                }
                this.tokens.push({ type: 'NUMBER', value: parseFloat(num) });
                continue;
            }
            
            // Identifiers and keywords
            if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
                let id = '';
                while (this.pos < this.code.length && ((this.code[this.pos] >= 'a' && this.code[this.pos] <= 'z') || 
                    (this.code[this.pos] >= 'A' && this.code[this.pos] <= 'Z') || 
                    (this.code[this.pos] >= '0' && this.code[this.pos] <= '9') || 
                    this.code[this.pos] === '_')) {
                    id += this.code[this.pos];
                    this.pos++;
                }
                
                if (this.keywords.includes(id)) {
                    this.tokens.push({ type: 'KEYWORD', value: id });
                } else {
                    this.tokens.push({ type: 'IDENTIFIER', value: id });
                }
                continue;
            }
            
            // Multi-character operators
            let twoChar = ch + (this.code[this.pos + 1] || '');
            if (this.operators.includes(twoChar)) {
                this.tokens.push({ type: 'OPERATOR', value: twoChar });
                this.pos += 2;
                continue;
            }
            
            // Single-character operators
            if (this.operators.includes(ch)) {
                this.tokens.push({ type: 'OPERATOR', value: ch });
                this.pos++;
                continue;
            }
            
            // Braces and parentheses
            if (ch === '{' || ch === '}' || ch === '(' || ch === ')' || ch === ';') {
                this.tokens.push({ type: 'BRACE', value: ch });
                this.pos++;
                continue;
            }
            
            this.pos++;
        }
        
        this.tokens.push({ type: 'EOF' });
        return this.tokens;
    }
}

// ─── PARSER ─────────
class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    peek() {
        return this.tokens[this.pos] || { type: 'EOF' };
    }

    next() {
        return this.tokens[this.pos++] || { type: 'EOF' };
    }

    expect(type, value) {
        const token = this.next();
        if (token.type !== type || (value && token.value !== value)) {
            throw new Error(`Expected ${type}${value ? ` '${value}'` : ''}, got ${token.type} '${token.value}'`);
        }
        return token;
    }

    parse() {
        const statements = [];
        while (this.peek().type !== 'EOF') {
            statements.push(this.parseStatement());
        }
        return { type: 'PROGRAM', statements };
    }

    parseStatement() {
        const token = this.peek();
        
        if (token.type === 'KEYWORD') {
            if (token.value === 'let') {
                return this.parseLetStatement();
            }
            if (token.value === 'print') {
                return this.parsePrintStatement();
            }
            if (token.value === 'if') {
                return this.parseIfStatement();
            }
            if (token.value === 'while') {
                return this.parseWhileStatement();
            }
            if (token.value === 'for') {
                return this.parseForStatement();
            }
        }

        if (token.type === 'IDENTIFIER' && this.tokens[this.pos + 1]?.type === 'OPERATOR' && this.tokens[this.pos + 1].value === '=') {
            return this.parseAssignmentStatement();
        }
        
        throw new Error(`Unexpected token: ${token.value} at position ${this.pos}`);
    }

    parseLetStatement() {
        this.next(); // consume 'let'
        const name = this.expect('IDENTIFIER').value;
        this.expect('OPERATOR', '=');
        const expr = this.parseExpression();
        return { type: 'LET', name, value: expr };
    }

    parsePrintStatement() {
        this.next(); // consume 'print'
        const expr = this.parseExpression();
        return { type: 'PRINT', value: expr };
    }

    parseAssignmentStatement() {
        const name = this.expect('IDENTIFIER').value;
        this.expect('OPERATOR', '=');
        const expr = this.parseExpression();
        return { type: 'ASSIGN', name, value: expr };
    }

    parseIfStatement() {
        this.next(); // consume 'if'
        const condition = this.parseExpression();
        this.expect('BRACE', '{');
        const body = [];
        while (this.peek().type !== 'BRACE' || this.peek().value !== '}') {
            body.push(this.parseStatement());
        }
        this.next(); // consume '}'
        
        let elseBody = null;
        if (this.peek().type === 'KEYWORD' && this.peek().value === 'else') {
            this.next(); // consume 'else'
            this.expect('BRACE', '{');
            elseBody = [];
            while (this.peek().type !== 'BRACE' || this.peek().value !== '}') {
                elseBody.push(this.parseStatement());
            }
            this.next(); // consume '}'
        }
        
        return { type: 'IF', condition, body, elseBody };
    }

    parseWhileStatement() {
        this.next(); // consume 'while'
        const condition = this.parseExpression();
        this.expect('BRACE', '{');
        const body = [];
        while (this.peek().type !== 'BRACE' || this.peek().value !== '}') {
            body.push(this.parseStatement());
        }
        this.next(); // consume '}'
        return { type: 'WHILE', condition, body };
    }

    parseForStatement() {
        this.next(); // consume 'for'
        const name = this.expect('IDENTIFIER').value;
        this.expect('OPERATOR', '=');
        const start = this.parseExpression();
        this.expect('KEYWORD', 'to');
        const end = this.parseExpression();
        this.expect('BRACE', '{');
        const body = [];
        while (this.peek().type !== 'BRACE' || this.peek().value !== '}') {
            body.push(this.parseStatement());
        }
        this.next(); // consume '}'
        return { type: 'FOR', name, start, end, body };
    }

    parseExpression() {
        let left = this.parseTerm();
        while (this.peek().type === 'OPERATOR' && ['==', '!=', '<', '>', '<=', '>='].includes(this.peek().value)) {
            const op = this.next().value;
            const right = this.parseTerm();
            left = { type: 'BINARY', op, left, right };
        }
        return left;
    }

    parseTerm() {
        let left = this.parseFactor();
        while (this.peek().type === 'OPERATOR' && ['+', '-'].includes(this.peek().value)) {
            const op = this.next().value;
            const right = this.parseFactor();
            left = { type: 'BINARY', op, left, right };
        }
        return left;
    }

    parseFactor() {
        let left = this.parsePrimary();
        while (this.peek().type === 'OPERATOR' && ['*', '/', '%'].includes(this.peek().value)) {
            const op = this.next().value;
            const right = this.parsePrimary();
            left = { type: 'BINARY', op, left, right };
        }
        return left;
    }

    parsePrimary() {
        const token = this.peek();
        
        if (token.type === 'NUMBER') {
            this.next();
            return { type: 'NUMBER', value: token.value };
        }
        
        if (token.type === 'STRING') {
            this.next();
            return { type: 'STRING', value: token.value };
        }
        
        if (token.type === 'IDENTIFIER') {
            this.next();
            return { type: 'VARIABLE', name: token.value };
        }
        
        if (token.type === 'KEYWORD' && token.value === 'true') {
            this.next();
            return { type: 'BOOLEAN', value: true };
        }
        
        if (token.type === 'KEYWORD' && token.value === 'false') {
            this.next();
            return { type: 'BOOLEAN', value: false };
        }
        
        if (token.type === 'BRACE' && token.value === '(') {
            this.next();
            const expr = this.parseExpression();
            this.expect('BRACE', ')');
            return expr;
        }
        
        throw new Error(`Unexpected token in expression: ${token.value}`);
    }
}

// ─── INTERPRETER ─────────
class Interpreter {
    constructor() {
        this.variables = {};
        this.output = [];
        this.isRunning = true;
    }

    evaluate(expr) {
        if (!expr) return null;
        
        switch (expr.type) {
            case 'NUMBER':
                return expr.value;
            
            case 'STRING':
                return expr.value;
            
            case 'BOOLEAN':
                return expr.value;
            
            case 'VARIABLE':
                if (!(expr.name in this.variables)) {
                    throw new Error(`Undefined variable: ${expr.name}`);
                }
                return this.variables[expr.name];
            
            case 'BINARY':
                const left = this.evaluate(expr.left);
                const right = this.evaluate(expr.right);
                
                switch (expr.op) {
                    case '+': return left + right;
                    case '-': return left - right;
                    case '*': return left * right;
                    case '/': return left / right;
                    case '%': return left % right;
                    case '==': return left === right;
                    case '!=': return left !== right;
                    case '<': return left < right;
                    case '>': return left > right;
                    case '<=': return left <= right;
                    case '>=': return left >= right;
                    default: throw new Error(`Unknown operator: ${expr.op}`);
                }
            
            default:
                throw new Error(`Unknown expression type: ${expr.type}`);
        }
    }

    execute(ast) {
        this.output = [];
        this.variables = {};
        this.isRunning = true;
        this.executeStatements(ast.statements);
        return this.output;
    }

    executeStatements(statements) {
        for (const stmt of statements) {
            if (!this.isRunning) break;
            this.executeStatement(stmt);
        }
    }

    executeStatement(stmt) {
        switch (stmt.type) {
            case 'LET':
                const value = this.evaluate(stmt.value);
                this.variables[stmt.name] = value;
                break;
            
            case 'PRINT':
                const val = this.evaluate(stmt.value);
                this.output.push(String(val));
                break;

            case 'ASSIGN':
                const assignedValue = this.evaluate(stmt.value);
                this.variables[stmt.name] = assignedValue;
                break;
            
            case 'IF':
                const cond = this.evaluate(stmt.condition);
                if (cond) {
                    this.executeStatements(stmt.body);
                } else if (stmt.elseBody) {
                    this.executeStatements(stmt.elseBody);
                }
                break;
            
            case 'WHILE':
                while (this.evaluate(stmt.condition)) {
                    this.executeStatements(stmt.body);
                }
                break;
            
            case 'FOR':
                // Initialize loop variable
                this.variables[stmt.name] = this.evaluate(stmt.start);
                const endVal = this.evaluate(stmt.end);
                while (this.variables[stmt.name] <= endVal) {
                    this.executeStatements(stmt.body);
                    this.variables[stmt.name]++;
                }
                break;
            
            default:
                throw new Error(`Unknown statement type: ${stmt.type}`);
        }
    }
}

// ─── COMPLETE INTERPRETER API ─────────
class MiniLang {
    static run(code) {
        try {
            // Tokenize
            const tokenizer = new Tokenizer(code);
            const tokens = tokenizer.tokenize();
            
            // Parse
            const parser = new Parser(tokens);
            const ast = parser.parse();
            
            // Execute
            const interpreter = new Interpreter();
            const output = interpreter.execute(ast);
            
            return {
                success: true,
                output: output,
                ast: ast
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                output: []
            };
        }
    }
}

// ─── EXPORT FOR BROWSER ─────────
if (typeof window !== 'undefined') {
    window.MiniLang = MiniLang;
}

// ─── EXPORT FOR NODE ─────────
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MiniLang;
}