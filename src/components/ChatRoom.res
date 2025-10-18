open ConvexTypes

// Custom type for messages with user info (since getByRoom adds user data)
type messageWithUser = {
  ...messagesDoc,
  user: option<{
    @as("_id") id: usersId,
    name: string,
    avatar: option<string>,
  }>
}

@react.component
let make = (~roomId: roomsId, ~userId: usersId) => {
  // Fetch room details
  let room = Convex_rooms.Query_getById.use(~roomId)
  
  // Fetch messages for the room
  // We need to cast the result since the query adds user info
  let messagesRaw = Convex_messages.Query_getByRoom.use(~roomId, ~limit=Some(JSON.Encode.int(50)))
  let messages: option<array<messageWithUser>> = Obj.magic(messagesRaw)
  
  // Fetch room members
  let members = Convex_rooms.Query_getMembers.use(~roomId)
  
  // Mutation to send a message
  let sendMessage = Convex_messages.Mutation_send.use()
  
  // State for message input
  let (messageText, setMessageText) = React.useState(() => "")
  
  let handleSendMessage = async _ => {
    if messageText->String.trim !== "" {
      try {
        let _ = await sendMessage({
          roomId: roomId,
          userId: userId,
          content: messageText,
          type_: "text"
        })
        setMessageText(_ => "")
      } catch {
        | Exn.Error(err) => Console.error2("Failed to send message:", err)
      }
    }
  }
  
  <div className="flex flex-col h-screen bg-gray-50">
    // Header
    <div className="bg-white border-b px-6 py-4">
      {switch room {
      | None => <div className="text-gray-500"> {React.string("Loading room...")} </div>
      | Some(None) => <div className="text-red-500"> {React.string("Room not found")} </div>
      | Some(Some(roomData)) => 
        <div>
          <h2 className="text-xl font-semibold"> {React.string(roomData.name)} </h2>
          {switch roomData.description {
          | Some(desc) => <p className="text-gray-600 text-sm"> {React.string(desc)} </p>
          | None => React.null
          }}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">
              {React.string(`Type: ${
                switch roomData.type_ {
                | #public => "Public"
                | #"private" => "Private" 
                | #direct => "Direct"
                }
              }`)}
            </span>
            {switch members {
            | None => React.null
            | Some(memberList) => 
              <span className="text-xs text-gray-500">
                {React.string(`• ${memberList->Array.length->Int.toString} members`)}
              </span>
            }}
          </div>
        </div>
      }}
    </div>
    
    // Messages area
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {switch messages {
      | None => 
        <div className="text-center text-gray-500 mt-8"> 
          {React.string("Loading messages...")} 
        </div>
      | Some(messageList) =>
        if messageList->Array.length === 0 {
          <div className="text-center text-gray-500 mt-8"> 
            {React.string("No messages yet. Start the conversation!")} 
          </div>
        } else {
          <div className="space-y-4">
            {messageList->Array.map(msg => {
              let isOwnMessage = msg.userId === userId
              <div 
                key={msg.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                <div 
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-200 text-gray-800"
                  }`}>
                  {switch msg.user {
                  | None => React.null
                  | Some(user) => 
                    if !isOwnMessage {
                      <div className="text-xs font-semibold mb-1">
                        {React.string(user.name)}
                      </div>
                    } else {
                      React.null
                    }
                  }}
                  <div> {React.string(msg.content)} </div>
                  <div className={`text-xs mt-1 ${
                    isOwnMessage ? "text-blue-100" : "text-gray-500"
                  }`}>
                    {React.string(
                      Date.fromTime(msg.createdAt)->Date.toLocaleTimeString
                    )}
                  </div>
                </div>
              </div>
            })->React.array}
          </div>
        }
      }}
    </div>
    
    // Input area
    <div className="bg-white border-t px-6 py-4">
      <div className="flex gap-2">
        <input
          type_="text"
          value={messageText}
          onChange={e => {
            let target = e->ReactEvent.Form.target
            let value = (target->Obj.magic)["value"]
            setMessageText(_ => value)
          }}
          onKeyDown={e => {
            if ReactEvent.Keyboard.key(e) === "Enter" && !ReactEvent.Keyboard.shiftKey(e) {
              ReactEvent.Keyboard.preventDefault(e)
              handleSendMessage()->ignore
            }
          }}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={_ => handleSendMessage()->ignore}
          disabled={messageText->String.trim === ""}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
          {React.string("Send")}
        </button>
      </div>
    </div>
  </div>
}