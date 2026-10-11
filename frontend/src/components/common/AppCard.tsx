import { type PropsWithChildren } from 'react'
import clsx from 'clsx'

type AppCardProps = PropsWithChildren<{
  className?: string
  title?: string
}>

export default function AppCard({ children, className, title }: AppCardProps) {
  return (
    <section className={clsx('pc-card', className)}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  )
}
