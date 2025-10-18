# ReScript + Convex Agents Integration Guide

## Overview

Building agents with ReScript v12 RC and Convex backend integration for reactive, type-safe agent systems.

## Tech Stack

- **ReScript v12 RC** with @rescript/react, Core and JSX v4
- **Convex.dev** for backend/database
- **Vite 6** with React Plugin (Fast Refresh)
- **ES6 modules** (compiled to `.res.mjs` files)
- **Tailwind 4** for styling
- **shadcn/ui** for UI components

## Convex + ReScript Integration

### File Structure for Convex

Place ReScript files in the convex folder using double dots to ignore them:
```
/convex/hello..res       # ReScript source (ignored by Convex)
/convex/hello..res.js    # Compiled output (processed by Convex)
```

### Type-Safe Hooks Bindings

#### useMutation Binding

```rescript
module Mutation_insertAgent = {
  @module("@packages/backend/convex/_generated/api")
  external api: 'api = "api"
  
  type input = {
    name: string,
    role: string,
    capabilities: array<string>
  }
  
  type t = input => Promise.t<unit>
  
  @module("convex/react") 
  external useMutation: string => t = "useMutation"
}

// Usage in component
let mutation_insertAgent = Mutation_insertAgent.useMutation(
  Mutation_insertAgent.api["agents"]["create"]
)

try {
  await mutation_insertAgent({
    name: "Assistant",
    role: "helper",
    capabilities: ["chat", "analyze"]
  })
} catch {
  | Exn.Error(err) => {
    Console.log2("Failed to create agent:", err)
  }
}
```

#### useQuery Binding with Skip Pattern

```rescript
module Query_getAgent = {
  @module("@packages/backend/convex/_generated/api")
  external api: 'api = "api"
  
  type input_ = { agentId: string }
  @unboxed type input = Input(input_) | Skip(string)
  
  type agent = {
    id: string,
    name: string,
    role: string,
    capabilities: array<string>,
    createdAt: float
  }
  
  @module("convex/react") 
  external useQuery: (string, input) => option<agent> = "useQuery"
}

// Usage with conditional query
let agent = Query_getAgent.useQuery(
  Query_getAgent.api["agents"]["getById"], 
  if agentId === "" { 
    Skip("skip") 
  } else { 
    Input({agentId: agentId})
  }
)
```

## Agent System Architecture

### Core Agent Types

```rescript
type agentCapability = 
  | Chat
  | ImageGeneration
  | CodeExecution
  | DataAnalysis
  | WebSearch

type agentStatus = 
  | Idle
  | Processing
  | Completed
  | Failed(string)

type agent = {
  id: string,
  name: string,
  description: string,
  capabilities: array<agentCapability>,
  status: agentStatus,
  context: option<JSON.t>,
}

type agentMessage = {
  agentId: string,
  content: string,
  timestamp: float,
  metadata: option<JSON.t>,
}
```

### Agent Manager Component

```rescript
@react.component
let make = () => {
  // Query all agents
  let agents = Query_listAgents.useQuery(
    Query_listAgents.api["agents"]["list"], 
    Input()
  )
  
  // Mutation for agent actions
  let executeAgent = Mutation_executeAgent.useMutation(
    Mutation_executeAgent.api["agents"]["execute"]
  )
  
  let handleAgentExecution = async (agentId, task) => {
    try {
      await executeAgent({
        agentId: agentId,
        task: task,
        parameters: Dict.fromArray([])
      })
    } catch {
      | Exn.Error(err) => {
        Console.error2("Agent execution failed:", err)
      }
    }
  }
  
  <div className="agent-manager">
    {switch agents {
    | None => <div> {React.string("Loading agents...")} </div>
    | Some(agentList) =>
      agentList
      ->Array.map(agent =>
        <AgentCard 
          key={agent.id} 
          agent 
          onExecute={task => handleAgentExecution(agent.id, task)}
        />
      )
      ->React.array
    }}
  </div>
}
```

## VSCode Snippets

Add to `.vscode/settings.json`:

