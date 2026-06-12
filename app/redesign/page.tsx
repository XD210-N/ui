"use client";

import { RedesignHome } from "./RedesignHome";
import { RedesignRuntimeBinding } from "./bindings";

export default function RedesignPage() {
  return (
    <RedesignRuntimeBinding>
      <RedesignHome />
    </RedesignRuntimeBinding>
  );
}
