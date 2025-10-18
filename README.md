# ReScript + Convex Chat Application

A real-time chat application built with ReScript v12 RC and Convex, featuring automatic TypeScript-to-ReScript codegen for type-safe backend bindings.

## 🚀 Features

- **Type-safe Convex bindings**: Automatic code generation from Convex functions to ReScript
- **Real-time chat**: Powered by Convex's reactive backend
- **Modern ReScript**: Using v12 RC with Core library and JSX v4
- **Full-stack type safety**: From database schema to UI components
- **Custom codegen tool**: Generates idiomatic ReScript bindings from Convex TypeScript

## 📁 Project Structure

```
├── convex/                    # Convex backend
│   ├── schema.ts             # Database schema
│   ├── users.ts              # User management functions
│   ├── rooms.ts              # Chat room functions
│   ├── messages.ts           # Message handling
│   └── agents.ts             # Agent system (for future AI integration)
│
├── packages/
│   └── convex-rescript-codegen/  # Custom code generator
│       ├── src/
│       │   ├── cli.ts        # CLI entry point
│       │   ├── parser.ts     # TypeScript AST parser
│       │   ├── generator.ts  # ReScript code generator
│       │   └── templates.ts  # Code templates
│       └── package.json
│
├── src/
│   ├── bindings/
│   │   └── generated/        # Auto-generated Convex bindings
│   │       ├── ConvexTypes.res      # Table document types
│   │       ├── Convex_users.res     # User function bindings
│   │       ├── Convex_rooms.res     # Room function bindings
│   │       └── Convex_messages.res  # Message function bindings
│   ├── components/
│   │   └── ChatRoom.res     # Main chat room component
│   ├── App.res               # Main app component
│   └── Main.res              # Entry point
│
└── rescript.json             # ReScript configuration
```

## 🛠️ Tech Stack

- **Frontend**: ReScript v12 RC, React, Tailwind CSS 4
- **Backend**: Convex (reactive backend-as-a-service)
- **Build**: Vite 6, Bun
- **Codegen**: TypeScript Compiler API (ts-morph)

## 📦 Installation

1. **Clone the repository**
```bash
git clone [your-repo-url]
cd random-rescript-convex
```

2. **Install dependencies**
```bash
bun install
```

3. **Set up Convex**
```bash
bunx convex dev
```

4. **Generate ReScript bindings**
```bash
bun run codegen
```

## 🚀 Development

Run these commands in separate terminals:

1. **Convex backend** (watches for changes):
```bash
bunx convex dev
```

2. **ReScript compiler** (watch mode):
```bash
bun run res:dev
```

3. **Vite dev server**:
```bash
bun run dev
```

4. **Regenerate bindings** (when Convex schema/functions change):
```bash
bun run codegen
```

## 🔧 How the Codegen Works

The `convex-rescript-codegen` tool automatically generates type-safe ReScript bindings from your Convex functions:

1. **Parses** TypeScript files in `/convex` using the TypeScript AST
2. **Extracts** function signatures, argument types, and return types
3. **Generates** idiomatic ReScript modules with proper types
4. **Handles** edge cases like reserved keywords and polymorphic variants

### Example

Given this Convex function:
```typescript
// convex/users.ts
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", { ...args });
  },
});
```

Generates this ReScript binding:
```rescript
// src/bindings/generated/Convex_users.res
module Mutation_create = {
  type input = {
    name: string,
    email: string,
  }
  type t = input => promise<usersId>
  
  @module("convex/react")
  external useMutation: 'api => t = "useMutation"
  
  let use = () => {
    useMutation(api["users"]["create"])
  }
}
```

## 📝 Key Features of the Codegen

- **Reserved keyword handling**: Automatically escapes ReScript keywords (e.g., `type` → `type_`)
- **Polymorphic variants**: Converts string unions to polymorphic variants
- **ID types**: Generates table-specific ID types (e.g., `usersId`, `roomsId`)
- **Document types**: Creates full document types with system fields
- **React hooks**: Generates ready-to-use hooks for queries and mutations

## 🎯 Usage Example

```rescript
// Using generated bindings in a component
@react.component
let make = () => {
  // Query users
  let users = Convex_users.Query_list.use(~limit=Some(JSON.Encode.int(10)))
  
  // Mutation to create user
  let createUser = Convex_users.Mutation_create.use()
  
  let handleCreate = async () => {
    try {
      let userId = await createUser({
        name: "Alice",
        email: "alice@example.com",
        avatar: None
      })
      Console.log2("Created user:", userId)
    } catch {
      | Exn.Error(err) => Console.error(err)
    }
  }
  
  // Render UI...
}
```

## 📚 Available Scripts

- `bun run dev` - Start Vite dev server
- `bun run build` - Build for production
- `bun run res:dev` - Start ReScript in watch mode
- `bun run res:build` - Build ReScript
- `bun run res:clean` - Clean ReScript build artifacts
- `bun run codegen` - Generate ReScript bindings from Convex
- `bun run codegen:watch` - Watch mode for codegen

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT

## 🔮 Future Enhancements

- [ ] Add authentication with Clerk or Auth0
- [ ] Implement file uploads and image sharing
- [ ] Add AI agents for chat assistance
- [ ] Create more shadcn/ui component bindings
- [ ] Add end-to-end tests
- [ ] Improve codegen to handle more complex types
- [ ] Add support for Convex actions and HTTP endpoints

## 🐛 Known Issues

- Complex nested types in Convex queries may need manual type definitions
- Some shadcn/ui components need manual ReScript bindings
- Hot reload sometimes requires manual page refresh

## 📖 Resources

- [ReScript Documentation](https://rescript-lang.org)
- [Convex Documentation](https://docs.convex.dev)
- [ReScript + React](https://rescript-lang.org/docs/react/latest/introduction)
- [Convex React Hooks](https://docs.convex.dev/client/react)

## ✨ Acknowledgments

Built with ReScript v12 RC and Convex for exploring type-safe full-stack development.