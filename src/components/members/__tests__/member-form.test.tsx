import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Member } from "@/types/member.types";

import { MemberForm } from "../member-form";

// Mock the app store
vi.mock("@/store/use-app-store", () => ({
  useAppStore: () => ({
    activeBranch: "bkgalabovo",
  }),
}));

// Mock data for a member
const mockMember: Member = {
  id: "member1",
  siteId: "bkgalabovo",
  firstName: "John",
  lastName: "Doe",
  name: "John Doe",
  email: "john.doe@example.com",
  status: "active",
  dateOfBirth: new Date("1990-01-15").toISOString(),
  registrationDate: new Date().toISOString(),
  phone: "123456789",
  skillLevel: "intermediate",
  gender: "male",
};

describe("MemberForm", () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();

  // Clear mocks after each test
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render correctly in create mode", () => {
    render(<MemberForm onSave={onSave} onClose={onClose} />);

    expect(screen.getByText(/Основна информация/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Име/i)).toHaveValue("");
    expect(screen.getByLabelText(/Фамилия/i)).toHaveValue("");
    expect(screen.getByRole("button", { name: /Напред/i })).toBeInTheDocument();
  }, 10000);

  it("should render correctly in edit mode with initialData", async () => {
    render(
      <MemberForm onSave={onSave} onClose={onClose} initialData={mockMember} />
    );

    expect(screen.getByLabelText(/^Име/i)).toHaveValue(mockMember.firstName);
    expect(screen.getByLabelText(/Фамилия/i)).toHaveValue(mockMember.lastName);

    // Go to Step 2 (Contacts)
    fireEvent.click(screen.getByRole("button", { name: /Напред/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Имейл/i)).toHaveValue(mockMember.email);
    });

    // Go to Step 3 (Details)
    fireEvent.click(screen.getByRole("button", { name: /Напред/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Запазване/i })
      ).toBeInTheDocument();
    });
  });

  it("should call onSave with form data when submitted", async () => {
    render(<MemberForm onSave={onSave} onClose={onClose} />);

    // Fill in Step 1
    fireEvent.change(screen.getByLabelText(/^Име/i), {
      target: { value: "Test" },
    });
    fireEvent.change(screen.getByLabelText(/Фамилия/i), {
      target: { value: "User" },
    });

    // Go to Step 2
    fireEvent.click(screen.getByRole("button", { name: /Напред/i }));

    // Wait for email input to be rendered and fill in
    const emailInput = await screen.findByLabelText(/Имейл/i);
    fireEvent.change(emailInput, {
      target: { value: "test.user@example.com" },
    });

    // Go to Step 3
    fireEvent.click(screen.getByRole("button", { name: /Напред/i }));

    // Wait for the submit button to be rendered and click it
    const saveButton = await screen.findByRole("button", {
      name: /Създаване/i,
    });
    fireEvent.click(saveButton);

    // Wait for the async onSave to be called
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "Test",
          lastName: "User",
          email: "test.user@example.com",
        })
      );
    });
  });

  it("should display validation errors for required fields", async () => {
    render(<MemberForm onSave={onSave} onClose={onClose} />);

    // Attempt to submit by moving forward with invalid data
    fireEvent.click(screen.getByRole("button", { name: /Напред/i }));

    // Check for specific validation messages from Zod schema
    expect(
      await screen.findByText("First name is required.")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Last name is required.")
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("should mark email as invalid for incorrect format", async () => {
    render(<MemberForm onSave={onSave} onClose={onClose} />);

    // Fill in Step 1
    fireEvent.change(screen.getByLabelText(/^Име/i), {
      target: { value: "Test" },
    });
    fireEvent.change(screen.getByLabelText(/Фамилия/i), {
      target: { value: "User" },
    });

    // Go to Step 2
    fireEvent.click(screen.getByRole("button", { name: /Напред/i }));

    // Enter an invalid email
    const emailInput = await screen.findByLabelText(/Имейл/i);
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.blur(emailInput);

    // Submit the form
    fireEvent.submit(screen.getByRole("form", { name: /member-form/i }));

    // Check for validation message
    expect(
      await screen.findByText("Invalid email address", {}, { timeout: 2000 })
    ).toBeInTheDocument();

    // Ensure onSave was not called
    expect(onSave).not.toHaveBeenCalled();
  });

  it("should call onClose when the cancel button is clicked", () => {
    render(<MemberForm onSave={onSave} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /Отказ/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
