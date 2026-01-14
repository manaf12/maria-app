/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState  } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDeclaration } from "../services/declaration.service";
import Stage1Section from "../components/Stage1Section";

export type StageId = 1 | 2 | 3 | 4 | 5;
type StageStatus = "completed" | "current" | "locked";
type SummaryBlock = {
  maritalStatus: string;
  childrenCount: number;
  incomes: string;
  properties: string;
  offerName: string;
  offerPrice: number;
  taxYear: number;
};


type RequiredDocument = {
  id: string;
  label: string;
  mandatory: boolean;
  status: "todo" | "uploaded";
};

type AdditionalQuestion = {
  id: string;
  label: string;
  answer?: string;
};

type SubmissionInfo = {
  date?: string;
  method?: string;
};

type InvoiceBlock = {
  offerName: string;
  totalAmount: string;
  invoiceUrl: string;
};
type FileMeta = {
  deliveredForStep?: string;
  downloadedBy?: string;
  downloadedAt?: string;
  [key: string]: any;
};
type FileEntity = {
  uploadedAt: any;
  id: string;
  originalName: string;
  documentType: string;
  meta?: FileMeta;
};
interface FilesSummaryProps {
  files: FileEntity[];
  onDownloadFile: (fileId: string) => void;
  isAdmin: boolean;
    isOpen?: boolean;
  onClose?: () => void;

}

export type ViewRequestData = {
  id: string;
  taxYear: number;
  clientName: string;
  productName: string;
  currentStage: StageId;
  files?: FileEntity[];
  summary: SummaryBlock;
status: string;
  step1: {
    documents: RequiredDocument[];
  };

  step2: {
    questions: AdditionalQuestion[];
  };

  step5?: SubmissionInfo;
  steps?: any[];
  invoice: InvoiceBlock;
};
type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  locale?: "en" | "fr" | "de";
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  roles?: string[];
};
type ViewRequestContentProps = {
  data: ViewRequestData;
  user: User | null;
  isAdmin: boolean;
  onCompleteStep3: () => void;
  onBackToDashboard: () => void;
onStep3DraftUpload?: () => Promise<void>;
  onUploadDocuments?: () => void;
  onSubmitStep1?: () => Promise<void> | void;
  onSubmitStep2?: (answers: Record<string, string>) => Promise<void> | void;
  onDownloadDraft?: () => void;
  onValidateDeclaration?: (comments: string) => Promise<void> | void;
  onDownloadFinal?: () => void;
  onUploadAssessmentNotice?: () => void;
  onDownloadInvoice?: (url: string) => void;
  onDownloadFile: (fileId: string) => void;
  onApproveStep2: (note?: string) => void;
  onAdminUpload?: (stepId?: string, documentType?: string) => Promise<void>;
  adminDraftFile?: File | null;
  setAdminDraftFile?: (f: File | null) => void;
  isUploadingDraft?: boolean;
  onConfirmReceipt?: (fileId?: string) => Promise<void>;
  confirming?: boolean;
  onAddStepComment?: (comment: string) => Promise<void>;
  step4UserComment?: string;
  setStep4UserComment?: (value: string) => void;
  step4AdminComment?: string;
  setStep4AdminComment?: (value: string) => void;
  isAddingStepComment?: boolean;
  onCompleteStep5?: () => void;
  userSubmissionFile?: File | null;
  setUserSubmissionFile?: (f: File | null) => void;
  isUploadingUserSubmission?: boolean;
  onUserUploadSubmission?: (
    documentType?: string,
    deliveredForStep?: string,
  ) => Promise<void>;
onAddStep2Comment: (comment: string) => Promise<void>;
step2UserComment: string;
setStep2UserComment: (value: string) => void;
step2AdminComment: string;
setStep2AdminComment: (value: string) => void;
isAddingStep2Comment: boolean;  adminFinalFile?: File | null;
  setAdminFinalFile?: (f: File | null) => void;
  isUploadingFinal?: boolean;
  onAdminUploadFinal?: (
    stepId?: string,
    documentType?: string,
  ) => Promise<void>;
};


