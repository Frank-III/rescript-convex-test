%%raw("import './index.css'")

// Create Convex client - you'll need to set VITE_CONVEX_URL in your .env
@val @scope("import.meta.env")
external convexUrl: option<string> = "VITE_CONVEX_URL"

let client = switch convexUrl {
| Some(url) => {
    Console.log2("Convex URL:", url)
    ConvexBindings.ConvexReactClient.make(url)
  }
| None => ConvexBindings.ConvexReactClient.make("https://your-project.convex.cloud")
}

switch ReactDOM.querySelector("#root") {
| Some(domElement) =>
  ReactDOM.Client.createRoot(domElement)->ReactDOM.Client.Root.render(
    <React.StrictMode>
      <ConvexBindings.ConvexProvider client>
        <App />
      </ConvexBindings.ConvexProvider>
    </React.StrictMode>,
  )
| None => ()
}
