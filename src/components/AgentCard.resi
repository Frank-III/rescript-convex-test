// AgentCard.resi - Interface for Fast Refresh

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
let make: (~agent: agent, ~onExecute: string => Promise.t<unit>) => React.element