```json
{
  "usemut": {
    "prefix": "usemut",
    "body": [
      "module Mutation_$1 = {",
      "  @module(\"@packages/backend/convex/_generated/api\")",
      "  external api: 'api = \"api\"",
      "  type input = { $2: $3 }",
      "  type t = input => Promise.t<unit>",
      "  @module(\"convex/react\")",
      "  external useMutation: string => t = \"useMutation\"",
      "}",
      "",
      "let mutation_$1 = Mutation_$1.useMutation(",
      "  Mutation_$1.api[\"$4\"][\"$1\"]",
      ")",
      "",
      "try {",
      "  await mutation_$1({ $2: $5 })",
      "} catch {",
      "  | Exn.Error(err) => {",
      "    Console.log2(\"Mutation failed:\", err)",
      "  }",
      "}"
    ]
  },
  "usequery": {
    "prefix": "usequery",
    "body": [
      "module Query_$1 = {",
      "  @module(\"@packages/backend/convex/_generated/api\")",
      "  external api: 'api = \"api\"",
      "  type input_ = { $2: string }",
      "  @unboxed type input = Input(input_) | Skip(string)",
      "  type output = $3",
      "  @module(\"convex/react\")",
      "  external useQuery: (string, input) => option<output> = \"useQuery\"",
      "}",
      "",
      "let response_$1 = Query_$1.useQuery(",
      "  Query_$1.api[\"$4\"][\"$1\"],",
      "  if $2 === \"\" { Skip(\"skip\") } else { Input({$2: $2}) }",
      ")"
    ]
  }
}
```

## Shadcn/ui Integration

### Installation

1. Initialize shadcn/ui:
```sh
bunx --bun shadcn@latest init
```

2. Add components:
```sh
bunx --bun shadcn@latest add button
bunx --bun shadcn@latest add card
bunx --bun shadcn@latest add dialog
```

### ReScript Bindings for Shadcn Components

#### Button Component Binding

Create `src/components/ui/ShadcnButton.res`:

```rescript
// ShadcnButton.res - ReScript binding for shadcn/ui Button component

module Button = {
  @react.component @module("./button")
  external make: (
    ~children: React.element,
    ~variant: [
      | #default
      | #destructive
      | #outline
      | #secondary
      | #ghost
      | #link
    ]=?,
    ~size: [#default | #sm | #lg | #icon]=?,
    ~asChild: bool=?,
    ~className: string=?,
    ~disabled: bool=?,
    ~onClick: ReactEvent.Mouse.t => promise<unit>=?,
    ~type_: [#button | #submit | #reset]=?,
  ) => React.element = "Button"
}
```

Create `src/components/ui/ShadcnButton.resi`:

```rescript
// ShadcnButton.resi - Interface file for Fast Refresh (Optional)
// Note: .resi files are not always necessary in ReScript v12 RC

module Button: {
  @react.component
  let make: (
    ~children: React.element,
    ~variant: [
      | #default
      | #destructive
      | #outline
      | #secondary
      | #ghost
      | #link
    ]=?,
    ~size: [#default | #sm | #lg | #icon]=?,
    ~asChild: bool=?,
    ~className: string=?,
    ~disabled: bool=?,
    ~onClick: ReactEvent.Mouse.t => promise<unit>=?,
    ~type_: [#button | #submit | #reset]=?,
  ) => React.element
}
```

#### Usage in ReScript Components

```rescript
// AgentCard.res
@react.component
let make = (~agent: agent, ~onExecute: string => unit) => {
  let handleClick = _ => {
    onExecute("start")
  }
  
  <div className="agent-card p-4 border rounded-lg">
    <h3 className="text-lg font-semibold">
      {React.string(agent.name)}
    </h3>
    <p className="text-sm text-gray-600 mb-4">
      {React.string(agent.description)}
    </p>
    <ShadcnButton.Button 
      variant=#default
      size=#sm
      onClick={handleClick}>
      {React.string("Execute Agent")}
    </ShadcnButton.Button>
  </div>
}
```

### Pattern for Other Shadcn Components

For each shadcn component, create a corresponding ReScript binding:

