import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query to list all agents
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

// Query to get a single agent by ID
export const getById = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.agentId);
  },
});

// Query to get agents by status
export const getByStatus = query({
  args: { 
    status: v.union(
      v.literal("idle"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Mutation to create a new agent
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    role: v.string(),
    capabilities: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const agentId = await ctx.db.insert("agents", {
      ...args,
      status: "idle",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return agentId;
  },
});

// Mutation to update agent status
export const updateStatus = mutation({
  args: {
    agentId: v.id("agents"),
    status: v.union(
      v.literal("idle"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Mutation to execute an agent task
export const execute = mutation({
  args: {
    agentId: v.id("agents"),
    task: v.string(),
    parameters: v.any(),
  },
  handler: async (ctx, args) => {
    // Update agent status to processing
    await ctx.db.patch(args.agentId, {
      status: "processing",
      updatedAt: Date.now(),
    });

    // Create a new task record
    const taskId = await ctx.db.insert("agentTasks", {
      agentId: args.agentId,
      task: args.task,
      parameters: args.parameters,
      status: "processing",
      createdAt: Date.now(),
    });

    // In a real application, you would trigger the actual task execution here
    // For now, we'll simulate completion after creation
    
    return taskId;
  },
});

// Mutation to delete an agent
export const remove = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.agentId);
  },
});