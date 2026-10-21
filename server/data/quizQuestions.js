/**
 * data/quizQuestions.js — Curated Adaptive Micro-Quiz Question Bank
 *
 * Disheera · Enterprise Backend Service
 *
 * 45 Vetted Technical Questions across 3 Core Foundational Skills:
 * - JavaScript (5 Easy, 5 Medium, 5 Hard)
 * - Python (5 Easy, 5 Medium, 5 Hard)
 * - SQL (5 Easy, 5 Medium, 5 Hard)
 *
 * Each question has:
 * - id: unique string
 * - skill: 'javascript' | 'python' | 'sql'
 * - difficulty: 'easy' | 'medium' | 'hard'
 * - topic: specific topic tag for roadmap gap mapping (e.g. 'closures', 'event-loop', 'joins')
 * - question: prompt text
 * - options: 4 distinct choices
 * - correctIndex: 0-3 index
 * - explanation: punchy 1-line educational rationale
 */

const QUIZ_QUESTIONS = {
  "javascript": {
    "easy": [
      {
        "id": "js-e1",
        "skill": "javascript",
        "difficulty": "easy",
        "topic": "variables-scope",
        "question": "What is the main scoping difference between var and let in JavaScript?",
        "options": [
          "var is block-scoped; let is function-scoped",
          "let is block-scoped; var is function-scoped",
          "let can be redeclared in the same scope; var cannot",
          "There is no scoping difference between them"
        ],
        "correctIndex": 1,
        "explanation": "let honors block scope delimited by curly braces {}, whereas var hoists to the enclosing function scope."
      },
      {
        "id": "js-e2",
        "skill": "javascript",
        "difficulty": "easy",
        "topic": "primitives-null",
        "question": "What does the expression typeof null evaluate to in JavaScript?",
        "options": [
          "\"null\"",
          "\"undefined\"",
          "\"object\"",
          "\"boolean\""
        ],
        "correctIndex": 2,
        "explanation": "typeof null returns \"object\" due to a legacy design quirk in the original JavaScript 1.0 engine."
      },
      {
        "id": "js-e3",
        "skill": "javascript",
        "difficulty": "easy",
        "topic": "array-methods",
        "question": "Which Array method produces a brand-new array containing transformed items?",
        "options": [
          ".forEach()",
          ".map()",
          ".filter()",
          ".push()"
        ],
        "correctIndex": 1,
        "explanation": ".map() returns a new array with the transformed values, whereas .forEach() returns undefined."
      },
      {
        "id": "js-e4",
        "skill": "javascript",
        "difficulty": "easy",
        "topic": "equality-coercion",
        "question": "What are the evaluation results of (\"5\" == 5) and (\"5\" === 5)?",
        "options": [
          "true and true",
          "false and false",
          "true and false",
          "false and true"
        ],
        "correctIndex": 2,
        "explanation": "The == operator performs type coercion, while === strictly checks both value and type."
      },
      {
        "id": "js-e5",
        "skill": "javascript",
        "difficulty": "easy",
        "topic": "dom-manipulation",
        "question": "Which native DOM method retrieves an HTML element using its unique ID?",
        "options": [
          "document.getElementsByClassName()",
          "document.querySelector(\".id\")",
          "document.getElementById()",
          "document.findId()"
        ],
        "correctIndex": 2,
        "explanation": "document.getElementById() directly selects the singular DOM node matching the specified ID."
      },
      {
        "id": "js-e6",
        "skill": "javascript",
        "difficulty": "easy",
        "topic": "nan-comparison",
        "question": "Why does NaN === NaN evaluate to false in JavaScript?",
        "options": [
          "Because NaN represents an undefined variable reference",
          "Because IEEE 754 float specifications define NaN as not equal to any value, including itself",
          "Because the JavaScript parser automatically converts NaN to 0 in comparison",
          "Because === converts both operands to strings first"
        ],
        "correctIndex": 1,
        "explanation": "According to IEEE 754 and JavaScript specs, NaN is unique and never strictly equal to any value, including another NaN."
      },
      {
        "id": "js-e7",
        "skill": "javascript",
        "difficulty": "easy",
        "topic": "const-mutation",
        "question": "Can properties of an object declared with \"const user = { name: 'Alex' }\" be modified?",
        "options": [
          "No, const makes all nested object properties permanently immutable",
          "Yes, const prevents variable re-assignment, but properties within the object can still be mutated",
          "Only if Object.freeze() was explicitly invoked beforehand",
          "No, modifying properties throws a SyntaxError in modern strict mode"
        ],
        "correctIndex": 1,
        "explanation": "const binds the variable identifier to the memory reference; object mutation is permitted unless Object.freeze() is used."
      },
      {
        "id": "js-e8",
        "skill": "javascript",
        "difficulty": "easy",
        "topic": "template-literals",
        "question": "Which syntax creates a template literal string with embedded expressions in ES6+?",
        "options": [
          "Single quotes: 'Hello ${name}'",
          "Double quotes: \"Hello #{name}\"",
          "Backticks: `Hello ${name}`",
          "Parentheses: (Hello %(name))"
        ],
        "correctIndex": 2,
        "explanation": "Template literals use backticks (``) and ${expression} interpolation placeholders."
      },
      {
        "id": "js-e9",
        "skill": "javascript",
        "difficulty": "easy",
        "topic": "string-includes",
        "question": "Which modern String method checks if a substring exists within a string and returns a boolean?",
        "options": [
          ".has()",
          ".contains()",
          ".includes()",
          ".searchBool()"
        ],
        "correctIndex": 2,
        "explanation": "String.prototype.includes() returns true if the search string appears within the target string."
      },
      {
        "id": "js-e10",
        "skill": "javascript",
        "difficulty": "easy",
        "topic": "json-serialization",
        "question": "What happens when you pass an invalid JSON string to JSON.parse() in JavaScript?",
        "options": [
          "It returns null silently",
          "It returns undefined without throwing",
          "It throws a SyntaxError exception",
          "It returns an empty object {}"
        ],
        "correctIndex": 2,
        "explanation": "JSON.parse() throws a SyntaxError when given malformed JSON, requiring a try/catch block for safe parsing."
      }
    ],
    "medium": [
      {
        "id": "js-m1",
        "skill": "javascript",
        "difficulty": "medium",
        "topic": "closures",
        "question": "What fundamentally is a closure in JavaScript?",
        "options": [
          "A function that terminates immediately after running",
          "A function bundled with references to its surrounding lexical environment",
          "A method to close browser popups securely",
          "A callback that only runs when a network promise rejects"
        ],
        "correctIndex": 1,
        "explanation": "Closures allow inner functions to retain access to variables from an outer enclosing scope even after it finishes execution."
      },
      {
        "id": "js-m2",
        "skill": "javascript",
        "difficulty": "medium",
        "topic": "async-promises",
        "question": "What are the three possible lifecycle states of a JavaScript Promise?",
        "options": [
          "starting, running, finished",
          "pending, fulfilled, rejected",
          "waiting, success, error",
          "init, resolved, failed"
        ],
        "correctIndex": 1,
        "explanation": "Promises begin as pending and transition definitively into either fulfilled or rejected."
      },
      {
        "id": "js-m3",
        "skill": "javascript",
        "difficulty": "medium",
        "topic": "this-binding",
        "question": "How do ES6 arrow functions handle the this keyword compared to traditional functions?",
        "options": [
          "Arrow functions bind this dynamically to the runtime caller",
          "Arrow functions lexically inherit this from the surrounding outer context",
          "Arrow functions cannot access this at all",
          "Arrow functions bind this strictly to the global window object"
        ],
        "correctIndex": 1,
        "explanation": "Arrow functions do not bind their own this; they retain the this value of the enclosing lexical scope."
      },
      {
        "id": "js-m4",
        "skill": "javascript",
        "difficulty": "medium",
        "topic": "event-propagation",
        "question": "What does event.stopPropagation() achieve when dispatched in an event listener?",
        "options": [
          "Prevents default browser navigation or form refresh",
          "Stops the event from traveling further up or down the DOM tree",
          "Deletes the element that received the event",
          "Pauses asynchronous JavaScript execution"
        ],
        "correctIndex": 1,
        "explanation": "stopPropagation() stops the event from bubbling up to parent ancestors or capturing down."
      },
      {
        "id": "js-m5",
        "skill": "javascript",
        "difficulty": "medium",
        "topic": "rest-spread",
        "question": "Given const o = { a: 1, b: 2 }; const copy = { ...o, b: 9 }; what is copy.b?",
        "options": [
          "1",
          "2",
          "9",
          "undefined"
        ],
        "correctIndex": 2,
        "explanation": "Object spread properties evaluate left-to-right, so the later b: 9 overrides the earlier spread b: 2."
      },
      {
        "id": "js-m6",
        "skill": "javascript",
        "difficulty": "medium",
        "topic": "event-loop-microtasks",
        "question": "In what order will the console messages appear?",
        "codeSnippet": "console.log(\"1\");\nsetTimeout(() => console.log(\"2\"), 0);\nPromise.resolve().then(() => console.log(\"3\"));\nconsole.log(\"4\");",
        "options": [
          "1, 2, 3, 4",
          "1, 4, 3, 2",
          "1, 4, 2, 3",
          "3, 1, 4, 2"
        ],
        "correctIndex": 1,
        "explanation": "Synchronous code runs first (1, 4), then the microtask queue (Promise.then: 3), and finally macrotasks (setTimeout: 2)."
      },
      {
        "id": "js-m7",
        "skill": "javascript",
        "difficulty": "medium",
        "topic": "debounce-throttle",
        "question": "What is the key functional difference between debouncing and throttling a function?",
        "options": [
          "Debounce enforces a maximum execution frequency; throttle delays until activity ceases",
          "Debounce waits until events stop firing for N ms; throttle executes at most once every N ms",
          "Debounce only works with mouse events; throttle only works with network fetches",
          "There is no difference; they are aliases for the same algorithm"
        ],
        "correctIndex": 1,
        "explanation": "Debounce postpones execution until inactivity; throttle guarantees periodic execution during continuous events."
      },
      {
        "id": "js-m8",
        "skill": "javascript",
        "difficulty": "medium",
        "topic": "destructuring-defaults",
        "question": "What does this destructuring expression evaluate to: const { count = 10 } = { count: null }?",
        "options": [
          "count = 10 because null is falsy",
          "count = null because default parameters only apply when the property is undefined",
          "Throws a TypeError on null destructuring",
          "count = 0"
        ],
        "correctIndex": 1,
        "explanation": "Default values in destructuring and function parameters only kick in when the value is strictly undefined, not null."
      },
      {
        "id": "js-m9",
        "skill": "javascript",
        "difficulty": "medium",
        "topic": "set-uniqueness",
        "question": "What is the fastest way to extract unique primitive items from an array in modern JavaScript?",
        "options": [
          "array.filter((v, i) => array.indexOf(v) === i)",
          "[...new Set(array)]",
          "array.reduce((acc, v) => acc.includes(v) ? acc : [...acc, v], [])",
          "Object.values(array)"
        ],
        "correctIndex": 1,
        "explanation": "[...new Set(array)] leverages the O(1) average lookup uniqueness of the native Set collection."
      },
      {
        "id": "js-m10",
        "skill": "javascript",
        "difficulty": "medium",
        "topic": "optional-chaining",
        "question": "What will user?.profile?.getName?.() return if user.profile is null?",
        "options": [
          "Throws a TypeError: Cannot read property \"getName\" of null",
          "undefined without throwing an exception",
          "null",
          "false"
        ],
        "correctIndex": 1,
        "explanation": "Optional chaining (?.) short-circuits evaluation and immediately returns undefined if the left-hand operand is null or undefined."
      }
    ],
    "hard": [
      {
        "id": "js-h1",
        "skill": "javascript",
        "difficulty": "hard",
        "topic": "event-loop",
        "question": "What is the log order of: console.log(1); setTimeout(() => console.log(2), 0); Promise.resolve().then(() => console.log(3)); console.log(4);?",
        "options": [
          "1, 2, 3, 4",
          "1, 4, 2, 3",
          "1, 4, 3, 2",
          "1, 3, 4, 2"
        ],
        "correctIndex": 2,
        "explanation": "Synchronous operations (1, 4) run first, followed by microtasks (Promise 3), and lastly macrotasks (setTimeout 2)."
      },
      {
        "id": "js-h2",
        "skill": "javascript",
        "difficulty": "hard",
        "topic": "prototypes",
        "question": "What occurs when querying a property not found directly on an object instance?",
        "options": [
          "Immediately throws a ReferenceError",
          "Traverses up the __proto__ prototype chain until found or reaches null",
          "Instantiates the property with value null on the object",
          "Clones the prototype properties into local memory"
        ],
        "correctIndex": 1,
        "explanation": "JavaScript walks up the prototype chain link by link until it either finds the property or hits null (Object.prototype.__proto__)."
      },
      {
        "id": "js-h3",
        "skill": "javascript",
        "difficulty": "hard",
        "topic": "debounce-throttle",
        "question": "What is the operational distinction between debounce and throttle?",
        "options": [
          "Throttle delays until user stops; debounce enforces a maximum execution frequency",
          "Debounce delays execution until N ms of silence; throttle limits execution to once per N ms",
          "Throttle is for click events; debounce is for scroll events only",
          "They are interchangeable terms for asynchronous queuing"
        ],
        "correctIndex": 1,
        "explanation": "Debounce fires only after inactivity settles; throttle guarantees regular execution at most once per time window."
      },
      {
        "id": "js-h4",
        "skill": "javascript",
        "difficulty": "hard",
        "topic": "memory-weakmap",
        "question": "Why are WeakMaps advantageous over regular Maps for object association caches?",
        "options": [
          "WeakMaps allow garbage collection of keys when no other references exist",
          "WeakMaps accept primitive strings and numbers as keys",
          "WeakMaps maintain an ordered array of keys internally",
          "WeakMaps can be serialized with JSON.stringify()"
        ],
        "correctIndex": 0,
        "explanation": "WeakMap references to key objects are weak, preventing memory leaks when target objects are discarded elsewhere."
      },
      {
        "id": "js-h5",
        "skill": "javascript",
        "difficulty": "hard",
        "topic": "currying-hof",
        "question": "Currying transforms a multi-argument function fn(a, b, c) into which structure?",
        "options": [
          "fn(a)(b)(c)",
          "[a, b, c].map(fn)",
          "Promise.all([a, b, c])",
          "fn([a, b, c])"
        ],
        "correctIndex": 0,
        "explanation": "Currying translates a function callable with N arguments into a nested chain of single-argument functions."
      },
      {
        "id": "js-h6",
        "skill": "javascript",
        "difficulty": "hard",
        "topic": "weakmap-gc",
        "question": "Why are WeakMaps uniquely suited for caching object metadata or private fields compared to regular Maps?",
        "options": [
          "WeakMaps store key/value pairs in disk cache rather than RAM",
          "WeakMap keys are held weakly, allowing the garbage collector to reclaim keys when no other references exist",
          "WeakMaps can use primitive strings and numbers as weak keys",
          "WeakMaps automatically encrypt object values in memory"
        ],
        "correctIndex": 1,
        "explanation": "WeakMap references to keys are weak, preventing memory leaks when objects are discarded elsewhere in the application."
      },
      {
        "id": "js-h7",
        "skill": "javascript",
        "difficulty": "hard",
        "topic": "generators-iterators",
        "question": "What protocol must a custom JavaScript object implement to be iterable via for...of loops?",
        "options": [
          "It must have a .toArray() method returning an Array",
          "It must implement the [Symbol.iterator] method returning an iterator object with a .next() method",
          "It must inherit directly from GeneratorFunction.prototype",
          "It must register its properties with Object.keys()"
        ],
        "correctIndex": 1,
        "explanation": "The Iterable protocol requires an object to have a method at the [Symbol.iterator] key that returns an iterator with next()."
      },
      {
        "id": "js-h8",
        "skill": "javascript",
        "difficulty": "hard",
        "topic": "prototype-pollution",
        "question": "What security vulnerability occurs when recursive object merge functions fail to validate \"__proto__\" keys?",
        "options": [
          "Cross-Site Scripting (XSS) via cookie theft",
          "Prototype Pollution, injecting malicious properties into Object.prototype affecting all objects",
          "SQL Injection via client-side query string templates",
          "Buffer Overflow in the V8 garbage collector"
        ],
        "correctIndex": 1,
        "explanation": "Prototype pollution allows attackers to modify Object.prototype, altering application behavior or bypassing security checks."
      },
      {
        "id": "js-h9",
        "skill": "javascript",
        "difficulty": "hard",
        "topic": "currying-partial-application",
        "question": "What functional programming transformation converts f(a, b, c) into f(a)(b)(c)?",
        "options": [
          "Memoization",
          "Currying",
          "Transduction",
          "Function Hoisting"
        ],
        "correctIndex": 1,
        "explanation": "Currying transforms a multi-argument function into a series of unary functions that each take one argument."
      },
      {
        "id": "js-h10",
        "skill": "javascript",
        "difficulty": "hard",
        "topic": "proxy-reflection",
        "question": "What Proxy trap intercepts property access operations like \"user.name\" in ES6 Proxies?",
        "options": [
          "trapAccess()",
          "get(target, prop, receiver)",
          "interceptProperty(key)",
          "onPropertyRead()"
        ],
        "correctIndex": 1,
        "explanation": "The get trap in a Proxy handler intercepts property read operations, receiving target, prop, and receiver arguments."
      }
    ]
  },
  "python": {
    "easy": [
      {
        "id": "py-e1",
        "skill": "python",
        "difficulty": "easy",
        "topic": "mutability",
        "question": "Which of the following built-in Python data structures is immutable?",
        "options": [
          "list",
          "dict",
          "set",
          "tuple"
        ],
        "correctIndex": 3,
        "explanation": "Tuples cannot be altered or appended to after instantiation, making them immutable."
      },
      {
        "id": "py-e2",
        "skill": "python",
        "difficulty": "easy",
        "topic": "slicing",
        "question": "What does the slice expression arr[::-1] do to a list arr = [1, 2, 3]?",
        "options": [
          "Returns [1, 2, 3]",
          "Returns [3, 2, 1]",
          "Deletes the last element",
          "Raises an IndexError"
        ],
        "correctIndex": 1,
        "explanation": "A step parameter of -1 reverses the sequence."
      },
      {
        "id": "py-e3",
        "skill": "python",
        "difficulty": "easy",
        "topic": "dict-get",
        "question": "What is the recommended way to read a dictionary key without triggering a KeyError if absent?",
        "options": [
          "d[key]",
          "d.get(key, default)",
          "d.fetch(key)",
          "d.has(key)"
        ],
        "correctIndex": 1,
        "explanation": "dict.get() safely returns None or a custom fallback value if the key is not in the dictionary."
      },
      {
        "id": "py-e4",
        "skill": "python",
        "difficulty": "easy",
        "topic": "args-kwargs",
        "question": "In a function header def f(*args, **kwargs), what type is args?",
        "options": [
          "list",
          "tuple",
          "dict",
          "generator"
        ],
        "correctIndex": 1,
        "explanation": "*args packs arbitrary positional arguments into an immutable tuple."
      },
      {
        "id": "py-e5",
        "skill": "python",
        "difficulty": "easy",
        "topic": "f-strings",
        "question": "Which syntax represents a Python 3.6+ formatted f-string?",
        "options": [
          "f\"Hello {name}\"",
          "\"Hello %s\" % name",
          "\"Hello {}\".format(name)",
          "$\"Hello {name}\""
        ],
        "correctIndex": 0,
        "explanation": "f-strings use an f prefix and evaluate expressions directly inside curly braces."
      },
      {
        "id": "py-e6",
        "skill": "python",
        "difficulty": "easy",
        "topic": "mutable-immutable",
        "question": "Which of the following built-in Python data types is immutable?",
        "options": [
          "list",
          "dict",
          "tuple",
          "set"
        ],
        "correctIndex": 2,
        "explanation": "Tuples, strings, and numbers are immutable in Python; their contents cannot be modified after instantiation."
      },
      {
        "id": "py-e7",
        "skill": "python",
        "difficulty": "easy",
        "topic": "dict-get-default",
        "question": "What does data.get(\"age\", 25) return if \"age\" is not a key in dictionary data?",
        "options": [
          "KeyError exception",
          "None",
          "25",
          "False"
        ],
        "correctIndex": 2,
        "explanation": "dict.get(key, default) returns the specified default fallback if the key does not exist, avoiding a KeyError."
      },
      {
        "id": "py-e8",
        "skill": "python",
        "difficulty": "easy",
        "topic": "f-strings",
        "question": "Which is the recommended format string syntax introduced in Python 3.6+ for string interpolation?",
        "options": [
          "\"Hello %s\" % name",
          "\"Hello {}\".format(name)",
          "f\"Hello {name}\"",
          "string.interpolate(\"Hello $name\")"
        ],
        "correctIndex": 2,
        "explanation": "f-strings (Formatted String Literals) are evaluated at runtime and offer superior readability and performance."
      },
      {
        "id": "py-e9",
        "skill": "python",
        "difficulty": "easy",
        "topic": "is-vs-equality",
        "question": "What is the difference between \"a == b\" and \"a is b\" in Python?",
        "options": [
          "== compares object identity (memory address); is compares value equality",
          "== compares value equality; is compares object identity (memory address)",
          "== is used for numbers; is is used for strings",
          "There is no difference in Python 3"
        ],
        "correctIndex": 1,
        "explanation": "== checks if values are equal; is checks whether both variables reference the exact same object in memory."
      },
      {
        "id": "py-e10",
        "skill": "python",
        "difficulty": "easy",
        "topic": "slicing",
        "question": "What does my_list[::-1] do in Python?",
        "options": [
          "Clears the list completely",
          "Returns a reversed shallow copy of my_list",
          "Deletes the last element of my_list",
          "Throws an IndexError"
        ],
        "correctIndex": 1,
        "explanation": "A step parameter of -1 reverses the sequence during slicing."
      }
    ],
    "medium": [
      {
        "id": "py-m1",
        "skill": "python",
        "difficulty": "medium",
        "topic": "comprehensions",
        "question": "What is the output of [x*2 for x in range(4) if x % 2 == 0]?",
        "options": [
          "[0, 2, 4, 6]",
          "[0, 4]",
          "[0, 2]",
          "[4, 8]"
        ],
        "correctIndex": 1,
        "explanation": "Even numbers in range(4) are 0 and 2. Multiplying by 2 produces [0, 4]."
      },
      {
        "id": "py-m2",
        "skill": "python",
        "difficulty": "medium",
        "topic": "generators",
        "question": "What is the primary memory advantage of a generator with yield over a normal list return?",
        "options": [
          "Generators run in parallel on all CPU cores",
          "Generators compute items lazily on demand, avoiding storing the full list in memory",
          "Generators compile into C extensions automatically",
          "Generators automatically compress data using gzip"
        ],
        "correctIndex": 1,
        "explanation": "yield produces an iterator that evaluates one item at a time, keeping memory overhead constant O(1)."
      },
      {
        "id": "py-m3",
        "skill": "python",
        "difficulty": "medium",
        "topic": "context-managers",
        "question": "Which dunder methods must a class define to implement the with context manager protocol?",
        "options": [
          "__open__ and __close__",
          "__enter__ and __exit__",
          "__start__ and __finish__",
          "__init__ and __del__"
        ],
        "correctIndex": 1,
        "explanation": "__enter__ handles acquisition and __exit__ guarantees cleanup, even if an exception occurs."
      },
      {
        "id": "py-m4",
        "skill": "python",
        "difficulty": "medium",
        "topic": "shallow-copy",
        "question": "If b = copy.copy(a) on a nested list a = [[1, 2], [3]], what happens if you set a[0][0] = 99?",
        "options": [
          "b is unaffected and stays [[1, 2], [3]]",
          "b[0][0] also becomes 99 because inner lists share references",
          "Raises an AttributeError",
          "Python creates an immutable copy automatically"
        ],
        "correctIndex": 1,
        "explanation": "Shallow copies copy only the outer container; nested mutable objects remain shared between copies."
      },
      {
        "id": "py-m5",
        "skill": "python",
        "difficulty": "medium",
        "topic": "decorators",
        "question": "What is a Python decorator at its core?",
        "options": [
          "A graphical styling tool for Python scripts",
          "A higher-order function that takes a function and returns a modified function",
          "A class that enforces the Singleton pattern",
          "A type annotation that forces static compilation"
        ],
        "correctIndex": 1,
        "explanation": "Decorators wrap a callable to add pre/post-execution behavior without altering its original definition."
      },
      {
        "id": "py-m6",
        "skill": "python",
        "difficulty": "medium",
        "topic": "generator-expressions",
        "question": "Why would you use a generator expression (x for x in data) instead of a list comprehension [x for x in data]?",
        "options": [
          "Generators allow indexing with negative integers",
          "Generators yield items lazily on demand, consuming O(1) memory instead of holding the entire list in RAM",
          "Generators are automatically multithreaded across all CPU cores",
          "Generators can only store strings, whereas lists store any type"
        ],
        "correctIndex": 1,
        "explanation": "Generators compute values lazily using iterators, making them ideal for processing large or infinite datasets with minimal memory."
      },
      {
        "id": "py-m7",
        "skill": "python",
        "difficulty": "medium",
        "topic": "args-kwargs",
        "question": "In a function definition \"def send_email(*args, **kwargs)\", what data types are args and kwargs?",
        "options": [
          "args is a list; kwargs is a dict",
          "args is a tuple; kwargs is a dict",
          "args is a set; kwargs is a list",
          "args is a tuple; kwargs is a namedtuple"
        ],
        "correctIndex": 1,
        "explanation": "*args captures positional arguments as a tuple; **kwargs captures keyword arguments as a dictionary."
      },
      {
        "id": "py-m8",
        "skill": "python",
        "difficulty": "medium",
        "topic": "context-managers",
        "question": "Which two dunder methods must a class implement to support the \"with\" context management protocol?",
        "options": [
          "__start__ and __stop__",
          "__open__ and __close__",
          "__enter__ and __exit__",
          "__init__ and __del__"
        ],
        "correctIndex": 2,
        "explanation": "Context managers implement __enter__() to set up resources and __exit__() to ensure cleanup even if exceptions occur."
      },
      {
        "id": "py-m9",
        "skill": "python",
        "difficulty": "medium",
        "topic": "decorator-wraps",
        "question": "Why should custom decorators use functools.wraps on the wrapper function?",
        "options": [
          "To make the decorated function run 2x faster",
          "To preserve the original function's name, docstring, and metadata",
          "To automatically catch uncaught exceptions",
          "To convert the function into a class method"
        ],
        "correctIndex": 1,
        "explanation": "@functools.wraps copies the __name__, __doc__, and module metadata from the original function to the wrapper."
      },
      {
        "id": "py-m10",
        "skill": "python",
        "difficulty": "medium",
        "topic": "lambda-sorting",
        "question": "How do you sort a list of dictionaries users = [{\"age\": 22}, {\"age\": 19}] by age ascending?",
        "options": [
          "users.sort(by=\"age\")",
          "users.sort(key=lambda u: u[\"age\"])",
          "sorted(users, property=\"age\")",
          "users.order_by(\"age\")"
        ],
        "correctIndex": 1,
        "explanation": "The key parameter accepts a callable (such as a lambda) that extracts a comparison key from each element."
      }
    ],
    "hard": [
      {
        "id": "py-h1",
        "skill": "python",
        "difficulty": "hard",
        "topic": "gil-concurrency",
        "question": "What constraint does CPython Global Interpreter Lock (GIL) place on threading?",
        "options": [
          "Disallows opening multiple network sockets",
          "Restricts execution to one thread running Python bytecode at a time, limiting CPU-bound speedups",
          "Requires all functions to be declared async",
          "Prevents Python from executing on 64-bit systems"
        ],
        "correctIndex": 1,
        "explanation": "The GIL prevents multi-threaded CPU parallelization in CPython; multiprocessing is required for CPU parallelism."
      },
      {
        "id": "py-h2",
        "skill": "python",
        "difficulty": "hard",
        "topic": "metaclasses",
        "question": "In Python object model, what is the default metaclass that creates classes?",
        "options": [
          "object",
          "type",
          "ClassFactory",
          "MetaBase"
        ],
        "correctIndex": 1,
        "explanation": "In Python, type is the default metaclass responsible for constructing class objects."
      },
      {
        "id": "py-h3",
        "skill": "python",
        "difficulty": "hard",
        "topic": "descriptors",
        "question": "Which triad of methods comprises the Python descriptor protocol?",
        "options": [
          "__get__, __set__, __delete__",
          "__read__, __write__, __close__",
          "__getattr__, __setattr__, __delattr__",
          "__enter__, __exit__, __iter__"
        ],
        "correctIndex": 0,
        "explanation": "Defining __get__, __set__, or __delete__ on an attribute creates a managed descriptor object."
      },
      {
        "id": "py-h4",
        "skill": "python",
        "difficulty": "hard",
        "topic": "cyclic-gc",
        "question": "How does CPython reclaim memory from circular reference cycles (a.b = b; b.a = a)?",
        "options": [
          "Reference counting alone handles all circular graphs",
          "A generational cyclic garbage collector identifies and sweeps isolated circular references",
          "The OS cleans it up only on script exit",
          "Circular references cause permanent uncollectable leaks"
        ],
        "correctIndex": 1,
        "explanation": "CPython pairs reference counting with a generational cyclic GC that detects unreferenced self-contained loops."
      },
      {
        "id": "py-h5",
        "skill": "python",
        "difficulty": "hard",
        "topic": "asyncio-blocking",
        "question": "What occurs if a coroutine executes time.sleep(3) instead of await asyncio.sleep(3)?",
        "options": [
          "asyncio switches to a background worker thread automatically",
          "The entire single-threaded event loop freezes for 3 seconds, blocking all other scheduled tasks",
          "Raises an immediate BlockingIOError exception",
          "The sleep is skipped automatically"
        ],
        "correctIndex": 1,
        "explanation": "time.sleep() blocks the OS thread running the event loop, freezing all concurrent coroutines."
      },
      {
        "id": "py-h6",
        "skill": "python",
        "difficulty": "hard",
        "topic": "gil-concurrency",
        "question": "What is the Global Interpreter Lock (GIL) in CPython, and how does it affect CPU-bound multithreading?",
        "options": [
          "A security sandbox that prevents native C extensions from crashing",
          "A mutex that allows only one native thread to execute Python bytecode at a time, preventing true CPU parallelism with threading",
          "A database lock used by SQLite inside Python",
          "A compiler optimization that speeds up mathematical loops"
        ],
        "correctIndex": 1,
        "explanation": "The GIL prevents concurrent multi-core execution of Python bytecode; CPU-bound tasks require multiprocessing rather than threading."
      },
      {
        "id": "py-h7",
        "skill": "python",
        "difficulty": "hard",
        "topic": "metaclasses",
        "question": "What is the role of a metaclass in Python, and which method actually constructs the new class object?",
        "options": [
          "A metaclass handles garbage collection; __del__ allocates memory",
          "A metaclass is the class of a class; __new__ constructs the class object before __init__ initializes it",
          "A metaclass defines abstract database tables only; __call__ executes queries",
          "A metaclass is a C extension for compilation; __build__ produces bytecode"
        ],
        "correctIndex": 1,
        "explanation": "Classes are instances of metaclasses (defaulting to type). __new__ on a metaclass creates the class object itself."
      },
      {
        "id": "py-h8",
        "skill": "python",
        "difficulty": "hard",
        "topic": "slots-memory",
        "question": "What is the primary benefit of declaring \"__slots__ = ('id', 'name')\" on a high-throughput Python class?",
        "options": [
          "Encrypts attributes in memory to prevent tampering",
          "Eliminates the per-instance __dict__, significantly reducing memory usage for millions of objects",
          "Enforces static type checking at runtime",
          "Automatically serializes instances to JSON"
        ],
        "correctIndex": 1,
        "explanation": "__slots__ reserves space for declared attributes directly in a fixed-size array, eliminating the overhead of per-instance dictionaries."
      },
      {
        "id": "py-h9",
        "skill": "python",
        "difficulty": "hard",
        "topic": "asyncio-eventloop",
        "question": "In Python asyncio, what happens if you call a blocking synchronous function (like time.sleep) inside an async coroutine?",
        "options": [
          "Asyncio automatically creates an OS thread to run it in background",
          "It blocks the entire single-threaded event loop, preventing all other scheduled coroutines from running",
          "It raises an AsyncBlockedException",
          "The event loop skips the coroutine and continues"
        ],
        "correctIndex": 1,
        "explanation": "Asyncio relies on cooperative multitasking on a single thread; blocking calls halt the event loop unless run in an executor."
      },
      {
        "id": "py-h10",
        "skill": "python",
        "difficulty": "hard",
        "topic": "descriptors",
        "question": "What protocol defines Python Descriptors, powering properties, methods, and ORM column attributes?",
        "options": [
          "The __serialize__, __deserialize__ protocol",
          "The __get__, __set__, and __delete__ methods on an object assigned to a class attribute",
          "The __iter__ and __next__ protocol",
          "The __hash__ and __eq__ protocol"
        ],
        "correctIndex": 1,
        "explanation": "Descriptors implement __get__, __set__, or __delete__ to customize attribute lookup, binding, and mutation behavior."
      }
    ]
  },
  "sql": {
    "easy": [
      {
        "id": "sql-e1",
        "skill": "sql",
        "difficulty": "easy",
        "topic": "where-filter",
        "question": "Which SQL clause filters records before any grouping or aggregations take place?",
        "options": [
          "HAVING",
          "WHERE",
          "ORDER BY",
          "GROUP BY"
        ],
        "correctIndex": 1,
        "explanation": "WHERE filters rows before aggregation, whereas HAVING filters aggregated buckets after GROUP BY."
      },
      {
        "id": "sql-e2",
        "skill": "sql",
        "difficulty": "easy",
        "topic": "sorting",
        "question": "Which query clause sorts records from highest to lowest salary?",
        "options": [
          "ORDER BY salary DESC",
          "SORT BY salary DOWN",
          "GROUP BY salary DESC",
          "ORDER BY salary HIGHEST"
        ],
        "correctIndex": 0,
        "explanation": "ORDER BY column DESC orders records in descending (highest-to-lowest) order."
      },
      {
        "id": "sql-e3",
        "skill": "sql",
        "difficulty": "easy",
        "topic": "distinct",
        "question": "Which keyword eliminates duplicate rows from a query result set?",
        "options": [
          "UNIQUE",
          "DISTINCT",
          "DIFFERENT",
          "SINGLE"
        ],
        "correctIndex": 1,
        "explanation": "SELECT DISTINCT returns unique values, removing duplicate rows from the output."
      },
      {
        "id": "sql-e4",
        "skill": "sql",
        "difficulty": "easy",
        "topic": "null-handling",
        "question": "What is the correct SQL syntax to test whether a column val has no data?",
        "options": [
          "val = NULL",
          "val IS NULL",
          "val == NULL",
          "val.isNull()"
        ],
        "correctIndex": 1,
        "explanation": "NULL represents an unknown state; equality (= NULL) yields UNKNOWN, so IS NULL must be used."
      },
      {
        "id": "sql-e5",
        "skill": "sql",
        "difficulty": "easy",
        "topic": "primary-keys",
        "question": "What two fundamental constraints are enforced on a relational PRIMARY KEY?",
        "options": [
          "NOT NULL and UNIQUE",
          "FOREIGN KEY and INDEX",
          "DEFAULT 0 and CHECK",
          "AUTO_INCREMENT only"
        ],
        "correctIndex": 0,
        "explanation": "A primary key must uniquely identify each row and therefore cannot contain duplicates or NULL values."
      },
      {
        "id": "sql-e6",
        "skill": "sql",
        "difficulty": "easy",
        "topic": "distinct-rows",
        "question": "Which SQL clause removes duplicate rows from the query result set?",
        "options": [
          "UNIQUE",
          "DISTINCT",
          "DIFFERENT",
          "NO_DUPLICATES"
        ],
        "correctIndex": 1,
        "explanation": "SELECT DISTINCT filters out duplicate tuples from the returned projection."
      },
      {
        "id": "sql-e7",
        "skill": "sql",
        "difficulty": "easy",
        "topic": "order-by",
        "question": "How do you sort query results by column \"salary\" from highest to lowest?",
        "options": [
          "ORDER BY salary ASC",
          "ORDER BY salary DESC",
          "SORT BY salary REVERSE",
          "GROUP BY salary DESC"
        ],
        "correctIndex": 1,
        "explanation": "ORDER BY column DESC sorts values in descending order (largest to smallest)."
      },
      {
        "id": "sql-e8",
        "skill": "sql",
        "difficulty": "easy",
        "topic": "count-aggregate",
        "question": "What is the functional difference between COUNT(*) and COUNT(column_name) in SQL?",
        "options": [
          "COUNT(*) counts distinct values; COUNT(col) counts all values",
          "COUNT(*) counts all rows including NULLs; COUNT(col) counts only rows where column_name is NOT NULL",
          "COUNT(*) is only supported in MySQL; COUNT(col) is ANSI standard",
          "There is no difference in any SQL engine"
        ],
        "correctIndex": 1,
        "explanation": "COUNT(*) calculates total records in the partition; COUNT(col) ignores rows where that specific column contains NULL."
      },
      {
        "id": "sql-e9",
        "skill": "sql",
        "difficulty": "easy",
        "topic": "between-range",
        "question": "Is the SQL expression \"WHERE age BETWEEN 18 AND 25\" inclusive or exclusive of the boundary values?",
        "options": [
          "Exclusive of both 18 and 25",
          "Inclusive of both 18 and 25 (equivalent to age >= 18 AND age <= 25)",
          "Inclusive of 18, but exclusive of 25",
          "Depends entirely on the database charset"
        ],
        "correctIndex": 1,
        "explanation": "The SQL BETWEEN operator is inclusive: it matches values greater than or equal to low and less than or equal to high."
      },
      {
        "id": "sql-e10",
        "skill": "sql",
        "difficulty": "easy",
        "topic": "in-operator",
        "question": "Which SQL operator tests whether a value matches any value in a specified list of literals or subquery results?",
        "options": [
          "LIKE",
          "IN",
          "WITHIN",
          "CONTAINS"
        ],
        "correctIndex": 1,
        "explanation": "The IN operator is shorthand for multiple OR conditions: WHERE status IN (\"active\", \"pending\")."
      }
    ],
    "medium": [
      {
        "id": "sql-m1",
        "skill": "sql",
        "difficulty": "medium",
        "topic": "joins",
        "question": "What does a LEFT JOIN return when a left-table record has no matching record in the right table?",
        "options": [
          "The left row is dropped from the result set",
          "The left row is returned with NULL in all right-table columns",
          "Throws a foreign key integrity error",
          "Generates a Cartesian cross product"
        ],
        "correctIndex": 1,
        "explanation": "LEFT JOIN preserves all rows from the left table, filling unmatched right-side attributes with NULL."
      },
      {
        "id": "sql-m2",
        "skill": "sql",
        "difficulty": "medium",
        "topic": "having-aggregation",
        "question": "Which query correctly finds departments with an average salary greater than 60,000?",
        "options": [
          "SELECT dept, AVG(sal) FROM emp WHERE AVG(sal) > 60000 GROUP BY dept;",
          "SELECT dept, AVG(sal) FROM emp GROUP BY dept HAVING AVG(sal) > 60000;",
          "SELECT dept, AVG(sal) FROM emp HAVING sal > 60000;",
          "SELECT dept FROM emp WHERE sal > 60000;"
        ],
        "correctIndex": 1,
        "explanation": "Aggregates like AVG() cannot appear in a WHERE clause; they must be filtered via HAVING after GROUP BY."
      },
      {
        "id": "sql-m3",
        "skill": "sql",
        "difficulty": "medium",
        "topic": "acid-isolation",
        "question": "What does the Isolation property in ACID database transactions guarantee?",
        "options": [
          "Database backups are kept on physically isolated drives",
          "Concurrent transactions execute without viewing each other uncommitted intermediate changes",
          "Either all operations commit or all roll back",
          "Committed updates survive hardware power failure"
        ],
        "correctIndex": 1,
        "explanation": "Isolation ensures concurrent transactions execute without cross-contaminating intermediate states."
      },
      {
        "id": "sql-m4",
        "skill": "sql",
        "difficulty": "medium",
        "topic": "b-tree-indexes",
        "question": "What is the primary operational trade-off of maintaining secondary B-Tree indexes?",
        "options": [
          "Accelerates SELECT queries but adds write overhead on INSERT, UPDATE, and DELETE",
          "Slows down SELECT queries but speeds up bulk inserts",
          "Eliminates the need for primary keys",
          "Disables relational table constraints"
        ],
        "correctIndex": 0,
        "explanation": "Indexes provide fast seek times for reads, but every write must update the table and index trees."
      },
      {
        "id": "sql-m5",
        "skill": "sql",
        "difficulty": "medium",
        "topic": "subqueries-exists",
        "question": "Why is WHERE EXISTS (SELECT 1 ...) frequently faster than WHERE id IN (SELECT id ...)?",
        "options": [
          "EXISTS short-circuits as soon as the first matching record is found",
          "IN queries cannot use B-Tree indexes",
          "EXISTS runs client-side instead of server-side",
          "IN queries require table locks"
        ],
        "correctIndex": 0,
        "explanation": "EXISTS returns a boolean immediately upon finding the first match without scanning further."
      },
      {
        "id": "sql-m6",
        "skill": "sql",
        "difficulty": "medium",
        "topic": "coalesce-null-handling",
        "question": "What does COALESCE(phone, mobile, \"N/A\") return in SQL?",
        "options": [
          "Concatenates phone and mobile with \"N/A\"",
          "The first non-NULL expression from the argument list, or \"N/A\" if both are NULL",
          "An array of all phone numbers",
          "Throws an error if phone is NULL"
        ],
        "correctIndex": 1,
        "explanation": "COALESCE evaluates arguments in sequence and returns the first non-NULL value found."
      },
      {
        "id": "sql-m7",
        "skill": "sql",
        "difficulty": "medium",
        "topic": "having-vs-where",
        "question": "When must the HAVING clause be used instead of the WHERE clause?",
        "options": [
          "When filtering by string columns containing wildcards",
          "When filtering groups based on aggregate function results (e.g. HAVING COUNT(*) > 5)",
          "When querying views instead of physical tables",
          "When sorting results by multiple columns"
        ],
        "correctIndex": 1,
        "explanation": "WHERE filters rows before aggregation occurs; HAVING filters aggregated groups created by GROUP BY."
      },
      {
        "id": "sql-m8",
        "skill": "sql",
        "difficulty": "medium",
        "topic": "union-vs-union-all",
        "question": "What is the performance and behavioral difference between UNION and UNION ALL?",
        "options": [
          "UNION is faster because it skips duplicates; UNION ALL sorts both tables",
          "UNION removes duplicate rows with an internal sort/hash; UNION ALL retains all rows and is significantly faster",
          "UNION merges columns; UNION ALL merges rows",
          "UNION ALL only works on tables with identical primary keys"
        ],
        "correctIndex": 1,
        "explanation": "UNION performs deduplication, which requires expensive sorting or hashing; UNION ALL concatenates result sets directly."
      },
      {
        "id": "sql-m9",
        "skill": "sql",
        "difficulty": "medium",
        "topic": "primary-vs-unique-key",
        "question": "What is the primary architectural difference between a PRIMARY KEY and a UNIQUE constraint?",
        "options": [
          "A table can have multiple PRIMARY KEYs but only one UNIQUE constraint",
          "A table can have only one PRIMARY KEY which disallows NULLs; a table can have multiple UNIQUE constraints which may allow NULLs",
          "UNIQUE constraints cannot be indexed",
          "PRIMARY KEYs are only used for string columns"
        ],
        "correctIndex": 1,
        "explanation": "A table is limited to a single PRIMARY KEY (no NULLs); multiple UNIQUE constraints are permitted and allow NULL values."
      },
      {
        "id": "sql-m10",
        "skill": "sql",
        "difficulty": "medium",
        "topic": "b-tree-indexing",
        "question": "How do standard B-Tree database indexes speed up SELECT WHERE queries?",
        "options": [
          "By compressing the table into a zip archive in memory",
          "By maintaining a balanced tree structure that reduces lookup time from O(N) full-table scans to O(log N) tree traversals",
          "By converting all queries into cached stored procedures",
          "By automatically duplicating rows across multiple disks"
        ],
        "correctIndex": 1,
        "explanation": "B-Tree indexes maintain sorted keys with pointers to heap rows, enabling fast logarithmic seek operations."
      }
    ],
    "hard": [
      {
        "id": "sql-h1",
        "skill": "sql",
        "difficulty": "hard",
        "topic": "window-functions",
        "question": "When two rows tie for 1st place, what values do RANK() and DENSE_RANK() assign to the 3rd row?",
        "options": [
          "RANK() gives 3; DENSE_RANK() gives 2",
          "RANK() gives 2; DENSE_RANK() gives 3",
          "Both assign 2",
          "Both assign 3"
        ],
        "correctIndex": 0,
        "explanation": "RANK() skips rank numbers after ties (1, 1, 3), whereas DENSE_RANK() leaves no gaps (1, 1, 2)."
      },
      {
        "id": "sql-h2",
        "skill": "sql",
        "difficulty": "hard",
        "topic": "isolation-levels",
        "question": "Which transaction isolation level eliminates dirty reads, non-repeatable reads, AND phantom reads?",
        "options": [
          "READ UNCOMMITTED",
          "READ COMMITTED",
          "REPEATABLE READ",
          "SERIALIZABLE"
        ],
        "correctIndex": 3,
        "explanation": "SERIALIZABLE is the strictest isolation level, preventing phantom rows through range locks or snapshot serializability."
      },
      {
        "id": "sql-h3",
        "skill": "sql",
        "difficulty": "hard",
        "topic": "recursive-ctes",
        "question": "What two components are mandatory in a WITH RECURSIVE Common Table Expression?",
        "options": [
          "An anchor member and a recursive member connected by UNION or UNION ALL",
          "A cursor and a while loop",
          "A trigger and an insert procedure",
          "A materialized view and an index"
        ],
        "correctIndex": 0,
        "explanation": "A recursive CTE needs an initial base anchor query and a recursive step referencing the CTE itself."
      },
      {
        "id": "sql-h4",
        "skill": "sql",
        "difficulty": "hard",
        "topic": "sargability",
        "question": "Why does WHERE YEAR(created_at) = 2026 fail to use an index on created_at?",
        "options": [
          "Wrapping a column in a scalar function makes the predicate non-SARGable, forcing a full scan",
          "YEAR() is not an ANSI SQL function",
          "Indexes only support string columns",
          "Date columns cannot be indexed in relational databases"
        ],
        "correctIndex": 0,
        "explanation": "Functions applied to columns prevent B-Tree index range seeks. The SARGable form is created_at >= \"2026-01-01\" AND created_at < \"2027-01-01\"."
      },
      {
        "id": "sql-h5",
        "skill": "sql",
        "difficulty": "hard",
        "topic": "explain-analyze",
        "question": "In an EXPLAIN execution plan, what does a Seq Scan (Sequential Scan) on a massive table signify?",
        "options": [
          "The database used a hardware-accelerated index seek",
          "The database read every disk block sequentially because no index was usable or cost-effective",
          "The query completed directly from L1 CPU cache",
          "An in-memory hash table was generated"
        ],
        "correctIndex": 1,
        "explanation": "A Sequential Scan reads all table blocks sequentially from disk, causing I/O bottlenecks on large tables."
      },
      {
        "id": "sql-h6",
        "skill": "sql",
        "difficulty": "hard",
        "topic": "window-functions",
        "question": "What is the difference between ROW_NUMBER(), RANK(), and DENSE_RANK() when ordering values with ties (e.g. 100, 100, 90)?",
        "options": [
          "ROW_NUMBER assigns distinct numbers (1,2,3); RANK leaves gaps after ties (1,1,3); DENSE_RANK leaves no gaps (1,1,2)",
          "RANK is only for integers; DENSE_RANK is for decimals",
          "ROW_NUMBER ignores partitions; RANK partitions automatically",
          "DENSE_RANK assigns negative values to ties"
        ],
        "correctIndex": 0,
        "explanation": "ROW_NUMBER assigns strictly sequential ranks; RANK skips rank numbers after duplicates; DENSE_RANK assigns consecutive ranks without gaps."
      },
      {
        "id": "sql-h7",
        "skill": "sql",
        "difficulty": "hard",
        "topic": "cte-recursive",
        "question": "What clause creates a Common Table Expression (CTE) in SQL, and what keyword is required for hierarchical tree queries?",
        "options": [
          "CREATE TEMPORARY TABLE with LOOP",
          "WITH ... and WITH RECURSIVE",
          "SUBQUERY ... and RECURSE",
          "DECLARE CURSOR with WHILE"
        ],
        "correctIndex": 1,
        "explanation": "The WITH clause defines a CTE; WITH RECURSIVE allows an anchor query to union with a recursive member for traversing trees and graphs."
      },
      {
        "id": "sql-h8",
        "skill": "sql",
        "difficulty": "hard",
        "topic": "acid-isolation-levels",
        "question": "Which transaction isolation level prevents dirty reads, non-repeatable reads, AND phantom reads completely?",
        "options": [
          "READ UNCOMMITTED",
          "READ COMMITTED",
          "REPEATABLE READ",
          "SERIALIZABLE"
        ],
        "correctIndex": 3,
        "explanation": "SERIALIZABLE is the strictest ANSI SQL isolation level, executing transactions as if they occurred sequentially."
      },
      {
        "id": "sql-h9",
        "skill": "sql",
        "difficulty": "hard",
        "topic": "query-execution-plan",
        "question": "In an EXPLAIN ANALYZE output, what indicates that a query is scanning every page of a 10-million row table rather than using an index?",
        "options": [
          "Index Scan",
          "Bitmap Index Scan",
          "Seq Scan (Sequential Scan / Full Table Scan)",
          "Index Only Scan"
        ],
        "correctIndex": 2,
        "explanation": "Seq Scan (or Table Scan) means the database engine reads all heap pages linearly from disk because no matching index was chosen."
      },
      {
        "id": "sql-h10",
        "skill": "sql",
        "difficulty": "hard",
        "topic": "database-normalization",
        "question": "What condition distinguishes Boyce-Codd Normal Form (BCNF) from Third Normal Form (3NF)?",
        "options": [
          "BCNF requires all tables to have exactly two columns",
          "In BCNF, for every functional dependency X -> Y, X must be a superkey (eliminating non-trivial dependencies on candidate keys)",
          "BCNF forbids primary keys from containing integers",
          "3NF disallows composite keys; BCNF allows them"
        ],
        "correctIndex": 1,
        "explanation": "BCNF is a stricter version of 3NF requiring the determinant of every non-trivial functional dependency to be a superkey."
      }
    ]
  },
  "react": {
    "easy": [
      {
        "id": "react-e1",
        "skill": "react",
        "difficulty": "easy",
        "topic": "jsx-syntax",
        "question": "What is JSX in React?",
        "options": [
          "A proprietary templating engine that replaces HTML in browser runtimes",
          "A syntax extension for JavaScript that compiles to React.createElement calls",
          "A database query language for fetching component data",
          "A CSS preprocessor designed exclusively for React"
        ],
        "correctIndex": 1,
        "explanation": "JSX allows writing HTML-like structures in JavaScript, which Babel/transpilers compile into React.createElement calls."
      },
      {
        "id": "react-e2",
        "skill": "react",
        "difficulty": "easy",
        "topic": "usestate-hook",
        "question": "Which Hook allows functional components to declare and manage internal state?",
        "options": [
          "useEffect",
          "useState",
          "useRef",
          "useContext"
        ],
        "correctIndex": 1,
        "explanation": "useState declares a state variable and provides an updater function to trigger re-renders."
      },
      {
        "id": "react-e3",
        "skill": "react",
        "difficulty": "easy",
        "topic": "props-unidirectional",
        "question": "How is data passed from a parent component to a child component in React?",
        "options": [
          "Through bidirectional DOM event bubbling",
          "Via immutable Props passed down the component hierarchy",
          "By mutating the global window.state object",
          "Using the localStorage API exclusively"
        ],
        "correctIndex": 1,
        "explanation": "React enforces unidirectional data flow where parent components pass data downward via immutable props."
      },
      {
        "id": "react-e4",
        "skill": "react",
        "difficulty": "easy",
        "topic": "keys-reconciliation",
        "question": "Why should list items in React always have a unique \"key\" prop?",
        "options": [
          "To apply unique CSS styles to every list element",
          "To enable React reconciliation to identify which items changed, added, or removed",
          "To automatically sort the array alphabetically in memory",
          "To register browser click event listeners on list items"
        ],
        "correctIndex": 1,
        "explanation": "Keys give list items stable identities so React avoids costly re-renders and accurately mutates DOM elements."
      },
      {
        "id": "react-e5",
        "skill": "react",
        "difficulty": "easy",
        "topic": "useeffect-mount",
        "question": "When does a useEffect(() => {}, []) with an empty dependency array execute?",
        "options": [
          "On every single render of the component",
          "Only once after the initial render (component mount)",
          "Before the initial DOM elements are generated",
          "Only when the component is unmounted from the DOM"
        ],
        "correctIndex": 1,
        "explanation": "An empty dependency array indicates no variables trigger re-execution, running the effect only once on mount."
      },
      {
        "id": "react-e6",
        "skill": "react",
        "difficulty": "easy",
        "topic": "jsx-classname",
        "question": "Why does JSX use \"className\" instead of the standard HTML \"class\" attribute?",
        "options": [
          "Because React is written in PHP where class is reserved",
          "Because \"class\" is a reserved keyword in JavaScript",
          "To avoid collisions with CSS class definitions",
          "Because className supports inline CSS styles directly"
        ],
        "correctIndex": 1,
        "explanation": "JSX transpiles to JavaScript objects; \"class\" is a reserved keyword for ES6 classes, so React uses className."
      },
      {
        "id": "react-e7",
        "skill": "react",
        "difficulty": "easy",
        "topic": "fragments",
        "question": "What is the purpose of React Fragments (<> ... </> or <React.Fragment>)?",
        "options": [
          "To lazy-load child components across the network",
          "To group a list of children without adding extra wrapper nodes to the DOM tree",
          "To apply global styles across all child elements",
          "To trigger automatic component re-renders"
        ],
        "correctIndex": 1,
        "explanation": "Fragments allow components to return multiple sibling elements without rendering an unnecessary wrapper div into the DOM."
      },
      {
        "id": "react-e8",
        "skill": "react",
        "difficulty": "easy",
        "topic": "list-keys",
        "question": "Why should array indices generally NOT be used as the \"key\" prop when rendering dynamic lists?",
        "options": [
          "React throws a runtime fatal exception on numeric keys",
          "Reordering, inserting, or filtering items can cause component state to attach to the wrong element or cause visual bugs",
          "Indices make network requests slower",
          "Keys must always be UUID strings in React"
        ],
        "correctIndex": 1,
        "explanation": "Using array indices as keys disrupts React's reconciliation algorithm when items are added, removed, or reordered."
      },
      {
        "id": "react-e9",
        "skill": "react",
        "difficulty": "easy",
        "topic": "props-flow",
        "question": "What direction does data typically flow in idiomatic React applications?",
        "options": [
          "Bidirectional two-way binding between all components",
          "Unidirectional downward data flow from parent to child via props",
          "Upward only from child components to the root DOM",
          "Randomized via event emitters"
        ],
        "correctIndex": 1,
        "explanation": "React enforces one-way (unidirectional) data flow: state lives in parents and flows down to children via props."
      },
      {
        "id": "react-e10",
        "skill": "react",
        "difficulty": "easy",
        "topic": "conditional-rendering",
        "question": "What will render if count is 0 in: {count && <span>Items: {count}</span>}?",
        "options": [
          "Nothing renders",
          "The number 0 renders on the screen",
          "Throws a TypeError",
          "The span element renders with empty text"
        ],
        "correctIndex": 1,
        "explanation": "The logical && returns the left-hand operand if falsy. Because 0 is a valid renderable number, React prints \"0\" on the screen."
      }
    ],
    "medium": [
      {
        "id": "react-m1",
        "skill": "react",
        "difficulty": "medium",
        "topic": "usecallback-memoization",
        "question": "What is the primary purpose of the useCallback Hook?",
        "options": [
          "To cache the return value of an expensive mathematical computation",
          "To return a memoized callback instance that prevents unnecessary child re-renders",
          "To asynchronously fetch data from remote REST endpoints",
          "To register global browser keyboard shortcuts"
        ],
        "correctIndex": 1,
        "explanation": "useCallback memoizes a function definition across renders unless its declared dependencies change."
      },
      {
        "id": "react-m2",
        "skill": "react",
        "difficulty": "medium",
        "topic": "batching-react18",
        "question": "What is \"Automatic Batching\" introduced in React 18?",
        "options": [
          "Batching HTTP network requests across all open browser tabs",
          "Grouping multiple state updates into a single re-render even inside promises and timeouts",
          "Compiling multiple JSX files into a single bundle chunk at build time",
          "Automatically deferring CSS animations until the page finishes loading"
        ],
        "correctIndex": 1,
        "explanation": "React 18 batches state updates inside promises, setTimeout, and native event handlers to minimize re-renders."
      },
      {
        "id": "react-m3",
        "skill": "react",
        "difficulty": "medium",
        "topic": "functional-updates",
        "question": "When updating state that depends on the current state value, what is the best practice?",
        "options": [
          "Directly assign the new value: state = state + 1",
          "Pass an updater function: setState(prev => prev + 1)",
          "Read the value synchronously from the DOM before updating",
          "Wrap the state assignment inside a while loop until updated"
        ],
        "correctIndex": 1,
        "explanation": "Functional state updates guarantee access to the latest state snapshot regardless of asynchronous batching."
      },
      {
        "id": "react-m4",
        "skill": "react",
        "difficulty": "medium",
        "topic": "controlled-inputs",
        "question": "What distinguishes a \"Controlled Component\" in React form handling?",
        "options": [
          "The input form values are entirely managed and updated via React state",
          "The input value is read directly from the DOM using standard HTML event targets",
          "The component requires an external Redux store to function",
          "The browser automatically disables user typing when validation errors occur"
        ],
        "correctIndex": 0,
        "explanation": "A controlled component derives its input value directly from React state and updates it via onChange handlers."
      },
      {
        "id": "react-m5",
        "skill": "react",
        "difficulty": "medium",
        "topic": "usememo-optimization",
        "question": "How does useMemo differ from useCallback?",
        "options": [
          "useMemo caches calculated values; useCallback caches function definitions",
          "useMemo runs synchronously before mount; useCallback runs asynchronously after render",
          "useMemo is only usable in class components; useCallback is for functional components",
          "There is no technical difference; they are aliases for the same hook"
        ],
        "correctIndex": 0,
        "explanation": "useMemo caches the result of invoking a calculation, whereas useCallback returns the memoized function reference."
      },
      {
        "id": "react-m6",
        "skill": "react",
        "difficulty": "medium",
        "topic": "stale-closures",
        "question": "What bug occurs when a useEffect with an empty dependency array [] references state that changes over time?",
        "options": [
          "Memory overflow",
          "Stale Closure: the effect captures the initial state value from the first render and never sees updates",
          "SyntaxError in modern React",
          "The component unmounts unexpectedly"
        ],
        "correctIndex": 1,
        "explanation": "Without dependencies declared, closures inside useEffect capture the variables from the initial render scope."
      },
      {
        "id": "react-m7",
        "skill": "react",
        "difficulty": "medium",
        "topic": "usecallback-usememo",
        "question": "What is the exact distinction between useMemo and useCallback in React?",
        "options": [
          "useMemo is for state; useCallback is for effects",
          "useMemo caches the returned result of a function calculation; useCallback caches the function definition itself",
          "useCallback only runs on the server; useMemo runs on the client",
          "They are identical aliases"
        ],
        "correctIndex": 1,
        "explanation": "useMemo(() => fn(), deps) memoizes a computed value; useCallback(fn, deps) memoizes a callback reference."
      },
      {
        "id": "react-m8",
        "skill": "react",
        "difficulty": "medium",
        "topic": "controlled-inputs",
        "question": "What constitutes a \"controlled component\" in React form handling?",
        "options": [
          "An input managed strictly by third-party DOM plugins",
          "An input whose value is bound to React state and updated via an onChange handler",
          "An input that cannot be edited by the user",
          "An input with an automatic CSS animation"
        ],
        "correctIndex": 1,
        "explanation": "Controlled components have their form data controlled by React state via value and onChange props."
      },
      {
        "id": "react-m9",
        "skill": "react",
        "difficulty": "medium",
        "topic": "useref-vs-usestate",
        "question": "What happens to the component when you mutate ref.current from useRef()?",
        "options": [
          "The component immediately triggers a re-render",
          "The value updates synchronously without causing a re-render",
          "The component throws a mutation error",
          "React logs an error in the console"
        ],
        "correctIndex": 1,
        "explanation": "useRef creates a mutable container object whose .current value persists across renders without triggering a re-render."
      },
      {
        "id": "react-m10",
        "skill": "react",
        "difficulty": "medium",
        "topic": "custom-hooks",
        "question": "What naming convention and rule must all custom React hooks follow?",
        "options": [
          "Must end with \"Handler\" and be declared inside class components",
          "Must start with \"use\" and only call hooks at the top level (never inside loops or conditions)",
          "Must be wrapped in React.memo()",
          "Must return an array with exactly two items"
        ],
        "correctIndex": 1,
        "explanation": "Hooks must start with \"use\" so ESLint can verify the Rules of Hooks (top-level only, only inside React functions)."
      }
    ],
    "hard": [
      {
        "id": "react-h1",
        "skill": "react",
        "difficulty": "hard",
        "topic": "fiber-architecture",
        "question": "What is the React Fiber architecture and what key capability did it introduce?",
        "options": [
          "A WebAssembly compiler for converting JSX to native C++ code",
          "A complete rewrite of the reconciliation engine enabling interruptible, prioritized rendering",
          "A client-side database layer designed to replace Redux and Context API",
          "A multi-threaded worker pipeline executing in Node.js backend processes"
        ],
        "correctIndex": 1,
        "explanation": "Fiber breaks reconciliation work into incremental units, allowing React to pause and prioritize high-urgency user inputs."
      },
      {
        "id": "react-h2",
        "skill": "react",
        "difficulty": "hard",
        "topic": "uselayouteffect-timing",
        "question": "When does useLayoutEffect fire relative to browser DOM mutations and painting?",
        "options": [
          "Asynchronously after the browser has completed painting screen pixels",
          "Synchronously after all DOM mutations but before the browser paints to screen",
          "Before the Virtual DOM is generated during the render phase",
          "Only after the user triggers a click or scroll interaction"
        ],
        "correctIndex": 1,
        "explanation": "useLayoutEffect runs synchronously before browser paint, making it suitable for reading layout geometry and preventing visual flicker."
      },
      {
        "id": "react-h3",
        "skill": "react",
        "difficulty": "hard",
        "topic": "usetransition-concurrency",
        "question": "What is the primary role of the useTransition Hook in React 18 Concurrent features?",
        "options": [
          "To apply smooth CSS transitions between page navigation routes",
          "To mark state updates as non-urgent transitions, keeping urgent inputs responsive",
          "To automatically convert synchronous code into web worker threads",
          "To throttle network requests over slow mobile connections"
        ],
        "correctIndex": 1,
        "explanation": "useTransition marks state updates as non-blocking transitions so critical interactions (like typing) remain immediately responsive."
      },
      {
        "id": "react-h4",
        "skill": "react",
        "difficulty": "hard",
        "topic": "dependency-cycles",
        "question": "What causes an infinite re-render loop inside a useEffect hook?",
        "options": [
          "Leaving the dependency array completely empty ([])",
          "Updating a state variable that is included in the effect's dependency array without a break condition",
          "Calling console.log inside the effect cleanup callback",
          "Using async/await in external helper functions"
        ],
        "correctIndex": 1,
        "explanation": "Mutating state inside an effect that depends on that same state triggers continuous re-render and re-execution cycles."
      },
      {
        "id": "react-h5",
        "skill": "react",
        "difficulty": "hard",
        "topic": "synthetic-events-delegation",
        "question": "In React 17 and 18, where does React attach its root event listeners for synthetic events?",
        "options": [
          "Directly to the window global object",
          "Directly to the root DOM container where ReactDOM.render/createRoot was invoked",
          "Directly to document.documentElement",
          "Individually to every individual HTML element in the DOM tree"
        ],
        "correctIndex": 1,
        "explanation": "React 17 shifted event delegation from document to the root DOM node container, isolating micro-frontends cleanly."
      },
      {
        "id": "react-h6",
        "skill": "react",
        "difficulty": "hard",
        "topic": "concurrent-mode-transitions",
        "question": "What does the useTransition hook do in React 18+?",
        "options": [
          "Animates CSS opacity between page route changes",
          "Marks state updates as non-urgent transitions, keeping the UI responsive while expensive renders happen in background",
          "Transitions client state directly to MongoDB",
          "Converts standard components to Web Workers"
        ],
        "correctIndex": 1,
        "explanation": "useTransition marks state updates as non-blocking transitions so urgent user input (like typing) isn't delayed by large renders."
      },
      {
        "id": "react-h7",
        "skill": "react",
        "difficulty": "hard",
        "topic": "rsc-architecture",
        "question": "In React Server Components (RSC), what is a key architectural capability that distinguishes them from traditional SSR?",
        "options": [
          "Server Components have access to window.localStorage",
          "Server Components execute exclusively on the server, have direct DB access, and send 0 bytes of JS bundle to the client",
          "Server Components support useEffect and useState hooks directly",
          "Server Components only run inside Docker containers"
        ],
        "correctIndex": 1,
        "explanation": "RSC code never ships to the browser, reducing bundle size to zero for server-only logic while allowing direct backend access."
      },
      {
        "id": "react-h8",
        "skill": "react",
        "difficulty": "hard",
        "topic": "fiber-reconciliation",
        "question": "How did React Fiber replace the legacy Stack Reconciler to prevent UI stuttering?",
        "options": [
          "By compiling JSX to WebAssembly binary modules",
          "By breaking rendering work into incremental units (fibers) that can be paused, prioritized, and resumed across animation frames",
          "By delegating all DOM manipulation to browser service workers",
          "By abandoning the Virtual DOM in favor of direct innerHTML writes"
        ],
        "correctIndex": 1,
        "explanation": "Fiber implements a cooperative scheduler that breaks reconciliation into incremental fiber chunks that can pause for urgent input."
      },
      {
        "id": "react-h9",
        "skill": "react",
        "difficulty": "hard",
        "topic": "error-boundaries",
        "question": "Which lifecycle methods must a class component implement to function as an Error Boundary?",
        "options": [
          "componentWillCatch and componentDidCatch",
          "static getDerivedStateFromError() and componentDidCatch()",
          "onError() and onRenderError()",
          "tryRender() and catchRender()"
        ],
        "correctIndex": 1,
        "explanation": "Error Boundaries must be class components implementing static getDerivedStateFromError (to update state) or componentDidCatch."
      },
      {
        "id": "react-h10",
        "skill": "react",
        "difficulty": "hard",
        "topic": "use-sync-external-store",
        "question": "Why was useSyncExternalStore introduced in React 18 for external state libraries (Redux, Zustand)?",
        "options": [
          "To replace localStorage with IndexedDB",
          "To prevent \"tearing\" (visual inconsistencies where parts of the UI read different versions of store state during concurrent rendering)",
          "To enable automatic multi-tab state broadcasting",
          "To encrypt state before sending to the client"
        ],
        "correctIndex": 1,
        "explanation": "useSyncExternalStore guarantees synchronous snapshot reads from external stores, eliminating tearing during concurrent rendering."
      }
    ]
  },
  "node.js": {
    "easy": [
      {
        "id": "node-e1",
        "skill": "node.js",
        "difficulty": "easy",
        "topic": "v8-runtime",
        "question": "What is the role of Google V8 in the Node.js runtime environment?",
        "options": [
          "A package manager for downloading third-party modules",
          "The high-performance JavaScript engine that compiles and executes JS to machine code",
          "A multi-threaded database driver for PostgreSQL and MongoDB",
          "A reverse proxy server handling incoming HTTP socket traffic"
        ],
        "correctIndex": 1,
        "explanation": "V8 is Google's open-source C++ engine that parses and executes JavaScript in Node.js and Chrome."
      },
      {
        "id": "node-e2",
        "skill": "node.js",
        "difficulty": "easy",
        "topic": "fs-module",
        "question": "Which built-in core module in Node.js is used to interact with the file system?",
        "options": [
          "path",
          "fs",
          "os",
          "http"
        ],
        "correctIndex": 1,
        "explanation": "The \"fs\" (file system) core module provides synchronous and asynchronous file I/O methods."
      },
      {
        "id": "node-e3",
        "skill": "node.js",
        "difficulty": "easy",
        "topic": "process-env",
        "question": "Which global object is used in Node.js to access environment variables?",
        "options": [
          "window.env",
          "global.environment",
          "process.env",
          "system.config"
        ],
        "correctIndex": 2,
        "explanation": "process.env is a global object injected by the operating system containing runtime environment keys."
      },
      {
        "id": "node-e4",
        "skill": "node.js",
        "difficulty": "easy",
        "topic": "commonjs-exports",
        "question": "How do you export a function or object in standard CommonJS module syntax?",
        "options": [
          "export default",
          "module.exports = ...",
          "public return",
          "global.share()"
        ],
        "correctIndex": 1,
        "explanation": "CommonJS uses module.exports (or exports) to define exported public APIs from a file."
      },
      {
        "id": "node-e5",
        "skill": "node.js",
        "difficulty": "easy",
        "topic": "npm-scripts",
        "question": "Which command initializes a new package.json file with default values?",
        "options": [
          "npm create-empty",
          "npm init -y",
          "node --setup",
          "npm install --all"
        ],
        "correctIndex": 1,
        "explanation": "npm init -y auto-populates package.json using default values without interactive terminal prompts."
      },
      {
        "id": "node-e6",
        "skill": "node.js",
        "difficulty": "easy",
        "topic": "process-env",
        "question": "How do you access environment variables (like PORT) in a Node.js process?",
        "options": [
          "System.getEnv(\"PORT\")",
          "process.env.PORT",
          "global.env.PORT",
          "node.environment.PORT"
        ],
        "correctIndex": 1,
        "explanation": "process.env is a global object containing the user environment variables in Node.js."
      },
      {
        "id": "node-e7",
        "skill": "node.js",
        "difficulty": "easy",
        "topic": "package-dependencies",
        "question": "In package.json, what is the difference between \"dependencies\" and \"devDependencies\"?",
        "options": [
          "dependencies are for backend; devDependencies are for frontend",
          "dependencies are required for production runtime; devDependencies are only needed for local development and testing",
          "devDependencies are automatically installed globally by npm",
          "There is no functional difference"
        ],
        "correctIndex": 1,
        "explanation": "devDependencies (like linters, test runners) are excluded in production builds via \"npm install --production\"."
      },
      {
        "id": "node-e8",
        "skill": "node.js",
        "difficulty": "easy",
        "topic": "path-module",
        "question": "Why should path.join() or path.resolve() be used instead of manual string concatenation for file paths in Node.js?",
        "options": [
          "They compress file paths to save memory",
          "They normalize directory separators automatically across operating systems (e.g. \"/\" on Linux/macOS vs \"\\\" on Windows)",
          "They automatically verify if the file exists on disk",
          "They prevent unauthorized file access"
        ],
        "correctIndex": 1,
        "explanation": "path.join and path.resolve handle OS-specific path separators cleanly, ensuring cross-platform compatibility."
      },
      {
        "id": "node-e9",
        "skill": "node.js",
        "difficulty": "easy",
        "topic": "fs-promises",
        "question": "Which module in modern Node.js provides native Promise-based file system methods like await readFile()?",
        "options": [
          "require(\"fs\")",
          "require(\"fs/promises\")",
          "require(\"fs-async\")",
          "require(\"promise-fs\")"
        ],
        "correctIndex": 1,
        "explanation": "The \"fs/promises\" module exposes all standard file system methods returning native JavaScript Promises."
      },
      {
        "id": "node-e10",
        "skill": "node.js",
        "difficulty": "easy",
        "topic": "npm-scripts",
        "question": "Which command runs the script defined under \"scripts\": { \"build\": \"webpack\" } in package.json?",
        "options": [
          "npm build",
          "npm run build",
          "node run build",
          "node execute build"
        ],
        "correctIndex": 1,
        "explanation": "Custom npm scripts must be invoked using \"npm run <script-name>\" (only \"test\" and \"start\" can omit \"run\")."
      }
    ],
    "medium": [
      {
        "id": "node-m1",
        "skill": "node.js",
        "difficulty": "medium",
        "topic": "event-loop-architecture",
        "question": "How does Node.js handle high-concurrency non-blocking I/O on a single main thread?",
        "options": [
          "By spawning a new operating system thread for each incoming HTTP request",
          "Via the libuv Event Loop which delegates I/O polling to the operating system kernel",
          "By pausing all background timers until network requests respond",
          "By compiling JavaScript code directly into multithreaded assembly at runtime"
        ],
        "correctIndex": 1,
        "explanation": "Node.js uses an event loop built on libuv to execute non-blocking operations asynchronously on a single thread."
      },
      {
        "id": "node-m2",
        "skill": "node.js",
        "difficulty": "medium",
        "topic": "streams-buffering",
        "question": "What is the performance advantage of using Node.js Streams when reading multi-gigabyte files?",
        "options": [
          "Streams compress files automatically into zip format in memory",
          "Streams read data in small chunks without consuming large amounts of RAM buffer memory",
          "Streams bypass operating system disk security checks for speed",
          "Streams encrypt every byte using AES-256 automatically"
        ],
        "correctIndex": 1,
        "explanation": "Streams process data piece by piece without loading the entire payload into heap memory, preventing Out-Of-Memory crashes."
      },
      {
        "id": "node-m3",
        "skill": "node.js",
        "difficulty": "medium",
        "topic": "nexttick-vs-setimmediate",
        "question": "What is the difference between process.nextTick() and setImmediate()?",
        "options": [
          "process.nextTick runs after current phase; setImmediate runs before timers",
          "process.nextTick runs immediately before next Event Loop phase; setImmediate runs in Check phase",
          "setImmediate runs synchronously; process.nextTick runs in an external worker thread",
          "There is no difference; they are interchangeable aliases"
        ],
        "correctIndex": 1,
        "explanation": "process.nextTick queues microtasks executed before the event loop advances; setImmediate queues in the Check phase."
      },
      {
        "id": "node-m4",
        "skill": "node.js",
        "difficulty": "medium",
        "topic": "libuv-threadpool",
        "question": "What is the default thread pool size in libuv (used for fs, crypto, dns lookups)?",
        "options": [
          "1 thread",
          "4 threads",
          "16 threads",
          "Unlimited dynamic threads"
        ],
        "correctIndex": 1,
        "explanation": "The default libuv thread pool size is 4, configurable via the UV_THREADPOOL_SIZE environment variable."
      },
      {
        "id": "node-m5",
        "skill": "node.js",
        "difficulty": "medium",
        "topic": "worker-threads",
        "question": "What is the primary architectural difference between Worker Threads and Child Processes in Node.js?",
        "options": [
          "Worker Threads share memory via SharedArrayBuffer; Child Processes have isolated memory spaces",
          "Child Processes cannot communicate over IPC sockets",
          "Worker Threads run only in the browser, not on the server",
          "Child Processes cannot execute asynchronous code"
        ],
        "correctIndex": 0,
        "explanation": "worker_threads share the same process and can share memory, whereas child_process creates independent OS processes."
      },
      {
        "id": "node-m6",
        "skill": "node.js",
        "difficulty": "medium",
        "topic": "event-loop-phases",
        "question": "Which phase of the Node.js event loop executes callbacks scheduled by setImmediate()?",
        "options": [
          "Timers phase",
          "Poll phase",
          "Check phase",
          "Close callbacks phase"
        ],
        "correctIndex": 2,
        "explanation": "The Check phase executes setImmediate() callbacks right after the poll phase completes."
      },
      {
        "id": "node-m7",
        "skill": "node.js",
        "difficulty": "medium",
        "topic": "streams-backpressure",
        "question": "What problem does stream \"backpressure\" solve in Node.js I/O?",
        "options": [
          "Encrypting data packets during socket transmission",
          "Pausing the incoming readable stream when the downstream writable stream is slower, preventing RAM exhaustion",
          "Compressing JSON payloads over HTTP/2",
          "Auto-restarting crashed child worker processes"
        ],
        "correctIndex": 1,
        "explanation": "Backpressure occurs when data builds up faster than a destination can process it; pipe() handles this by pausing the reader."
      },
      {
        "id": "node-m8",
        "skill": "node.js",
        "difficulty": "medium",
        "topic": "commonjs-vs-esm",
        "question": "What is a fundamental difference between CommonJS require() and ES Modules import in Node.js?",
        "options": [
          "CommonJS require() is synchronous and evaluated at runtime; ESM import is statically parsed before execution",
          "CommonJS only works with TypeScript",
          "ESM cannot export functions, only primitives",
          "require() is deprecated and disabled in Node 20+"
        ],
        "correctIndex": 0,
        "explanation": "CommonJS require is dynamic and synchronous at runtime; ESM static imports allow tree-shaking and pre-parsing."
      },
      {
        "id": "node-m9",
        "skill": "node.js",
        "difficulty": "medium",
        "topic": "buffer-allocation",
        "question": "Why is Buffer.alloc(size) preferred over Buffer.allocUnsafe(size) for handling sensitive data?",
        "options": [
          "Buffer.alloc is 100x faster",
          "Buffer.alloc zeroes out memory before allocation; allocUnsafe leaves existing uninitialized memory which may leak secrets",
          "allocUnsafe only works with 32-bit integers",
          "Buffer.alloc compresses the buffer automatically"
        ],
        "correctIndex": 1,
        "explanation": "allocUnsafe does not zero memory, potentially exposing previously allocated sensitive data (tokens, passwords)."
      },
      {
        "id": "node-m10",
        "skill": "node.js",
        "difficulty": "medium",
        "topic": "event-emitter-leak",
        "question": "What does the Node.js warning \"MaxListenersExceededWarning: Possible EventEmitter memory leak detected\" indicate?",
        "options": [
          "A physical disk drive has run out of space",
          "More than 10 listeners were added to an EventEmitter without calling removeListener(), often signaling an event leak",
          "The network port is in use by another process",
          "A buffer has exceeded 2GB limit"
        ],
        "correctIndex": 1,
        "explanation": "By default, EventEmitters warn when more than 10 listeners are attached to prevent silent memory accumulation."
      }
    ],
    "hard": [
      {
        "id": "node-h1",
        "skill": "node.js",
        "difficulty": "hard",
        "topic": "stream-backpressure",
        "question": "What is \"Backpressure\" in Node.js streams and how is it resolved?",
        "options": [
          "A network error when an upstream server closes socket connections prematurely",
          "When a readable stream emits data faster than the writable stream can consume it, handled via .pipe() or drain events",
          "A memory leak caused by unreferenced timer callbacks in the timer phase",
          "A CPU freeze when garbage collection pauses the main thread for over 100ms"
        ],
        "correctIndex": 1,
        "explanation": "Backpressure occurs when writes buffer faster than consumption; stream.pipe() automatically pauses reads until \"drain\" fires."
      },
      {
        "id": "node-h2",
        "skill": "node.js",
        "difficulty": "hard",
        "topic": "event-loop-phases",
        "question": "In what exact phase of the libuv Event Loop are incoming I/O connections and read callbacks processed?",
        "options": [
          "Timers phase",
          "Poll phase",
          "Close callbacks phase",
          "Check phase"
        ],
        "correctIndex": 1,
        "explanation": "The Poll phase calculates how long to block and poll for I/O events, then processes events in the poll queue."
      },
      {
        "id": "node-h3",
        "skill": "node.js",
        "difficulty": "hard",
        "topic": "unhandled-rejections",
        "question": "In modern Node.js (v15+), what is the default behavior when an unhandled promise rejection occurs?",
        "options": [
          "A silent warning is logged to stdout while the server keeps running uninterrupted",
          "The Node.js process terminates with a non-zero exit code (crash)",
          "The promise is automatically retried up to 3 times before failing",
          "The event loop resets its internal queues and drops all pending requests"
        ],
        "correctIndex": 1,
        "explanation": "Modern Node.js crashes with an uncaughtException error when promise rejections are left unhandled."
      },
      {
        "id": "node-h4",
        "skill": "node.js",
        "difficulty": "hard",
        "topic": "cluster-module",
        "question": "How does the Node.js \"cluster\" module enable horizontal scaling on multi-core servers?",
        "options": [
          "It compiles the server into WebAssembly to execute in parallel on GPU cores",
          "It forks multiple worker processes that share the same master server listening port",
          "It creates an in-memory Redis cluster automatically inside the V8 engine",
          "It delegates socket handling to an external Nginx proxy automatically"
        ],
        "correctIndex": 1,
        "explanation": "The cluster module uses child processes with shared server ports to distribute incoming traffic across CPU cores."
      },
      {
        "id": "node-h5",
        "skill": "node.js",
        "difficulty": "hard",
        "topic": "eventemitter-memory-leaks",
        "question": "Why does Node.js EventEmitter print a warning when adding more than 10 listeners to an event?",
        "options": [
          "Because the operating system kernel cannot dispatch more than 10 events per second",
          "To alert developers to potential memory leaks where listeners are added repeatedly without removal",
          "Because arrays in V8 cannot hold more than 10 elements without reallocating heap memory",
          "To prevent CPU throttling enforced by cloud hosting providers"
        ],
        "correctIndex": 1,
        "explanation": "The defaultMaxListeners threshold (10) guards against memory leaks caused by repeatedly binding anonymous closures."
      },
      {
        "id": "node-h6",
        "skill": "node.js",
        "difficulty": "hard",
        "topic": "cluster-vs-worker-threads",
        "question": "When should you use the \"worker_threads\" module instead of the \"cluster\" module in Node.js?",
        "options": [
          "When you need to fork multiple independent OS processes that share a TCP port",
          "When performing CPU-intensive tasks (like image processing or crypto) that need shared memory (ArrayBuffers) within one process",
          "When creating HTTP reverse proxies",
          "Worker threads are only for Windows OS"
        ],
        "correctIndex": 1,
        "explanation": "cluster forks independent processes sharing a server port; worker_threads run parallel threads sharing memory via SharedArrayBuffer."
      },
      {
        "id": "node-h7",
        "skill": "node.js",
        "difficulty": "hard",
        "topic": "process-nexttick",
        "question": "Where does process.nextTick() execute relative to the Node.js Event Loop phases?",
        "options": [
          "In the Timers phase with setTimeout(0)",
          "Immediately after the current synchronous operation finishes, before the event loop advances to the next phase",
          "In the Close phase of the next tick",
          "Only after all I/O events have completed"
        ],
        "correctIndex": 1,
        "explanation": "process.nextTick queue is drained immediately after the current operation finishes, before any other event loop phase continues."
      },
      {
        "id": "node-h8",
        "skill": "node.js",
        "difficulty": "hard",
        "topic": "libuv-threadpool",
        "question": "What types of operations are delegated to the libuv thread pool (controlled by UV_THREADPOOL_SIZE) by default in Node.js?",
        "options": [
          "All JavaScript function calls and loops",
          "File system operations (fs), DNS lookups, compression (zlib), and specific crypto routines",
          "Incoming TCP socket connections",
          "React SSR rendering"
        ],
        "correctIndex": 1,
        "explanation": "libuv delegates synchronous OS tasks that cannot be handled by non-blocking OS primitives (fs, dns.lookup, crypto.pbkdf2) to its thread pool."
      },
      {
        "id": "node-h9",
        "skill": "node.js",
        "difficulty": "hard",
        "topic": "child-process-spawn-exec",
        "question": "Why is child_process.spawn() preferred over child_process.exec() when running commands that produce large output?",
        "options": [
          "spawn runs with root privileges automatically",
          "spawn streams output via readable streams without buffer size limits; exec buffers everything in memory and throws an error on overflow",
          "exec only works in Linux containers",
          "spawn automatically restarts on failure"
        ],
        "correctIndex": 1,
        "explanation": "exec buffers standard output (default 1MB limit), causing crashes on large streams; spawn streams output chunk by chunk."
      },
      {
        "id": "node-h10",
        "skill": "node.js",
        "difficulty": "hard",
        "topic": "heap-profiling",
        "question": "Which native V8 flag or core module method takes a complete memory snapshot for debugging memory leaks in Node.js?",
        "options": [
          "process.dumpMemory()",
          "require(\"v8\").getHeapSnapshot() / --inspect and Chrome DevTools",
          "console.profile()",
          "os.memorySnapshot()"
        ],
        "correctIndex": 1,
        "explanation": "v8.getHeapSnapshot() produces a .heapsnapshot file that can be loaded into Chrome DevTools Memory panel to trace retained objects."
      }
    ]
  },
  "html": {
    "easy": [
      {
        "id": "html-e1",
        "skill": "html",
        "difficulty": "easy",
        "topic": "heading-hierarchy",
        "question": "Which HTML tag represents the most important top-level heading on a web page?",
        "options": [
          "<head>",
          "<h6>",
          "<h1>",
          "<header>"
        ],
        "correctIndex": 2,
        "explanation": "<h1> denotes the primary heading of the document hierarchy and should typically appear once per page for SEO and accessibility."
      },
      {
        "id": "html-e2",
        "skill": "html",
        "difficulty": "easy",
        "topic": "anchor-href",
        "question": "Which attribute on an anchor tag (<a>) specifies the hyperlink target destination URL?",
        "options": [
          "src",
          "link",
          "href",
          "target-url"
        ],
        "correctIndex": 2,
        "explanation": "The href (hypertext reference) attribute specifies the destination URL or fragment identifier."
      },
      {
        "id": "html-e3",
        "skill": "html",
        "difficulty": "easy",
        "topic": "image-alt-text",
        "question": "What is the primary accessibility and fallback purpose of the \"alt\" attribute on an <img> tag?",
        "options": [
          "To define the image file type extension",
          "To provide descriptive text for screen readers and when images fail to load",
          "To set the hover tooltip popup text in all desktop browsers",
          "To encrypt the image data before sending over HTTP"
        ],
        "correctIndex": 1,
        "explanation": "The alt attribute conveys the image's meaning to visually impaired users and displays when the image source fails."
      },
      {
        "id": "html-e4",
        "skill": "html",
        "difficulty": "easy",
        "topic": "lists-ordered",
        "question": "Which HTML tag creates a numbered (ordered) list?",
        "options": [
          "<ul>",
          "<ol>",
          "<li>",
          "<list>"
        ],
        "correctIndex": 1,
        "explanation": "<ol> defines an ordered list where browser agents automatically prefix items with sequential numbers."
      },
      {
        "id": "html-e5",
        "skill": "html",
        "difficulty": "easy",
        "topic": "meta-tags",
        "question": "Where should document metadata tags (<meta>) be placed in an HTML document?",
        "options": [
          "Inside the <head> section",
          "At the end of the <body>",
          "Directly before the <!DOCTYPE html>",
          "Inside the <footer> element"
        ],
        "correctIndex": 0,
        "explanation": "Document metadata tags must reside within the <head> element to configure character encoding, viewport, and SEO tags."
      },
      {
        "id": "html-e6",
        "skill": "html",
        "difficulty": "easy",
        "topic": "button-vs-anchor",
        "question": "What is the semantic rule for choosing between <button> and <a href>?",
        "options": [
          "Use <button> for navigation; <a href> for modal toggles",
          "Use <a href> for navigating to URLs/pages; use <button> for actions that change state or submit forms",
          "They are interchangeable in modern HTML5",
          "Buttons cannot have text content, only icons"
        ],
        "correctIndex": 1,
        "explanation": "Links (<a>) represent navigation to a destination; buttons (<button>) represent actions that trigger logic or change state."
      },
      {
        "id": "html-e7",
        "skill": "html",
        "difficulty": "easy",
        "topic": "img-alt-accessibility",
        "question": "What is the accessibility consequence of omitting the \"alt\" attribute on an <img> element?",
        "options": [
          "The image fails to render entirely",
          "Screen readers may read out the entire image file URL or path, degrading assistive technology experience",
          "The browser throws a JavaScript console error",
          "The page title is overwritten"
        ],
        "correctIndex": 1,
        "explanation": "Without alt text, assistive technologies often fall back to speaking the raw file name or URL. Use alt=\"\" for purely decorative images."
      },
      {
        "id": "html-e8",
        "skill": "html",
        "difficulty": "easy",
        "topic": "form-methods",
        "question": "What is the primary difference between method=\"GET\" and method=\"POST\" in HTML forms?",
        "options": [
          "GET sends form data encoded in the URL query string; POST sends form data in the HTTP request body",
          "GET encrypts form data; POST sends plain text",
          "GET allows file uploads; POST does not",
          "There is no difference in modern browsers"
        ],
        "correctIndex": 0,
        "explanation": "GET appends parameters to the URL query string (good for bookmarks/search); POST sends them inside the request payload."
      },
      {
        "id": "html-e9",
        "skill": "html",
        "difficulty": "easy",
        "topic": "label-for",
        "question": "How do you explicitly link a <label> element to an <input id=\"email\"> for keyboard and assistive access?",
        "options": [
          "<label target=\"email\">",
          "<label for=\"email\">",
          "<label input=\"email\">",
          "<label name=\"email\">"
        ],
        "correctIndex": 1,
        "explanation": "The \"for\" attribute on a <label> must match the \"id\" of the associated input element to enable click-to-focus and screen reader linkage."
      },
      {
        "id": "html-e10",
        "skill": "html",
        "difficulty": "easy",
        "topic": "input-types",
        "question": "What is the benefit of using <input type=\"email\"> instead of <input type=\"text\">?",
        "options": [
          "It connects automatically to Gmail",
          "It provides native browser validation, regex validation, and shows an email-optimized keyboard on mobile devices",
          "It prevents bots from submitting the form",
          "It hashes the email in memory"
        ],
        "correctIndex": 1,
        "explanation": "type=\"email\" triggers built-in browser format validation and displays an @-friendly soft keyboard on mobile devices."
      }
    ],
    "medium": [
      {
        "id": "html-m1",
        "skill": "html",
        "difficulty": "medium",
        "topic": "semantic-article-vs-section",
        "question": "What is the semantic distinction between <article> and <section> in HTML5?",
        "options": [
          "<article> represents self-contained content that can be distributed independently; <section> groups thematic content",
          "<article> is exclusively for news blog posts; <section> is for e-commerce products only",
          "<section> has inherent accessibility roles; <article> has no accessibility support",
          "There is no semantic difference; they are styling synonyms"
        ],
        "correctIndex": 0,
        "explanation": "<article> denotes independently reusable or syndicable content (e.g., a blog post, comment, or card)."
      },
      {
        "id": "html-m2",
        "skill": "html",
        "difficulty": "medium",
        "topic": "script-defer-execution",
        "question": "How does the \"defer\" attribute alter how a <script> tag executes?",
        "options": [
          "Downloads script in parallel and executes it immediately, pausing HTML parsing",
          "Downloads in parallel and executes only after the HTML document has been fully parsed",
          "Executes the script on a separate background thread in WebAssembly",
          "Postpones script downloading until the user scrolls past the fold"
        ],
        "correctIndex": 1,
        "explanation": "defer downloads scripts asynchronously while parsing continues, then executes in document order before DOMContentLoaded."
      },
      {
        "id": "html-m3",
        "skill": "html",
        "difficulty": "medium",
        "topic": "aria-labels",
        "question": "What is the primary utility of the \"aria-label\" attribute in HTML accessibility?",
        "options": [
          "It renders a visible floating tooltip badge on hover",
          "It provides an invisible string label for assistive technologies when visible text is absent (e.g., icon buttons)",
          "It translates text into other languages automatically using browser AI",
          "It alters the tab order sequence during keyboard navigation"
        ],
        "correctIndex": 1,
        "explanation": "aria-label assigns an accessible name to interactive elements that lack visible text, such as icon-only buttons."
      },
      {
        "id": "html-m4",
        "skill": "html",
        "difficulty": "medium",
        "topic": "responsive-picture-element",
        "question": "What capability does the HTML5 <picture> element offer over a standard <img> tag?",
        "options": [
          "It renders 3D WebGL scenes without JavaScript",
          "It serves different image assets based on media queries (art direction) and modern image formats (AVIF/WebP)",
          "It automatically resizes server-side images using AI compression",
          "It allows playing video files inside an image container"
        ],
        "correctIndex": 1,
        "explanation": "<picture> uses child <source> elements to support art direction and deliver optimized formats based on viewport and browser support."
      },
      {
        "id": "html-m5",
        "skill": "html",
        "difficulty": "medium",
        "topic": "form-validation-attributes",
        "question": "Which HTML5 attribute pattern enforces client-side regex validation on input fields without JavaScript?",
        "options": [
          "validate=\"regex\"",
          "pattern=\"[A-Za-z0-9]+\"",
          "rule=\"alphanumeric\"",
          "check=\"regex\""
        ],
        "correctIndex": 1,
        "explanation": "The pattern attribute specifies a JavaScript regular expression that the input's value must match before form submission."
      },
      {
        "id": "html-m6",
        "skill": "html",
        "difficulty": "medium",
        "topic": "viewport-meta",
        "question": "What does the meta tag <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"> do?",
        "options": [
          "Zooms in 200% on desktop browsers",
          "Instructs the browser to render the page at the device's physical width and sets a 1:1 scale ratio, enabling responsive design",
          "Disables touch gestures on mobile devices",
          "Forces all fonts to 16px"
        ],
        "correctIndex": 1,
        "explanation": "The viewport meta tag establishes the virtual viewport width to match the physical device screen, essential for responsive CSS."
      },
      {
        "id": "html-m7",
        "skill": "html",
        "difficulty": "medium",
        "topic": "responsive-picture",
        "question": "Why would a developer use the <picture> element with multiple <source> tags instead of a standard <img>?",
        "options": [
          "To play video files inside images",
          "To serve different image resolutions, modern formats (WebP/AVIF), and artistic crops based on media queries",
          "To prevent right-click image saving",
          "To automatically watermark photos"
        ],
        "correctIndex": 1,
        "explanation": "<picture> allows declarative art direction and format fallback (e.g. serving AVIF to supporting browsers and JPG as fallback)."
      },
      {
        "id": "html-m8",
        "skill": "html",
        "difficulty": "medium",
        "topic": "semantic-landmarks",
        "question": "Which HTML5 semantic element is intended for self-contained, independently distributable content like blog posts or news stories?",
        "options": [
          "<section>",
          "<article>",
          "<aside>",
          "<main>"
        ],
        "correctIndex": 1,
        "explanation": "<article> represents an independent, self-contained composition suitable for syndication or re-use (e.g., article, comment, card)."
      },
      {
        "id": "html-m9",
        "skill": "html",
        "difficulty": "medium",
        "topic": "native-dialog",
        "question": "What native HTML5 element and method opens an accessible modal with an automatic ::backdrop overlay?",
        "options": [
          "<popup> and element.show()",
          "<dialog> and element.showModal()",
          "<modal> and element.open()",
          "<window> and element.display()"
        ],
        "correctIndex": 1,
        "explanation": "The <dialog> element paired with .showModal() creates a top-layer modal, traps focus, handles ESC key closing, and provides ::backdrop."
      },
      {
        "id": "html-m10",
        "skill": "html",
        "difficulty": "medium",
        "topic": "script-defer-async",
        "question": "What is the execution order difference between <script defer> and <script async>?",
        "options": [
          "defer scripts execute in the exact order they appear in the HTML after DOM parsing completes; async scripts execute as soon as downloaded",
          "async guarantees execution order; defer does not",
          "defer only works on stylesheets; async works on scripts",
          "There is no difference in modern browsers"
        ],
        "correctIndex": 0,
        "explanation": "defer downloads in parallel and executes in DOM order after parsing; async executes immediately when ready, regardless of document order."
      }
    ],
    "hard": [
      {
        "id": "html-h1",
        "skill": "html",
        "difficulty": "hard",
        "topic": "reverse-tabnabbing-rel",
        "question": "Why should links with target=\"_blank\" always include rel=\"noopener noreferrer\"?",
        "options": [
          "To prevent the new tab from executing JavaScript code entirely",
          "To prevent the opened page from controlling the source window via window.opener (reverse tabnabbing) and leaking referrer headers",
          "To instruct search engine crawlers not to index the destination website",
          "To enforce SSL encryption on the external link target"
        ],
        "correctIndex": 1,
        "explanation": "Without noopener, the opened page can access window.opener and navigate the original tab to a phishing clone."
      },
      {
        "id": "html-h2",
        "skill": "html",
        "difficulty": "hard",
        "topic": "async-vs-defer-parsing",
        "question": "What is the key execution order difference between <script async> and <script defer>?",
        "options": [
          "defer scripts preserve document order; async scripts execute as soon as downloaded regardless of order",
          "async scripts guarantee execution order; defer scripts run in arbitrary order",
          "defer scripts execute before the HTML body starts parsing; async scripts run on window.onload",
          "Both execute at identical times; the names are legacy aliases"
        ],
        "correctIndex": 0,
        "explanation": "async scripts execute unpredictably as soon as downloaded; defer scripts preserve document ordering after DOM parsing."
      },
      {
        "id": "html-h3",
        "skill": "html",
        "difficulty": "hard",
        "topic": "shadow-dom-encapsulation",
        "question": "In Web Components, how does the Shadow DOM maintain style and DOM encapsulation?",
        "options": [
          "By compiling styles into an iframe sandbox with a separate origin",
          "By scoping internal DOM trees and CSS rules so global page styles do not bleed in or out",
          "By encrypting HTML element tags using browser public-key cryptography",
          "By disabling all DOM manipulation APIs for child elements"
        ],
        "correctIndex": 1,
        "explanation": "Shadow DOM attaches a scoped sub-tree to an element, shielding internal markup and CSS from outer document interference."
      },
      {
        "id": "html-h4",
        "skill": "html",
        "difficulty": "hard",
        "topic": "viewport-meta-scale",
        "question": "What happens on mobile devices if <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"> is omitted?",
        "options": [
          "The mobile browser renders the page as a 980px desktop canvas and zooms out, making text tiny and unreadable",
          "The mobile browser refuses to render the page and returns an HTTP 400 error",
          "The page automatically converts into an Android native APK layout",
          "All responsive CSS media queries evaluate to true simultaneously"
        ],
        "correctIndex": 0,
        "explanation": "Without the viewport meta tag, mobile browsers default to a desktop virtual viewport (~980px) and scale it down to fit screen width."
      },
      {
        "id": "html-h5",
        "skill": "html",
        "difficulty": "hard",
        "topic": "contenteditable-xss",
        "question": "What critical security vulnerability must developers sanitize against when allowing user input in contenteditable elements?",
        "options": [
          "Cross-Site Scripting (XSS) via injected <script> or event handler attributes inside raw HTML",
          "SQL Injection into browser localStorage tables",
          "DNS Spoofing on outgoing form actions",
          "Denial of Service due to infinite font-size recursion"
        ],
        "correctIndex": 0,
        "explanation": "contenteditable generates HTML nodes, allowing malicious actors to inject unescaped markup and execute XSS payloads."
      },
      {
        "id": "html-h6",
        "skill": "html",
        "difficulty": "hard",
        "topic": "aria-live-regions",
        "question": "What does aria-live=\"polite\" accomplish for assistive screen reader users?",
        "options": [
          "Mutes the screen reader audio",
          "Announces dynamic content updates to screen readers when the user becomes idle, without interrupting ongoing speech",
          "Immediately cuts off existing speech to shout the notification",
          "Translates the notification into multiple languages"
        ],
        "correctIndex": 1,
        "explanation": "aria-live=\"polite\" queues notifications to be spoken at the next natural conversational pause without interrupting the user."
      },
      {
        "id": "html-h7",
        "skill": "html",
        "difficulty": "hard",
        "topic": "shadow-dom-encapsulation",
        "question": "What does the Shadow DOM provide in modern Web Components?",
        "options": [
          "Encrypted DOM trees that cannot be viewed in DevTools",
          "Scoped CSS styles and encapsulated DOM subtrees that do not leak into or get affected by global document styles",
          "Automatic database synchronization",
          "Hardware-accelerated 3D WebGL rendering"
        ],
        "correctIndex": 1,
        "explanation": "Shadow DOM encapsulates styles and DOM nodes, preventing outside CSS from interfering with internal component markup."
      },
      {
        "id": "html-h8",
        "skill": "html",
        "difficulty": "hard",
        "topic": "content-security-policy",
        "question": "What security header or meta tag prevents inline script execution and unauthorized cross-site data exfiltration?",
        "options": [
          "X-Frame-Options",
          "Content-Security-Policy (CSP)",
          "Strict-Transport-Security (HSTS)",
          "X-Content-Type-Options"
        ],
        "correctIndex": 1,
        "explanation": "Content-Security-Policy (CSP) restricts the sources from which scripts, styles, and data can be loaded, stopping XSS attacks."
      },
      {
        "id": "html-h9",
        "skill": "html",
        "difficulty": "hard",
        "topic": "open-graph-meta",
        "question": "Which set of meta tags controls the image, title, and description displayed when a web page is shared on social media and chat apps?",
        "options": [
          "Dublin Core Metadata (<meta name=\"dc:...\">)",
          "Open Graph Protocol (<meta property=\"og:title\" content=\"...\">, og:image, og:description)",
          "Schema.org RDF only",
          "XML Sitemap tags"
        ],
        "correctIndex": 1,
        "explanation": "The Open Graph protocol (og:title, og:image, og:url, og:description) standardizes rich snippet previews across platforms."
      },
      {
        "id": "html-h10",
        "skill": "html",
        "difficulty": "hard",
        "topic": "reverse-tabnabbing",
        "question": "Why should links with target=\"_blank\" always include rel=\"noopener noreferrer\"?",
        "options": [
          "To prevent the new page from accessing window.opener and redirecting the parent page to a malicious phishing site",
          "To ensure the new tab inherits user session cookies",
          "To speed up TCP handshake times",
          "To allow the new window to bypass CORS restrictions"
        ],
        "correctIndex": 0,
        "explanation": "rel=\"noopener\" prevents the newly opened tab from referencing window.opener, stopping reverse tabnabbing phishing exploits."
      }
    ]
  },
  "css": {
    "easy": [
      {
        "id": "css-e1",
        "skill": "css",
        "difficulty": "easy",
        "topic": "box-model-layers",
        "question": "In the standard CSS box model, what is the layer located between padding and margin?",
        "options": [
          "content",
          "border",
          "outline",
          "shadow"
        ],
        "correctIndex": 1,
        "explanation": "The CSS box model consists of content, padding, border, and margin from inside out."
      },
      {
        "id": "css-e2",
        "skill": "css",
        "difficulty": "easy",
        "topic": "color-property",
        "question": "Which CSS property defines the foreground text color of an element?",
        "options": [
          "text-color",
          "font-color",
          "color",
          "foreground"
        ],
        "correctIndex": 2,
        "explanation": "The \"color\" property sets the foreground text color of an element."
      },
      {
        "id": "css-e3",
        "skill": "css",
        "difficulty": "easy",
        "topic": "id-selectors",
        "question": "Which CSS selector symbol targets an element with id=\"main-nav\"?",
        "options": [
          ".main-nav",
          "#main-nav",
          "*main-nav",
          "@main-nav"
        ],
        "correctIndex": 1,
        "explanation": "The hash (#) symbol denotes an ID selector in CSS; a dot (.) denotes a class selector."
      },
      {
        "id": "css-e4",
        "skill": "css",
        "difficulty": "easy",
        "topic": "position-default",
        "question": "What is the default value of the \"position\" property in CSS for all HTML elements?",
        "options": [
          "relative",
          "absolute",
          "static",
          "fixed"
        ],
        "correctIndex": 2,
        "explanation": "The initial value of position is \"static\", positioning elements according to the normal page flow."
      },
      {
        "id": "css-e5",
        "skill": "css",
        "difficulty": "easy",
        "topic": "flexbox-basics",
        "question": "Which display property creates a flex formatting context for laying out items in one dimension?",
        "options": [
          "display: block",
          "display: inline",
          "display: flex",
          "display: table"
        ],
        "correctIndex": 2,
        "explanation": "display: flex converts the container into a flex container, aligning children along the main or cross axis."
      },
      {
        "id": "css-e6",
        "skill": "css",
        "difficulty": "easy",
        "topic": "inline-vs-block",
        "question": "What is a key layout distinction between \"display: block\" and \"display: inline\"?",
        "options": [
          "Inline elements take up full width; block elements take only needed width",
          "Block elements start on a new line and stretch the full width available; inline elements sit beside text and ignore top/bottom margins",
          "Inline elements can have custom heights; block elements cannot",
          "Block elements are transparent by default"
        ],
        "correctIndex": 1,
        "explanation": "Block elements create a new line and expand horizontally; inline elements flow along text and ignore vertical width/height styling."
      },
      {
        "id": "css-e7",
        "skill": "css",
        "difficulty": "easy",
        "topic": "box-sizing",
        "question": "Why do modern CSS resets set \"* { box-sizing: border-box; }\"?",
        "options": [
          "It rounds all corners by 4px",
          "It includes padding and border within the declared width and height, eliminating layout overflow bugs",
          "It removes all default margins from headings",
          "It makes all fonts anti-aliased"
        ],
        "correctIndex": 1,
        "explanation": "With border-box, width = content + padding + border, preventing elements from expanding beyond their intended width."
      },
      {
        "id": "css-e8",
        "skill": "css",
        "difficulty": "easy",
        "topic": "margin-vs-padding",
        "question": "What is the fundamental difference between margin and padding in the CSS box model?",
        "options": [
          "Margin is inside the element border; padding is outside",
          "Padding is space inside the border around content; margin is transparent space outside the element border",
          "Padding only affects text color",
          "Margin cannot have negative values"
        ],
        "correctIndex": 1,
        "explanation": "Padding creates space inside the border; margin creates separation between the element and adjacent elements."
      },
      {
        "id": "css-e9",
        "skill": "css",
        "difficulty": "easy",
        "topic": "hover-pseudo",
        "question": "Which CSS pseudo-class styles an element when the user points their mouse cursor over it?",
        "options": [
          ":focus",
          ":hover",
          ":active",
          ":visited"
        ],
        "correctIndex": 1,
        "explanation": "The :hover pseudo-class applies styles when the pointer device hovers over an interactive element."
      },
      {
        "id": "css-e10",
        "skill": "css",
        "difficulty": "easy",
        "topic": "color-properties",
        "question": "Which CSS property changes the text color of an element?",
        "options": [
          "text-color",
          "font-color",
          "color",
          "foreground"
        ],
        "correctIndex": 2,
        "explanation": "The color property defines the foreground text color of an element."
      }
    ],
    "medium": [
      {
        "id": "css-m1",
        "skill": "css",
        "difficulty": "medium",
        "topic": "box-sizing-borderbox",
        "question": "What is the primary effect of applying \"box-sizing: border-box\" to all elements?",
        "options": [
          "Adds a default 2px solid black border around all page containers",
          "Includes padding and border within the element's declared width and height",
          "Prevents margins from ever collapsing with adjacent siblings",
          "Enforces 3D hardware acceleration on all CSS transforms"
        ],
        "correctIndex": 1,
        "explanation": "border-box causes width/height to encompass content, padding, and border, making responsive sizing intuitive."
      },
      {
        "id": "css-m2",
        "skill": "css",
        "difficulty": "medium",
        "topic": "flexbox-axes-alignment",
        "question": "In a flex container with flex-direction: row, which property aligns items along the main horizontal axis?",
        "options": [
          "align-items",
          "justify-content",
          "align-content",
          "place-self"
        ],
        "correctIndex": 1,
        "explanation": "justify-content distributes space along the main axis; align-items aligns items along the cross axis."
      },
      {
        "id": "css-m3",
        "skill": "css",
        "difficulty": "medium",
        "topic": "grid-autofit-minmax",
        "question": "What does \"grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))\" accomplish?",
        "options": [
          "Forces exactly 4 equal columns on all screen widths",
          "Creates a responsive grid where columns automatically wrap when below 280px without media queries",
          "Centers a single column in the middle of the viewport",
          "Restricts grid items from exceeding 280px maximum height"
        ],
        "correctIndex": 1,
        "explanation": "auto-fit with minmax produces responsive multi-column layouts that gracefully wrap as the viewport shrinks."
      },
      {
        "id": "css-m4",
        "skill": "css",
        "difficulty": "medium",
        "topic": "specificity-hierarchy",
        "question": "Arrange the following CSS selectors in order of increasing specificity (lowest to highest):",
        "options": [
          "Type Selector < Class Selector < ID Selector < Inline Style",
          "ID Selector < Class Selector < Type Selector < Inline Style",
          "Class Selector < Type Selector < Inline Style < ID Selector",
          "Inline Style < Type Selector < Class Selector < ID Selector"
        ],
        "correctIndex": 0,
        "explanation": "Specificity cascades from elements (0,0,1) to classes (0,1,0) to IDs (1,0,0) to inline style attributes (1,0,0,0)."
      },
      {
        "id": "css-m5",
        "skill": "css",
        "difficulty": "medium",
        "topic": "rem-vs-em-units",
        "question": "What is the base reference point for 1rem in CSS?",
        "options": [
          "The font-size of the immediate parent container",
          "The font-size of the root <html> document element",
          "1% of the total viewport height",
          "The device screen DPI resolution"
        ],
        "correctIndex": 1,
        "explanation": "rem (root em) computes relative to the font-size of the root (<html>) element, typically 16px by default."
      },
      {
        "id": "css-m6",
        "skill": "css",
        "difficulty": "medium",
        "topic": "flexbox-axes",
        "question": "In a Flexbox container with \"flex-direction: row\", which property aligns items along the cross (vertical) axis?",
        "options": [
          "justify-content",
          "align-items",
          "align-content",
          "flex-wrap"
        ],
        "correctIndex": 1,
        "explanation": "justify-content aligns items along the main axis; align-items aligns items along the perpendicular cross axis."
      },
      {
        "id": "css-m7",
        "skill": "css",
        "difficulty": "medium",
        "topic": "grid-auto-fit",
        "question": "What responsive layout behavior is produced by \"grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))\"?",
        "options": [
          "A fixed 3-column table on all screens",
          "An intrinsically responsive grid that automatically wraps cards and stretches them to fill available width without media queries",
          "An infinite horizontal carousel",
          "A single centered column"
        ],
        "correctIndex": 1,
        "explanation": "auto-fit with minmax() creates a responsive grid that automatically reflows columns based on available container width."
      },
      {
        "id": "css-m8",
        "skill": "css",
        "difficulty": "medium",
        "topic": "css-custom-properties",
        "question": "How do you declare and access a CSS custom property (variable)?",
        "options": [
          "$primary-color: #4F46E5; and color: $primary-color;",
          "--primary-color: #4F46E5; and color: var(--primary-color, #000);",
          "@primary-color: #4F46E5; and color: @primary-color;",
          "const(primary-color): #4F46E5;"
        ],
        "correctIndex": 1,
        "explanation": "CSS Custom Properties start with two hyphens (--name) and are accessed with the var(--name, fallback) function."
      },
      {
        "id": "css-m9",
        "skill": "css",
        "difficulty": "medium",
        "topic": "specificity-calculation",
        "question": "Between \"#nav .menu li a\" and \".header .nav .item a:hover\", which selector has higher specificity?",
        "options": [
          ".header .nav .item a:hover (4 classes/pseudos)",
          "#nav .menu li a because it contains an ID selector (1, 1, 2) vs (0, 4, 1)",
          "They have identical specificity",
          "Whichever comes last in the CSS file"
        ],
        "correctIndex": 1,
        "explanation": "ID selectors outweigh any number of class selectors (1, 1, 2 has higher priority than 0, 4, 1)."
      },
      {
        "id": "css-m10",
        "skill": "css",
        "difficulty": "medium",
        "topic": "prefers-color-scheme",
        "question": "Which CSS media feature detects if a user has selected a system-level dark theme in their operating system?",
        "options": [
          "@media (theme: dark)",
          "@media (prefers-color-scheme: dark)",
          "@media (color-mode: night)",
          "@media (dark-mode: true)"
        ],
        "correctIndex": 1,
        "explanation": "prefers-color-scheme detects whether the user's OS or browser has requested a light or dark theme."
      }
    ],
    "hard": [
      {
        "id": "css-h1",
        "skill": "css",
        "difficulty": "hard",
        "topic": "stacking-context",
        "question": "Which of the following CSS declarations creates a brand-new Stacking Context for z-index layering?",
        "options": [
          "opacity: 0.99 or transform: translateZ(0)",
          "font-weight: bold",
          "text-align: center",
          "background-color: transparent"
        ],
        "correctIndex": 0,
        "explanation": "Elements with opacity < 1, transform, filter, isolation: isolate, or position: relative with z-index spawn a new stacking context."
      },
      {
        "id": "css-h2",
        "skill": "css",
        "difficulty": "hard",
        "topic": "gpu-compositor-animations",
        "question": "Why is animating transform and opacity significantly more performant than animating top, left, or width?",
        "options": [
          "They do not trigger browser Reflow (Layout) or Repaint, running entirely on the GPU Compositor thread",
          "They bypass browser frame-rate limits and render at 240Hz",
          "They automatically disable garbage collection during animation loops",
          "They compile CSS into native WebGL shaders during page load"
        ],
        "correctIndex": 0,
        "explanation": "transform and opacity avoid expensive layout reflow and paint cycles by delegating rendering directly to GPU compositing."
      },
      {
        "id": "css-h3",
        "skill": "css",
        "difficulty": "hard",
        "topic": "has-relational-selector",
        "question": "What unique problem does the CSS :has() pseudo-class solve?",
        "options": [
          "It acts as a parent and previous-sibling selector by styling an element based on its descendant contents",
          "It checks if the user has an active internet connection",
          "It verifies whether the browser has JavaScript enabled",
          "It enforces that all form inputs have non-empty values before styling"
        ],
        "correctIndex": 0,
        "explanation": ":has() is the long-awaited \"parent selector\" allowing styles to apply to ancestors depending on child state."
      },
      {
        "id": "css-h4",
        "skill": "css",
        "difficulty": "hard",
        "topic": "block-formatting-context",
        "question": "What is a Block Formatting Context (BFC) and what common layout issue does it resolve?",
        "options": [
          "An isolated layout region that prevents internal margins from collapsing with external siblings and contains internal floats",
          "A responsive typography calculator for fluid font scaling",
          "A CSS print media stylesheet preventing page breaks across cards",
          "A web worker layout pipeline introduced in HTTP/3"
        ],
        "correctIndex": 0,
        "explanation": "A BFC (created by overflow: hidden, display: flow-root, etc.) contains floats and prevents margin collapse with outside elements."
      },
      {
        "id": "css-h5",
        "skill": "css",
        "difficulty": "hard",
        "topic": "clamp-fluid-typography",
        "question": "What does the CSS clamp() function do in modern fluid responsive design (e.g. font-size: clamp(1rem, 2.5vw, 2.5rem))?",
        "options": [
          "Enforces a value that scales dynamically with viewport width but is bounded between a minimum and maximum threshold",
          "Truncates long paragraphs of text with an ellipsis (...) after 3 lines",
          "Compresses image files dynamically based on screen pixel density",
          "Restricts flex items from shrinking below their declared flex-basis"
        ],
        "correctIndex": 0,
        "explanation": "clamp(MIN, VAL, MAX) clamps an ideal responsive value (like 2.5vw) between an accessible minimum and maximum limit."
      },
      {
        "id": "css-h6",
        "skill": "css",
        "difficulty": "hard",
        "topic": "contain-property",
        "question": "What performance benefit does the \"contain: content\" or \"contain: layout paint\" property provide in large DOM trees?",
        "options": [
          "Compresses the HTML to reduce network latency",
          "Isolates the element's subtree from the rest of the page, allowing the browser to skip layout and paint calculations for off-screen items",
          "Prevents user selection of text",
          "Enforces responsive aspect ratios"
        ],
        "correctIndex": 1,
        "explanation": "The contain property signals that an element's subtree is independent, allowing the rendering engine to optimize paint/layout cycles."
      },
      {
        "id": "css-h7",
        "skill": "css",
        "difficulty": "hard",
        "topic": "subgrid",
        "question": "What does \"grid-template-columns: subgrid\" allow child grid items to do in modern CSS?",
        "options": [
          "Create a 3D isometric projection",
          "Inherit and align with the column tracks of their parent grid container without repeating track declarations",
          "Convert the grid into a flexbox container",
          "Split single columns into micro-pixels"
        ],
        "correctIndex": 1,
        "explanation": "Subgrid allows nested grid elements to directly participate in the sizing and alignment of their ancestor grid tracks."
      },
      {
        "id": "css-h8",
        "skill": "css",
        "difficulty": "hard",
        "topic": "gpu-compositing",
        "question": "Why are animations using \"transform\" and \"opacity\" significantly smoother than animating \"top\", \"left\", or \"height\"?",
        "options": [
          "They don't trigger layout or repaint cycles and can be handled directly by the GPU compositor thread",
          "They bypass CSS validation checks",
          "They automatically double the monitor refresh rate to 120Hz",
          "top and left are deprecated in modern CSS"
        ],
        "correctIndex": 0,
        "explanation": "transform and opacity can be composited directly on the GPU without triggering CPU layout reflows or repaints."
      },
      {
        "id": "css-h9",
        "skill": "css",
        "difficulty": "hard",
        "topic": "container-queries",
        "question": "What is the key advantage of CSS Container Queries (@container) over standard Media Queries (@media)?",
        "options": [
          "They only apply to Docker containers",
          "They adapt styles based on the size of the component's parent container rather than the overall browser viewport",
          "They eliminate the need for class names",
          "They can query database rows directly"
        ],
        "correctIndex": 1,
        "explanation": "@container queries allow truly modular, reusable components to adapt to their immediate container's width regardless of screen size."
      },
      {
        "id": "css-h10",
        "skill": "css",
        "difficulty": "hard",
        "topic": "cascade-layers",
        "question": "How do CSS Cascade Layers (@layer) solve CSS specificity wars in modern architectures?",
        "options": [
          "By automatically deleting unused CSS selectors at build time",
          "By explicitly defining layer precedence order (e.g. @layer reset, base, components, utilities), where higher layers override lower ones regardless of specificity",
          "By converting all CSS rules into inline style attributes",
          "By forcing all selectors to use !important"
        ],
        "correctIndex": 1,
        "explanation": "@layer establishes an explicit hierarchy of precedence where selectors in higher layers always win over lower layers."
      }
    ]
  }
};

