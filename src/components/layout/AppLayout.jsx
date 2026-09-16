import TopNav from './TopNav'
import ToastContainer from '../ui/ToastContainer'
import DataReminderBanner from '../executive/DataReminderBanner'

/*
 * Dashboards size themselves to the viewport and scroll internally. Pages
 * taller than the viewport (Executive, Edit Data) pass `scrollable` to get a
 * padded, scrolling content area below the fixed header.
 */
export default function AppLayout({ children, scrollable = false }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f7f8fa]">
      <TopNav />

      <div
        className={`flex flex-1 flex-col ${
          scrollable
            ? 'mt-16 overflow-y-auto'
            : 'mt-16 overflow-hidden'
        }`}
      >
        <DataReminderBanner />

        <div className={`flex min-h-0 flex-1 flex-col ${scrollable ? 'px-5 pb-8' : 'overflow-hidden'}`}>
          {children}
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}
