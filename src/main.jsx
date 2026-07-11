import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AuthProvider  from './context/AuthContext'
import ToastProvider from './context/ToastContext'
import DashboardProvider from './context/DashboardContext'
import App           from './App'
import './index.css'

alert('main.jsx loaded')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:     2,
      staleTime: 5 * 60 * 1000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <ToastProvider>
            <DashboardProvider>
              <App />
            </DashboardProvider>
          </ToastProvider>
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>
)


// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import { HashRouter } from 'react-router-dom'
// import AuthProvider from './context/AuthContext'
// import App from './App'
// import './index.css'

// const rootElement = document.getElementById('root')

// ReactDOM.createRoot(rootElement).render(
// <HashRouter>
//   <AuthProvider>
//     <ToastProvider>
//       <DashboardProvider>
//         <App />
//       </DashboardProvider>
//     </ToastProvider>
//   </AuthProvider>
// </HashRouter>
// )