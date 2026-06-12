import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Test helpers

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// Task Form Validation──

describe("TaskForm validation", () => {
  it("shows error when title is empty on submit", async () => {
    // Lazy import to avoid module resolution issues in test environment
    const { TaskForm } = await import("@/components/tasks/task-form");
    const onClose = jest.fn();

    render(<TaskForm onClose={onClose} />, { wrapper: createWrapper() });

    // Click submit without filling title
    const submitBtn = screen.getByRole("button", { name: /create task/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders edit mode with prefilled values", async () => {
    const { TaskForm } = await import("@/components/tasks/task-form");

    const mockTask = {
      id: "task-1",
      user_id: "user-1",
      title: "Fix the bug",
      description: "It is urgent",
      status: "in_progress" as const,
      priority: "high" as const,
      due_date: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    render(<TaskForm task={mockTask} onClose={jest.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByDisplayValue("Fix the bug")).toBeInTheDocument();
    expect(screen.getByDisplayValue("It is urgent")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument();
  });

  it("closes modal when Escape is pressed", async () => {
    const { TaskForm } = await import("@/components/tasks/task-form");
    const onClose = jest.fn();

    render(<TaskForm onClose={onClose} />, { wrapper: createWrapper() });

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

// SearchBar─

describe("SearchBar", () => {
  it("renders input and updates value", async () => {
    const { SearchBar } = await import("@/components/tasks/search-bar");

    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search tasks/i);
    expect(input).toBeInTheDocument();

    await userEvent.type(input, "implement");
    expect(input).toHaveValue("implement");
  });

  it("shows clear button when input has value", async () => {
    const { SearchBar } = await import("@/components/tasks/search-bar");

    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search tasks/i);
    await userEvent.type(input, "test");

    // Clear button should appear
    const clearBtn = screen.getByRole("button");
    expect(clearBtn).toBeInTheDocument();

    // Clicking it clears the input
    await userEvent.click(clearBtn);
    expect(input).toHaveValue("");
  });
});

// Task completion flow──

describe("TaskCard completion", () => {
  it("renders task title and status badge", async () => {
    const { TaskCard } = await import("@/components/tasks/task-card");

    const mockTask = {
      id: "t1",
      user_id: "u1",
      title: "Write tests",
      description: "",
      status: "todo" as const,
      priority: "medium" as const,
      due_date: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    render(<TaskCard task={mockTask} />, { wrapper: createWrapper() });

    expect(screen.getByText("Write tests")).toBeInTheDocument();
    expect(screen.getByText("To Do")).toBeInTheDocument();
  });

  it("shows overdue indicator for past due dates", async () => {
    const { TaskCard } = await import("@/components/tasks/task-card");

    const mockTask = {
      id: "t2",
      user_id: "u1",
      title: "Overdue task",
      description: "",
      status: "todo" as const,
      priority: "high" as const,
      due_date: "2020-01-01T00:00:00Z", // past date
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    render(<TaskCard task={mockTask} />, { wrapper: createWrapper() });

    // Due date text should appear and be styled as overdue
    const dueDateEl = screen.getByText(/jan 1, 2020/i);
    expect(dueDateEl.closest("span")).toHaveClass("text-danger");
  });
});
