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
const roles = user?.roles ?? [];
const isAdmin =
  roles.includes("admin") || roles.includes("SUPER_ADMIN"); // treat super admin as admin UI
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

  const backToDashboard = () => {
    if (!user || !user.roles) return navigate("/client-dashboard");

    const roles = user.roles;

    if (roles.includes("admin") || roles.includes("SUPER_ADMIN")) {
      navigate("/admin/declarations");
    } else {
      navigate("/client-dashboard");
    }
  };

  const { data: declaration, refetch, isLoading, error } = useQuery<
    ViewRequestData,
    Error
  >({
    queryKey: ["declaration", declarationId],
    queryFn: () => fetchDeclaration(declarationId),
    enabled: !!declarationId,
  });

  // i18n message helpers (so you translate everything once)
  const msg = {
    downloadFailed: t("view.alerts.downloadFailed"),
    selectFileFirst: t("view.alerts.selectFileFirst"),
    uploadFailed: t("view.alerts.uploadFailed"),

    step2WriteCommentFirst: t("view.step2.writeCommentFirst"),
    step2CommentSubmitted: t("view.step2.commentSubmitted"),
    step2SubmitFailed: t("view.step2.submitFailed"),
    step2ApproveConfirm: t("view.step2.approveConfirm"),
    step2ApproveSuccess: t("view.step2.approveSuccess"),
    step2ApproveError: t("view.step2.approveError"),

    step4WriteCommentFirst: t("view.step4.writeCommentFirst"),
    step4SubmitConfirm: t("view.step4.submitConfirm"),
    step4CommentSubmitted: t("view.step4.commentSubmitted"),
    step4SubmitFailed: t("view.step4.submitFailed"),

    confirmDraftReceipt: t("view.step3.confirmDraftReceipt"),
    draftConfirmed: t("view.step3.draftConfirmed"),
    confirmReceiptFailed: t("view.step3.confirmReceiptFailed"),

    confirmCompleteStep3: t("view.step3.confirmComplete"),
    step3Completed: t("view.step3.completed"),
    step3CompleteError: t("view.step3.completeError"),

    confirmCompleteStep5: t("view.step5.confirmComplete"),
    step5Completed: t("view.step5.completed"),
    step5CompleteError: t("view.step5.completeError"),

    draftUploadSuccess: t("view.step3.draftUploadSuccess"),
    finalUploadSuccess: t("view.step5.finalUploadSuccess"),

    userUploadSuccess: t("view.submission.userUploadSuccess"),
  };

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
      alert(msg.downloadFailed);
    }
  };

  const handleAddStep2Comment = async (comment: string) => {
    const text = comment.trim();
    if (!text) return alert(msg.step2WriteCommentFirst);

    setIsAddingStep2Comment(true);
    try {
      await declarationActions.addStep2Comment(declarationId, text);
      await invalidate();

      if (isAdmin) setStep2AdminComment("");
      else setStep2UserComment("");

      alert(msg.step2CommentSubmitted);
    } catch (err: any) {
      console.error("Failed to add step2 comment", err);
      alert(err?.response?.data?.message ?? msg.step2SubmitFailed);
    } finally {
      setIsAddingStep2Comment(false);
    }
  };

  const handleAddStep4Comment = async (comment: string) => {
    const text = (comment ?? "").trim();
    if (!text) return alert(msg.step4WriteCommentFirst);
    if (!confirm(msg.step4SubmitConfirm)) return;

    setIsAddingStepComment(true);
    try {
      await declarationActions.addStep4Comment(declarationId, text);
      await invalidate();

      if (isAdmin) setStep4AdminComment("");
      else setStep4UserComment("");

      alert(msg.step4CommentSubmitted);
    } catch (err: any) {
      console.error("Failed to add comment", err);
      alert(err?.response?.data?.error ?? msg.step4SubmitFailed);
    } finally {
      setIsAddingStepComment(false);
    }
  };

  const handleConfirmReceipt = async (fileId?: string) => {
    if (!confirm(msg.confirmDraftReceipt)) return;

    setConfirming(true);
    try {
      await declarationActions.confirmDraftReceipt(declarationId, fileId);
      alert(msg.draftConfirmed);
      await refetch?.();
    } catch (err) {
      console.error("Confirm failed", err);
      alert(msg.confirmReceiptFailed);
    } finally {
      setConfirming(false);
    }
  };

  const handleApproveStep2 = async (note?: string) => {
    if (!confirm(msg.step2ApproveConfirm)) return;

    try {
      await declarationActions.approveStep2(declarationId, note);
      alert(msg.step2ApproveSuccess);
      await invalidate();
    } catch (err) {
      console.error("Failed to approve Step 2", err);
      alert(msg.step2ApproveError);
    }
  };

  const handleCompleteStep3 = async () => {
    if (!confirm(msg.confirmCompleteStep3)) return;

    try {
      await declarationActions.completeStep3(declarationId);
      alert(msg.step3Completed);
      await refetch?.();
    } catch (err) {
      console.error("Failed to complete Step 3", err);
      alert(msg.step3CompleteError);
    }
  };

  const handleCompleteStep5 = async () => {
    if (!confirm(msg.confirmCompleteStep5)) return;

    try {
      await declarationActions.completeStep5(declarationId);
      alert(msg.step5Completed);
      await refetch?.();
    } catch (err) {
      console.error("Failed to complete Step 5", err);
      alert(msg.step5CompleteError);
    }
  };

  // uploads
  const handleStep3DraftUpload = async () => {
    if (!adminDraftFile) return alert(msg.selectFileFirst);
    setIsUploadingDraft(true);
    try {
      await uploadFormFile({
        url: `/admin/declarations/${declarationId}/step3-upload-draft`,
        file: adminDraftFile,
      });
      await invalidate();
      alert(msg.draftUploadSuccess);
      setAdminDraftFile(null);
    } catch (err) {
      console.error("Step 3 draft upload failed", err);
      alert(msg.uploadFailed);
    } finally {
      setIsUploadingDraft(false);
    }
  };

  const handleAdminUploadFinal = async () => {
    if (!adminFinalFile) return alert(msg.selectFileFirst);
    setIsUploadingFinal(true);
    try {
      await uploadFormFile({
        url: `/admin/declarations/${declarationId}/upload-draft`,
        file: adminFinalFile,
        extra: { documentType: "final_file", stepId: "submission" },
      });
      await invalidate();
      alert(msg.finalUploadSuccess);
      setAdminFinalFile(null);
    } catch (err) {
      console.error("Admin final upload failed", err);
      alert(msg.uploadFailed);
    } finally {
      setIsUploadingFinal(false);
    }
  };

  const handleUserUploadSubmission = async () => {
    if (!userSubmissionFile) return alert(msg.selectFileFirst);
    setIsUploadingUserSubmission(true);
    try {
      await uploadFormFile({
        url: `/files/${declarationId}/upload`,
        file: userSubmissionFile,
        extra: { documentType: "assessment_notice", deliveredForStep: "submission" },
      });
      await invalidate();
      alert(msg.userUploadSuccess);
      setUserSubmissionFile(null);
    } catch (err) {
      console.error("User upload failed", err);
      alert(msg.uploadFailed);
    } finally {
      setIsUploadingUserSubmission(false);
    }
  };

  if (isLoading) {
    return (
      <div className="view-page">
        <p>{t("view.loading1")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-page">
        <p style={{ color: "red" }}>{error.message || t("view.errors1.loadFailed")}</p>
        <button className="btn-secondary" onClick={backToDashboard}>
          {t("view.back1")}
        </button>
      </div>
    );
  }

  if (!declaration) {
    return (
      <div className="view-page">
        <p>{t("view.notFound1")}</p>
        <button className="btn-secondary" onClick={backToDashboard}>
          {t("view.back1")}
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
