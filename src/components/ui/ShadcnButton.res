// ShadcnButton.res - ReScript binding for shadcn/ui Button component

module Button = {
  @react.component @module("./button")
  external make: (
    ~children: React.element,
    ~variant: [
      | #default
      | #destructive
      | #outline
      | #secondary
      | #ghost
      | #link
    ]=?,
    ~size: [#default | #sm | #lg | #icon]=?,
    ~asChild: bool=?,
    ~className: string=?,
    ~disabled: bool=?,
    ~onClick: ReactEvent.Mouse.t => promise<unit>=?,
    ~type_: [#button | #submit | #reset]=?,
  ) => React.element = "Button"
}
