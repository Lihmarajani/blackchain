
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isAddress, getAddress } from "ethers";
import { getWalletContract } from "@/lib/contract";
import {
  updateApplicationStatus,
  registerApplicationBlockchain,
} from "./actions";

const SEPOLIA_CHAIN_ID = 11155111;

export default function AdminActions({ application }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState(application.staff_notes || "");

  async function handleStatusChange(newStatus) {
    if (loading) return;

    const confirmed = window.confirm(
      `Are you sure you want to mark this application as ${newStatus}?`
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      const result = await updateApplicationStatus(
        application.application_number,
        newStatus,
        notes
      );

      if (result?.error) {
        throw new Error(result.error);
      }

      router.refresh();
    } catch (err) {
      console.error("Status update failed:", err);
      setError(err?.message || "Unable to update application status.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterBlockchain() {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      // 1. Validate application data.
      const applicationNumber = String(
        application.application_number ?? ""
      ).trim();

      const titleNumber = String(
        application.property_title_number ?? ""
      ).trim();

      const location = String(
        application.property_location ?? ""
      ).trim();

      const propertyType = String(
        application.property_type ?? ""
      ).trim();

      const sha256 = String(
        application.document_sha256 ?? ""
      ).trim();

      const ipfsCID = String(application.ipfs_cid ?? "").trim();

      if (!applicationNumber) {
        throw new Error("The application number is missing.");
      }

      if (!titleNumber || !location || !propertyType) {
        throw new Error(
          "The property title number, location, and property type are required."
        );
      }

      if (!/^[a-fA-F0-9]{64}$/.test(sha256)) {
        throw new Error(
          "The document SHA-256 hash must contain exactly 64 hexadecimal characters."
        );
      }

      if (!ipfsCID) {
        throw new Error(
          "This application has no IPFS CID. Confirm that the document was uploaded successfully through Pinata."
        );
      }

      // Basic validation for common CIDv0 and CIDv1 formats.
      const looksLikeCID =
        /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(ipfsCID) ||
        /^b[a-z2-7]{20,}$/.test(ipfsCID);

      if (!looksLikeCID) {
        throw new Error(
          "The saved IPFS CID does not match a supported CIDv0 or base32 CIDv1 format."
        );
      }

      // 2. The current contract expects land area as uint256.
      const landArea = Number(application.land_area);

      if (!Number.isSafeInteger(landArea) || landArea < 0) {
        throw new Error(
          "Land area must be a non-negative whole number because the current contract expects uint256."
        );
      }

      // 3. Check MetaMask.
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error(
          "MetaMask was not detected. Enable the extension for this site and refresh the page."
        );
      }

      const { contract, signer } = await getWalletContract();

      if (!contract || !signer || !signer.provider) {
        throw new Error(
          "Unable to initialize the wallet signer or smart contract."
        );
      }

      // 4. Ensure Sepolia is selected.
      const network = await signer.provider.getNetwork();

      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        throw new Error(
          "Please switch MetaMask to Ethereum Sepolia (Chain ID 11155111)."
        );
      }

      // 5. Ask for the initial property owner's wallet.
      const ownerInput = window.prompt(
        "Enter the applicant's Ethereum wallet address. This address will become the initial property owner:"
      );

      if (ownerInput === null || !ownerInput.trim()) {
        throw new Error("Registration cancelled: owner wallet is required.");
      }

      if (!isAddress(ownerInput.trim())) {
        throw new Error("Enter a valid Ethereum wallet address.");
      }

      const ownerWallet = getAddress(ownerInput.trim());

      // 6. Convert the database SHA-256 digest to bytes32.
      const documentHash = `0x${sha256.toLowerCase()}`;

      // Solidity's propertyId parameter is a string.
      const propertyId = applicationNumber;

      // 7. Confirm details before sending a blockchain transaction.
      const confirmed = window.confirm(
        [
          "Register this property on Ethereum Sepolia?",
          "",
          `Application: ${applicationNumber}`,
          `Property ID: ${propertyId}`,
          `Title number: ${titleNumber}`,
          `Initial owner: ${ownerWallet}`,
          `Location: ${location}`,
          `Property type: ${propertyType}`,
          `Land area: ${landArea}`,
          `IPFS CID: ${ipfsCID}`,
          `SHA-256: ${sha256}`,
          "",
          "Confirm only if these details are correct.",
        ].join("\n")
      );

      if (!confirmed) {
        throw new Error("Blockchain registration cancelled.");
      }

      // 8. Register using the actual saved CID.
      // Confirm this argument order matches the deployed contract ABI.
      const tx = await contract.registerProperty(
        propertyId,
        titleNumber,
        ownerWallet,
        location,
        propertyType,
        landArea,
        documentHash,
        ipfsCID
      );

      setError(
        `Transaction submitted: ${tx.hash}. Waiting for Sepolia confirmation...`
      );

      const receipt = await tx.wait();

      if (!receipt || Number(receipt.status) !== 1) {
        throw new Error(
          `Blockchain transaction failed. Transaction: ${tx.hash}`
        );
      }

      // 9. Save the confirmed transaction in Supabase.
      const result = await registerApplicationBlockchain(
        application.application_number,
        propertyId,
        tx.hash
      );

      if (result?.error) {
        throw new Error(
          `The blockchain transaction succeeded (${tx.hash}), but the database update failed: ${result.error}. Check the transaction before attempting another registration.`
        );
      }

      window.alert(
        [
          "Blockchain registration successful!",
          "",
          `Property ID: ${propertyId}`,
          `IPFS CID: ${ipfsCID}`,
          `Transaction: ${tx.hash}`,
        ].join("\n")
      );

      router.refresh();
    } catch (err) {
      console.error("Blockchain registration failed:", err);

      setError(
        err?.reason ||
          err?.shortMessage ||
          err?.message ||
          "Blockchain registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">
        Admin Actions
      </h2>

      {error && (
        <div
          role="alert"
          className="mt-4 break-words rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <div className="mt-4">
        <label
          htmlFor="staff-notes"
          className="mb-2 block text-sm font-semibold text-slate-800"
        >
          Staff Notes
        </label>

        <textarea
          id="staff-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={loading}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 disabled:bg-slate-100"
          rows={3}
          placeholder="Enter notes before approving or rejecting..."
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        {["pending", "under_review"].includes(application.status) && (
          <>
            <button
              type="button"
              onClick={() => handleStatusChange("approved")}
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Please wait..." : "Approve Application"}
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange("rejected")}
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject Application
            </button>
          </>
        )}

        {application.status === "approved" && (
          <button
            type="button"
            onClick={handleRegisterBlockchain}
            disabled={loading}
            className="rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Processing..." : "Register on Blockchain"}
          </button>
        )}
      </div>
    </div>
  );
}
