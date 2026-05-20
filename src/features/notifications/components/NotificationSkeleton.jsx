/**
 * NotificationSkeleton
 *
 * Shimmer placeholder rows shown while notifications are loading.
 * Matches the exact layout of a real NotificationItem so there is
 * zero layout shift when content arrives.
 *
 * Uses the project's existing color tokens (slate palette) and the
 * shimmer animation defined in index.css.
 */

const SkeletonRow = () => (
  <div className="flex items-start gap-3 px-4 py-3.5 animate-pulse">
    {/* Icon placeholder */}
    <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-slate-100" />

    {/* Text block */}
    <div className="flex-1 space-y-2 min-w-0">
      <div className="h-3 w-3/4 rounded-full bg-slate-100" />
      <div className="h-2.5 w-full rounded-full bg-slate-100" />
      <div className="h-2.5 w-1/2 rounded-full bg-slate-100" />
    </div>

    {/* Timestamp placeholder */}
    <div className="h-2.5 w-10 shrink-0 rounded-full bg-slate-100 mt-1" />
  </div>
);

const NotificationSkeleton = ({ count = 5 }) => (
  <div className="divide-y divide-slate-100">
    {Array.from({ length: count }, (_, i) => (
      <SkeletonRow key={i} />
    ))}
  </div>
);

export default NotificationSkeleton;
