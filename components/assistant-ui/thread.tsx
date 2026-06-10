import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from "@/components/assistant-ui/attachment";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import {
  Reasoning,
  ReasoningContent,
  ReasoningRoot,
  ReasoningText,
  ReasoningTrigger,
} from "@/components/assistant-ui/reasoning";
import {
  ToolGroupContent,
  ToolGroupRoot,
  ToolGroupTrigger,
} from "@/components/assistant-ui/tool-group";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ActionBarMorePrimitive,
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  getMcpAppFromToolPart,
  MessagePrimitive,
  SuggestionPrimitive,
  ThreadPrimitive,
  useAui,
  useAuiState,
} from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  SquareIcon,
} from "lucide-react";
import { type FC, useState, useEffect } from "react";
import { useStrings } from "@/lib/strings-context";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-background"
      style={{
        ["--thread-max-width" as string]: "44rem",
        ["--composer-radius" as string]: "24px",
        ["--composer-padding" as string]: "10px",
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        data-slot="aui_thread-viewport"
        className="relative flex min-h-0 flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth"
      >
        <div className="mx-auto flex w-full max-w-(--thread-max-width) flex-1 flex-col px-4 pt-4">
          <AuiIf condition={(s) => s.thread.isEmpty}>
            <ThreadWelcome />
          </AuiIf>

          <div
            data-slot="aui_message-group"
            className="mb-10 flex flex-col gap-y-8 empty:hidden"
          >
            <ThreadPrimitive.Messages>
              {() => <ThreadMessage />}
            </ThreadPrimitive.Messages>
          </div>

          <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mt-auto flex h-0 flex-col overflow-visible">
            <ThreadScrollToBottom />
          </ThreadPrimitive.ViewportFooter>
        </div>
      </ThreadPrimitive.Viewport>
      <div
        data-slot="aui_composer-dock"
        className="mx-auto w-full max-w-(--thread-max-width) shrink-0 px-4 pb-4 md:pb-6"
      >
        <Composer />
      </div>
    </ThreadPrimitive.Root>
  );
};

const ThreadMessage: FC = () => {
  const role = useAuiState((s) => s.message.role);
  const isEditing = useAuiState((s) => s.message.composer.isEditing);

  if (isEditing) return <EditComposer />;
  if (role === "user") return <UserMessage />;
  return <AssistantMessage />;
};

const ThreadScrollToBottom: FC = () => {
  const s = useStrings();
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip={s.scrollToBottom}
        variant="outline"
        className="aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:border-border dark:bg-background dark:hover:bg-accent"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  const s = useStrings();
  return (
    <div className="aui-thread-welcome-root my-auto flex grow flex-col">
      <div className="aui-thread-welcome-center flex w-full grow flex-col items-center justify-center">
        <div className="aui-thread-welcome-message flex size-full flex-col justify-center px-4">
          <h1 className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both font-semibold text-3xl duration-300 bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
            {s.welcomeTitle}
          </h1>
          <p className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-muted-foreground text-lg delay-75 duration-300">
            {s.welcomeSubtitle}
          </p>
        </div>
      </div>
      <ThreadSuggestions />
    </div>
  );
};

const ThreadSuggestions: FC = () => {
  return (
    <div className="aui-thread-welcome-suggestions grid w-full @md:grid-cols-2 gap-2 pb-4">
      <ThreadPrimitive.Suggestions>
        {() => <ThreadSuggestionItem />}
      </ThreadPrimitive.Suggestions>
    </div>
  );
};

