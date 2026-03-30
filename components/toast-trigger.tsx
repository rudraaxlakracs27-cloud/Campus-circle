"use client";

import { useEffect } from "react";
import { useToast } from "@/components/toast-provider";

type ToastTriggerProps = {
  title: string;
  body?: string;
  tone?: "success" | "warning";
};

export function ToastTrigger({ title, body, tone = "success" }: ToastTriggerProps) {
  const { showToast } = useToast();

  useEffect(() => {
    showToast({
      title,
      body,
      tone
    });
  }, [body, showToast, title, tone]);

  return null;
}
