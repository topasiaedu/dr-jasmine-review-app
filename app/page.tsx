import { ReviewWizard } from "@/components/review-wizard/review-wizard";

/**
 * Guided Google review craft helper for Dr Jasmine (Metanova Health).
 */
export default function HomePage() {
  return (
    <main className="brand-shell flex flex-1 flex-col px-[18px] pt-7 pb-[calc(40px+env(safe-area-inset-bottom,0px))]">
      <ReviewWizard />
    </main>
  );
}
