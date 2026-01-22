/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../auth/AuthContext";
import { fetchDeclaration } from "../services/declaration.service";
import { uploadFormFile } from "../services/uploadFormFile";
import { declarationActions } from "../services/declarationActions.service";

import ViewRequestContent from "./ViewRequest/ViewRequestContent";
import type { ViewRequestData } from "../types/declaration.types";

export default function ViewRequestPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const declarationId = id!;

  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("admin") ?? false;

  const queryClient = useQueryClient();

  // UI state
  const [confirming, setConfirming] = useState(false);

  const [adminDraftFile, setAdminDraftFile] = useState<File | null>(null);
  const [isUploadingDraft, setIsUploadingDraft] = useState(false);

  const [adminFinalFile, setAdminFinalFile] = useState<File | null>(null);
  const [isUploadingFinal, setIsUploadingFinal] = useState(false);

  const [userSubmissionFile, setUserSubmissionFile] = useState<File | null>(null);
  const [isUploadingUserSubmission, setIsUploadingUserSubmission] = useState(false);

  const [step4UserComment, setStep4UserComment] = useState("");
  const [step4AdminComment, setStep4AdminComment] = useState("");
  const [isAddingStepComment, setIsAddingStepComment] = useState(false);

  const [step2UserComment, setStep2UserComment] = useState("");
  const [step2AdminComment, setStep2AdminComment] = useState("");
  const [isAddingStep2Comment, setIsAddingStep2Comment] = useState(false);

  const backToDashboard = () => navigate("/client-dashboard");

  const { data: declaration, refetch, isLoading, error } = useQuery<
    ViewRequestData,
    Error
  >({
    queryKey: ["declaration", declarationId],
    queryFn: () => fetchDeclaration(declarationId),
    enabled: !!declarationId,
  });

  // ===== helpers =====
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["declaration", declarationId] });
  };

  // ===== actions =====
  const handleDownloadFile = async (fileId: string) => {
    try {
      const response = await declarationActions.getFileUrl(fileId);
      const { url } = response.data;
      window.open(url, "_blank");
      await refetch?.();
    } catch (err) {
      console.error("Failed to get download URL", err);
      alert("Could not download file.");
    }
  };

  const handleAddStep2Comment = async (comment: string) => {
    const text = comment.trim();
    if (!text) return alert("Please write a comment first.");

    setIsAddingStep2Comment(true);
    try {
      await declarationActions.addStep2Comment(declarationId, text);
      await invalidate();

      if (isAdmin) setStep2AdminComment("");
      else setStep2UserComment("");

      alert("Comment submitted.");
    } catch (err: any) {
      console.error("Failed to add step2 comment", err);
      alert(err?.response?.data?.message ?? "Could not submit comment.");
    } finally {
      setIsAddingStep2Comment(false);
    }
  };

  const handleAddStep4Comment = async (comment: string) => {
    const text = (comment ?? "").trim();
    if (!text) return alert("Please write a comment before submitting.");
    if (!confirm("Are you sure you want to submit this comment?")) return;

    setIsAddingStepComment(true);
    try {
      await declarationActions.addStep4Comment(declarationId, text);
      await invalidate();

      if (isAdmin) setStep4AdminComment("");
      else setStep4UserComment("");

      alert("Comment submitted.");
    } catch (err: any) {
      console.error("Failed to add comment", err);
      alert(err?.response?.data?.error ?? "Could not submit comment.");
    } finally {
      setIsAddingStepComment(false);
    }
  };

  const handleConfirmReceipt = async (fileId?: string) => {
    if (!confirm("Are you sure you want to confirm receipt of the draft?")) return;

    setConfirming(true);
    try {
      await declarationActions.confirmDraftReceipt(declarationId, fileId);
      alert("Confirmed — step will be marked as completed.");
      await refetch?.();
    } catch (err) {
      console.error("Confirm failed", err);
      alert("Could not confirm receipt.");
    } finally {
      setConfirming(false);
    }
  };

  const handleApproveStep2 = async (note?: string) => {
    if (!confirm("Are you sure you want to approve these documents?")) return;

    try {
      await declarationActions.approveStep2(declarationId, note);
      alert("Step 2 approved successfully!");
      await invalidate();
    } catch (err) {
      console.error("Failed to approve Step 2", err);
      alert("An error occurred while approving the step.");
    }
  };

  const handleCompleteStep3 = async () => {
    if (!confirm("Are you sure you have finished preparing the tax declaration?")) return;

    try {
      await declarationActions.completeStep3(declarationId);
      alert("Step 3 marked as complete!");
      await refetch?.();
    } catch (err) {
      console.error("Failed to complete Step 3", err);
      alert("An error occurred.");
    }
  };

  const handleCompleteStep5 = async () => {
    if (!confirm("Are you sure you want to mark this declaration as fully completed?")) return;

    try {
      await declarationActions.completeStep5(declarationId);
      alert("Step 5 marked as complete! The declaration is now finished.");
      await refetch?.();
    } catch (err) {
      console.error("Failed to complete Step 5", err);
      alert("An error occurred while completing the final step.");
    }
  };

  // uploads
  const handleStep3DraftUpload = async () => {
    if (!adminDraftFile) return alert("Please select a file first.");
    setIsUploadingDraft(true);
    try {
      await uploadFormFile({
        url: `/admin/declarations/${declarationId}/step3-upload-draft`,
        file: adminDraftFile,
      });
      await invalidate();
      alert("Draft uploaded successfully.");
      setAdminDraftFile(null);
    } catch (err) {
      console.error("Step 3 draft upload failed", err);
      alert("Upload failed.");
    } finally {
      setIsUploadingDraft(false);
    }
  };

  const handleAdminUploadFinal = async () => {
    if (!adminFinalFile) return alert("Please select a file first.");
    setIsUploadingFinal(true);
    try {
      await uploadFormFile({
        url: `/admin/declarations/${declarationId}/upload-draft`,
        file: adminFinalFile,
        extra: { documentType: "final_file", stepId: "submission" },
      });
      await invalidate();
      alert("Final file uploaded successfully.");
      setAdminFinalFile(null);
    } catch (err) {
      console.error("Admin final upload failed", err);
      alert("Upload failed.");
    } finally {
      setIsUploadingFinal(false);
    }
  };

  const handleUserUploadSubmission = async () => {
    if (!userSubmissionFile) return alert("Please select a file first.");
    setIsUploadingUserSubmission(true);
    try {
      await uploadFormFile({
        url: `/files/${declarationId}/upload`,
        file: userSubmissionFile,
        extra: { documentType: "assessment_notice", deliveredForStep: "submission" },
      });
      await invalidate();
      alert("File uploaded. Admin will be able to download it.");
      setUserSubmissionFile(null);
    } catch (err) {
      console.error("User upload failed", err);
      alert("Upload failed.");
    } finally {
      setIsUploadingUserSubmission(false);
    }
  };

  if (isLoading) {
    return (
      <div className="view-page">
        <p>{t("view.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-page">
        <p style={{ color: "red" }}>{error.message || t("view.errors.loadFailed")}</p>
        <button className="btn-secondary" onClick={backToDashboard}>
          {t("view.back")}
        </button>
      </div>
    );
  }

  if (!declaration) {
    return (
      <div className="view-page">
        <p>{t("view.notFound")}</p>
        <button className="btn-secondary" onClick={backToDashboard}>
          {t("view.back")}
        </button>
      </div>
    );
  }

  const viewDeclaration = {
    ...declaration,
    steps: Array.isArray(declaration.steps) ? declaration.steps : [],
    files: Array.isArray(declaration.files) ? declaration.files : [],
  } as ViewRequestData;

  return (
    <ViewRequestContent
      data={viewDeclaration}
      user={user ?? null}
      isAdmin={isAdmin}
      onBackToDashboard={backToDashboard}
      onUploadDocuments={() => refetch?.()}
      onDownloadFile={handleDownloadFile}
      onApproveStep2={handleApproveStep2}
      onAddStep2Comment={handleAddStep2Comment}
      step2UserComment={step2UserComment}
      setStep2UserComment={setStep2UserComment}
      step2AdminComment={step2AdminComment}
      setStep2AdminComment={setStep2AdminComment}
      isAddingStep2Comment={isAddingStep2Comment}
      onCompleteStep3={handleCompleteStep3}
      onStep3DraftUpload={handleStep3DraftUpload}
      adminDraftFile={adminDraftFile}
      setAdminDraftFile={setAdminDraftFile}
      isUploadingDraft={isUploadingDraft}
      confirming={confirming}
      onConfirmReceipt={handleConfirmReceipt}
      onAddStepComment={handleAddStep4Comment}
      step4UserComment={step4UserComment}
      setStep4UserComment={setStep4UserComment}
      step4AdminComment={step4AdminComment}
      setStep4AdminComment={setStep4AdminComment}
      isAddingStepComment={isAddingStepComment}
      onCompleteStep5={handleCompleteStep5}
      userSubmissionFile={userSubmissionFile}
      setUserSubmissionFile={setUserSubmissionFile}
      isUploadingUserSubmission={isUploadingUserSubmission}
      onUserUploadSubmission={handleUserUploadSubmission}
      onAdminUploadFinal={handleAdminUploadFinal}
  adminFinalFile={adminFinalFile}
  setAdminFinalFile={setAdminFinalFile}
  isUploadingFinal={isUploadingFinal}
   
    />
  );
}
