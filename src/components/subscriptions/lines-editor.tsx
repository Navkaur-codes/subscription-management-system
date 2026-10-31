"use client";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney } from "@/lib/format";
import { unitPrice, type PricedLine } from "@/lib/pricing";
import type { ProductOption } from "@/lib/subscriptions/form-options";
import type { LineValue } from "./form-types";

const NONE = "none";

export function newLine(): LineValue {
  return { key: crypto.randomUUID(), productId: "", variantId: "", quantity: 1, unitPrice: 0, taxRate: 0 };
}

/** Editable product lines; prices and tax default from the catalog. */
export function LinesEditor({
  products,
  lines,
  priced,
  onChange,
}: {
  products: ProductOption[];
  lines: LineValue[];
  priced: PricedLine[];
  onChange: (lines: LineValue[]) => void;
}) {
  const update = (i: number, patch: Partial<LineValue>) =>
    onChange(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const setProduct = (i: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    update(i, { productId, variantId: "", unitPrice: unitPrice(p.salesPrice), taxRate: p.taxRate });
  };

  const setVariant = (i: number, variantId: string) => {
    const p = products.find((x) => x.id === lines[i].productId);
    if (!p) return;
    const v = p.variants.find((x) => x.id === variantId);
    update(i, { variantId: v ? v.id : "", unitPrice: unitPrice(p.salesPrice, v?.extraPrice ?? 0) });
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="h-9 px-3 text-left font-medium">Product</th>
              <th className="px-3 text-left font-medium">Variant</th>
              <th className="w-24 px-3 text-right font-medium">Qty</th>
              <th className="w-32 px-3 text-right font-medium">Unit price</th>
              <th className="w-20 px-3 text-right font-medium">Tax</th>
              <th className="w-32 px-3 text-right font-medium">Amount</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const product = products.find((p) => p.id === l.productId);
              return (
                <tr key={l.key} className="border-t">
                  <td className="min-w-48 p-2">
                    <Select value={l.productId} onValueChange={(v) => setProduct(i, v)}>
                      <SelectTrigger className="w-full" size="sm">
                        <SelectValue placeholder="Select product">{product?.name}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="min-w-40 p-2">
                    <Select
                      value={l.variantId || NONE}
                      onValueChange={(v) => setVariant(i, v)}
                      disabled={!product?.variants.length}
                    >
                      <SelectTrigger className="w-full" size="sm">
                        <SelectValue>{product?.variants.find((x) => x.id === l.variantId)?.label ?? "No variant"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>No variant</SelectItem>
                        {product?.variants.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.label} {v.extraPrice ? `(+${formatMoney(v.extraPrice)})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={1}
                      className="font-mono-num h-8 min-w-16 text-right"
                      value={l.quantity}
                      onChange={(e) => update(i, { quantity: Math.max(0, Math.floor(Number(e.target.value))) })}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className="font-mono-num h-8 min-w-24 text-right"
                      value={l.unitPrice}
                      onChange={(e) => update(i, { unitPrice: Number(e.target.value) })}
                    />
                  </td>
                  <td className="font-mono-num px-3 text-right text-muted-foreground">{l.taxRate}%</td>
                  <td className="font-mono-num px-3 text-right font-medium whitespace-nowrap">{formatMoney(priced[i]?.amount ?? 0)}</td>
                  <td className="p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Remove line"
                      onClick={() => onChange(lines.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...lines, newLine()])}>
        <Plus className="size-4" /> Add line
      </Button>
    </div>
  );
}
