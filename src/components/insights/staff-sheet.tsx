"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { createStaff } from "@/app/(app)/users/actions";

export function StaffSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"STAFF" | "ADMIN">("STAFF");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  const onSubmit = (fd: FormData) =>
    start(async () => {
      const res = await createStaff({
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        password: String(fd.get("password") ?? ""),
        role,
      });
      if (res.ok) {
        toast.success(res.message ?? "Added");
        setErrors({});
        setOpen(false);
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
      }
    });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="size-4" /> Add staff member
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add staff member</SheetTitle>
          <SheetDescription>They can sign in with this temporary password.</SheetDescription>
        </SheetHeader>
        <form action={onSubmit} className="grid gap-4 px-4">
          <FormField label="Name" htmlFor="s-name" required error={errors.name}>
            <Input id="s-name" name="name" />
          </FormField>
          <FormField label="Email" htmlFor="s-email" required error={errors.email}>
            <Input id="s-email" name="email" type="email" />
          </FormField>
          <FormField
            label="Temporary password"
            htmlFor="s-pw"
            required
            error={errors.password}
            hint="9+ characters with upper, lower and a special character"
          >
            <Input id="s-pw" name="password" type="text" autoComplete="off" />
          </FormField>
          <FormField label="Role">
            <Select value={role} onValueChange={(v) => setRole(v as "STAFF" | "ADMIN")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Add member
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
