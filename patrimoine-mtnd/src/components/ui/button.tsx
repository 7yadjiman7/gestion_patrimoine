import React from "react"
import { Slot } from "@radix-ui/react-slot"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?:
        | "default"
        | "destructive"
        | "outline"
        | "secondary"
        | "ghost"
        | "link"
    size?: "default" | "sm" | "lg" | "icon"
    asChild?: boolean
}

const Button = React.forwardRef(
    (
        {
            className,
            variant = "default",
            size = "default",
            asChild = false,
            ...props
        }: ButtonProps,
        ref: React.Ref<HTMLButtonElement>
    ) => {
        const baseClasses =
            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus:ring-2 focus:ring-offset-2"

        const variantClasses = {
            default:
                "bg-blue-600 text-white shadow-xs hover:bg-blue-700 focus:ring-blue-500",
            destructive:
                "bg-red-600 text-white shadow-xs hover:bg-red-700 focus:ring-red-500",
            outline:
                "border border-gray-300 bg-white shadow-xs hover:bg-gray-50 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700",
            secondary:
                "bg-gray-100 text-gray-700 shadow-xs hover:bg-gray-200 focus:ring-gray-500",
            ghost: "hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-700",
            link: "text-blue-600 underline-offset-4 hover:underline",
        }

        const sizeClasses = {
            default: "h-9 px-4 py-2",
            sm: "h-8 px-3 gap-1.5",
            lg: "h-10 px-6",
            icon: "w-9 h-9",
        }

        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                ref={ref as any}
                className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
                {...props}
            />
        )
    }
)

Button.displayName = "Button"

// Export pour compatibilité avec le code existant
export const buttonVariants = () => Button

export { Button }
