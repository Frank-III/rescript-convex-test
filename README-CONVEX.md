# Running the ReScript + Convex Agent App

## Prerequisites
- Bun installed
- Convex account (free at convex.dev)

## Setup Steps

### 1. Install Dependencies
```bash
bun install
```

### 2. Set up Convex

#### First time setup:
```bash
bunx convex dev
```

This will:
- Prompt you to log in to Convex (or create account)
- Create a new project or select existing one
- Generate the `convex/_generated` folder
- Give you your deployment URL

#### Update .env.local:
Copy your Convex deployment URL from the terminal and update `.env.local`:
```
VITE_CONVEX_URL=https://your-actual-project.convex.cloud
```

### 3. Run the Application

In separate terminals:

#### Terminal 1 - ReScript Compiler:
```bash
bun run res:dev
```

#### Terminal 2 - Convex Backend:
```bash
bunx convex dev
```

#### Terminal 3 - Vite Dev Server:
```bash
bun run dev
```

## Features

The app provides:
- ✅ Create agents with name, description, and role
- ✅ View all agents in a grid layout
- ✅ Execute agents (triggers task processing)
- ✅ Remove agents
- ✅ Real-time updates via Convex subscriptions
- ✅ Status tracking (idle, processing, completed, failed)
- ✅ Statistics dashboard

## Project Structure

```
src/
├── bindings/
│   ├── ConvexBindings.res    # Core Convex React bindings
│   └── AgentConvex.res        # Agent-specific Convex bindings
├── components/
│   ├── AgentList.res          # Main agent management component
│   └── ui/
│       └── ShadcnButton.res   # Shadcn button bindings
├── App.res                    # Main app component
└── Main.res                   # Entry point with Convex provider

convex/
├── schema.ts                  # Database schema
├── agents.ts                  # Agent queries/mutations
└── messages.ts                # Message queries/mutations
```

## Troubleshooting

### "Could not start ReScript build: A ReScript build is already running"
This is normal if you have `bun run res:dev` running in another terminal.

### Convex connection issues
1. Make sure `bunx convex dev` is running
2. Verify your VITE_CONVEX_URL in `.env.local` matches your Convex project URL
3. Check the browser console for connection errors

### Type errors
The ReScript compiler provides excellent error messages. Check the terminal running `bun run res:dev` for detailed error output.

## Next Steps

1. Add authentication (Clerk or Auth0 integration)
2. Implement real AI agent processing with OpenAI/Anthropic
3. Add agent conversation history
4. Create agent templates
5. Add file upload capabilities for agents
6. Implement agent scheduling/cron jobs