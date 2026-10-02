import { ReviewWizard } from "@/components/review-wizard/review-wizard";

/**
 * Guided Google review craft helper for Dr Jasmine (Metanova Health).
 */
export default function HomePage() {
  return (
    <main className="brand-shell flex flex-1 flex-col px-4 pt-5 pb-[calc(28px+env(safe-area-inset-bottom,0px))]">
      <ReviewWizard />
    </main>
  );
}
