import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { CropService } from "@/lib/db";
import { cropUpdateSchema } from "@/lib/validations/crop";
import { ActivityLogger } from "@/lib/activity-logger";
import { ApiResponseHandler } from "@/lib/api-response-handler";

export const GET = ApiResponseHandler.withErrorHandling(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { userId } = await auth();
    ApiResponseHandler.requireAuth(userId);

    const { id } = await params;
    const crop = await CropService.findById(id, userId);

    if (!crop) {
      return ApiResponseHandler.notFound("Crop");
    }

    return ApiResponseHandler.success(crop);
  }
);

export const PUT = ApiResponseHandler.withErrorHandling(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { userId } = await auth();
    ApiResponseHandler.requireAuth(userId);

    const validatedData = (await ApiResponseHandler.validateBody(
      request,
      cropUpdateSchema
    )) as any;
    const { id } = await params;

    // Check if crop exists and belongs to user
    const existingCrop = await CropService.findById(id, userId);
    if (!existingCrop) {
      return ApiResponseHandler.notFound("Crop");
    }

    const updateData: any = { ...validatedData };
    if (validatedData.plantingDate) {
      updateData.plantingDate = new Date(validatedData.plantingDate);
    }
    if (validatedData.expectedHarvestDate) {
      updateData.expectedHarvestDate = new Date(
        validatedData.expectedHarvestDate
      );
    }

    const updatedCrop = await CropService.update(id, userId, updateData);

    // Log activity with changes
    const changes: Record<string, any> = {};
    if (validatedData && typeof validatedData === "object") {
      Object.entries(validatedData).forEach(([key, value]) => {
        if (value !== (existingCrop as any)[key]) {
          changes[key] = { from: (existingCrop as any)[key], to: value };
        }
      });
    }

    if (Object.keys(changes).length > 0) {
      await ActivityLogger.cropUpdated(userId, id, updatedCrop.name, changes);
    }

    // Check for status changes
    if (validatedData.status && validatedData.status !== existingCrop.status) {
      await ActivityLogger.cropStatusChanged(
        userId,
        id,
        updatedCrop.name,
        existingCrop.status,
        validatedData.status
      );
    }

    return ApiResponseHandler.success(updatedCrop, "Crop updated successfully");
  }
);

export const DELETE = ApiResponseHandler.withErrorHandling(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { userId } = await auth();
    ApiResponseHandler.requireAuth(userId);

    const { id } = await params;

    // Check if crop exists and belongs to user
    const existingCrop = await CropService.findById(id, userId);
    if (!existingCrop) {
      return ApiResponseHandler.notFound("Crop");
    }

    // Log activity before deletion
    await ActivityLogger.cropDeleted(userId, id, existingCrop.name);

    await CropService.delete(id, userId);

    return ApiResponseHandler.success(
      { id, name: existingCrop.name },
      "Crop deleted successfully"
    );
  }
);
