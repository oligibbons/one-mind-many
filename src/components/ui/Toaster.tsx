// src/components/ui/Toaster.tsx

"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast game-card flex items-center gap-4 !bg-gray-900 !border-gray-700 !text-gray-200 !shadow-lg",
          description: "group-[.toast]:text-gray-400",
          actionButton:
            "group-[.toast]:bg-orange-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-gray-700 group-[.toast]:text-gray-300",
          error: "!bg-red-900/50 !border-red-700 !text-red-300",
          success: "!bg-green-900/50 !border-green-700 !text-green-300",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }