import React from 'react';

const Shimmer = ({ w = 'w-full', h = 'h-3', rounded = 'rounded-lg' }: { w?: string; h?: string; rounded?: string }) => (
  <div className={`${w} ${h} ${rounded} bg-slate-200 animate-pulse`} />
);

export default function SidebarSkeleton() {
  return (
    <div className="px-4 py-4 space-y-5 animate-in fade-in duration-200">
      {/* Tab bar */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 rounded-xl p-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-8 bg-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>

      {/* Section label */}
      <Shimmer w="w-1/3" h="h-2.5" rounded="rounded" />

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse border border-slate-200" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Label */}
      <Shimmer w="w-2/5" h="h-2.5" rounded="rounded" />

      {/* Chip row */}
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-7 w-20 bg-slate-200 rounded-full animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>

      {/* Color grid */}
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse border border-slate-200" style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Label */}
      <Shimmer w="w-1/3" h="h-2.5" rounded="rounded" />

      {/* List rows */}
      {[0, 1, 2].map(i => (
        <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse border border-slate-200" style={{ animationDelay: `${i * 70}ms` }} />
      ))}
    </div>
  );
}
