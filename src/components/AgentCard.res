// AgentCard.res - Example component using shadcn/ui Button

type agentCapability =
  | Chat
  | ImageGeneration
  | CodeExecution
  | DataAnalysis
  | WebSearch

type agentStatus =
  | Idle
  | Processing
  | Completed
  | Failed(string)

type agent = {
  id: string,
  name: string,
  description: string,
  capabilities: array<agentCapability>,
  status: agentStatus,
}

@react.component
let make = (~agent: agent, ~onExecute: string => Promise.t<unit>) => {
  let (isLoading, setIsLoading) = React.useState(() => false)

  let handleClick = async _ => {
    setIsLoading(_ => true)
    try {
      await onExecute(agent.id)
      setIsLoading(_ => false)
    } catch {
    | Exn.Error(err) => {
        Console.error2("Failed to execute agent:", err)
        setIsLoading(_ => false)
      }
    }
  }

  let statusColor = switch agent.status {
  | Idle => "bg-gray-100"
  | Processing => "bg-blue-100"
  | Completed => "bg-green-100"
  | Failed(_) => "bg-red-100"
  }

  <div className="agent-card p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-3">
      <h3 className="text-lg font-semibold"> {React.string(agent.name)} </h3>
      <span className={`px-2 py-1 rounded-full text-xs ${statusColor}`}>
        {React.string(
          switch agent.status {
          | Idle => "Idle"
          | Processing => "Processing"
          | Completed => "Completed"
          | Failed(msg) => `Failed: ${msg}`
          },
        )}
      </span>
    </div>

    <p className="text-sm text-gray-600 mb-4"> {React.string(agent.description)} </p>

    <div className="flex flex-wrap gap-1 mb-4">
      {agent.capabilities
      ->Array.map(cap => {
        let capName = switch cap {
        | Chat => "Chat"
        | ImageGeneration => "Image"
        | CodeExecution => "Code"
        | DataAnalysis => "Data"
        | WebSearch => "Search"
        }
        <span key={capName} className="px-2 py-1 bg-gray-100 rounded text-xs">
          {React.string(capName)}
        </span>
      })
      ->React.array}
    </div>

    <ShadcnButton.Button
      variant=#default
      size=#sm
      disabled={isLoading || agent.status == Processing}
      onClick={handleClick}
    >
      {React.string(isLoading ? "Executing..." : "Execute Agent")}
    </ShadcnButton.Button>
  </div>
}
