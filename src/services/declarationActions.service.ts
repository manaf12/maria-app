import axiosClient from "../api/axiosClient";

export const declarationActions = {
  // ====== Files ======
  async getFileUrl(fileId: string) {
    return axiosClient.get(`/files/${fileId}/url`);
  },

  // ====== Comments ======
  async addStep2Comment(declarationId: string, comment: string) {
    return axiosClient.post(
      `/orders/${declarationId}/steps/documentsReview/comment`,
      { comment }
    );
  },

  async addStep4Comment(declarationId: string, comment: string) {
    return axiosClient.post(
      `/orders/${declarationId}/steps/reviewAndValidation/comment`,
      { comment }
    );
  },

  async confirmDraftReceipt(declarationId: string, fileId?: string) {
    return axiosClient.post(
      `/orders/${declarationId}/steps/reviewAndValidation/confirm-download`,
      { fileId }
    );
  },

  // ====== Admin actions ======
  async approveStep2(declarationId: string, note?: string) {
    return axiosClient.patch(`/admin/declarations/${declarationId}/review`, {
      status: { status: "DONE" },
      note,
    });
  },

  async completeStep3(declarationId: string) {
    return axiosClient.patch(
      `/admin/declarations/${declarationId}/steps/taxPreparation/complete`
    );
  },

  async completeStep5(declarationId: string) {
    return axiosClient.patch(
      `/admin/declarations/${declarationId}/steps/submission/complete`
    );
  },
};
