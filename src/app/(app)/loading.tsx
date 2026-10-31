import { PageSkeleton } from "@/components/shared/page-skeleton";

// Shown instantly on navigation (and prefetched for visible links) while the page renders on the server.
export default function Loading() {
  return <PageSkeleton />;
}
