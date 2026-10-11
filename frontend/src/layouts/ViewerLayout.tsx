import { Outlet } from 'react-router'

export default function ViewerLayout() {
  return (
    <main className="pc-viewer-shell">
      <Outlet />
    </main>
  )
}
