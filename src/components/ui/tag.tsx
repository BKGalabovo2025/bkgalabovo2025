
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const tagVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            color: {
                gray: 'border-transparent bg-gray-200 text-gray-800',
                blue: 'border-transparent bg-blue-100 text-blue-800',
                red: 'border-transparent bg-red-100 text-red-800',
                green: 'border-transparent bg-green-100 text-green-800',
                purple: 'border-transparent bg-purple-100 text-purple-800',
            },
        },
        defaultVariants: {
            color: 'gray',
        },
    }
);

export interface TagProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof tagVariants> {}

export function Tag({ className, color, ...props }: TagProps) {
    return (
        <div className={tagVariants({ color, className })} {...props} />
    );
}
