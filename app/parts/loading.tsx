// ==========================================
// Auto Parts Loading Skeleton
// ==========================================

export default function PartsLoading() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header Skeleton */}
            <header className="border-b bg-card/80 backdrop-blur-xl sticky top-16 z-40">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                        <div className="space-y-1.5">
                            <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6">
                    {/* Sidebar Skeleton */}
                    <aside className="hidden lg:block w-72 shrink-0">
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                                    <div className="h-9 w-full bg-muted rounded-md animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Grid Skeleton */}
                    <main className="flex-1">
                        <div className="mb-6">
                            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="rounded-xl border bg-card overflow-hidden"
                                >
                                    {/* Image Skeleton */}
                                    <div className="aspect-square bg-muted animate-pulse" />
                                    {/* Content Skeleton */}
                                    <div className="p-4 space-y-3">
                                        <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
                                        <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className="h-4 bg-muted rounded animate-pulse" />
                                            <div className="h-4 bg-muted rounded animate-pulse" />
                                        </div>
                                        <div className="h-6 w-1/4 bg-muted rounded animate-pulse mt-4" />
                                        <div className="h-10 w-full bg-muted rounded-md animate-pulse mt-2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
