import type { Metadata } from "next";
import { AllTasksClient } from "./all-tasks-client";

export const metadata: Metadata = {
  icons: "/icon.png",
  title: "All Tasks",
};

export default function AllTasksPage() {
  return <AllTasksClient />;
}