// Merge curated questions for TypeScript, MongoDB, Docker, Git, AWS, PostgreSQL, Express, Tailwind, Next.js, FastAPI, Linux, REST APIs, Redis, Kubernetes
const additionalQuestions = require('./additionalQuizQuestions');
Object.assign(QUIZ_QUESTIONS, additionalQuestions);

const skillsData = require('./skillsData');

function normalizeSkillKey(skill) {
  const s = (skill || '').toLowerCase().trim();
  if (s === 'nodejs' || s === 'node') return 'node.js';
  if (s === 'reactjs' || s === 'react.js') return 'react';
  if (s === 'express' || s === 'expressjs') return 'express.js';
  if (s === 'html5') return 'html';
  if (s === 'css3') return 'css';
  if (s === 'js') return 'javascript';
  if (s === 'py') return 'python';
  if (s === 'golang') return 'go';
  if (s === 'ts') return 'typescript';
  if (s === 'postgres') return 'postgresql';
  if (s === 'mongo') return 'mongodb';
  if (s === 'k8s') return 'kubernetes';
  if (s === 'tailwind') return 'tailwind-css';
  if (s === 'next' || s === 'nextjs') return 'next.js';
  if (s === 'tf') return 'terraform';
  if (s === 'rest' || s === 'restapi' || s === 'rest-api') return 'rest-apis';
  if (s === 'fast-api') return 'fastapi';
  if (s === 'ui/ux' || s === 'uiux') return 'ui/ux-design';
  return s;
}

