
"use client";

import { useState } from "react";
import { getReadOnlyContract } from "../../lib/contract";

export default function DiagnosticsPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function checkContract() {
    setLoading(true);
    setResult(null);

    try {
      const { provider, contract, network } =
        await getReadOnlyContract();

      const code = await provider.getCode(
        await contract.getAddress()
      );

      const adminRole = await contract.DEFAULT_ADMIN_ROLE();
      const registrarRole = await contract.REGISTRAR_ROLE();

      setResult({
        success: true,
        network: network.name,
        chainId: network.chainId.toString(),
        contractAddress: await contract.getAddress(),
        contractCodeFound: code !== "0x",
        adminRoleConfigured: Boolean(adminRole),
        registrarRoleConfigured: Boolean(registrarRole),
      });
    } catch (error) {
      setResult({
        success: false,
        message: error.message || "Contract check failed.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">
        Sepolia Contract Diagnostics
      </h1>

      <p className="mt-2 text-gray-600">
        Read-only check of the deployed Land Verification contract.
      </p>

      <button
        type="button"
        onClick={checkContract}
        disabled={loading}
        className="mt-6 rounded-lg bg-blue-700 px-5 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Checking..." : "Check Deployed Contract"}
      </button>

      {result && (
        <pre className="mt-6 overflow-auto rounded-lg bg-gray-100 p-4 text-sm text-gray-900">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
