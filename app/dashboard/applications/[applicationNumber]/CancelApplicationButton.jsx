"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelApplication } from "./actions";

export default function CancelApplicationButton({ applicationNumber }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this application? This action cannot be undone.")) return;
    
    setLoading(true);
    const result = await cancelApplication(applicationNumber);
    
    if (result.error) {
      alert(result.error);
      setLoading(false);
    } else {
      router.refresh();
    }
  }

  return (
    <button 
      onClick={handleCancel} 
      disabled={loading}
      className="mt-2 text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
    >
      Cancel Application
    </button>
  );
}