const ThreadSuggestionItem: FC = () => {
  return (
    <div className="aui-thread-welcome-suggestion-display fade-in slide-in-from-bottom-2 @md:nth-[n+3]:block nth-[n+3]:hidden animate-in fill-mode-both duration-200">
      <SuggestionPrimitive.Trigger send asChild>
        <Button
          variant="ghost"
          className="aui-thread-welcome-suggestion h-auto w-full @md:flex-col flex-wrap items-start justify-start gap-1 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-start text-sm backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/15"
        >
          <SuggestionPrimitive.Title className="aui-thread-welcome-suggestion-text-1 font-medium" />
          <SuggestionPrimitive.Description className="aui-thread-welcome-suggestion-text-2 text-muted-foreground empty:hidden" />
        </Button>
      </SuggestionPrimitive.Trigger>
    </div>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
      <ComposerPrimitive.AttachmentDropzone asChild>
        <div
          data-slot="aui_composer-shell"
          className="flex w-full flex-col gap-2 rounded-(--composer-radius) border border-white/10 bg-white/6 p-(--composer-padding) backdrop-blur-md transition-all focus-within:border-purple-500/40 focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.3),0_0_28px_rgba(139,92,246,0.12)] data-[dragging=true]:border-primary/50 data-[dragging=true]:border-dashed data-[dragging=true]:bg-accent/50"
        >
          <ComposerAttachments />
          <ComposerInput />
          <ComposerAction />
        </div>
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
};

const ComposerInput: FC = () => {
  const s = useStrings();
  return (
    <ComposerPrimitive.Input
      placeholder={s.composerPlaceholder}
      className="aui-composer-input max-h-32 min-h-10 w-full resize-none bg-transparent px-1.75 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
      rows={1}
      autoFocus
      aria-label={s.composerAriaLabel}
    />
  );
};

const ComposerAction: FC = () => {
  const str = useStrings();
  return (
    <div className="aui-composer-action-wrapper relative flex items-center justify-between">
      <ComposerAddAttachment />
      <AuiIf condition={(st) => !st.thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip={str.sendMessage}
            side="bottom"
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-send size-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 border-0 text-white transition-all hover:scale-105 hover:shadow-[0_0_16px_rgba(139,92,246,0.5)]"
            aria-label={str.sendMessageAriaLabel}
          >
            <ArrowUpIcon className="aui-composer-send-icon size-4" />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </AuiIf>
      <AuiIf condition={(st) => st.thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-cancel size-8 rounded-full"
            aria-label={str.stopGeneratingAriaLabel}
          >
            <SquareIcon className="aui-composer-cancel-icon size-3 fill-current" />
          </Button>
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </div>
  );
};



const ThinkingIndicator: FC = () => {
  const thinkingPhrases = useStrings().thinkingPhrases;
  const [phraseIdx, setPhraseIdx] = useState(0);
  // Index into thinkingLogs array; advances automatically so even batched
  // messages that arrive simultaneously are shown one-by-one.
  const [logIdx, setLogIdx] = useState(0);

  const isThinking = useAuiState((s) => {
    if (s.message.status?.type !== "running") return false;
    return !s.message.content.some(
      (p) =>
        p.type === "text" &&
        (p as { type: "text"; text: string }).text.length > 0,
    );
  });

  const logTexts = useAuiState(
    (s) =>
      (s.message.metadata?.custom as Record<string, unknown> | undefined)
        ?.thinkingLogs as string[] | undefined,
  );

  // Accumulated LLM reasoning text streamed via type:"thinking" SSE events.
  const thinkingText = useAuiState(
    (s) =>
      (s.message.metadata?.custom as Record<string, unknown> | undefined)
        ?.thinkingText as string | undefined,
  );

  useEffect(() => {
    if (!isThinking) return;
    const id = setInterval(
      () => setPhraseIdx((i) => (i + 1) % thinkingPhrases.length),
      1800,
    );
    return () => clearInterval(id);
  }, [isThinking]);

  // Advance through log messages at ~1.5 s each so that messages arriving
  // simultaneously (same SSE chunk) still animate sequentially.
  useEffect(() => {
    if (!logTexts || logTexts.length === 0) return;
    // If we're already at or past the last item do nothing; a new item will
    // trigger this effect again when logTexts.length grows.
    if (logIdx >= logTexts.length - 1) return;
    const id = setTimeout(() => setLogIdx((i) => i + 1), 1500);
    return () => clearTimeout(id);
  }, [logTexts?.length, logIdx]);

  if (!isThinking) return null;

  // Show the tail of the streaming reasoning text (last 300 chars) so the
  // display stays compact even for long chain-of-thought responses.
  const reasoningTail = thinkingText && thinkingText.length > 0
    ? (thinkingText.length > 300 ? "…" + thinkingText.slice(-300) : thinkingText)
    : null;

  return (
    <div className="flex items-start gap-3 py-3 px-2">
      {/* Orbital animation */}
      <div className="relative w-9 h-9 flex items-center justify-center shrink-0 mt-0.5">
        {/* Pulsing core */}
        <div
          className="w-2.5 h-2.5 rounded-full bg-primary"
          style={{ animation: "thinking-core-pulse 2s ease-in-out infinite" }}
        />
        {/* Orbit 1 — fast / inner / violet */}
        <div
          className="absolute w-1.5 h-1.5 rounded-full bg-violet-400"
          style={{
            animation: "thinking-orbit-1 1.4s linear infinite",
            boxShadow: "0 0 5px rgba(167,139,250,0.9)",
          }}
        />
        {/* Orbit 2 — medium / outer / indigo */}
        <div
          className="absolute w-1.5 h-1.5 rounded-full bg-indigo-400"
          style={{
            animation: "thinking-orbit-2 2s linear infinite",
            boxShadow: "0 0 5px rgba(129,140,248,0.9)",
          }}
        />
        {/* Orbit 3 — slow / small / fuchsia */}
        <div
          className="absolute w-1 h-1 rounded-full bg-fuchsia-400"
          style={{
            animation: "thinking-orbit-3 2.6s linear infinite",
            boxShadow: "0 0 4px rgba(232,121,249,0.9)",
          }}
        />
      </div>

      {/* Reasoning text (streaming) → cycling log entries → cycling phrases */}
      <div className="flex flex-col gap-1 min-w-0">
        {reasoningTail ? (
          <span
            className="text-xs text-muted-foreground/70 leading-relaxed break-words font-mono whitespace-pre-wrap"
            style={{ animation: "thinking-text-in 0.15s ease-out forwards" }}
          >
            {reasoningTail}
            <span
              className="inline-block w-0.5 h-3 bg-primary/60 ml-0.5 align-text-bottom"
              style={{ animation: "thinking-cursor-blink 0.8s step-end infinite" }}
            />
          </span>
        ) : logTexts && logTexts.length > 0 ? (
          <span
            key={logIdx}
            className="text-sm text-muted-foreground/80 leading-snug break-words"
            style={{ animation: "thinking-text-in 0.25s ease-out forwards" }}
          >
            {logTexts[logIdx]}
          </span>
        ) : (
          <div className="flex items-baseline gap-0 text-sm text-muted-foreground select-none">
            <span
              key={phraseIdx}
              style={{ animation: "thinking-text-in 0.35s ease-out forwards" }}
            >
              {thinkingPhrases[phraseIdx]}
            </span>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block"
                style={{
                  animation: "thinking-dot-bounce 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }}
              >
                .
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm dark:bg-destructive/5 dark:text-red-200">
        <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const MessageSuggestionButton: FC<{
  suggestion: { title: string; label: string; prompt: string };
}> = ({ suggestion }) => {
  const aui = useAui();
  const disabled = useAuiState((s) => s.thread.isDisabled);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        const thread = aui.thread();
        if (thread.getState().isRunning) return;
        thread.append({
          content: [{ type: "text", text: suggestion.prompt }],
        });
      }}
      className="aui-message-suggestion rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm transition-all hover:bg-white/10 hover:border-white/25 hover:scale-[1.02] flex items-baseline gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="font-medium">{suggestion.title}</span>
      {suggestion.label && (
        <span className="text-muted-foreground text-xs">{suggestion.label}</span>
      )}
    </button>
  );
};

const MessageSuggestions: FC = () => {
  const suggestions = useAuiState(
    (s) =>
      (s.message.metadata?.custom as Record<string, unknown> | undefined)
        ?.suggestions as Array<{ title: string; label: string; prompt: string }> | undefined,
  );
  const isComplete = useAuiState((s) => s.message.status?.type === "complete");
  if (!suggestions || suggestions.length === 0 || !isComplete) return null;
  return (
    <div className="aui-message-suggestions flex flex-wrap gap-2 mt-4 mb-1">
      {suggestions.map((suggestion, i) => (
        <MessageSuggestionButton key={i} suggestion={suggestion} />
      ))}
    </div>
  );
};

const AssistantMessage: FC = () => {
  // reserves space for action bar and compensates with `-mb` for consistent msg spacing
  // keeps hovered action bar from shifting layout (autohide doesn't support absolute positioning well)
  // for pt-[n] use -mb-[n + 6] & min-h-[n + 6] to preserve compensation
  const ACTION_BAR_PT = "pt-1.5";
  const ACTION_BAR_HEIGHT = `-mb-7.5 min-h-7.5 ${ACTION_BAR_PT}`;

  return (
    <MessagePrimitive.Root
      data-slot="aui_assistant-message-root"
      data-role="assistant"
      className="fade-in slide-in-from-bottom-1 relative animate-in duration-150 [contain-intrinsic-size:auto_300px] [content-visibility:auto]"
    >
      <div
        data-slot="aui_assistant-message-content"
        className="wrap-break-word px-2 text-foreground leading-relaxed"
      >
        <ThinkingIndicator />
        <MessagePrimitive.GroupedParts
          groupBy={(part) => {
            if (part.type === "reasoning")
              return ["group-chainOfThought", "group-reasoning"];
            if (part.type === "tool-call") {
              // Don't group MCP tools - render them inline
              if (getMcpAppFromToolPart(part)) return null;
              // Don't group tools that are awaiting results (likely human input tools)
              if (!("result" in part) || part.result === undefined) return null;
              return ["group-chainOfThought", "group-tool"];
            }
            return null;
          }}
        >
          {({ part, children }) => {
            switch (part.type) {
              case "group-chainOfThought":
                return <div data-slot="aui_chain-of-thought">{children}</div>;
              case "group-reasoning": {
                const running = part.status.type === "running";
                return (
                  <ReasoningRoot defaultOpen={running}>
                    <ReasoningTrigger active={running} />
                    <ReasoningContent aria-busy={running}>
                      <ReasoningText>{children}</ReasoningText>
                    </ReasoningContent>
                  </ReasoningRoot>
                );
              }
              case "group-tool":
                return (
                  <ToolGroupRoot>
                    <ToolGroupTrigger
                      count={part.indices.length}
                      active={part.status.type === "running"}
                    />
                    <ToolGroupContent>{children}</ToolGroupContent>
                  </ToolGroupRoot>
                );
              case "text":
                return <MarkdownText />;
              case "reasoning":
                return <Reasoning {...part} />;
              case "tool-call":
                return part.toolUI ?? <ToolFallback {...part} />;
              default:
                return null;
            }
          }}
        </MessagePrimitive.GroupedParts>
        <MessageError />
        <MessageSuggestions />
      </div>

      <div
        data-slot="aui_assistant-message-footer"
        className={cn("ms-2 flex items-center", ACTION_BAR_HEIGHT)}
      >
        <BranchPicker />
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  const as = useStrings();
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-assistant-action-bar-root col-start-3 row-start-2 -ms-1 flex gap-1 text-muted-foreground"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip={as.copy}>
          <AuiIf condition={(s) => s.message.isCopied}>
            <CheckIcon />
          </AuiIf>
          <AuiIf condition={(s) => !s.message.isCopied}>
            <CopyIcon />
          </AuiIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip={as.refresh}>
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
      <ActionBarMorePrimitive.Root>
        <ActionBarMorePrimitive.Trigger asChild>
          <TooltipIconButton
            tooltip={as.more}
            className="data-[state=open]:bg-accent"
          >
            <MoreHorizontalIcon />
          </TooltipIconButton>
        </ActionBarMorePrimitive.Trigger>
        <ActionBarMorePrimitive.Content
          side="bottom"
          align="start"
          className="aui-action-bar-more-content z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <ActionBarPrimitive.ExportMarkdown asChild>
            <ActionBarMorePrimitive.Item className="aui-action-bar-more-item flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <DownloadIcon className="size-4" />
              {as.exportMarkdown}
            </ActionBarMorePrimitive.Item>
          </ActionBarPrimitive.ExportMarkdown>
        </ActionBarMorePrimitive.Content>
      </ActionBarMorePrimitive.Root>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      data-slot="aui_user-message-root"
      className="fade-in slide-in-from-bottom-1 grid animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 duration-150 [contain-intrinsic-size:auto_60px] [content-visibility:auto] [&:where(>*)]:col-start-2"
      data-role="user"
    >
      <UserMessageAttachments />

      <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
        <div className="aui-user-message-content wrap-break-word peer rounded-2xl bg-muted px-4 py-2.5 text-foreground empty:hidden">
          <MessagePrimitive.Parts />
        </div>
        <div className="aui-user-action-bar-wrapper absolute start-0 top-1/2 -translate-x-full -translate-y-1/2 pe-2 peer-empty:hidden rtl:translate-x-full">
          <UserActionBar />
        </div>
      </div>

      <BranchPicker
        data-slot="aui_user-branch-picker"
        className="col-span-full col-start-1 row-start-3 -me-1 justify-end"
      />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  // This app's external-store runtime is one-way (onNew only, no onEdit), so
  // editing a sent message is unsupported. Rendering ActionBarPrimitive.Edit
  // made `beginEdit` throw "Runtime does not support editing." on click. Omit
  // the user action bar until/unless onEdit is wired into MyRuntimeProvider.
  return null;
};

const EditComposer: FC = () => {
  const ec = useStrings();
  return (
    <MessagePrimitive.Root
      data-slot="aui_edit-composer-wrapper"
      className="flex flex-col px-2"
    >
      <ComposerPrimitive.Root className="aui-edit-composer-root ms-auto flex w-full max-w-[85%] flex-col rounded-2xl bg-muted">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input min-h-14 w-full resize-none bg-transparent p-4 text-foreground text-sm outline-none"
          autoFocus
        />
        <div className="aui-edit-composer-footer mx-3 mb-3 flex items-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm">
              {ec.cancel}
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm">{ec.update}</Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  const bp = useStrings();
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "aui-branch-picker-root -ms-2 me-2 inline-flex items-center text-muted-foreground text-xs",
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip={bp.previous}>
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip={bp.next}>
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};
