
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  FileText,
  Calendar,
  UserRound,
  ExternalLink,
  LoaderCircle
} from "lucide-react";
import { getReadOnlyContract } from "../../lib/contract";
import QRCodeDisplay from "./QRCodeDisplay";

function formatDate(timestamp) {
  const seconds = Number(timestamp);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "Not available";
  }

  return new Date(seconds * 1000).toLocaleString();
}

function shortenAddress(address) {
  if (!address || !ethers.isAddress(address)) {
    return "Not available";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function Detail({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3 border-b border-gray-100 py-4 last:border-b-0">
      <div className="mt-1 text-gray-500">
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <div className="mt-1 break-words font-medium text-gray-900">
          {children || "Not available"}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const [propertyId, setPropertyId] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("id") || "";
    }
    return "";
  });
  const [property, setProperty] = useState(null);
  const [ownershipHistory, setOwnershipHistory] = useState([]);
  const [error, setError] = useState("");
  const [searchedId, setSearchedId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(event) {
    event.preventDefault();

    const id = propertyId.trim();

    if (!id) {
      setError("Enter a property ID to continue.");
      setProperty(null);
      setSearchedId("");
      return;
    }

    setLoading(true);
    setError("");
    setProperty(null);
    setSearchedId(id);

    try {
      const { contract } = await getReadOnlyContract();
      const record = await contract.verifyProperty(id);

      if (!record.exists) {
        setError("No matching property record was found.");
        return;
      }

      setProperty({
        propertyId: record.propertyId,
        titleNumber: record.titleNumber,
        currentOwner: record.currentOwner,
        location: record.location,
        propertyType: record.propertyType,
        landArea: record.landArea.toString(),
        documentHash: record.documentHash,
        ipfsCID: record.ipfsCID,
        registeredAt: record.registeredAt.toString(),
        active: record.active,
      });

      const history = await contract.getOwnershipHistory(id);
      setOwnershipHistory(history || []);
    } catch (err) {
      const message =
        err?.reason || err?.shortMessage || err?.message || "";

      if (
        message.toLowerCase().includes("property not found") ||
        message.toLowerCase().includes("call exception")
      ) {
        setError(
          "No matching property record was found. Check the property ID and try again."
        );
      } else {
        setError(
          "Unable to retrieve the property record. Check your internet connection and try again."
        );
        console.error("Property verification failed:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  const contractAddress =
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          ← Back to Home
        </Link>

        <header className="mt-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <ShieldCheck size={32} />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Property Verification
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            Search the blockchain registry for a recorded land
            property. No wallet connection is required.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <form onSubmit={handleVerify}>
            <label
              htmlFor="propertyId"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Property ID
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="propertyId"
                name="propertyId"
                type="text"
                value={propertyId}
                onChange={(event) =>
                  setPropertyId(event.target.value)
                }
                placeholder="Enter property ID"
                autoComplete="off"
                maxLength={100}
                className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <LoaderCircle size={19} className="animate-spin" />
                ) : (
                  <Search size={19} />
                )}
                {loading ? "Searching..." : "Verify Property"}
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Enter the exact property ID assigned during
              registration.
            </p>
          </form>
        </section>

        {error && (
          <section
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5"
          >
            <div className="flex gap-3">
              <ShieldAlert
                className="mt-0.5 shrink-0 text-red-600"
                size={22}
              />
              <div>
                <h2 className="font-semibold text-red-900">
                  Verification unsuccessful
                </h2>
                <p className="mt-1 text-sm text-red-800">
                  {error}
                </p>
              </div>
            </div>
          </section>
        )}

        {property && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div
              className={`p-5 sm:p-7 ${
                property.active ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <div className="flex items-start gap-3">
                {property.active ? (
                  <ShieldCheck
                    size={30}
                    className="shrink-0 text-green-700"
                  />
                ) : (
                  <ShieldAlert
                    size={30}
                    className="shrink-0 text-red-700"
                  />
                )}

                <div>
                  <p
                    className={`text-sm font-semibold ${
                      property.active
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {property.active
                      ? "Record found — Active"
                      : "Record found — Revoked"}
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-gray-900">
                    {property.propertyId}
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    {property.active
                      ? "An active record exists in this blockchain registry."
                      : "This record has been revoked by an authorized registrar."}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-2 sm:px-7">
              <Detail icon={FileText} label="Title Number">
                {property.titleNumber}
              </Detail>

              <Detail icon={MapPin} label="Recorded Location">
                {property.location}
              </Detail>

              <Detail icon={FileText} label="Property Type">
                {property.propertyType}
              </Detail>

              <Detail icon={FileText} label="Recorded Land Area">
                {property.landArea}
              </Detail>

              <Detail icon={UserRound} label="Current Owner Wallet">
                <span title={property.currentOwner}>
                  {shortenAddress(property.currentOwner)}
                </span>

                <a
                  href={`https://sepolia.etherscan.io/address/${property.currentOwner}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
                >
                  View wallet <ExternalLink size={13} />
                </a>
              </Detail>

              <Detail icon={Calendar} label="Registration Date">
                {formatDate(property.registeredAt)}
              </Detail>

              <Detail icon={FileText} label="Recorded Document SHA-256 Hash">
                <span className="break-all font-mono text-xs">
                  {property.documentHash}
                </span>
              </Detail>

              <Detail icon={FileText} label="IPFS Content Identifier">
                {property.ipfsCID}
              </Detail>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 p-5 sm:px-7">
              {property.ipfsCID && (
                <a
                  href={`https://ipfs.io/ipfs/${encodeURIComponent(property.ipfsCID)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
                >
                  Open IPFS document <ExternalLink size={15} />
                </a>
              )}

              <div className="mt-4 border-t border-gray-200 pt-4">
                <QRCodeDisplay text={typeof window !== 'undefined' ? `${window.location.origin}/verify?id=${property.propertyId}` : `https://landverification.app/verify?id=${property.propertyId}`} />
              </div>

              <p className="mt-3 text-xs leading-5 text-gray-500">
                This result confirms what is recorded in the
                blockchain registry. It does not independently
                establish legal ownership or the authenticity of
                a land title. Public blockchain records and
                linked IPFS content may be accessible to others.
              </p>
            </div>

            {ownershipHistory && ownershipHistory.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 p-5 sm:px-7">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Ownership History</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {ownershipHistory.map((owner, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="font-mono text-xs">{shortenAddress(owner)}</span>
                      {index === 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Initial</span>}
                      {index === ownershipHistory.length - 1 && index !== 0 && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Current</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {searchedId && !property && !error && loading === false && (
          <p className="mt-5 text-center text-sm text-gray-500">
            No result to display.
          </p>
        )}

        <footer className="mt-8 text-center text-xs text-gray-500">
          {contractAddress && (
            <a
              href={`https://sepolia.etherscan.io/address/${contractAddress}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-blue-700 hover:underline"
            >
              View registry contract on Sepolia Etherscan
              <ExternalLink size={12} />
            </a>
          )}

          <p className="mt-2">
            Network: Ethereum Sepolia Testnet
          </p>
        </footer>
      </div>
    </main>
  );
}