export function FilesSummary({
  files,
  onDownloadFile,
  isAdmin = false,
  isOpen = false,
  onClose,
}: FilesSummaryProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose?.();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const userFiles = (files ?? []).filter((f) => f.meta?.uploaderRole !== "admin");
  const adminFiles = (files ?? []).filter((f) => f.meta?.uploaderRole === "admin");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between">
          <div>
            <h2 className="text-lg font-semibold">Uploaded Files</h2>
            <p className="text-sm text-slate-300">Documents for this declaration</p>
          </div>
          <button onClick={onClose} className="text-xl hover:opacity-80">×</button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileColumn title="Client Files" files={userFiles} onDownloadFile={onDownloadFile} />
          <FileColumn title="Admin Files" files={adminFiles} onDownloadFile={onDownloadFile} admin />
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function FileColumn({
  title,
  files,
  onDownloadFile,
  admin = false,
}: {
  title: string;
  files: any[];
  onDownloadFile: (id: string) => void;
  admin?: boolean;
}) {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        {title}
        {admin && (
          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
            ADMIN
          </span>
        )}
      </h3>

      {files.length ? (
        <ul className="space-y-3">
          {files.map((file) => (
            <li
              key={file.id}
              className="group flex items-center justify-between p-4 rounded-xl border bg-white shadow-sm hover:shadow-lg transition-all duration-200"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{file.originalName}</div>
                <div className="text-sm text-gray-500 capitalize">
                  {file.documentType.replace(/_/g, " ")}
                </div>
              </div>

              <button
                onClick={() => onDownloadFile(file.id)}
                className="ml-4 shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                ⬇
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No files uploaded yet.</p>
      )}
    </div>
  );
}
export function ViewRequestContent({
  data,
  user,
  isAdmin,
  onBackToDashboard,
  onUploadDocuments,
  onSubmitStep1,
  onSubmitStep2,
  onDownloadDraft,
  onValidateDeclaration,
  onDownloadFinal,
  onUploadAssessmentNotice,
  onDownloadFile,
  onApproveStep2,
  onCompleteStep3,
  onCompleteStep5,
  onAdminUpload,
  adminDraftFile,
  setAdminDraftFile,
  isUploadingDraft,
  onConfirmReceipt,
  onStep3DraftUpload,
  confirming,
  onAddStepComment,
  step4UserComment,
  setStep4UserComment,
  isAddingStepComment,
  userSubmissionFile,
  setUserSubmissionFile,
  isUploadingUserSubmission,
  onUserUploadSubmission,
  step4AdminComment,
  setStep4AdminComment,
  adminFinalFile,
  setAdminFinalFile,
  isUploadingFinal,
  onAdminUploadFinal,
    onAddStep2Comment,
  step2UserComment,
  setStep2UserComment,
  step2AdminComment,
  setStep2AdminComment,
  isAddingStep2Comment,
}: ViewRequestContentProps) {
  const { t } = useTranslation();
  const [step2Answers, setStep2Answers] = useState<Record<string, string>>({});
  const [adminNote, setAdminNote] = useState("");
const [isFilesModalOpen, setFilesModalOpen] = useState(false);
  const [step4Comments, setStep4Comments] = useState("");
  const [optionalEnabled, setOptionalEnabled] = useState<
    Record<string, boolean>
  >({});
    const { currentStage, status: declarationStatus, steps } = data;
  const isStep5Done = steps?.find(s => s.id === 'submission')?.status === 'DONE';
  const stages: { id: StageId; titleKey: string; status: StageStatus }[] = [
    {
      id: 1,
      titleKey: "view.sections.initialUpload",
      status:
        currentStage > 1
          ? "completed"
          : currentStage === 1
          ? "current"
          : "locked",
    },
    {
      id: 2,
      titleKey: "view.sections.reviewDocuments",
      status:
        currentStage > 2
          ? "completed"
          : currentStage === 2
          ? "current"
          : "locked",
    },
    {
      id: 3,
      titleKey: "view.sections.prepareDeclaration",
      status:
        currentStage > 3
          ? "completed"
          : currentStage === 3
          ? "current"
          : "locked",
    },
    {
      id: 4,
      titleKey: "view.sections.validation",
      status:
        currentStage > 4
          ? "completed"
          : currentStage === 4
          ? "current"
          : "locked",
    },
   {
      id: 5,
      titleKey: "view.sections.submission",
      status:
        declarationStatus === 'COMPLETED' || isStep5Done
          ? "completed"
          : currentStage === 5
          ? "current"
          : "locked",
    },
  ];

  const handleSubmitStep2Internal = async () => {
    if (!onSubmitStep2) return;
    await onSubmitStep2(step2Answers);
  };

  const handleValidateInternal = async () => {
    if (!onValidateDeclaration) return;
    await onValidateDeclaration(step4Comments);
  };

  return (
    <div className="view-page">
      <div className="view-top-bar">
        <button className="btn-secondary" onClick={onBackToDashboard}>
          {t("view.back")}
        </button>
      </div>

      <h1 className="view-title">{t("view.title")}</h1>
      <section className="view-block">
        <h2>{t("view.formSummary")}</h2>

        <dl className="summary-grid">
          <div>
            <dt>{t("view.summary.maritalStatus")}</dt>
            <dd>{data.summary.maritalStatus}</dd>
          </div>
          <div>
            <dt>{t("view.summary.childrenCount")}</dt>
            <dd>{data.summary.childrenCount}</dd>
          </div>
          <div>
            <dt>{t("view.summary.incomes")}</dt>
            <dd>{data.summary.incomes}</dd>
          </div>
          <div>
            <dt>{t("view.summary.properties")}</dt>
            <dd>{data.summary.properties}</dd>
          </div>
          <div>
            <dt>{t("view.summary.offer")}</dt>
            <dd>{data.summary.offerName}</dd>
          </div>
          <div>
            <dt>{t("view.summary.price")}</dt>
            <dd>CHF {data.summary.offerPrice}.–</dd>
          </div>
          <div>
            <dt>{t("view.summary.taxYear")}</dt>
            <dd>{data.summary.taxYear}</dd>
          </div>
        </dl>
      </section>
      <div className="view-top-bar">
  <button className="btn-secondary" onClick={() => setFilesModalOpen(true)}>
    {t("view.filesSummary.open", "Show files summary")}
  </button>
  <button className="btn-secondary" onClick={onBackToDashboard}>
    {t("view.back")}
  </button>
</div>
      <FilesSummary
        files={data.files ?? []}
        onDownloadFile={onDownloadFile}
  isAdmin={isAdmin}
  isOpen={isFilesModalOpen}
  onClose={() => setFilesModalOpen(false)}
      />
      <section className="view-stages">
        {stages.map((stage) => {
          const isLocked = stage.status === "locked";
          const isCurrent = stage.status === "current";
          const isCompleted = stage.status === "completed";

          return (
            <details
              key={stage.id}
              className={
                "view-section" +
                (isLocked ? " is-locked" : "") +
                (isCurrent ? " is-current" : "") +
                (isCompleted ? " is-completed" : "")
              }
              open={isCurrent || stage.id === 1}
              onClick={(e) => {
                if (isLocked) e.preventDefault();
              }}
            >
              <summary>
                <div className="view-section-title-row">
                  <span>{t(stage.titleKey)}</span>
                  <span className="view-section-status">
                    {isLocked && t("view.status.locked")}
                    {isCurrent && t("view.status.current")}
                    {isCompleted && t("view.status.completed")}
                  </span>
                </div>
              </summary>

              <div className="view-section-content">
                {renderStageContent({
                  data,
                  stageId: stage.id,
                  isAdmin: isAdmin,
                  status: stage.status,
                  t,
                  onUploadDocuments,
                  onSubmitStep1,
                  onDownloadDraft,
                   onStep3DraftUpload,
                  onCompleteStep3,
                  onDownloadFinal,
                  onUploadAssessmentNotice,
                    onCompleteStep5,
                  step2Answers,
                  setStep2Answers,
                  handleSubmitStep2Internal,
                  step4Comments,
                  setStep4Comments,
                  handleValidateInternal,
                  optionalEnabled,
                  setOptionalEnabled,
                  adminNote,
                  setAdminNote,
                  onDownloadFile,
                  onApproveStep2,
                  onAdminUpload,
                  adminDraftFile,
                  setAdminDraftFile,
                  isUploadingDraft,
                  user,
                  onConfirmReceipt,
                  confirming,
                  onAddStepComment,
                  step4UserComment,
                  setStep4UserComment,
                  isAddingStepComment,
                  userSubmissionFile,
                  setUserSubmissionFile,
                  isUploadingUserSubmission,
                  onUserUploadSubmission,
                  step4AdminComment,
                  setStep4AdminComment,
                  adminFinalFile,
                  setAdminFinalFile,
                  isUploadingFinal,
                  onAdminUploadFinal,
                  onAddStep2Comment,
step2UserComment,
setStep2UserComment,
step2AdminComment,
setStep2AdminComment,
isAddingStep2Comment,
                })}
              </div>
            </details>
          );
        })}
      </section>
      <div style={{ marginTop: 24 }}>
        <button className="btn-secondary" onClick={onBackToDashboard}>
          {t("view.back")}
        </button>
      </div>
    </div>
  );
}
export default function ViewRequestPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [adminDraftFile, setAdminDraftFile] = useState<File | null>(null);
  const [isUploadingDraft, setIsUploadingDraft] = useState(false);
  const [step4UserComment, setStep4UserComment] = useState<string>("");
  const [step4AdminComment, setStep4AdminComment] = useState<string>("");
  const [isAddingStepComment, setIsAddingStepComment] =
    useState<boolean>(false);
  const [adminFinalFile, setAdminFinalFile] = useState<File | null>(null);
  const [isUploadingFinal, setIsUploadingFinal] = useState(false);
const [step2UserComment, setStep2UserComment] = useState<string>("");
const [step2AdminComment, setStep2AdminComment] = useState<string>("");
const [isAddingStep2Comment, setIsAddingStep2Comment] = useState<boolean>(false);
  const [userSubmissionFile, setUserSubmissionFile] = useState<File | null>(
    null,
  );
  const [isUploadingUserSubmission, setIsUploadingUserSubmission] =
    useState(false);
  const handleAdminUploadFinal = async (
    stepId = "submission",
    documentType = "final_file",
  ) => {
    if (!adminFinalFile) return alert("Please select a file first.");
    setIsUploadingFinal(true);
    try {
      const fd = new FormData();
      fd.append("file", adminFinalFile);
      fd.append("documentType", documentType);
      fd.append("stepId", stepId);
      await axiosClient.post(
        `/admin/declarations/${declarationId}/upload-draft`,
        fd,{
       headers: { "Content-Type": "multipart/form-data" },
        }
      );
      alert("Final file uploaded successfully.");
      setAdminFinalFile(null);
      await queryClient.invalidateQueries({
        queryKey: ["declaration", declarationId],
      });
    } catch (err) {
      console.error("Admin final upload failed", err);
      alert("Upload failed.");
    } finally {
      setIsUploadingFinal(false);
    }
  };


  const handleUserUploadSubmission = async (
    documentType = "assessment_notice",
    deliveredForStep = "submission",
  ) => {
    if (!userSubmissionFile) return alert("Please select a file first.");
    setIsUploadingUserSubmission(true);
    try {
      const fd = new FormData();
      fd.append("file", userSubmissionFile);
      fd.append("documentType", documentType);
      fd.append("deliveredForStep", deliveredForStep);
      await axiosClient.post(`/files/${declarationId}/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await queryClient.invalidateQueries({
        queryKey: ["declaration", declarationId],
      });
      alert("File uploaded. Admin will be able to download it.");
      setUserSubmissionFile(null);
    } catch (err) {
      console.error("User upload failed", err);
      alert("Upload failed.");
    } finally {
      setIsUploadingUserSubmission(false);
    }
  };
  const declarationId = id!;
  const isAdmin = user?.roles?.includes("admin") ?? false;
  const queryClient = useQueryClient();
  const handleAddStep2Comment = async (comment: string) => {
  const text = comment.trim();
  if (!text) return alert("Please write a comment first.");

  setIsAddingStep2Comment(true);
  try {
    await axiosClient.post(
      `/orders/${declarationId}/steps/documentsReview/comment`,
      { comment: text }
    );

    await queryClient.invalidateQueries({
      queryKey: ["declaration", declarationId],
    });

    // امسحي الحقل المناسب حسب الدور
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
  const handleAddStepComment = async (comment?: string) => {
    const text = (comment ?? step4UserComment)?.trim();
    if (!text) {
      alert("Please write a comment before submitting.");
      return;
    }
    if (!confirm("Are you sure you want to submit this comment?")) return;

    setIsAddingStepComment(true);
    try {
      const stepId = "reviewAndValidation";
      await axiosClient.post(
        `/orders/${declarationId}/steps/${stepId}/comment`,
        { comment: text },
      );

      await queryClient.invalidateQueries({
        queryKey: ["declaration", declarationId],
      });
      setStep4UserComment("");
      alert("Comment submitted.");
    } catch (err: any) {
      console.error("Failed to add comment", err);
      alert(err?.response?.data?.error ?? "Could not submit comment.");
    } finally {
      setIsAddingStepComment(false);
    }
  };
  const backToDashboard = () => {
    navigate("/client-dashboard");
  };
  const {
    data: declaration,
    refetch,
    isLoading: queryLoading,
    error: queryError,
  } = useQuery<
    ViewRequestData,
    Error,
    ViewRequestData,
    readonly [string, string]
  >({
    queryKey: ["declaration", declarationId] as const,
    queryFn: () => fetchDeclaration(declarationId),
    enabled: !!declarationId,
  });
  const handleDownloadFile = async (fileId: string) => {
    try {
      const response = await axiosClient.get(`/files/${fileId}/url`);
      const { url } = response.data;
      window.open(url, "_blank");
      await refetch?.();
    } catch (error) {
      console.error("Failed to get download URL", error);
      alert("Could not download file.");
    }
  };
  const handleConfirmReceipt = async (fileId?: string) => {
    if (!confirm("Are you sure you want to confirm receipt of the draft?"))
      return;
    setConfirming(true);
    try {
      await axiosClient.post(
        `/orders/${declarationId}/steps/reviewAndValidation/confirm-download`,
        { fileId },
      );
      alert("Confirmed — step will be marked as completed.");
      await refetch?.();
    } catch (err) {
      console.error("Confirm failed", err);
      alert("Could not confirm receipt.");
    } finally {
      setConfirming(false);
    }
  };
const handleStep3DraftUpload = async () => {
  if (!adminDraftFile) return alert("Please select a file first.");
  setIsUploadingDraft(true);

  try {
    const fd = new FormData();
    fd.append("file", adminDraftFile); // نفس الاسم اللي ينتظره السيرفر غالباً

    await axiosClient.post(
      `/admin/declarations/${declarationId}/step3-upload-draft`,
      fd,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    await queryClient.invalidateQueries({ queryKey: ["declaration", declarationId] });
    alert("Draft uploaded successfully.");
    setAdminDraftFile(null);
  } catch (err) {
    console.error("Step 3 draft upload failed", err);
    alert("Upload failed.");
  } finally {
    setIsUploadingDraft(false);
  }
};

  const handleAdminUpload = async (
    stepId = "submission",
    documentType = "final_file",
  ) => {
    if (!adminDraftFile) return alert("Please select a file first.");
    setIsUploadingDraft(true);
    try {
      const fd = new FormData();
      fd.append("file", adminDraftFile);
      fd.append("documentType", documentType);
      fd.append("stepId", stepId);

      await axiosClient.post(
        `/admin/declarations/${declarationId}/upload-draft`,
        fd,
         {
  headers: { "Content-Type": "multipart/form-data" },
}
      );
      await queryClient.invalidateQueries({
        queryKey: ["declaration", declarationId],
      });
      alert("Draft uploaded successfully.");
      setAdminDraftFile(null);
    } catch (err) {
      console.error("Admin upload failed", err);
      alert("Upload failed.");
    } finally {
      setIsUploadingDraft(false);
    }
  };
  const handleApproveStep2 = async (note?: string) => {
    if (!confirm("Are you sure you want to approve these documents?")) return;

    const requestBody = {
      status: { status: "DONE" },
      note: note,
    };

    try {
      await axiosClient.patch(
        `admin/declarations/${declarationId}/review`,
        requestBody,
      );
      alert("Step 2 approved successfully!");
      await queryClient.invalidateQueries({ queryKey: ["declaration", declarationId] });
    } catch (error) {
      console.error("Failed to approve Step 2", error);
      alert("An error occurred while approving the step.");
    }
  };
  const handleCompleteStep3 = async () => {
    if (
      !confirm("Are you sure you have finished preparing the tax declaration?")
    )
      return;

    try {
      await axiosClient.patch(
        `/admin/declarations/${declarationId}/steps/taxPreparation/complete`,
      );
      alert("Step 3 marked as complete!");
      refetch(); 
    } catch (error) {
      console.error("Failed to complete Step 3", error);
      alert("An error occurred.");
    }
  };
  const handleCompleteStep5 = async ()=>{
        if (!confirm("Are you sure you want to mark this declaration as fully completed?")) {
      return;
    }
    try{
      await axiosClient.patch(
                `/admin/declarations/${declarationId}/steps/submission/complete`,
      )
      alert("Step 5 marked as complete! The declaration is now finished.");
      refetch(); 
    }catch(err){
            console.error("Failed to complete Step 5", err);
      alert("An error occurred while completing the final step.");
    }
  }
  const handleSubmitStep1 = async () => {
    try {
      await axiosClient.post(
        `/api/declarations/${declarationId}/steps/1/submit`,
      );
      await queryClient.invalidateQueries({ queryKey: ["declaration", declarationId] });
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Could not submit step 1");
    }
  };

  const handleSubmitStep2 = async (answers: Record<string, string>) => {
    try {
      await axiosClient.post(
        `/api/declarations/${declarationId}/steps/2/submit`,
        {
          answers,
        },
      );
      await queryClient.invalidateQueries({ queryKey: ["declaration", declarationId] });
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Could not submit step 2");
    }
  };

  const handleDownloadDraft = () => {
    window.open(`/api/declarations/${declarationId}/draft`, "_blank");
  };

  const handleValidateDeclaration = async (comments: string) => {
    try {
      await axiosClient.post(
        `/api/declarations/${declarationId}/steps/4/validate`,
        {
          comments,
        },
      );
await queryClient.invalidateQueries({ queryKey: ["declaration", declarationId] });
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Could not validate declaration");
    }
  };

  const handleDownloadFinal = () => {
    window.open(`/api/declarations/${declarationId}/final`, "_blank");
  };

  const handleDownloadInvoice = (url: string) => {
    window.open(url, "_blank");
  };

  const handleUploadAssessmentNotice = () => {
    alert("TODO: Implement assessment notice upload UI");
  };

  if (queryLoading) {
    return (
      <div className="view-page">
        <p>{t("view.loading")}</p>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="view-page">
        <p style={{ color: "red" }}>
          {queryError.message || t("view.errors.loadFailed")}
        </p>
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
  steps: Array.isArray(declaration?.steps) ? declaration.steps : [],
  files: Array.isArray(declaration?.files) ? declaration.files : [],
} as ViewRequestData;

  return (
    <ViewRequestContent
      data={viewDeclaration}
      user={user}
      isAdmin={isAdmin}
      onBackToDashboard={backToDashboard}
      onCompleteStep5={handleCompleteStep5}
      onUploadDocuments={() => refetch?.()}
      onSubmitStep1={handleSubmitStep1}
      onSubmitStep2={handleSubmitStep2}
      onDownloadFile={handleDownloadFile}
      onApproveStep2={handleApproveStep2}
      onDownloadDraft={handleDownloadDraft}
      onCompleteStep3={handleCompleteStep3}
      onValidateDeclaration={handleValidateDeclaration}
      onDownloadFinal={handleDownloadFinal}
      onUploadAssessmentNotice={handleUploadAssessmentNotice}
      onDownloadInvoice={handleDownloadInvoice}
      onStep3DraftUpload={handleStep3DraftUpload}
      onAdminUpload={handleAdminUpload}
      adminDraftFile={adminDraftFile}
      setAdminDraftFile={setAdminDraftFile}
      isUploadingDraft={isUploadingDraft}
      onConfirmReceipt={handleConfirmReceipt}
      confirming={confirming}
      onAddStepComment={handleAddStepComment}
      step4UserComment={step4UserComment}
      setStep4UserComment={setStep4UserComment}
      step4AdminComment={step4AdminComment} 
      setStep4AdminComment={setStep4AdminComment}
        onAddStep2Comment={handleAddStep2Comment}
  step2UserComment={step2UserComment}
  setStep2UserComment={setStep2UserComment}
  step2AdminComment={step2AdminComment}
  setStep2AdminComment={setStep2AdminComment}
  isAddingStep2Comment={isAddingStep2Comment}
      isAddingStepComment={isAddingStepComment}
      userSubmissionFile={userSubmissionFile}
      setUserSubmissionFile={setUserSubmissionFile}
      isUploadingUserSubmission={isUploadingUserSubmission}
      onUserUploadSubmission={handleUserUploadSubmission}
      adminFinalFile={adminFinalFile}
      setAdminFinalFile={setAdminFinalFile}
      isUploadingFinal={isUploadingFinal}
      onAdminUploadFinal={handleAdminUploadFinal}
    />
  );
}


type RenderProps = {
  data: ViewRequestData;
  stageId: StageId;
  isAdmin: boolean;
  status: StageStatus;
  t: (key: string) => string;
  onUploadDocuments?: () => void;
  onSubmitStep1?: () => Promise<void> | void;
  onDownloadDraft?: () => void;
  onCompleteStep3: () => void;
  onStep3DraftUpload?: () => Promise<void>; 
onCompleteStep5?: () => void;
  onDownloadFinal?: () => void;
  onUploadAssessmentNotice?: () => void;
  adminNote: string;
  setAdminNote: (note: string) => void;
  onDownloadFile: (fileId: string) => void;
  onApproveStep2: (note?: string) => void;
  step2Answers: Record<string, string>;
  setStep2Answers: (
    fn: (prev: Record<string, string>) => Record<string, string>,
  ) => void;
  handleSubmitStep2Internal: () => Promise<void> | void;
onAddStep2Comment: (comment: string) => Promise<void>;
step2UserComment: string;
setStep2UserComment: (value: string) => void;
step2AdminComment: string;
setStep2AdminComment: (value: string) => void;
isAddingStep2Comment: boolean;  step4Comments: string;
  setStep4Comments: (value: string) => void;
  handleValidateInternal: () => Promise<void> | void;

  optionalEnabled: Record<string, boolean>;
  setOptionalEnabled: (
    fn: (prev: Record<string, boolean>) => Record<string, boolean>,
  ) => void;

  onAdminUpload?: (stepId?: string, documentType?: string) => Promise<void>;
  adminDraftFile?: File | null;
  setAdminDraftFile?: (f: File | null) => void;
  isUploadingDraft?: boolean;
  user?: User | null;
  onConfirmReceipt?: (fileId?: string) => Promise<void>;
  confirming?: boolean;
  onAddStepComment?: (comment: string) => Promise<void>;
  step4UserComment?: string;
  setStep4UserComment?: (value: string) => void;
  setStep4AdminComment?: (value: string) => void;
  isAddingStepComment?: boolean;
  step4AdminComment?: string;
  userSubmissionFile?: File | null;
  setUserSubmissionFile?: (f: File | null) => void;
  isUploadingUserSubmission?: boolean;
  onUserUploadSubmission?: (
    documentType?: string,
    deliveredForStep?: string,
  ) => Promise<void>;

  adminFinalFile?: File | null;
  setAdminFinalFile?: (f: File | null) => void;
  isUploadingFinal?: boolean;
  onAdminUploadFinal?: (
    stepId?: string,
    documentType?: string,
  ) => Promise<void>;
};

function renderStageContent(props: RenderProps) {
  const {
    data,
    stageId,
    status,
    isAdmin,
    t,
    onCompleteStep3,
    adminNote,
    onDownloadFile, 
    onApproveStep2,
     onStep3DraftUpload,
    onUploadDocuments,
    onAdminUpload,  
    adminDraftFile, 
    setAdminDraftFile, 
    isUploadingDraft,
    user, 
    onConfirmReceipt, 
    confirming,
    onAddStepComment,
    step4UserComment,
    setStep4UserComment,
    isAddingStepComment,
    userSubmissionFile,
    setUserSubmissionFile,
    isUploadingUserSubmission,
    onUserUploadSubmission,
    step4AdminComment,
    setStep4AdminComment,
     onCompleteStep5,
     onAddStep2Comment,
step2UserComment,
setStep2UserComment,
step2AdminComment,
setStep2AdminComment,
isAddingStep2Comment,
     
  } = props;

  const isCurrent = status === "current";
  const isCompleted = status === "completed";
const documentsReviewStep = (data.steps ?? []).find(
    (s: any) => s.id === "documentsReview"
  );
  const isStep2Approved = documentsReviewStep?.status === "DONE";

if (stageId === 1) {
  const lockStep1 = isStep2Approved && !isAdmin;
  return (
    <Stage1Section
      declaration={data}
       isCurrent={!lockStep1}
      onUploadDocuments={onUploadDocuments}
      lockEditing={isStep2Approved && !isAdmin}
    />
  );
}

  // Step 2
if (stageId === 2) {
  const documentsReviewStep = (data.steps ?? []).find(
    (s: any) => s.id === "documentsReview"
  );

  const commentHistory: any[] = documentsReviewStep?.meta?.commentHistory ?? [];
  const lastComment: any = documentsReviewStep?.meta?.lastComment ?? null;

  // نص التعليق الحالي حسب الدور
  const currentCommentValue = isAdmin
    ? (step2AdminComment ?? "")
    : (step2UserComment ?? "");

  const setCurrentCommentValue = (v: string) => {
    if (isAdmin) setStep2AdminComment?.(v);
    else setStep2UserComment?.(v);
  };

  const handleSend = () => {
    const text = currentCommentValue.trim();
    if (!text) return;
    onAddStep2Comment(text); // مهم: نرسل string مضمون
  };

  return (
    <div className="stage-block">
      <p className="muted">
        {isAdmin ? t("view.step2.admin.description") : t("view.step2.description")}
      </p>

      {/* Files (اختياري للطرفين) */}
      <h3>{t("view.step2.admin.filesTitle")}</h3>
      <ul className="doc-list">
        {(data.files ?? []).map((file) => (
          <li key={file.id} className="doc-item-row">
            <div className="doc-item-main">
              <span>
                {file.originalName} ({file.documentType})
              </span>
            </div>
            <button
              className="btn-secondary btn-small"
              onClick={() => onDownloadFile(file.id)}
            >
              {t("view.step2.admin.downloadBtn")}
            </button>
          </li>
        ))}
      </ul>

      {/* Approve فقط للـ Admin وفي الحالة current */}
      {isAdmin && isCurrent && (
        <button
          className="btn-primary"
          style={{ marginTop: 12 }}
          onClick={() => onApproveStep2(adminNote)}
        >
          {t("view.step2.admin.approveBtn")}
        </button>
      )}

      {isCompleted && (
        <p className="success-text" style={{ marginTop: 12 }}>
          {t("view.step2.completed")}
        </p>
      )}

      {/* Comments Section (مشترك للطرفين) */}
      <div style={{ marginTop: 16 }}>
        <h4 className="font-medium">Comments</h4>

        {lastComment && (
          <div className="muted small" style={{ marginTop: 6 }}>
            Last comment: <strong>{lastComment.text}</strong>{" "}
            <em>({new Date(lastComment.at).toLocaleString()})</em>
          </div>
        )}

        {/* input + actions */}
        <div style={{ marginTop: 12 }}>
          <label className="block mb-2 font-medium">
            Add Comment {isAdmin ? "(for client)" : "(for admin)"}
          </label>

          <textarea
            className="input-textarea"
            value={currentCommentValue}
            onChange={(e) => setCurrentCommentValue(e.target.value)}
            rows={4}
            placeholder={
              isAdmin
                ? "Write a note for the client..."
                : "Write a question or note for the admin..."
            }
          />

          <div style={{ marginTop: 8 }}>
            <button
              className="btn-secondary"
              onClick={() => setCurrentCommentValue("")}
              disabled={!!isAddingStep2Comment}
              style={{ marginRight: 8 }}
            >
              Cancel
            </button>

            <button
              className="btn-primary"
              onClick={handleSend}
              disabled={!!isAddingStep2Comment || !currentCommentValue.trim()}
            >
              {isAddingStep2Comment ? "Sending..." : "Add Comment"}
            </button>
          </div>
        </div>

        {/* history */}
        <div style={{ marginTop: 16 }}>
          {commentHistory.length > 0 ? (
            <ul style={{ marginTop: 8 }}>
              {commentHistory.map((c: any, idx: number) => (
                <li key={idx} className="border rounded p-3 mb-2">
                  <div style={{ fontSize: 12, color: "#666" }}>
                    <strong>
                      {c.by === user?.id
                        ? "You"
                        : c.byName || c.byEmail || "Unknown"}
                    </strong>{" "}
                    — {c.at ? new Date(c.at).toLocaleString() : "unknown time"}
                  </div>
                  <div style={{ marginTop: 6 }}>{c.text}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small" style={{ marginTop: 8 }}>
              No comments yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


if (stageId === 3) {
  const draftFileForStep4 = (data.files ?? []).find(
    (f) => f.meta?.deliveredForStep === "reviewAndValidation"
  );

  return (
    <div className="stage-block">
      <p className="muted">{t("view.step3.text")}</p>
      <p className="muted small">{t("view.step3.eta")}</p>
      {isCurrent && isAdmin && (
        <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
          <label className="block mb-2 font-medium">
            Admin: Upload Tax Declaration Draft (PDF)
          </label>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setAdminDraftFile?.(f);
            }}
          />

          <div style={{ marginTop: 8 }}>
            <button
              className="btn-primary"
              disabled={isUploadingDraft || !adminDraftFile}
              onClick={onStep3DraftUpload}
            >
              {isUploadingDraft ? "Uploading..." : "Upload Draft"}
            </button>
          </div>
        </div>
      )}

      {isAdmin && isCurrent && (
        <div style={{ marginTop: 24 }}>
          <button
            className="btn-primary"
            onClick={onCompleteStep3}
            disabled={!draftFileForStep4}
          >
            Mark as Prepared & Complete Step 3
          </button>
          {!draftFileForStep4 && (
            <p className="muted small mt-2">
              You must upload the draft file before completing this step.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

  if (stageId === 4) {
    const stepsArr = data.steps ?? [];

    const reviewStep =
      stepsArr.find((s: any) => s?.id === "reviewAndValidation") ||
      stepsArr.find((s: any) => s?.nameKey === "steps.reviewAndValidation") ||
      stepsArr.find(
        (s: any) =>
          typeof s?.id === "string" &&
          s.id.toLowerCase().includes("review") &&
          !s.id.toLowerCase().includes("documents"),
      ) ||
      stepsArr.find(
        (s: any) =>
          typeof s?.nameKey === "string" &&
          s.nameKey.toLowerCase().includes("review") &&
          !s.nameKey.toLowerCase().includes("documents"),
      ) ||
      null;
    const commentHistory: any[] = reviewStep?.meta?.commentHistory ?? [];
    const lastComment: any = reviewStep?.meta?.lastComment ?? null;
    const step4Files = (data.files ?? []).filter(
      (f: any) => f?.meta?.deliveredForStep === "reviewAndValidation",
    );
    const latest = step4Files.length ? step4Files[step4Files.length - 1] : null;

    return (
      <div className="stage-block">
        <p className="muted">{t("view.step4.description")}</p>
        {latest ? (
          <div
            style={{ marginTop: 12 }}
            className="flex items-center justify-between"
          >
            <div>
              <strong>{latest.originalName}</strong>
              {latest.uploadedAt && (
                <div className="muted small">
                  Uploaded: {new Date(latest.uploadedAt).toLocaleString()}
                </div>
              )}
              {lastComment && (
                <div className="muted small" style={{ marginTop: 6 }}>
                  Last comment: <strong>{lastComment.text}</strong>{" "}
                  <em>({new Date(lastComment.at).toLocaleString()})</em>
                </div>
              )}
            </div>

            <div>
              <button
                className="btn-secondary"
                onClick={() => onDownloadFile(latest.id)}
              >
                {t("view.download")}
              </button>
            </div>
          </div>
        ) : (
          <p className="muted" style={{ marginTop: 12 }}>
            {t("view.step4.noDraftYet") ?? "No draft uploaded yet."}
          </p>
        )}
    
        {!isAdmin && !latest && (
          <p className="muted small" style={{ marginTop: 12 }}>
            {t("view.step4.waitingForAdmin") ??
              "Waiting for admin to upload the draft."}
          </p>
        )}
        {latest &&
          latest.meta?.downloadedBy === user?.id &&
          data.currentStage === 4 && (
            <div style={{ marginTop: 12 }}>
              <button
                className="btn-primary"
                disabled={!!confirming}
                onClick={() => onConfirmReceipt?.(latest.id)}
              >
                {confirming
                  ? "Confirming..."
                  : "Confirm you received the draft"}
              </button>
            </div>
          )}
        {isCurrent && (
          <div style={{ marginTop: 12 }}>
            <label className="block mb-2 font-medium">
              Add Comment {isAdmin ? "(for client)" : "(optional)"}
            </label>
            <textarea
              className="input-textarea"
              value={isAdmin ? step4AdminComment : step4UserComment}
              onChange={(e) => {
                if (isAdmin) {
                  setStep4AdminComment?.(e.target.value);
                } else {
                  setStep4UserComment?.(e.target.value);
                }
              }}
              placeholder={
                isAdmin
                  ? "Write a comment for the client..."
                  : "Example: I found an error on page 2, line 5..."
              }
              rows={4}
            />
            <div style={{ marginTop: 8 }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  if (isAdmin) {
                    setStep4AdminComment?.("");
                  } else {
                    setStep4UserComment?.("");
                  }
                }}
                disabled={isAddingStepComment}
                style={{ marginRight: 8 }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  const comment = isAdmin
                    ? step4AdminComment
                    : step4UserComment;
                  onAddStepComment?.(comment ?? "");
                }}
                disabled={
                  isAddingStepComment ||
                  !(isAdmin ? step4AdminComment : step4UserComment)?.trim()
                }
              >
                {isAddingStepComment ? "Sending..." : "Add Comment"}
              </button>
            </div>
          </div>
        )}
    <div style={{ marginTop: 16 }}>
  <h4 className="font-medium">Comments</h4>
  {commentHistory.length > 0 ? (
<ul style={{ marginTop: 8 }}>
  {commentHistory.map((c: any, idx: number) => (
    <li key={idx} className="border rounded p-3 mb-2">
  <div style={{ fontSize: 12, color: "#666" }}>
    <strong>{c.by === user?.id ? "You" : c.byName || c.byEmail}</strong> —{" "}
    {c.at ? new Date(c.at).toLocaleString() : "unknown time"}
  </div>
  <div style={{ marginTop: 6 }}>{c.text}</div>
</li>
  ))}
</ul>
  ) : (
    <p className="muted small" style={{ marginTop: 8 }}>
      No comments yet.
    </p>
  )}
</div>
      </div>
    );
  }

  if (stageId === 5) {
    const submissionFiles = (data.files ?? []).filter(
      (f: any) => f?.meta?.deliveredForStep === "submission",
    );
    const adminFiles = submissionFiles.filter(
      (f) => f?.meta?.uploaderRole === "admin",
    );
    const userFiles = submissionFiles.filter(
      (f) => f?.meta?.uploaderRole === "user",
    );
const canUserUploadInStep5 = !isAdmin && (isCurrent || isCompleted);

    return (
      <div className="stage-block">
        <p className="muted">{t("view.step5.description")}</p>

        <ul className="submission-info">
          <li>
            <strong>{t("view.step5.date")}:</strong> {data.step5?.date || "—"}
          </li>
          <li>
            <strong>{t("view.step5.method")}:</strong>{" "}
            {data.step5?.method || "—"}
          </li>
        </ul>

        <div style={{ marginTop: 12 }}>
          <h4>Admin uploaded files</h4>
          {adminFiles.length ? (
            <ul>
              {adminFiles.map((f: any) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between mb-2"
                >
                  <div>
                    <strong>{f.originalName}</strong>
                    <div className="muted small">
                      uploaded:{" "}
                      {f.uploadedAt
                        ? new Date(f.uploadedAt).toLocaleString()
                        : "unknown"}
                    </div>
                    <div className="muted small">by: admin</div>
                  </div>
                  <div>
                    <button
                      className="btn-secondary btn-small"
                      onClick={() => onDownloadFile(f.id)}
                    >
                      {t("view.download")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">No admin files yet.</p>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <h4>User uploaded files</h4>
          {userFiles.length ? (
            <ul>
              {userFiles.map((f: any) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between mb-2"
                >
                  <div>
                    <strong>{f.originalName}</strong>
                    <div className="muted small">
                      uploaded:{" "}
                      {f.uploadedAt
                        ? new Date(f.uploadedAt).toLocaleString()
                        : "unknown"}
                    </div>
                    <div className="muted small">
                      by: {f.meta?.uploadedBy ?? "user"}
                    </div>
                  </div>
                  <div>
                    <button
                      className="btn-secondary btn-small"
                      onClick={() => onDownloadFile(f.id)}
                    >
                      {t("view.download")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">No user files yet.</p>
          )}
        </div>
        {isCurrent && isAdmin && (
          <div style={{ marginTop: 16 }}>
            <label className="block mb-2 font-medium">
              Admin: upload final file (PDF)
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setAdminDraftFile?.(f);
              }}
            />

            <div style={{ marginTop: 8 }}>
              <button
                className="btn-primary"
                disabled={isUploadingDraft || !adminDraftFile}
                onClick={() => onAdminUpload?.("submission", "final_file")}
              >
                {isUploadingDraft ? "Uploading..." : "Upload final file"}
              </button>
                   <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #eee' }}>
          <button className="btn-primary" onClick={onCompleteStep5}>
            Mark as Fully Completed & Finish Declaration
          </button>
        </div>
            </div>
          </div>
          
        )}

        {canUserUploadInStep5 && (
  <div style={{ marginTop: 16 }}>
    <label className="block mb-2 font-medium">
      Upload assessment notice (if any)
    </label>
    <input
      type="file"
      accept="application/pdf"
      onChange={(e) => {
        const f = e.target.files?.[0] ?? null;
        setUserSubmissionFile?.(f);
      }}
    />
    <div style={{ marginTop: 8 }}>
      <button
        className="btn-primary"
        disabled={isUploadingUserSubmission || !userSubmissionFile}
        onClick={() =>
          onUserUploadSubmission?.("assessment_notice", "submission")
        }
      >
        {isUploadingUserSubmission ?? false
          ? "Uploading..."
          : "Upload notice"}
      </button>
    </div>
  </div>
)}
        <p className="success-text" style={{ marginTop: 12 }}>
          {t("view.step5.thanks")}
        </p>
      </div>
    );
  }
}
