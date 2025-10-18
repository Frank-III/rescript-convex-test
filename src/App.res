open ConvexTypes

@react.component
let make = () => {
  // Temporary hardcoded user and room IDs for testing
  // In a real app, these would come from authentication and routing
  let (currentUserId, setCurrentUserId) = React.useState(() => None)
  let (currentRoomId, setCurrentRoomId) = React.useState(() => None)
  let (userName, setUserName) = React.useState(() => "")
  let (userEmail, setUserEmail) = React.useState(() => "")
  let (roomName, setRoomName) = React.useState(() => "General Chat")

  // Mutations for creating user and room
  let createUser = Convex_users.Mutation_create.use()
  let createRoom = Convex_rooms.Mutation_create.use()
  let joinRoom = Convex_rooms.Mutation_join.use()

  // Query for users and rooms
  let users = Convex_users.Query_list.use(~limit=Some(JSON.Encode.int(10)))
  let rooms = Convex_rooms.Query_list.use(~userId=None)

  let handleCreateUser = async _ => {
    if userName !== "" && userEmail !== "" {
      try {
        let userId = await createUser({
          name: userName,
          email: userEmail,
          avatar: None,
        })
        setCurrentUserId(_ => Some(userId))
        Console.log2("Created user:", userId)
      } catch {
      | Exn.Error(err) => Console.error2("Failed to create user:", err)
      }
    }
  }

  let handleCreateRoom = async _ => {
    switch currentUserId {
    | None => Console.error("No user selected")
    | Some(userId) =>
      try {
        let roomId = await createRoom({
          name: roomName,
          description: Some(JSON.Encode.string("A place to chat")),
          type_: "public",
          userId,
        })
        setCurrentRoomId(_ => Some(roomId))
        Console.log2("Created room:", roomId)
      } catch {
      | Exn.Error(err) => Console.error2("Failed to create room:", err)
      }
    }
  }

  let handleJoinRoom = async roomId => {
    switch currentUserId {
    | None => Console.error("No user selected")
    | Some(userId) =>
      try {
        let _ = await joinRoom({
          roomId,
          userId,
        })
        setCurrentRoomId(_ => Some(roomId))
        Console.log2("Joined room:", roomId)
      } catch {
      | Exn.Error(err) => Console.error2("Failed to join room:", err)
      }
    }
  }

  <div className="h-screen flex">
    {switch (currentUserId, currentRoomId) {
    | (Some(userId), Some(roomId)) =>
      // Show chat room
      <ChatRoom roomId={roomId} userId={userId} />
    | _ =>
      // Show setup UI
      <div className="flex-1 p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8"> {React.string("ReScript + Convex Chat Demo")} </h1>

        // User setup
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {React.string("Step 1: Create or Select User")}
          </h2>

          {switch currentUserId {
          | None =>
            <div>
              <div className="flex gap-2 mb-4">
                <input
                  type_="text"
                  value={userName}
                  onChange={e => {
                    Console.log2("e", e)
                    setUserName(_ => ReactEvent.Form.target(e)["value"])
                  }}
                  placeholder="Your name"
                  className="flex-1 px-3 py-2 border rounded"
                />
                <input
                  type_="email"
                  value={userEmail}
                  onChange={e => setUserEmail(_ => ReactEvent.Form.target(e)["value"])}
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 border rounded"
                />
                <button
                  onClick={_ => handleCreateUser()->ignore}
                  disabled={userName === "" || userEmail === ""}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {React.string("Create User")}
                </button>
              </div>

              {switch users {
              | None => React.null
              | Some(userList) if userList->Array.length > 0 =>
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {React.string("Or select existing user:")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {userList
                    ->Array.map(user =>
                      <button
                        key={user.id}
                        onClick={_ => setCurrentUserId(_ => Some(user.id))}
                        className="p-2 text-left border rounded hover:bg-gray-50"
                      >
                        <div className="font-semibold"> {React.string(user.name)} </div>
                        <div className="text-sm text-gray-600"> {React.string(user.email)} </div>
                      </button>
                    )
                    ->React.array}
                  </div>
                </div>
              | _ => React.null
              }}
            </div>
          | Some(userId) =>
            <div className="text-green-600"> {React.string(`✓ User selected: ${userId}`)} </div>
          }}
        </div>

        // Room setup
        {switch currentUserId {
        | None => React.null
        | Some(userId) =>
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              {React.string("Step 2: Create or Join Room")}
            </h2>

            <div className="flex gap-2 mb-4">
              <input
                type_="text"
                value={roomName}
                onChange={e => setRoomName(_ => ReactEvent.Form.target(e)["value"])}
                placeholder="Room name"
                className="flex-1 px-3 py-2 border rounded"
              />
              <button
                onClick={_ => handleCreateRoom()->ignore}
                disabled={roomName === ""}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {React.string("Create Room")}
              </button>
            </div>

            {switch rooms {
            | None => React.null
            | Some(roomList) if roomList->Array.length > 0 =>
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {React.string("Or join existing room:")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {roomList
                  ->Array.map(room =>
                    <button
                      key={room.id}
                      onClick={_ => handleJoinRoom(room.id)->ignore}
                      className="p-3 text-left border rounded hover:bg-gray-50"
                    >
                      <div className="font-semibold"> {React.string(room.name)} </div>
                      {switch room.description {
                      | Some(desc) =>
                        <div className="text-sm text-gray-600"> {React.string(desc)} </div>
                      | None => React.null
                      }}
                      <div className="text-xs text-gray-500 mt-1">
                        {React.string(
                          `Type: ${switch room.type_ {
                            | #public => "Public"
                            | #"private" => "Private"
                            | #direct => "Direct"
                            }}`,
                        )}
                      </div>
                    </button>
                  )
                  ->React.array}
                </div>
              </div>
            | _ =>
              <div className="text-gray-500">
                {React.string("No rooms available. Create one!")}
              </div>
            }}
          </div>
        }}
      </div>
    }}
  </div>
}
