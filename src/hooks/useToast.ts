// src/hooks/useToast.ts

// This is a simple wrapper around the 'sonner' toast library.
// We are re-exporting its 'toast' function to be used
// anywhere in the app, which is what components like
// LobbyPage.tsx are expecting when they call `useToast()`.

import { toast } from "sonner"

// You can add more complex logic here if needed,
// but for now, a simple re-export is all that's required.
const useToast = () => {
  return { toast }
}

export { useToast, toast }