/**
 * Helper to fetch a question by skill, difficulty, and optional exclusions
 */
function getQuestion(skill, difficulty, excludedIds = []) {
  const normalizedSkill = normalizeSkillKey(skill);
  const pool = QUIZ_QUESTIONS[normalizedSkill]?.[difficulty] || [];
  const candidates = pool.filter((q) => !excludedIds.includes(q.id));

  if (candidates.length === 0) {
    return pool[Math.floor(Math.random() * pool.length)] || null;
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function getQuestionById(skill, questionId) {
  const normalizedSkill = normalizeSkillKey(skill);
  const skillBank = QUIZ_QUESTIONS[normalizedSkill];
  if (!skillBank) return null;

  for (const diff of ['easy', 'medium', 'hard']) {
    const found = skillBank[diff].find((q) => q.id === questionId);
    if (found) return found;
  }
  return null;
}

// All 94 standardized skills from skillsData.js are fully available for quiz verification
const AVAILABLE_QUIZ_SKILLS = Array.from(new Set([
  ...skillsData.map((s) => s.name),
  ...Object.keys(QUIZ_QUESTIONS)
]));

module.exports = {
  QUIZ_QUESTIONS,
  AVAILABLE_QUIZ_SKILLS,
  normalizeSkillKey,
  getQuestion,
  getQuestionById,
};
