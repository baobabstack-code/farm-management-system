"use client";

import { useState, useEffect, useRef } from "react";
import {
  FarmCard,
  FarmCardHeader,
  FarmCardContent,
  FarmButton,
  FarmInput,
} from "@/components/ui/farm-theme";
import { AlertTriangle, X, Info, AlertCircle } from "lucide-react";

export interface DependencyItem {
  entity: string;
  count: number;
  blocking: boolean;
  description?: string;
}

export interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  entityName: string;
  entityType: string;
  onConfirm: () => void;
  onCancel: () => void;
  dependencies?: DependencyItem[];
  loading?: boolean;
  customWarningMessage?: string;
  requireConfirmationText?: boolean;
  confirmationText?: string;
}

export default function DeleteConfirmationDialog({
  isOpen,
  entityName,
  entityType,
  onConfirm,
  onCancel,
  dependencies = [],
  loading = false,
  customWarningMessage,
  requireConfirmationText = true,
  confirmationText,
}: DeleteConfirmationDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);

  const expectedText = confirmationText || `DELETE ${entityName}`;
  const isConfirmValid =
    !requireConfirmationText || confirmText === expectedText;
  const hasBlockingDependencies = dependencies.some((dep) => dep.blocking);

  // Focus management and keyboard navigation
  useEffect(() => {
    if (isOpen) {
      // Focus the cancel button when dialog opens
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 100);

      // Reset confirmation text
      setConfirmText("");
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onCancel]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  // Handle tab trapping
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, input, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <div
        ref={dialogRef}
        className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        <FarmCard className="border-0 shadow-none">
          <div id="delete-dialog-title" className="sr-only">
            Delete {entityType}
          </div>
          <FarmCardHeader
            title={`Delete ${entityType}`}
            badge={
              <FarmButton
                ref={cancelButtonRef}
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8 w-8 p-0"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </FarmButton>
            }
          />
          <FarmCardContent>
            <div className="space-y-4">
              {/* Warning Icon and Message */}
              <div
                className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-lg"
                id="delete-dialog-description"
              >
                <AlertTriangle
                  className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <h4 className="font-medium text-destructive mb-1">
                    This action cannot be undone
                  </h4>
                  <p className="text-sm text-destructive/80">
                    {customWarningMessage ||
                      `All data associated with "${entityName}" will be permanently deleted.`}
                  </p>
                </div>
              </div>

              {/* Dependencies Warning */}
              {dependencies.length > 0 && (
                <div
                  className="space-y-3"
                  role="region"
                  aria-label="Dependencies information"
                >
                  <div className="flex items-center gap-2">
                    {hasBlockingDependencies ? (
                      <AlertCircle
                        className="w-5 h-5 text-destructive"
                        aria-hidden="true"
                      />
                    ) : (
                      <Info
                        className="w-5 h-5 text-warning"
                        aria-hidden="true"
                      />
                    )}
                    <h4 className="font-medium text-foreground">
                      {hasBlockingDependencies
                        ? "Cannot Delete - Dependencies Found"
                        : "Related Data"}
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {dependencies.map((dep, index) => (
                      <div
                        key={index}
                        className={`flex items-start justify-between p-3 rounded-lg border ${
                          dep.blocking
                            ? "bg-destructive/5 border-destructive/20"
                            : "bg-warning/5 border-warning/20"
                        }`}
                        role="listitem"
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium block">
                            {dep.entity}
                          </span>
                          {dep.description && (
                            <span className="text-xs text-muted-foreground">
                              {dep.description}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            dep.blocking ? "text-destructive" : "text-warning"
                          }`}
                        >
                          {dep.count} {dep.count === 1 ? "item" : "items"}
                        </span>
                      </div>
                    ))}
                  </div>
                  {hasBlockingDependencies && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <AlertCircle
                        className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <p className="text-sm text-destructive">
                        Please remove or reassign the related items before
                        deleting this {entityType.toLowerCase()}.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Confirmation Input */}
              {!hasBlockingDependencies && requireConfirmationText && (
                <div className="space-y-2">
                  <label
                    htmlFor="delete-confirmation-input"
                    className="text-sm font-medium text-foreground"
                  >
                    Type "{expectedText}" to confirm:
                  </label>
                  <FarmInput
                    ref={confirmInputRef}
                    id="delete-confirmation-input"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={expectedText}
                    className="font-mono"
                    aria-describedby="confirmation-help"
                    autoComplete="off"
                  />
                  <p
                    id="confirmation-help"
                    className="text-xs text-muted-foreground"
                  >
                    This confirmation helps prevent accidental deletions.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <FarmButton
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                  disabled={loading}
                  aria-label="Cancel deletion"
                >
                  Cancel
                </FarmButton>
                {!hasBlockingDependencies && (
                  <FarmButton
                    variant="destructive"
                    onClick={onConfirm}
                    disabled={!isConfirmValid || loading}
                    loading={loading}
                    className="flex-1"
                    aria-label={`Confirm deletion of ${entityName}`}
                  >
                    {loading ? "Deleting..." : "Delete Forever"}
                  </FarmButton>
                )}
              </div>
            </div>
          </FarmCardContent>
        </FarmCard>
      </div>
    </div>
  );
}
