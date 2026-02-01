import React from "react";
import { cn } from "../lib/utils";

interface SkeletonProps extends React.ComponentProps<"div"> {}

export const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/80", className)}
      {...props}
    />
  );
};

export const AppSkeleton = () => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Skeleton */}
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-100 flex-col p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-6 w-32" />
        </div>

        <div className="space-y-4 flex-1">
          <Skeleton className="h-4 w-12 mb-4" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />

          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 flex flex-col min-w-0 bg-white shadow-xl md:m-2 md:rounded-3xl overflow-hidden relative">
        <header className="p-6 flex justify-between items-center border-b border-slate-100 bg-white z-20">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </header>

        <div className="flex-1 p-6 space-y-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100"
            >
              <Skeleton className="w-6 h-6 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="w-8 h-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
