import ReactDOM from "react-dom/client"
import App from "./app.js"

// StrictMode removed for better development performance
// It causes double renders which significantly impacts hover/tooltip responsiveness
ReactDOM.createRoot(document.getElementById("root")!).render(
  <App />
)
