/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * data/additionalQuizQuestions.js — Curated Question Banks for High-Frequency Skills
 *
 * Expands static question bank coverage for:
 * - TypeScript, MongoDB, Docker, Git, AWS, PostgreSQL, Express.js,
 * - Tailwind CSS, Next.js, FastAPI, Linux, REST APIs, Redis, Kubernetes
 *
 * Each question conforms strictly to:
 * - id, skill, difficulty, topic, question, options (4), correctIndex (0-3), explanation
 *
 * Disheera · Enterprise Backend Service
 */

const ADDITIONAL_QUIZ_QUESTIONS = {
  "typescript": {
    "easy": [
      {
        "id": "ts-e1",
        "skill": "typescript",
        "difficulty": "easy",
        "topic": "primitive-types",
        "question": "What is the primary difference between the 'any' and 'unknown' types in TypeScript?",
        "options": [
          "'unknown' disables all type checking just like 'any'",
          "'unknown' is type-safe; you must perform type checking or narrowing before performing operations on it",
          "'any' can only store objects, while 'unknown' can only store primitives",
          "There is no difference; they are interchangeable aliases"
        ],
        "correctIndex": 1,
        "explanation": "'unknown' is the type-safe counterpart of 'any'. TypeScript prevents invoking methods or reading properties on 'unknown' without prior type narrowing."
      },
      {
        "id": "ts-e2",
        "skill": "typescript",
        "difficulty": "easy",
        "topic": "interface-vs-type",
        "question": "Which statement accurately describes 'interface' declaration merging in TypeScript?",
        "options": [
          "Interfaces with the same name in the same scope automatically merge their property declarations",
          "Interfaces throw a compile error if declared with the same name twice",
          "Interfaces cannot be extended using the 'extends' keyword",
          "Type aliases support declaration merging, but interfaces do not"
        ],
        "correctIndex": 0,
        "explanation": "Multiple interface declarations with the same identifier in the same scope merge their members automatically."
      },
      {
        "id": "ts-e3",
        "skill": "typescript",
        "difficulty": "easy",
        "topic": "type-assertions",
        "question": "What is the runtime effect of TypeScript type assertions (e.g. `value as string`)?",
        "options": [
          "It converts the runtime type of the variable to string",
          "It throws a TypeError at runtime if the value is not a string",
          "It has zero runtime effect; type assertions are completely erased during compilation",
          "It serializes the value into a JSON string"
        ],
        "correctIndex": 2,
        "explanation": "TypeScript type assertions are purely compile-time hints for the type checker and are completely erased in generated JavaScript."
      }
    ],
    "medium": [
      {
        "id": "ts-m1",
        "skill": "typescript",
        "difficulty": "medium",
        "topic": "generics",
        "question": "Given the function `function identity<T>(arg: T): T`, what does the type parameter `T` enforce?",
        "options": [
          "The argument must be of type string or number only",
          "The return value's type will match the exact type passed as the argument",
          "The argument is automatically converted to an object",
          "The function can only be invoked once"
        ],
        "correctIndex": 1,
        "explanation": "Generics capture the argument's type and preserve that specific type contract through to the return value."
      },
      {
        "id": "ts-m2",
        "skill": "typescript",
        "difficulty": "medium",
        "topic": "utility-types",
        "question": "What does the built-in utility type `Partial<T>` do in TypeScript?",
        "options": [
          "Makes all properties of type T read-only",
          "Constructs a type with all properties of T set to optional (?)",
          "Removes undefined and null from all properties of T",
          "Extracts only boolean properties from T"
        ],
        "correctIndex": 1,
        "explanation": "Partial<T> maps over every key in T and appends the optional modifier (?), making each field optional."
      },
      {
        "id": "ts-m3",
        "skill": "typescript",
        "difficulty": "medium",
        "topic": "type-narrowing",
        "question": "Which TypeScript syntax defines a custom user-defined type guard?",
        "options": [
          "function isUser(x: any): boolean",
          "function isUser(x: any): x is User",
          "function isUser(x: any): as User",
          "function isUser(x: any): typeof User"
        ],
        "correctIndex": 1,
        "explanation": "A type predicate in the form `parameterName is Type` tells TypeScript to narrow the variable's type within conditional blocks."
      }
    ],
    "hard": [
      {
        "id": "ts-h1",
        "skill": "typescript",
        "difficulty": "hard",
        "topic": "mapped-conditional-types",
        "question": "What does the expression `T extends infer U ? U : never` achieve in TypeScript?",
        "options": [
          "Always evaluates to never",
          "Uses the 'infer' keyword inside a conditional type to extract and bind an unknown subtype variable",
          "Triggers a compiler loop that throws an out-of-memory error",
          "Converts an asynchronous Promise into a synchronous value"
        ],
        "correctIndex": 1,
        "explanation": "The 'infer' keyword allows introducing a type variable within the true branch of a conditional type to deduce nested types."
      },
      {
        "id": "ts-h2",
        "skill": "typescript",
        "difficulty": "hard",
        "topic": "const-assertions",
        "question": "What is the primary effect of applying `as const` to an object literal in TypeScript?",
        "options": [
          "It seals the object using Object.freeze() at runtime",
          "It narrows all primitive properties to readonly literal types and arrays to readonly tuples",
          "It marks the object as eligible for garbage collection",
          "It prevents other files from importing the object"
        ],
        "correctIndex": 1,
        "explanation": "'as const' narrows types to their exact literal values (e.g. 'admin' instead of string) and marks all properties as readonly."
      }
    ]
  },

  "mongodb": {
    "easy": [
      {
        "id": "mongo-e1",
        "skill": "mongodb",
        "difficulty": "easy",
        "topic": "data-format",
        "question": "In what binary representation format does MongoDB store documents on disk?",
        "options": ["Plaintext JSON", "XML", "BSON (Binary JSON)", "YAML"],
        "correctIndex": 2,
        "explanation": "MongoDB stores documents in BSON, a binary-encoded serialization of JSON that supports additional data types like ObjectId and Date."
      },
      {
        "id": "mongo-e2",
        "skill": "mongodb",
        "difficulty": "easy",
        "topic": "crud-basics",
        "question": "Which MongoDB operator is used to modify specific field values without replacing the entire document?",
        "options": ["$push", "$set", "$inc", "$replace"],
        "correctIndex": 1,
        "explanation": "$set updates the value of the specified field without overwriting the rest of the document."
      }
    ],
    "medium": [
      {
        "id": "mongo-m1",
        "skill": "mongodb",
        "difficulty": "medium",
        "topic": "aggregation-pipeline",
        "question": "In a MongoDB aggregation pipeline, which stage is used to filter documents before grouping or projecting?",
        "options": ["$project", "$match", "$group", "$filter"],
        "correctIndex": 1,
        "explanation": "$match acts as an early query filter in the pipeline, utilizing indexes when placed at the very start."
      },
      {
        "id": "mongo-m2",
        "skill": "mongodb",
        "difficulty": "medium",
        "topic": "indexing",
        "question": "What is a Compound Index in MongoDB?",
        "options": [
          "An index created across multiple replica set nodes",
          "An index where a single index structure holds references to multiple fields in a collection",
          "An index that automatically encrypts document passwords",
          "An index stored in RAM rather than on NVMe storage"
        ],
        "correctIndex": 1,
        "explanation": "Compound indexes index multiple fields together, and can satisfy queries matching prefixes of the indexed field list."
      }
    ],
    "hard": [
      {
        "id": "mongo-h1",
        "skill": "mongodb",
        "difficulty": "hard",
        "topic": "replica-sets-transactions",
        "question": "What is required in MongoDB to execute Multi-Document ACID Transactions?",
        "options": [
          "A standalone instance without replica sets",
          "MongoDB WiredTiger engine deployed on a Replica Set or Sharded Cluster",
          "Disabling journaling to allow in-memory writes",
          "Setting readPreference to 'secondaryPreferred'"
        ],
        "correctIndex": 1,
        "explanation": "Multi-document transactions in MongoDB require a Replica Set (since v4.0) or Sharded Cluster (since v4.2) using the WiredTiger storage engine."
      }
    ]
  },

  "docker": {
    "easy": [
      {
        "id": "docker-e1",
        "skill": "docker",
        "difficulty": "easy",
        "topic": "container-basics",
        "question": "What is the primary difference between a Docker Image and a Docker Container?",
        "options": [
          "An image is a running instance; a container is a static template",
          "An image is a read-only blueprint; a container is a runnable, isolated instance with a read-write layer",
          "Containers are written in Python; images are written in Go",
          "There is no difference; they are identical terms"
        ],
        "correctIndex": 1,
        "explanation": "An image is an immutable template containing application code and runtime dependencies, while a container is an isolated execution instance."
      },
      {
        "id": "docker-e2",
        "skill": "docker",
        "difficulty": "easy",
        "topic": "dockerfile-directives",
        "question": "In a Dockerfile, what is the key difference between RUN and CMD?",
        "options": [
          "RUN executes at container startup; CMD executes during image build",
          "RUN executes commands during the image build process and commits a layer; CMD provides default commands when the container starts",
          "RUN is for Linux containers; CMD is for Windows containers",
          "RUN can only execute echo commands"
        ],
        "correctIndex": 1,
        "explanation": "RUN builds image layers by executing commands during build time; CMD specifies default startup behavior when launching a container."
      }
    ],
    "medium": [
      {
        "id": "docker-m1",
        "skill": "docker",
        "difficulty": "medium",
        "topic": "multi-stage-builds",
        "question": "What is the primary architectural purpose of Multi-Stage Builds in Docker?",
        "options": [
          "To allow containers to run across multiple physical machines simultaneously",
          "To drastically minimize final image size by separating build tools/compilers from the lean runtime image",
          "To speed up container network throughput by duplicating layers",
          "To automatically publish images to Docker Hub"
        ],
        "correctIndex": 1,
        "explanation": "Multi-stage builds allow compiling in an intermediate stage and copying only the final artifact into a slim production base image."
      },
      {
        "id": "docker-m2",
        "skill": "docker",
        "difficulty": "medium",
        "topic": "volume-persistence",
        "question": "How do Named Docker Volumes achieve data persistence?",
        "options": [
          "By syncing all data to cloud storage every hour",
          "By storing data in the container's ephemeral read-write layer",
          "By managing a dedicated host filesystem directory outside the container's copy-on-write lifecycle",
          "By committing container state to a Git repository"
        ],
        "correctIndex": 2,
        "explanation": "Volumes bypass the Union File System and store persistent data directly in Docker-managed storage on the host filesystem."
      }
    ],
    "hard": [
      {
        "id": "docker-h1",
        "skill": "docker",
        "difficulty": "hard",
        "topic": "networking-isolation",
        "question": "What occurs when two Docker containers are connected to the same user-defined bridge network?",
        "options": [
          "They cannot communicate without exposing ports to the public internet",
          "They can resolve each other by container name via Docker's embedded DNS server without host port mapping",
          "They share the exact same filesystem and environment variables",
          "Their CPU allocations are divided equally by the kernel"
        ],
        "correctIndex": 1,
        "explanation": "User-defined bridge networks provide automatic internal DNS resolution between containers by container name."
      }
    ]
  },

  "git": {
    "easy": [
      {
        "id": "git-e1",
        "skill": "git",
        "difficulty": "easy",
        "topic": "staging-commit",
        "question": "What does the command `git add .` do in a local repository?",
        "options": [
          "Pushes commits directly to the remote main branch",
          "Stages all modified and new untracked files in the current directory into the index",
          "Deletes all uncommitted changes permanently",
          "Creates a new Git branch"
        ],
        "correctIndex": 1,
        "explanation": "`git add .` moves modified and new untracked files from the working directory into the staging area (index)."
      },
      {
        "id": "git-e2",
        "skill": "git",
        "difficulty": "easy",
        "topic": "branching",
        "question": "Which command creates a new branch named 'feature-auth' and switches to it in a single step?",
        "options": [
          "git branch feature-auth",
          "git checkout -b feature-auth (or git switch -c feature-auth)",
          "git merge feature-auth",
          "git commit -b feature-auth"
        ],
        "correctIndex": 1,
        "explanation": "`git checkout -b` or modern `git switch -c` creates the specified branch and immediately checks it out."
      }
    ],
    "medium": [
      {
        "id": "git-m1",
        "skill": "git",
        "difficulty": "medium",
        "topic": "rebase-vs-merge",
        "question": "What is the primary difference between `git merge` and `git rebase`?",
        "options": [
          "Merge creates a merge commit preserving historical topology; rebase rewrites history by replaying commits onto the base branch",
          "Rebase can only be used on remote repositories; merge is only local",
          "Merge deletes the source branch; rebase keeps it active",
          "Rebase resolves all conflicts automatically without human intervention"
        ],
        "correctIndex": 0,
        "explanation": "Merge preserves history with a 2-parent merge commit; rebase creates a linear history by replaying commits on top of another branch."
      },
      {
        "id": "git-m2",
        "skill": "git",
        "difficulty": "medium",
        "topic": "cherry-pick",
        "question": "What is the function of the `git cherry-pick <commit-hash>` command?",
        "options": [
          "Deletes the specified commit from history",
          "Applies the changes from an existing specific commit onto the current HEAD as a new commit",
          "Pushes the specified commit directly to production",
          "Reverts the working directory to the initial commit"
        ],
        "correctIndex": 1,
        "explanation": "Cherry-pick enables grabbing an isolated commit from another branch and applying its exact diff to the active branch."
      }
    ],
    "hard": [
      {
        "id": "git-h1",
        "skill": "git",
        "difficulty": "hard",
        "topic": "detached-head-reflog",
        "question": "A developer accidentally ran `git reset --hard HEAD~3` and lost recent commits. How can these commits be recovered?",
        "options": [
          "They are permanently lost and cannot be retrieved",
          "Using `git reflog` to locate the previous commit SHA and checking it out or creating a branch from it",
          "By cloning the repository into another folder",
          "By restarting the terminal"
        ],
        "correctIndex": 1,
        "explanation": "Git's Reference Log (`git reflog`) tracks every HEAD update locally for ~30-90 days, allowing recovery of abandoned commits."
      }
    ]
  },

  "aws": {
    "easy": [
      {
        "id": "aws-e1",
        "skill": "aws",
        "difficulty": "easy",
        "topic": "core-services",
        "question": "Which AWS compute service provides serverless, event-driven code execution without provisioning servers?",
        "options": ["Amazon EC2", "AWS Lambda", "Amazon ECS", "AWS Elastic Beanstalk"],
        "correctIndex": 1,
        "explanation": "AWS Lambda runs code automatically in response to triggers and events, scaling dynamically without managing servers."
      },
      {
        "id": "aws-e2",
        "skill": "aws",
        "difficulty": "easy",
        "topic": "storage",
        "question": "What is the primary use case for Amazon Simple Storage Service (Amazon S3)?",
        "options": [
          "Relational database storage requiring ACID joins",
          "Scalable object storage for files, backups, static websites, and media assets",
          "In-memory caching for sub-millisecond key-value lookups",
          "Domain Name System (DNS) routing"
        ],
        "correctIndex": 1,
        "explanation": "Amazon S3 provides 99.999999999% (11 9s) of durability for object storage."
      }
    ],
    "medium": [
      {
        "id": "aws-m1",
        "skill": "aws",
        "difficulty": "medium",
        "topic": "iam-security",
        "question": "According to the AWS Well-Architected Framework, what is the Principle of Least Privilege in IAM?",
        "options": [
          "Granting AdministratorAccess to all developers for maximum agility",
          "Granting only the bare minimum permissions necessary to perform specific intended tasks",
          "Storing root account access keys in local .env files",
          "Disabling Multi-Factor Authentication (MFA) on production accounts"
        ],
        "correctIndex": 1,
        "explanation": "Least privilege mandates giving identities only the precise actions and resources needed for their specific responsibilities."
      },
      {
        "id": "aws-m2",
        "skill": "aws",
        "difficulty": "medium",
        "topic": "networking-vpc",
        "question": "What is the fundamental difference between an AWS Security Group and a Network ACL (NACL)?",
        "options": [
          "Security Groups are stateless at subnet level; NACLs are stateful at instance level",
          "Security Groups are stateful firewalls at the instance/ENI level; NACLs are stateless firewalls at the subnet level",
          "Security Groups only block outgoing traffic; NACLs only allow incoming traffic",
          "NACLs require third-party licensing"
        ],
        "correctIndex": 1,
        "explanation": "Security Groups operate statefully at the network interface level, while NACLs evaluate ordered stateless rules at the subnet boundary."
      }
    ],
    "hard": [
      {
        "id": "aws-h1",
        "skill": "aws",
        "difficulty": "hard",
        "topic": "architecture-resilience",
        "question": "When designing a Multi-AZ fault-tolerant architecture on AWS, what happens if an entire Availability Zone experiences an outage?",
        "options": [
          "All resources in the entire AWS Region terminate immediately",
          "Traffic is automatically routed to healthy instances in remaining AZs via an Application Load Balancer with zero regional downtime",
          "Data in S3 buckets in that region is permanently deleted",
          "IAM credentials expire automatically"
        ],
        "correctIndex": 1,
        "explanation": "Well-architected Multi-AZ deployments use Application Load Balancers and auto-scaling groups across at least 2-3 isolated AZs."
      }
    ]
  },

  "postgresql": {
    "easy": [
      {
        "id": "pg-e1",
        "skill": "postgresql",
        "difficulty": "easy",
        "topic": "acid-transactions",
        "question": "What does the 'A' represent in the ACID database transaction guarantee?",
        "options": ["Availability", "Atomicity (all operations succeed or all are rolled back)", "Asynchronous", "Association"],
        "correctIndex": 1,
        "explanation": "Atomicity ensures that all statements within a transaction block complete successfully, or the entire transaction is rolled back."
      },
      {
        "id": "pg-e2",
        "skill": "postgresql",
        "difficulty": "easy",
        "topic": "constraints",
        "question": "Which SQL constraint ensures that all values in a column are distinct across all rows?",
        "options": ["NOT NULL", "CHECK", "UNIQUE", "FOREIGN KEY"],
        "correctIndex": 2,
        "explanation": "The UNIQUE constraint prevents duplicate entries in the specified column or group of columns."
      }
    ],
    "medium": [
      {
        "id": "pg-m1",
        "skill": "postgresql",
        "difficulty": "medium",
        "topic": "explain-analyze",
        "question": "What is the difference between `EXPLAIN` and `EXPLAIN ANALYZE` in PostgreSQL?",
        "options": [
          "`EXPLAIN` executes the query; `EXPLAIN ANALYZE` only estimates costs",
          "`EXPLAIN` only prints the planner's estimated cost without running the query; `EXPLAIN ANALYZE` actually executes the query to measure real runtime and row counts",
          "`EXPLAIN ANALYZE` rewrites the query into stored procedures",
          "There is no difference"
        ],
        "correctIndex": 1,
        "explanation": "`EXPLAIN ANALYZE` executes the statement to report true elapsed execution times and actual buffer counts alongside planner estimates."
      },
      {
        "id": "pg-m2",
        "skill": "postgresql",
        "difficulty": "medium",
        "topic": "jsonb-data-type",
        "question": "Why is the `JSONB` data type preferred over `JSON` for most workloads in PostgreSQL?",
        "options": [
          "JSONB only supports uppercase keys",
          "JSONB stores data in a decomposed binary format that supports indexing (GIN/BTREE) and faster lookups",
          "JSONB compresses data into base64 strings",
          "JSONB cannot be queried with standard SQL"
        ],
        "correctIndex": 1,
        "explanation": "JSONB parses and stores data in binary format, allowing fast indexing via GIN indexes and efficient operators like `@>`."
      }
    ],
    "hard": [
      {
        "id": "pg-h1",
        "skill": "postgresql",
        "difficulty": "hard",
        "topic": "concurrency-mvcc",
        "question": "How does PostgreSQL's Multi-Version Concurrency Control (MVCC) enable high concurrent read/write throughput?",
        "options": [
          "By acquiring table-level exclusive locks on every SELECT query",
          "By maintaining multiple physical versions of rows so readers do not block writers and writers do not block readers",
          "By storing all write operations in temporary flat files until midnight",
          "By forcing all database clients onto a single thread"
        ],
        "correctIndex": 1,
        "explanation": "MVCC creates new row versions (tuples) with xmin/xmax transaction visibility IDs, ensuring reading and writing transactions never lock each other out."
      }
    ]
  },

  "express.js": {
    "easy": [
      {
        "id": "exp-e1",
        "skill": "express.js",
        "difficulty": "easy",
        "topic": "middleware-basics",
        "question": "What must middleware functions in Express.js call to pass control to the subsequent middleware in the stack?",
        "options": ["next()", "continue()", "res.send()", "return true"],
        "correctIndex": 0,
        "explanation": "Calling `next()` passes execution control to the next registered middleware in the request-response lifecycle."
      },
      {
        "id": "exp-e2",
        "skill": "express.js",
        "difficulty": "easy",
        "topic": "routing",
        "question": "In Express.js, how do you access URL route parameters defined as `/users/:id`?",
        "options": ["req.body.id", "req.params.id", "req.query.id", "req.headers.id"],
        "correctIndex": 1,
        "explanation": "Route path parameters mapped with colons are populated into the `req.params` dictionary object."
      }
    ],
    "medium": [
      {
        "id": "exp-m1",
        "skill": "express.js",
        "difficulty": "medium",
        "topic": "error-handling-middleware",
        "question": "What specific signature must an Express.js error-handling middleware have to be recognized by Express?",
        "options": [
          "function(req, res, next)",
          "function(err, req, res, next) with exactly 4 parameters",
          "function(err, res)",
          "function(error, status)"
        ],
        "correctIndex": 1,
        "explanation": "Express checks `fn.length === 4` (`err, req, res, next`) to identify error-handling middleware."
      }
    ],
    "hard": [
      {
        "id": "exp-h1",
        "skill": "express.js",
        "difficulty": "hard",
        "topic": "unhandled-async-rejections",
        "question": "In Express 4.x, what happens if an unhandled Promise rejection occurs inside an `async (req, res)` route handler without try/catch?",
        "options": [
          "Express catches it automatically and sends HTTP 500",
          "The request hangs indefinitely until client timeout and may crash the Node.js process with unhandledRejection",
          "Express restarts the operating system",
          "The route handler runs in a separate thread"
        ],
        "correctIndex": 1,
        "explanation": "Express 4 does not catch unhandled async promise rejections automatically; they must be wrapped with try/catch or forwarded to `next(err)`."
      }
    ]
  },

  "tailwind-css": {
    "easy": [
      {
        "id": "tw-e1",
        "skill": "tailwind-css",
        "difficulty": "easy",
        "topic": "utility-first",
        "question": "What is the core philosophy of Tailwind CSS?",
        "options": [
          "Providing pre-styled UI components like bootstrap modal and navbar",
          "Utility-first framework composed of atomic classes applied directly in HTML markup",
          "Writing raw CSS stylesheets in separate .css files only",
          "Generating inline style attributes dynamically at runtime"
        ],
        "correctIndex": 1,
        "explanation": "Tailwind provides low-level atomic utility classes that let you build bespoke designs directly in markup."
      },
      {
        "id": "tw-e2",
        "skill": "tailwind-css",
        "difficulty": "easy",
        "topic": "responsive-breakpoints",
        "question": "In Tailwind CSS, how do responsive prefixes like `md:` function?",
        "options": [
          "They only apply to screens smaller than medium width",
          "They apply styles using mobile-first min-width media queries (e.g. min-width: 768px)",
          "They only apply to tablets in landscape orientation",
          "They compile to separate mobile stylesheets"
        ],
        "correctIndex": 1,
        "explanation": "Tailwind uses mobile-first breakpoints where `md:flex` applies at and above the `md` viewport threshold."
      }
    ],
    "medium": [
      {
        "id": "tw-m1",
        "skill": "tailwind-css",
        "difficulty": "medium",
        "topic": "arbitrary-values",
        "question": "How do you specify an arbitrary custom pixel value in Tailwind CSS without modifying the config file?",
        "options": ["top-[17px]", "top:17px", "top-(17px)", "top{17px}"],
        "correctIndex": 0,
        "explanation": "Square bracket notation (e.g. `top-[17px]`, `bg-[#1da1f2]`) enables on-the-fly arbitrary values compiled by the JIT engine."
      }
    ],
    "hard": [
      {
        "id": "tw-h1",
        "skill": "tailwind-css",
        "difficulty": "hard",
        "topic": "jit-purging",
        "question": "Why is dynamic class construction like `text-${color}-500` discouraged in Tailwind CSS?",
        "options": [
          "Tailwind JIT scans source files for uninterrupted, complete class name strings using static regex analysis",
          "JavaScript strings cannot contain dashes",
          "Tailwind only supports black and white colors",
          "It causes runtime CSS parser crashes"
        ],
        "correctIndex": 0,
        "explanation": "Tailwind's compiler extracts complete string tokens statically; interpolated strings are not recognized and their CSS will not be generated."
      }
    ]
  },

  "next.js": {
    "easy": [
      {
        "id": "next-e1",
        "skill": "next.js",
        "difficulty": "easy",
        "topic": "app-router-components",
        "question": "In the Next.js App Router, what is the default rendering paradigm for components inside the `app/` directory?",
        "options": [
          "Client Components (rendered only in browser)",
          "React Server Components (RSC) rendered on the server with zero client bundle impact",
          "Static HTML exported to disk without hydration",
          "Web Workers"
        ],
        "correctIndex": 1,
        "explanation": "All components in the Next.js App Router are React Server Components by default unless explicitly marked with `'use client'`."
      }
    ],
    "medium": [
      {
        "id": "next-m1",
        "skill": "next.js",
        "difficulty": "medium",
        "topic": "use-client-directive",
        "question": "When must a component in the Next.js App Router include the `'use client'` directive?",
        "options": [
          "When it needs to import external NPM packages",
          "When it uses browser APIs, interactive event handlers (`onClick`), or React hooks (`useState`, `useEffect`)",
          "When it fetches data from an internal database",
          "When it renders an image tag"
        ],
        "correctIndex": 1,
        "explanation": "The `'use client'` directive defines the boundary where components require browser interaction, event listeners, or client-side hooks."
      }
    ],
    "hard": [
      {
        "id": "next-h1",
        "skill": "next.js",
        "difficulty": "hard",
        "topic": "incremental-static-regeneration",
        "question": "How does Incremental Static Regeneration (ISR) work in Next.js?",
        "options": [
          "It forces the entire site to rebuild on every user page load",
          "It serves cached static HTML while regenerating the page in the background after a specified revalidation window expires",
          "It converts all static pages into client-side single page apps",
          "It requires deploying to a physical server cluster"
        ],
        "correctIndex": 1,
        "explanation": "ISR updates static pages in the background as traffic arrives without needing to rebuild the entire application."
      }
    ]
  },

  "fastapi": {
    "easy": [
      {
        "id": "fast-e1",
        "skill": "fastapi",
        "difficulty": "easy",
        "topic": "pydantic-validation",
        "question": "What library does FastAPI leverage for data parsing, type validation, and schema definitions?",
        "options": ["Marshmallow", "Pydantic", "Cerberus", "Django Forms"],
        "correctIndex": 1,
        "explanation": "FastAPI uses Pydantic models for data validation, serialization, and automatic OpenAPI documentation generation."
      }
    ],
    "medium": [
      {
        "id": "fast-m1",
        "skill": "fastapi",
        "difficulty": "medium",
        "topic": "async-concurrency",
        "question": "In FastAPI, what is the best practice for defining endpoints that perform CPU-bound tasks vs async I/O?",
        "options": [
          "Always use `async def` for CPU-heavy mathematical computations",
          "Use `async def` for async I/O calls (e.g. async db/http) and standard `def` for blocking I/O or CPU operations so FastAPI offloads them to an external threadpool",
          "FastAPI does not support standard `def`",
          "CPU-bound tasks should be run inside WebSocket callbacks"
        ],
        "correctIndex": 1,
        "explanation": "Standard `def` endpoints are executed inside an external threadpool by Starlette so they do not block the main event loop."
      }
    ],
    "hard": [
      {
        "id": "fast-h1",
        "skill": "fastapi",
        "difficulty": "hard",
        "topic": "dependency-injection",
        "question": "What is the primary benefit of FastAPI's `Depends()` dependency injection system?",
        "options": [
          "It converts Python code into C++ binaries",
          "It manages shared logic, database sessions, authentication guards, and hierarchical dependency trees cleanly and testably",
          "It replaces pip package manager",
          "It prevents all runtime exceptions"
        ],
        "correctIndex": 1,
        "explanation": "`Depends` allows modular sharing of database sessions, security scopes, and business dependencies with automatic parameter resolution."
      }
    ]
  },

  "linux": {
    "easy": [
      {
        "id": "linux-e1",
        "skill": "linux",
        "difficulty": "easy",
        "topic": "file-permissions",
        "question": "What permissions does `chmod 755 filename` grant in Linux?",
        "options": [
          "Read/Write/Execute for Owner; Read/Execute for Group and Others",
          "Full access for everyone",
          "Read-only for Owner and Group",
          "No permissions for anyone"
        ],
        "correctIndex": 0,
        "explanation": "7 (rwx) for owner, 5 (r-x) for group, 5 (r-x) for others."
      }
    ],
    "medium": [
      {
        "id": "linux-m1",
        "skill": "linux",
        "difficulty": "medium",
        "topic": "process-management",
        "question": "Which Linux command sends a termination signal (SIGTERM) gracefully to a process by ID?",
        "options": ["kill -9 <pid>", "kill -15 <pid> (or kill <pid>)", "stop <pid>", "pause <pid>"],
        "correctIndex": 1,
        "explanation": "`kill <pid>` sends SIGTERM (15) by default, giving the process an opportunity to clean up resources, unlike SIGKILL (9)."
      }
    ],
    "hard": [
      {
        "id": "linux-h1",
        "skill": "linux",
        "difficulty": "hard",
        "topic": "systemd-services",
        "question": "What is the difference between `systemctl stop <service>` and `systemctl disable <service>`?",
        "options": [
          "`stop` halts the running process immediately; `disable` prevents the service from starting automatically upon system boot",
          "`disable` deletes the service binary from the filesystem",
          "`stop` is only for container processes",
          "There is no difference"
        ],
        "correctIndex": 0,
        "explanation": "`stop` halts the active process runtime; `disable` removes the symlinks in `/etc/systemd/system/` so it doesn't launch at boot."
      }
    ]
  },

  "rest-apis": {
    "easy": [
      {
        "id": "rest-e1",
        "skill": "rest-apis",
        "difficulty": "easy",
        "topic": "http-methods",
        "question": "Which HTTP method is intended to be idempotent and used for full resource updates?",
        "options": ["POST", "PUT", "PATCH", "CONNECT"],
        "correctIndex": 1,
        "explanation": "PUT is idempotent: making the same PUT request multiple times produces the exact same resource state as making it once."
      }
    ],
    "medium": [
      {
        "id": "rest-m1",
        "skill": "rest-apis",
        "difficulty": "medium",
        "topic": "status-codes",
        "question": "What HTTP status code should be returned when an authentication token is valid, but the user lacks permissions for that resource?",
        "options": ["401 Unauthorized", "403 Forbidden", "404 Not Found", "400 Bad Request"],
        "correctIndex": 1,
        "explanation": "401 indicates missing or invalid authentication credentials; 403 Forbidden indicates the server understands who you are but denies access."
      }
    ],
    "hard": [
      {
        "id": "rest-h1",
        "skill": "rest-apis",
        "difficulty": "hard",
        "topic": "hateoas-maturity",
        "question": "What does Level 3 of the Richardson Maturity Model introduce to REST API architecture?",
        "options": [
          "HTTP basic authentication",
          "Hypermedia Controls (HATEOAS), where responses include navigational links dynamically driving client interactions",
          "GraphQL integration",
          "Binary gRPC protocol buffers"
        ],
        "correctIndex": 1,
        "explanation": "Level 3 introduces Hypermedia as the Engine of Application State (HATEOAS), allowing clients to discover valid next actions via links."
      }
    ]
  },

  "redis": {
    "easy": [
      {
        "id": "redis-e1",
        "skill": "redis",
        "difficulty": "easy",
        "topic": "data-structures",
        "question": "What is Redis primarily classified as?",
        "options": [
          "A relational database with foreign key cascades",
          "An in-memory, key-value data structure store used as a database, cache, and message broker",
          "A client-side styling engine",
          "A file compression utility"
        ],
        "correctIndex": 1,
        "explanation": "Redis stores all working data in RAM, delivering microsecond responses for strings, hashes, lists, sets, and sorted sets."
      }
    ],
    "medium": [
      {
        "id": "redis-m1",
        "skill": "redis",
        "difficulty": "medium",
        "topic": "persistence",
        "question": "What are the two primary persistence mechanisms in Redis?",
        "options": [
          "XML and CSV",
          "RDB (point-in-time snapshots) and AOF (Append-Only File log of write commands)",
          "Git commits and Docker volumes",
          "SQLite replication"
        ],
        "correctIndex": 1,
        "explanation": "RDB creates compact point-in-time snapshots on disk; AOF logs every write operation received by the server for near-zero data loss."
      }
    ],
    "hard": [
      {
        "id": "redis-h1",
        "skill": "redis",
        "difficulty": "hard",
        "topic": "eviction-policies",
        "question": "When Redis reaches its `maxmemory` threshold, which eviction policy removes keys with the least recent usage among those with an expiration TTL set?",
        "options": ["allkeys-lru", "volatile-lru", "noeviction", "volatile-random"],
        "correctIndex": 1,
        "explanation": "`volatile-lru` evicts the least recently used keys out of the keys that have an expire set, preserving non-expiring data."
      }
    ]
  },

  "kubernetes": {
    "easy": [
      {
        "id": "k8s-e1",
        "skill": "kubernetes",
        "difficulty": "easy",
        "topic": "pods-basics",
        "question": "What is the smallest deployable computing unit in Kubernetes?",
        "options": ["Container", "Pod (one or more containers sharing storage and network)", "Node", "Cluster"],
        "correctIndex": 1,
        "explanation": "A Pod encapsulates one or more co-located containers that share storage resources, a single IP address, and localhost networking."
      }
    ],
    "medium": [
      {
        "id": "k8s-m1",
        "skill": "kubernetes",
        "difficulty": "medium",
        "topic": "deployments-replicasets",
        "question": "What Kubernetes resource controller manages declarative updates and rolling updates for Pods?",
        "options": ["DaemonSet", "Deployment", "StatefulSet", "ConfigMap"],
        "correctIndex": 1,
        "explanation": "A Deployment provides declarative updates for Pods and ReplicaSets, orchestrating zero-downtime rolling updates."
      }
    ],
    "hard": [
      {
        "id": "k8s-h1",
        "skill": "kubernetes",
        "difficulty": "hard",
        "topic": "service-networking",
        "question": "What is the difference between a ClusterIP and a NodePort Service in Kubernetes?",
        "options": [
          "ClusterIP exposes the Service on a cluster-internal IP; NodePort opens a dedicated high-range port across every worker node",
          "ClusterIP is for external internet traffic; NodePort is for internal pods only",
          "NodePort requires creating an AWS route table entry",
          "ClusterIP only works with single-container pods"
        ],
        "correctIndex": 0,
        "explanation": "ClusterIP is the default internal-only service; NodePort exposes the service on each Node's IP at a static port (typically 30000-32767)."
      }
    ]
  },
  "technical-seo": {
    "easy": [
      {
        "id": "tseo-e1",
        "skill": "technical-seo",
        "difficulty": "easy",
        "topic": "core-web-vitals",
        "question": "Which Core Web Vital metric measures visual stability and prevents unexpected shifts during page load?",
        "options": [
          "Largest Contentful Paint (LCP)",
          "Cumulative Layout Shift (CLS)",
          "Interaction to Next Paint (INP)",
          "First Input Delay (FID)"
        ],
        "correctIndex": 1,
        "explanation": "CLS (Cumulative Layout Shift) measures visual stability by tracking sudden layout shifts of DOM elements while resources load."
      }
    ],
    "medium": [
      {
        "id": "tseo-m1",
        "skill": "technical-seo",
        "difficulty": "medium",
        "topic": "canonicalization",
        "question": "What is the primary architectural purpose of an HTML <link rel='canonical'> tag?",
        "options": [
          "Accelerates DNS resolution for external third-party CDNs",
          "Explicitly signals the authoritative master URL to search engines to consolidate duplicate page equity",
          "Instructs search engine bots never to index the target URL",
          "Compresses the DOM payload for mobile devices"
        ],
        "correctIndex": 1,
        "explanation": "rel='canonical' specifies the master version of duplicate or near-duplicate web pages, preventing duplicate content dilution in search indexes."
      }
    ],
    "hard": [
      {
        "id": "tseo-h1",
        "skill": "technical-seo",
        "difficulty": "hard",
        "topic": "crawl-budget",
        "question": "When managing crawl budget on large e-commerce platforms with millions of faceted filter URLs, which method is most effective?",
        "options": [
          "Allowing all URLs and letting search engines figure it out automatically",
          "Restricting search bots via robots.txt Disallow on dynamic query parameters and applying canonical tags or noindex",
          "Converting all query parameters to URL fragments (#)",
          "Removing all sitemaps from the web root"
        ],
        "correctIndex": 1,
        "explanation": "Using robots.txt rules for faceted search parameters combined with canonical tags prevents search crawlers from wasting crawl budget on infinite permutation traps."
      }
    ]
  },
  "aeo": {
    "easy": [
      {
        "id": "aeo-e1",
        "skill": "aeo",
        "difficulty": "easy",
        "topic": "llms-txt-standard",
        "question": "What is the role of the emerging /llms.txt standard on modern websites?",
        "options": [
          "It blocks all generative AI crawlers from scraping web content",
          "It serves a clean, token-efficient, markdown-first summary of the site designed specifically for LLMs and AI search engines",
          "It trains a custom LLM directly in the user's browser via WebAssembly",
          "It encrypts the website's HTML against AI scraper bots"
        ],
        "correctIndex": 1,
        "explanation": "/llms.txt provides a lightweight, markdown-formatted directory and summary of high-value site documentation optimized for LLM context windows."
      }
    ],
    "medium": [
      {
        "id": "aeo-m1",
        "skill": "aeo",
        "difficulty": "medium",
        "topic": "answer-engine-vs-seo",
        "question": "How does Answer Engine Optimization (AEO) differ fundamentally from traditional keyword SEO?",
        "options": [
          "AEO focuses strictly on pay-per-click ad spending",
          "AEO optimizes content structure and entity clarity so AI systems synthesize direct answers with citations, rather than relying solely on SERP rank",
          "AEO works exclusively on mobile voice assistants without web crawlers",
          "AEO requires eliminating all schema markup from web pages"
        ],
        "correctIndex": 1,
        "explanation": "AEO aims for entity synthesis and inclusion in AI answer generation (Perplexity, ChatGPT Search, Claude), prioritizing direct informational value over raw keyword stuffing."
      }
    ],
    "hard": [
      {
        "id": "aeo-h1",
        "skill": "aeo",
        "difficulty": "hard",
        "topic": "information-gain",
        "question": "Which content strategy provides the highest citation frequency in generative answer engines?",
        "options": [
          "Regurgitating existing competitor blog articles with minor wording changes",
          "Publishing unique primary research, structured Schema.org graphs, and high Information Gain content with verified citations",
          "Hiding keyword lists in CSS display:none elements",
          "Targeting only exact-match long-tail keyword strings"
        ],
        "correctIndex": 1,
        "explanation": "AI models prioritize high Information Gain—novel data, verifiable empirical claims, clear entity schemas, and primary source citations—over commoditized duplicate copy."
      }
    ]
  },
  "baidu-seo": {
    "easy": [
      {
        "id": "bseo-e1",
        "skill": "baidu-seo",
        "difficulty": "easy",
        "topic": "icp-license",
        "question": "What legal/administrative requirement is mandatory to host a website on servers in mainland China for optimal Baidu indexing?",
        "options": [
          "SSL EV Certificate",
          "ICP License / Filing (ICP备案)",
          "China Trademark Registration only",
          "Baidu Paid Advertising Contract"
        ],
        "correctIndex": 1,
        "explanation": "An ICP filing (ICP备案) issued by the Ministry of Industry and Information Technology (MIIT) is legally required for hosting websites within mainland China."
      }
    ],
    "medium": [
      {
        "id": "bseo-m1",
        "skill": "baidu-seo",
        "difficulty": "medium",
        "topic": "crawler-rendering",
        "question": "How does the Baiduspider crawler historically behave when handling client-side single page applications (SPAs)?",
        "options": [
          "It executes complex client-side JavaScript flawlessly like a full headless Chromium browser",
          "It struggles to execute client-side JavaScript reliably, making Server-Side Rendering (SSR) or pre-rendered HTML essential",
          "It converts all JavaScript bundles into native WebAssembly bytecode",
          "It only indexes pages written in Flash"
        ],
        "correctIndex": 1,
        "explanation": "Baiduspider has limited JavaScript execution compared to Googlebot. Serving pre-rendered HTML or using SSR is critical for robust indexation in Baidu."
      }
    ],
    "hard": [
      {
        "id": "bseo-h1",
        "skill": "baidu-seo",
        "difficulty": "hard",
        "topic": "chinese-segmentation",
        "question": "Why is Chinese word segmentation (分词, Fencí) essential when optimizing page copy for Baidu search?",
        "options": [
          "Chinese has no spaces between words; Baidu uses algorithmic dictionaries and segmentation to understand multi-character search intent",
          "Baidu translates all queries into English before querying its index",
          "It converts Simplified Chinese to Traditional Chinese automatically",
          "It prevents UTF-8 encoding errors on Apache servers"
        ],
        "correctIndex": 0,
        "explanation": "Because Chinese text is written continuously without spaces, Baidu relies on word segmentation (分词) algorithms. Structuring keywords to match natural compound terms is crucial."
      }
    ]
  }
};

module.exports = ADDITIONAL_QUIZ_QUESTIONS;
