import TopNav from './TopNav'
import ToastContainer from '../ui/ToastContainer'

export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f7f8fa]">
      <TopNav />

      {/* h-16 header offset; child dashboard sizing and widget ratios are unchanged. */}
      <div className="flex flex-1 flex-col overflow-hidden pt-16">
        {children}
      </div>

      <ToastContainer />
    </div>
  )
}
