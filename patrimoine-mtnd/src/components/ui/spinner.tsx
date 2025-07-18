import React from "react"

function Spinner() {
  return (
    <div className="inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent">
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export { Spinner }
