# Convex ReScript Codegen

Automatically generate type-safe ReScript bindings from your Convex backend functions using TypeScript's compiler API for accurate parsing.

## Features

- 🚀 Automatic binding generation from Convex schema and functions
- 🔍 Type-safe hooks for queries, mutations, and actions  
- 📁 Support for internal and public functions
- 👁️ Watch mode with `@parcel/watcher` for instant regeneration
- ⚡ Blazing fast with Bun runtime
- 🎯 Smart Skip pattern for optional queries

## Installation

This package is included in the monorepo. To use it:

```bash
# From the project root
cd packages/convex-rescript-codegen
bun install
```

## Usage

### Generate bindings once:
```bash
bun run dev
```

### Watch mode (auto-regenerate on changes):
```bash
bun run watch
```

### CLI Options:
```bash
bun run src/cli.ts [options]

Options:
  -w, --watch     Watch for changes and auto-regenerate
  -i, --input     Input directory (default: ./convex)
  -o, --output    Output directory (default: ./src/bindings/generated)
  -v, --verbose   Verbose output
```

## Generated Code Structure

For each Convex module, the codegen creates:

### Query Example
```rescript
module Query_list = {
  type output = JSON.t
  
  @module("convex/react")
  external useQuery: ('api, unit) => option<output> = "useQuery"
  
  let use = () => {
    useQuery(api["agents"]["list"], ())
  }
}
```

### Mutation Example
```rescript
module Mutation_create = {
  type input = {
    name: string,
    description: string,
    role: string,
  }
  type t = input => promise<JSON.t>
  
  @module("convex/react")
  external useMutation: 'api => t = "useMutation"
  
  let use = () => {
    useMutation(api["agents"]["create"])
  }
}
```

### Skip Pattern for Optional Queries
```rescript
module Query_getById = {
  type input_ = { id: string }
  @unboxed type input = Input(input_) | Skip(string)
  type output = JSON.t
  
  @module("convex/react")
  external useQuery: ('api, input) => option<output> = "useQuery"
  
  let use = (~skip=false, ~id) => {
    if skip {
      useQuery(api["agents"]["getById"], Skip("skip"))
    } else {
      useQuery(api["agents"]["getById"], Input({id: id}))
    }
  }
}
```

## How It Works

1. **Parse**: Reads all TypeScript files in your Convex directory
2. **Extract**: Identifies exported queries, mutations, and actions
3. **Transform**: Maps Convex types to ReScript types
4. **Generate**: Creates type-safe ReScript modules with hooks
5. **Watch**: Monitors changes and regenerates automatically

## Type Mappings

| Convex Type | ReScript Type |
|------------|--------------|
| `v.string()` | `string` |
| `v.number()` | `float` |
| `v.boolean()` | `bool` |
| `v.null()` | `unit` |
| `v.id("table")` | `convexId<"table">` |
| `v.optional(...)` | `option<...>` |
| `v.array(...)` | `array<...>` |
| `v.object(...)` | `Dict.t<string, JSON.t>` |
| `v.any()` | `JSON.t` |

## Development

```bash
# Run tests
bun test

# Build for production
bun build ./src/cli.ts --outdir ./dist --target node
```

## Future Improvements

- [ ] Parse return types from Convex functions
- [ ] Generate types from Convex schema
- [ ] Support for complex validator types
- [ ] Custom type mappings via config
- [ ] Integration with convex-helpers
- [ ] Generate mock data for testing