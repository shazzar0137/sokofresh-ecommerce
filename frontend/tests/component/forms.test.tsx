import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { PhoneField } from "@/components/forms/phone-field";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { kenyanMobileSchema, PHONE_ERROR_MESSAGE } from "@/utils/phone";

describe("TextField", () => {
  it("links the visible label, hint and error to the input", () => {
    render(<TextField label="Delivery landmark" hint="A gate or shop near you" error="Too long" />);
    const input = screen.getByLabelText("Delivery landmark");
    expect(input).toHaveAccessibleDescription("A gate or shop near you Too long");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("is not marked invalid without an error", () => {
    render(<TextField label="Name" />);
    const input = screen.getByLabelText("Name");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("keeps a caller's own aria-describedby", () => {
    render(
      <>
        <p id="extra">Extra help</p>
        <TextField label="Name" aria-describedby="extra" hint="Hint" />
      </>,
    );
    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription("Hint Extra help");
  });
});

describe("PhoneField", () => {
  it("brings up the phone keypad and allows autofill", () => {
    render(<PhoneField />);
    const input = screen.getByLabelText("M-Pesa number");
    expect(input).toHaveAttribute("type", "tel");
    expect(input).toHaveAttribute("inputmode", "tel");
    expect(input).toHaveAttribute("autocomplete", "tel");
  });
});

const formSchema = z.object({ phone: kenyanMobileSchema });

function PhoneForm({ onValid }: { onValid: (v: z.output<typeof formSchema>) => void }) {
  const { register, handleSubmit, formState } = useForm<z.input<typeof formSchema>, unknown, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      <PhoneField {...register("phone")} error={formState.errors.phone?.message} />
      <Button type="submit">Continue</Button>
    </form>
  );
}

describe("React Hook Form + Zod with the form primitives", () => {
  it("shows the phone error next to the field and does not submit", async () => {
    const onValid = vi.fn();
    render(<PhoneForm onValid={onValid} />);
    await userEvent.type(screen.getByLabelText("M-Pesa number"), "0201234567");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText(PHONE_ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.getByLabelText("M-Pesa number")).toHaveAttribute("aria-invalid", "true");
    expect(onValid).not.toHaveBeenCalled();
  });

  it("submits the number in E.164 form", async () => {
    const onValid = vi.fn();
    render(<PhoneForm onValid={onValid} />);
    await userEvent.type(screen.getByLabelText("M-Pesa number"), "0712 345 678");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await vi.waitFor(() => expect(onValid).toHaveBeenCalled());
    expect(onValid.mock.calls[0]?.[0]).toEqual({ phone: "+254712345678" });
  });
});