```rescript
// ShadcnCard.res
module Card = {
  @react.component @module("./card")
  external make: (
    ~children: React.element,
    ~className: string=?,
  ) => React.element = "Card"
}

module CardHeader = {
  @react.component @module("./card")
  external make: (
    ~children: React.element,
    ~className: string=?,
  ) => React.element = "CardHeader"
}

module CardTitle = {
  @react.component @module("./card")
  external make: (
    ~children: React.element,
    ~className: string=?,
  ) => React.element = "CardTitle"
}

module CardContent = {
  @react.component @module("./card")
  external make: (
    ~children: React.element,
    ~className: string=?,
  ) => React.element = "CardContent"
}
```

## Development Workflow

### Setup

1. Install dependencies:
```sh
bun install
```

2. Initialize shadcn/ui:
```sh
bunx --bun shadcn@latest init
```

3. Run ReScript compiler in watch mode:
```sh
bun run res:dev
```

4. Run Vite dev server (separate terminal):
```sh
bun run dev
```

5. Run Convex dev server (separate terminal):
```sh
bunx convex dev
```

### Best Practices

1. **Type Safety**: Always define input/output types for Convex functions
2. **Error Handling**: Use try/catch blocks for mutations with `Exn.Error`
3. **Skip Pattern**: Use the unboxed Skip pattern for conditional queries
4. **Interface Files**: Create `.resi` files for React components for Fast Refresh
5. **Track Compiled Output**: Keep `.res.mjs` files in git for transparency
6. **No Belt/Js modules**: Use Core library functions instead
7. **JSON Type**: Always use `JSON.t` instead of `Json.t`
8. **React Elements**: Use `React.string`, `React.int`, `React.float` for primitives
9. **Async/Await**: Prefer async/await over promise chaining
10. **useState**: Initialize with a function: `React.useState(() => initialValue)`

## Example: Multi-Agent Chat System

```rescript
// AgentChat.res
module AgentChat = {
  type message = {
    id: string,
    agentId: string,
    content: string,
    timestamp: float,
  }
  
  @react.component
  let make = (~agents: array<agent>) => {
    let (messages, setMessages) = React.useState(() => [])
    
    // Subscribe to messages
    let latestMessages = Query_subscribeMessages.useQuery(
      Query_subscribeMessages.api["messages"]["subscribe"],
      Input({limit: 100})
    )
    
    React.useEffect1(() => {
      switch latestMessages {
      | Some(msgs) => setMessages(_ => msgs)
      | None => ()
      }
      None
    }, [latestMessages])
    
    // Render chat interface
    <div className="agent-chat">
      {messages
        ->Array.map(msg => 
          <MessageBubble key={msg.id} message={msg} />
        )
        ->React.array}
    </div>
  }
}
```

## Common ReScript v12 RC Patterns

### String Interpolation
```rescript
// Use Int.toString, Float.toString for numbers in templates
let age = 42
let message = `Age: ${age->Int.toString}`
```

### React Children
```rescript
// Always use React.string for text
<div className="text-lg">
  {React.string("Hello World")}
</div>

// Arrays need React.array
{items->Array.map(item => <Item key={item.id} />)->React.array}
```

### Error Handling
```rescript
// Use Exn.Error instead of Js.Exn.Error
try {
  await someAsyncOperation()
} catch {
  | Exn.Error(err) => Console.error(err)
}
```

### useState Hook
```rescript
// Initialize with a function
let (count, setCount) = React.useState(() => 0)
```

### External Bindings with @send
```rescript
// No () needed when calling @send externals that return values
type t
@send external foo: t => string = "foo"
external obj: t = "someObject"

let result = obj->foo // No () needed!
```

## Resources

- [ReScript Documentation](https://rescript-lang.org)
- [Convex Documentation](https://docs.convex.dev)
- [ReScript + React](https://rescript-lang.org/docs/react/latest/introduction)
- [Convex React Hooks](https://docs.convex.dev/client/react)
- [Shadcn/ui Documentation](https://ui.shadcn.com)
EOF'
