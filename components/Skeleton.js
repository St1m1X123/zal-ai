'use client'

export const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-white/5 rounded-2xl ${className}`} />
)

export function DashboardSkeleton() {
    return (
        <div className="flex flex-col gap-6 px-4 pt-4">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex flex-col gap-2">
                        <Skeleton className="w-16 h-3" />
                        <Skeleton className="w-24 h-4" />
                    </div>
                </div>
                <Skeleton className="w-20 h-6 rounded-full" />
            </div>

            {/* Hero Card Skeleton */}
            <Skeleton className="w-full h-[330px] rounded-[28px]" />

            {/* Grid Skeleton */}
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
            </div>
        </div>
    )
}

export function ProfileSkeleton() {
    return (
        <div className="flex flex-col gap-8 p-6">
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="flex flex-col items-center gap-2">
                    <Skeleton className="w-32 h-6" />
                    <Skeleton className="w-48 h-4" />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
            </div>

            <div className="flex flex-col gap-4">
                <Skeleton className="w-full h-32 rounded-2xl" />
                <Skeleton className="w-full h-48 rounded-2xl" />
            </div>
        </div>
    )
}

export function ProgramsSkeleton() {
    return (
        <div className="flex flex-col gap-6 px-4 pt-6">
            <div className="flex flex-col gap-2">
                <Skeleton className="w-24 h-3" />
                <Skeleton className="w-48 h-6" />
            </div>

            <div className="flex flex-col gap-4 mt-4">
                <Skeleton className="w-full h-24 rounded-2xl" />
                <Skeleton className="w-full h-24 rounded-2xl" />
                <Skeleton className="w-full h-24 rounded-2xl" />
            </div>
        </div>
    )
}
