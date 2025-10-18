# convex-rescript-codegen

Generate type-safe ReScript bindings from your Convex backend functions. This tool parses your Convex TypeScript code using the TypeScript AST and generates idiomatic ReScript modules with proper types and React hooks.

## ✨ Features

- 🎯 **Type-safe bindings** - Generates fully typed ReScript modules from Convex functions
- 🔄 **React hooks** - Ready-to-use `useQuery` and `useMutation` hooks
- 📦 **Schema support** - Parses Convex schema to generate document types
- 🔍 **AST-based parsing** - Uses TypeScript compiler API for accurate parsing
- ⚡ **Blazing fast** - Powered by Bun runtime (10x faster than Node.js)
- 👁️ **Watch mode** - Auto-regenerate on file changes with @parcel/watcher
- 🎨 **Idiomatic ReScript** - Generates clean, idiomatic ReScript code
- 🛡️ **Edge case handling** - Handles reserved keywords, polymorphic variants

## 📦 Installation

This package is designed to run with Bun for best performance:

```bash
# Recommended: Install with Bun
bun add -D convex-rescript-codegen

# Also works with npm/yarn/pnpm (requires Bun runtime)
npm install -D convex-rescript-codegen
```

**Note:** This package requires [Bun runtime](https://bun.sh) to be installed on your system.

## 🚀 Quick Start

1. **Install Bun if you haven't already:**
```bash
curl -fsSL https://bun.sh/install | bash
```

2. **Add to your package.json scripts:**
```json
{
  "scripts": {
    "codegen": "bunx convex-rescript",
    "codegen:watch": "bunx convex-rescript --watch"
  }
}
```

3. **Run the generator:**
```bash
bun run codegen
# or directly with
bunx convex-rescript
```

3. **Use the generated bindings:**
```rescript
// Your generated bindings are in src/bindings/generated/
open ConvexTypes

@react.component
let make = () => {
  // Use generated query hook
  let users = Convex_users.Query_list.use(~limit=Some(JSON.Encode.int(10)))
  
  // Use generated mutation hook
  let createUser = Convex_users.Mutation_create.use()
  
  // Type-safe function calls
  let handleCreate = async () => {
    let userId = await createUser({
      name: "Alice",
      email: "alice@example.com"
    })
    Console.log2("Created:", userId)
  }
  
  // Render your UI...
}
```

## 📁 Generated File Structure

```
src/bindings/generated/
├── ConvexTypes.res       # Document types from schema
├── ConvexBindings.res    # Core Convex React bindings
├── ConvexGenerated.res   # Module exports
├── Convex_users.res      # Bindings for users.ts
├── Convex_rooms.res      # Bindings for rooms.ts
└── Convex_messages.res   # Bindings for messages.ts
```

## 🔧 Configuration

### Command Line Options

```bash
convex-rescript [options]

Options:
  -i, --input <path>    Input directory (default: ./convex)
  -o, --output <path>   Output directory (default: ./src/bindings/generated)
  -w, --watch           Watch for changes
  -v, --verbose         Verbose output
  -h, --help            Show help
```

### Examples

```bash
# Basic usage (uses defaults)
convex-rescript

# Watch mode
convex-rescript --watch

# Custom paths
convex-rescript -i ./backend/convex -o ./frontend/src/bindings

# Verbose output for debugging
convex-rescript --verbose
```

## 📝 Type Mappings

| Convex Type | ReScript Type |
|------------|--------------|
| `v.string()` | `string` |
| `v.number()` | `float` |
| `v.boolean()` | `bool` |
| `v.null()` | `unit` |
| `v.id("table")` | `tableId` (e.g., `usersId`) |
| `v.optional(...)` | `option<...>` |
| `v.array(...)` | `array<...>` |
| `v.object(...)` | `JSON.t` |
| `v.any()` | `JSON.t` |
| `v.union(...)` | Polymorphic variants |
| `v.literal(...)` | Polymorphic variants |

## 🎯 Generated Code Examples

### Query with no arguments
```rescript
module Query_list = {
  type output = array<usersDoc>
  
  @module("convex/react")
  external useQuery: ('api, unit) => option<output> = "useQuery"
  
  let use = () => {
    useQuery(api["users"]["list"], ())
  }
}
```

### Query with arguments
```rescript
module Query_getById = {
  type input = {
    userId: usersId,
  }
  type output = option<usersDoc>
  
  @module("convex/react")
  external useQuery: ('api, input) => option<output> = "useQuery"
  
  let use = (~userId) => {
    useQuery(api["users"]["getById"], {
      userId: userId
    })
  }
}
```

### Mutation
```rescript
module Mutation_create = {
  type input = {
    name: string,
    email: string,
    avatar: option<string>,
  }
  type t = input => promise<usersId>
  
  @module("convex/react")
  external useMutation: 'api => t = "useMutation"
  
  let use = () => {
    useMutation(api["users"]["create"])
  }
}
```

### Document Types from Schema
```rescript
type usersDoc = {
  @as("_id") id: usersId,
  @as("_creationTime") creationTime: float,
  name: string,
  email: string,
  avatar: option<string>,
  status: [| #online | #offline | #away],
  lastSeen: float,
  createdAt: float,
}
```

## 🛡️ Edge Case Handling

### Reserved Keywords
The generator automatically escapes ReScript reserved keywords:
- `type` → `type_` with `@as("type")`
- `private` → `#"private"` in polymorphic variants

### Polymorphic Variants
Convex string unions are converted to ReScript polymorphic variants:
```typescript
// Convex
status: v.union(
  v.literal("online"),
  v.literal("offline"),
  v.literal("away")
)
```
```rescript
// ReScript
status: [| #online | #offline | #away]
```

## 🤝 Requirements

- **Bun runtime 1.0+** (required) - [Install Bun](https://bun.sh)
- ReScript v11+ (tested with v12 RC)
- Convex backend with TypeScript functions
- React project (for the generated hooks)

## 🐛 Known Limitations

1. **Complex nested types** - Very complex nested object types default to `JSON.t`
2. **Function return types** - Currently infers common patterns, not all return types
3. **Convex validators** - Complex validator compositions may not be fully supported
4. **Actions** - Limited support for Convex actions (treated similar to mutations)

## 🚧 Roadmap

- [ ] Full return type inference from function implementations
- [ ] Support for Convex HTTP endpoints
- [ ] Custom type mapping configuration
- [ ] Generate mock data for testing
- [ ] VS Code extension for instant generation
- [ ] Support for convex-helpers library patterns

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Built for the ReScript and Convex communities
- Inspired by GraphQL Code Generator and similar tools
- Uses ts-morph for robust TypeScript AST parsing

## 📚 Resources

- [ReScript Documentation](https://rescript-lang.org)
- [Convex Documentation](https://docs.convex.dev)
- [Project Repository](https://github.com/Frank-III/convex-rescript-codegen)

---

Made with ❤️ for type-safe full-stack development