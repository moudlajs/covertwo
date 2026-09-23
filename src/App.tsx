import { Shell } from './components/Shell'

export default function App() {
  return (
    <Shell footer={<span>ESPN</span>}>
      <p className="px-3 py-6 text-center font-mono text-xs text-slate-500">
        Scoreboard coming in the next release.
      </p>
    </Shell>
  )
}
