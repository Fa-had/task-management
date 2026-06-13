import type { Metadata } from "next";
import { AllTasksClient } from "./all-tasks-client";

export const metadata: Metadata = {
  title: "All Tasks — AntFlow",
};

export default function AllTasksPage() {
  return <AllTasksClient />;
}
