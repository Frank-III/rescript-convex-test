import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("direct")
    ),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      description: args.description,
      type: args.type,
      createdBy: args.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add creator as owner
    await ctx.db.insert("roomMembers", {
      roomId,
      userId: args.userId,
      role: "owner",
      joinedAt: Date.now(),
    });

    return roomId;
  },
});

export const list = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      // Return all public rooms
      return await ctx.db
        .query("rooms")
        .withIndex("by_type")
        .filter((q) => q.eq(q.field("type"), "public"))
        .collect();
    }

    // Return rooms the user is a member of
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_user")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const roomIds = memberships.map((m) => m.roomId);
    const rooms = await Promise.all(
      roomIds.map((id) => ctx.db.get(id))
    );

    return rooms.filter((room): room is Doc<"rooms"> => room !== null);
  },
});

export const getById = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roomId);
  },
});

export const join = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if already a member
    const existing = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user")
      .filter((q) => 
        q.and(
          q.eq(q.field("roomId"), args.roomId),
          q.eq(q.field("userId"), args.userId)
        )
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Add as member
    return await ctx.db.insert("roomMembers", {
      roomId: args.roomId,
      userId: args.userId,
      role: "member",
      joinedAt: Date.now(),
    });
  },
});

export const leave = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user")
      .filter((q) => 
        q.and(
          q.eq(q.field("roomId"), args.roomId),
          q.eq(q.field("userId"), args.userId)
        )
      )
      .first();

    if (membership && membership.role !== "owner") {
      await ctx.db.delete(membership._id);
      return true;
    }

    return false;
  },
});

export const getMembers = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_room")
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .collect();

    const users = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return user ? { ...user, role: m.role } : null;
      })
    );

    return users.filter((u) => u !== null);
  },
});