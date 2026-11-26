import { LoadingState } from "@/components/common/states";
import { PageContainer } from "@/components/layout/page-container";

export default function Loading() {
  return (
    <PageContainer className="py-12">
      <LoadingState label="Loading page" rows={4} />
    </PageContainer>
  );
}
