import classNames from "classnames";
import { useAppStore } from "../../store/app-store";
import { useProjectStore } from "../../store/project-store";
import { AppState } from "../../types";
import CodePreview from "../preview/CodePreview";
import KeyboardShortcutBadge from "../core/KeyboardShortcutBadge";
// import TipLink from "../messages/TipLink";
import SelectAndEditModeToggleButton from "../select-and-edit/SelectAndEditModeToggleButton";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useEffect, useRef, useState } from "react";
import HistoryDisplay from "../history/HistoryDisplay";
import Variants from "../variants/Variants";

interface SidebarProps {
  showSelectAndEditFeature: boolean;
  doUpdate: (instruction: string) => void;
  regenerate: () => void;
  cancelCodeGeneration: () => void;
}

function Sidebar({
  showSelectAndEditFeature,
  doUpdate,
  regenerate,
  cancelCodeGeneration,
}: SidebarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isErrorExpanded, setIsErrorExpanded] = useState(false);

  const { appState, updateInstruction, setUpdateInstruction } = useAppStore();

  const { inputMode, referenceImages, head, commits } = useProjectStore();

  const viewedCode =
    head && commits[head]
      ? commits[head].variants[commits[head].selectedVariantIndex].code
      : "";

  // Check if the currently selected variant is complete
  const isSelectedVariantComplete =
    head &&
    commits[head] &&
    commits[head].variants[commits[head].selectedVariantIndex].status ===
      "complete";

  // Check if the currently selected variant has an error
  const isSelectedVariantError =
    head &&
    commits[head] &&
    commits[head].variants[commits[head].selectedVariantIndex].status ===
      "error";

  // Get the error message from the selected variant
  const selectedVariantErrorMessage =
    head &&
    commits[head] &&
    commits[head].variants[commits[head].selectedVariantIndex].errorMessage;

  // Focus on the update instruction textarea when a variant is complete
  useEffect(() => {
    if (
      (appState === AppState.CODE_READY || isSelectedVariantComplete) &&
      textareaRef.current
    ) {
      textareaRef.current.focus();
    }
  }, [appState, isSelectedVariantComplete]);

  // Reset error expanded state when variant changes
  useEffect(() => {
    setIsErrorExpanded(false);
  }, [head, commits[head || ""]?.selectedVariantIndex]);

  return (
    <>
      <Variants />

      {/* Show code preview when coding and the selected variant is not complete */}
      {appState === AppState.CODING && !isSelectedVariantComplete && (
        <div className="flex flex-col">
          {/* Speed disclaimer for video mode */}
          {inputMode === "video" && (
            <div
              className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700
            p-2 text-xs mb-4 mt-1"
            >
              Code generation from videos can take 3-4 minutes. We do multiple
              passes to get the best result. Please be patient.
            </div>
          )}

          <CodePreview code={viewedCode} />

          <div className="flex w-full">
            <Button
              onClick={cancelCodeGeneration}
              className="w-full dark:text-white dark:bg-gray-700"
            >
              Cancel All Generations
            </Button>
          </div>
        </div>
      )}

      {/* Show error message when selected option has an error */}
      {isSelectedVariantError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-2">
          <div className="text-red-800 text-sm">
            <div className="font-medium mb-1">
              This option failed to generate because
            </div>
            {selectedVariantErrorMessage && (
              <div className="mb-2">
                <div className="text-red-700 bg-red-100 border border-red-300 rounded px-2 py-1 text-xs font-mono break-words">
                  {selectedVariantErrorMessage.length > 200 && !isErrorExpanded
                    ? `${selectedVariantErrorMessage.slice(0, 200)}...`
                    : selectedVariantErrorMessage}
                </div>
                {selectedVariantErrorMessage.length > 200 && (
                  <button
                    onClick={() => setIsErrorExpanded(!isErrorExpanded)}
                    className="text-red-600 text-xs underline mt-1 hover:text-red-800"
                  >
                    {isErrorExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            )}
            <div>Switch to another option above to make updates.</div>
          </div>
        </div>
      )}

      {/* Show update UI when app state is ready OR the selected variant is complete (but not errored) */}
      {(appState === AppState.CODE_READY || isSelectedVariantComplete) &&
        !isSelectedVariantError && (
          <div>
            <div className="grid w-full gap-2">
              <Textarea
                ref={textareaRef}
                placeholder="Tell the AI what to change..."
                onChange={(e) => setUpdateInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    doUpdate(updateInstruction);
                  }
                }}
                value={updateInstruction}
              />
              <Button
                onClick={() => doUpdate(updateInstruction)}
                className="dark:text-white dark:bg-gray-700 update-btn"
              >
                Update <KeyboardShortcutBadge letter="enter" />
              </Button>
            </div>
            <div className="flex items-center justify-end gap-x-2 mt-2">
              <Button
                onClick={regenerate}
                className="flex items-center gap-x-2 dark:text-white dark:bg-gray-700 regenerate-btn"
              >
                🔄 Regenerate
              </Button>
              {showSelectAndEditFeature && <SelectAndEditModeToggleButton />}
            </div>
            {/* <div className="flex justify-end items-center mt-2">
            <TipLink />
          </div> */}
          </div>
        )}

      {/* Reference image display */}
      <div className="flex gap-x-2 mt-2">
        {referenceImages.length > 0 && (
          <div className="flex flex-col">
            <div
              className={classNames({
                "scanning relative": appState === AppState.CODING,
              })}
            >
              {inputMode === "image" && (
                <img
                  className="w-[340px] border border-gray-200 rounded-md"
                  src={referenceImages[0]}
                  alt="Reference"
                />
              )}
              {inputMode === "video" && (
                <video
                  muted
                  autoPlay
                  loop
                  className="w-[340px] border border-gray-200 rounded-md"
                  src={referenceImages[0]}
                />
              )}
            </div>
            <div className="text-gray-400 uppercase text-sm text-center mt-1">
              {inputMode === "video" ? "Original Video" : "Original Screenshot"}
            </div>
          </div>
        )}
      </div>

      <HistoryDisplay shouldDisableReverts={appState === AppState.CODING} />
    </>
  );
}

export default Sidebar;
