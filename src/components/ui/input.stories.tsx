import type { Meta, StoryObj } from "@storybook/nextjs";
import { Input } from "./input";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "password", "email", "number", "date", "file"],
      description: "The type of the input field",
    },
    placeholder: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: "text",
    placeholder: "Enter text here...",
  },
};

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "admin@bkgalabovo.com",
  },
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "••••••••",
  },
};

export const FileUpload: Story = {
  args: {
    type: "file",
  },
};

export const Disabled: Story = {
  args: {
    type: "text",
    placeholder: "Not allowed",
    disabled: true,
  },
};
