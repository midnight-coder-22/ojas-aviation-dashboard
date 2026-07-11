import TopNav         from './TopNav'
import ToastContainer from '../ui/ToastContainer'

export default function AppLayout({ children }) {
  return (
    // h-screen + flex-col = full viewport, no body scroll
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <TopNav />
      {/*
        pt-11 = clears the fixed nav (h-11 = 44px)
        flex-1 flex flex-col overflow-hidden = fills remaining height
        Children must use flex-col structure to let table expand
      */}
      <div className="flex-1 flex flex-col overflow-hidden pt-11">
        {children}
      </div>
      <ToastContainer />
    </div>
  )
}