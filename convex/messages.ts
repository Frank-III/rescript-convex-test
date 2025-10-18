import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Chat room messages
export const send = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    content: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("file"),
      v.literal("system")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: args.userId,
      content: args.content,
      type: args.type,
      createdAt: Date.now(),
    });
  },
});

export const getByRoom = query({
  args: {
    roomId: v.id("rooms"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_room")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .order("desc")
      .take(limit);

    // Get user info for each message
    const messagesWithUsers = await Promise.all(
      messages.map(async (msg) => {
        const user = await ctx.db.get(msg.userId);
        return {
          ...msg,
          user: user ? {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          } : null,
        };
      })
    );

    return messagesWithUsers.reverse(); // Return in chronological order
  },
});

export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    
    if (!message || message.userId !== args.userId) {
      throw new Error("Cannot edit this message");
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      edited: true,
      editedAt: Date.now(),
    });

    return args.messageId;
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    
    if (!message || message.userId !== args.userId) {
      throw new Error("Cannot delete this message");
    }

    await ctx.db.delete(args.messageId);
    
    // Also delete reactions
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_message")
      .filter((q) => q.eq(q.field("messageId"), args.messageId))
      .collect();
    
    for (const reaction of reactions) {
      await ctx.db.delete(reaction._id);
    }

    return true;
  },
});

export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already reacted with this emoji
    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_message")
      .filter((q) => 
        q.and(
          q.eq(q.field("messageId"), args.messageId),
          q.eq(q.field("userId"), args.userId)
        )
      )
      .filter((q) => q.eq(q.field("emoji"), args.emoji))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("reactions", {
      messageId: args.messageId,
      userId: args.userId,
      emoji: args.emoji,
      createdAt: Date.now(),
    });
  },
});

export const removeReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const reaction = await ctx.db
      .query("reactions")
      .withIndex("by_message")
      .filter((q) => 
        q.and(
          q.eq(q.field("messageId"), args.messageId),
          q.eq(q.field("userId"), args.userId)
        )
      )
      .filter((q) => q.eq(q.field("emoji"), args.emoji))
      .first();

    if (reaction) {
      await ctx.db.delete(reaction._id);
      return true;
    }

    return false;
  },
});

// Keep agent message functions for backwards compatibility
export const sendAgentMessage = mutation({
  args: {
    agentId: v.id("agents"),
    content: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentMessages", {
      agentId: args.agentId,
      content: args.content,
      timestamp: Date.now(),
      metadata: args.metadata,
    });
  },
});

export const getByAgent = query({
  args: {
    agentId: v.id("agents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    return await ctx.db
      .query("agentMessages")
      .withIndex("by_agent")
      .filter((q) => q.eq(q.field("agentId"), args.agentId))
      .order("desc")
      .take(limit);
  },
});
