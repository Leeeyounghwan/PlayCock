import { NavLink, Outlet } from 'react-router'

const menu = [
  ['Live Board', '/admin/live'],
  ['세션 관리', '/admin/sessions'],
  ['운동 이력', '/admin/history'],
  ['월간 통계', '/admin/analytics'],
  ['운영비 관리', '/admin/finance'],
]

export default function AdminLayout() {
  return (
    <div className="pc-admin-shell">
      <aside className="pc-sidebar" aria-label="Admin navigation">
        <div className="pc-brand">
          Play<span>Cock</span>
        </div>
        <nav>
          {menu.map(([label, href]) => (
            <NavLink key={label} to={href} className="pc-nav-link">
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="pc-admin-main">
        <header className="pc-topbar">
          <strong>운영 관리자</strong>
          <span>2026.09.22 · Admin</span>
        </header>
        <main className="pc-admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
