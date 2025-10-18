// AUTO-GENERATED - Shared types for Convex bindings
// DO NOT EDIT

// ID types for each table
type usersId = string
type roomsId = string
type roomMembersId = string
type messagesId = string
type reactionsId = string
type agentsId = string
type agentMessagesId = string
type agentTasksId = string

// API types from Convex
@module("../../../convex/_generated/api")
external api: 'api = "api"

@module("../../../convex/_generated/api")
external internal: 'api = "internal"

// Table document types

// Document type for users table
type usersDoc = {
  @as("_id") id: usersId,
  @as("_creationTime") creationTime: float,
  name: string,
  email: string,
  avatar: option<string>,
  status: [#online | #offline | #away],
  lastSeen: float,
  createdAt: float,
}

// Document type for rooms table
type roomsDoc = {
  @as("_id") id: roomsId,
  @as("_creationTime") creationTime: float,
  name: string,
  description: option<string>,
  @as("type") type_: [#public | #"private" | #direct],
  createdBy: usersId,
  createdAt: float,
  updatedAt: float,
}

// Document type for roomMembers table
type roomMembersDoc = {
  @as("_id") id: roomMembersId,
  @as("_creationTime") creationTime: float,
  roomId: roomsId,
  userId: usersId,
  role: [#owner | #admin | #member],
  joinedAt: float,
  lastRead: option<float>,
}

// Document type for messages table
type messagesDoc = {
  @as("_id") id: messagesId,
  @as("_creationTime") creationTime: float,
  roomId: roomsId,
  userId: usersId,
  content: string,
  @as("type") type_: [#text | #image | #file | #system],
  edited: option<bool>,
  editedAt: option<float>,
  createdAt: float,
}

// Document type for reactions table
type reactionsDoc = {
  @as("_id") id: reactionsId,
  @as("_creationTime") creationTime: float,
  messageId: messagesId,
  userId: usersId,
  emoji: string,
  createdAt: float,
}

// Document type for agents table
type agentsDoc = {
  @as("_id") id: agentsId,
  @as("_creationTime") creationTime: float,
  name: string,
  description: string,
  role: string,
  capabilities: array<string>,
  status: [#idle | #processing | #completed | #failed],
  metadata: option<JSON.t>,
  createdAt: float,
  updatedAt: float,
}

// Document type for agentMessages table
type agentMessagesDoc = {
  @as("_id") id: agentMessagesId,
  @as("_creationTime") creationTime: float,
  agentId: agentsId,
  content: string,
  timestamp: float,
  metadata: option<JSON.t>,
}

// Document type for agentTasks table
type agentTasksDoc = {
  @as("_id") id: agentTasksId,
  @as("_creationTime") creationTime: float,
  agentId: agentsId,
  task: string,
  parameters: JSON.t,
  status: string,
  result: option<JSON.t>,
  createdAt: float,
  completedAt: option<float>,
}
