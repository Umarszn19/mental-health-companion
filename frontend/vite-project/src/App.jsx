import { Routes, Route } from 'react-router-dom'
import CreateAccount from './pages/CreateAccount'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import InsightsPage from './pages/InsightsPage'
import JournalPage from './pages/JournalPage'
import ToolkitPage from './pages/ToolkitPage'
import ResourcesPage from './pages/ResourcesPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/createAccount" element={<CreateAccount />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/insights" element={<InsightsPage />} />
      <Route path="/journal" element={<JournalPage />} />
      <Route path="/toolkit" element={<ToolkitPage />} />
      <Route path="/resources" element={<ResourcesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  )
}

export default App;
