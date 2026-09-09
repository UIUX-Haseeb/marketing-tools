"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BABY_BOY, BABY_GIRL } from "./template";
import { PostEditor } from "@/tools/_shared/post-editor";

const VARIANTS = [BABY_BOY, BABY_GIRL];

export function BabyTool() {
  const [variant, setVariant] = useState(BABY_BOY);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Design</p>
        <div className="flex gap-1.5" role="tablist" aria-label="Design">
          {VARIANTS.map((t) => {
            const on = t.id === variant.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setVariant(t)}
                className={cn(
                  "h-8 rounded-full border px-3 text-sm transition-colors",
                  on ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:border-navy-2/60 hover:text-foreground",
                )}
              >
                {t.variantLabel}
              </button>
            );
          })}
        </div>
      </div>
      {/* key resets the editor state when the design changes but keeps it simple */}
      <PostEditor key={variant.id} tool="baby" template={variant} source="manual" />
    </div>
  );
}
