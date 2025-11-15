'use client';

import {
  AtSign,
  Bold,
  Code,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Paperclip,
  Send,
  Smile,
  Strikethrough,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useMemo } from 'react';
import { Button } from '~/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { Toolbar } from './toolbar';
import type { RichTextEditorProps, ToolbarOption } from './types';
import { useRichTextEditor } from './use-rich-text-editor';

/**
 * Default top toolbar options for the rich text editor
 */
const defaultTopToolbarOptions = (
  formattingState: any,
  actions: any
): ToolbarOption[] => [
  {
    id: 'bold',
    icon: Bold,
    label: 'Toggle bold',
    command: 'bold',
    isActive: formattingState.bold,
    onClick: actions.toggleBold,
  },
  {
    id: 'italic',
    icon: Italic,
    label: 'Toggle italic',
    command: 'italic',
    isActive: formattingState.italic,
    onClick: actions.toggleItalic,
  },
  {
    id: 'strikethrough',
    icon: Strikethrough,
    label: 'Toggle strikethrough',
    command: 'strikethrough',
    isActive: formattingState.strikethrough,
    onClick: actions.toggleStrikethrough,
  },
  { id: 'separator1', separator: true },
  {
    id: 'code',
    icon: Code,
    label: 'Insert code',
    command: 'insertCode',
    isActive: formattingState.code,
    onClick: actions.insertCode,
  },
  { id: 'separator2', separator: true },
  {
    id: 'orderedList',
    icon: ListOrdered,
    label: 'Toggle numbered list',
    command: 'insertOrderedList',
    isActive: formattingState.orderedList,
    onClick: actions.toggleOrderedList,
  },
  {
    id: 'unorderedList',
    icon: List,
    label: 'Toggle bulleted list',
    command: 'insertUnorderedList',
    isActive: formattingState.unorderedList,
    onClick: actions.toggleUnorderedList,
  },
];

/**
 * Default bottom toolbar options for the rich text editor
 */
const defaultBottomToolbarOptions = (
  topToolbarVisible: boolean,
  setTopToolbarVisible: (visible: boolean) => void,
  actions: any
): ToolbarOption[] => [
  {
    id: 'upload',
    icon: Paperclip,
    label: 'Upload file',
    command: 'focus',
    onClick: () => {
      // For now, just focus the editor - could be enhanced with file picker
      actions.focus();
    },
  },
  { id: 'separator1', separator: true },
  {
    id: 'toggleTopToolbar',
    icon: topToolbarVisible ? Eye : EyeOff,
    label: topToolbarVisible ? 'Hide top toolbar' : 'Show top toolbar',
    command: 'toggle',
    onClick: () => setTopToolbarVisible(!topToolbarVisible),
  },
  {
    id: 'emoji',
    icon: Smile,
    label: 'Insert emoji',
    command: 'insertText',
    onClick: actions.insertEmoji,
  },
  {
    id: 'gif',
    icon: ImageIcon,
    label: 'Insert gif',
    command: 'insertText',
    onClick: () => {
      // For now, just insert a placeholder - could be enhanced with gif picker
      actions.formatText('insertText', '[GIF]');
    },
  },
  {
    id: 'mention',
    icon: AtSign,
    label: 'Mention',
    command: 'insertText',
    onClick: actions.insertMention,
  },
];

/**
 * Rich Text Editor Component
 * A comprehensive, extensible rich text editor with toolbar support
 */
export function RichTextEditor({
  initialContent = '',
  placeholder = '/ to focus and type...',
  showTopToolbar = true,
  topToolbarOptions,
  bottomToolbarOptions,
  onChange,
  onSubmit,
  className = '',
  disabled = false,
  loading = false,
  showSubmitButton = true,
  maxHeight = '40vh',
  minHeight = '2rem',
  formattingState: externalFormattingState,
  onFormattingStateChange,
  onEditorRef,
}: RichTextEditorProps) {
  const {
    editorRef,
    formattingState: internalFormattingState,
    topToolbarVisible,
    setTopToolbarVisible,
    formatText,
    toggleBold,
    toggleItalic,
    toggleStrikethrough,
    toggleOrderedList,
    toggleUnorderedList,
    insertCode,
    insertTime,
    insertEmoji,
    insertMention,
    focus,
  } = useRichTextEditor(
    initialContent,
    onChange,
    onFormattingStateChange,
    onEditorRef
  );

  // Use external formatting state if provided, otherwise use internal
  const currentFormattingState =
    externalFormattingState || internalFormattingState;

  // Prepare actions object for toolbar options (memoized to prevent unnecessary re-renders)
  const actions = useMemo(
    () => ({
      toggleBold,
      toggleItalic,
      toggleStrikethrough,
      toggleOrderedList,
      toggleUnorderedList,
      insertCode,
      insertTime,
      insertEmoji,
      insertMention,
      formatText,
      focus,
    }),
    [
      toggleBold,
      toggleItalic,
      toggleStrikethrough,
      toggleOrderedList,
      toggleUnorderedList,
      insertCode,
      insertTime,
      insertEmoji,
      insertMention,
      formatText,
      focus,
    ]
  );

  // Generate final toolbar options
  const finalTopToolbarOptions = useMemo(
    () =>
      topToolbarOptions ||
      defaultTopToolbarOptions(currentFormattingState, actions),
    [topToolbarOptions, currentFormattingState, actions]
  );

  const finalBottomToolbarOptions = useMemo(
    () =>
      bottomToolbarOptions ||
      defaultBottomToolbarOptions(
        topToolbarVisible,
        setTopToolbarVisible,
        actions
      ),
    [bottomToolbarOptions, topToolbarVisible, setTopToolbarVisible, actions]
  );

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = editorRef.current?.innerHTML || '';
    if (!content.trim() || content === '<br>' || loading) return;
    onSubmit?.(content.trim());
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    if (modKey) {
      // Cmd/Ctrl + B for bold
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        toggleBold();
        return;
      }
      // Cmd/Ctrl + I for italic
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        toggleItalic();
        return;
      }
    }

    // Handle Enter key for submission
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      className={`relative rounded-[14px] p-[3px] bg-muted/50 transition duration-200 backdrop-blur-sm border border-border shadow-lg ${className}`}
    >
      <div className="chat-editor relative flex w-full flex-col bg-card/50 border border-border/30 rounded-xl">
        {/* Top Toolbar */}
        {showTopToolbar && (
          <AnimatePresence>
            {topToolbarVisible && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="min-h-2"
              >
                <div className="flex flex-wrap items-center gap-1 py-1 px-1 pr-9">
                  <Toolbar
                    options={finalTopToolbarOptions}
                    disabled={disabled}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Editor Content */}
        <motion.div
          className="relative isolate max-h-[40vh] min-h-8 overflow-y-auto px-3 py-1.5 pr-9"
          style={{ maxHeight, minHeight }}
          layout
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <div
            ref={editorRef}
            contentEditable={!disabled}
            suppressContentEditableWarning
            data-placeholder={placeholder}
            className="min-h-8 max-h-[40vh] text-xs border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:border-0 focus:shadow-none focus:ring-0 focus:ring-offset-0 resize-none [&]:font-inherit [&]:text-inherit [&]:leading-inherit [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:font-mono [&_pre]:text-sm [&_pre]:whitespace-pre-wrap [&_pre]:my-1 [&_ol]:pl-6 [&_ul]:pl-6 [&_li]:my-0.5 [&_strong]:font-semibold [&_em]:italic [&_s]:line-through [&_u]:underline [&_p]:my-1 [&_div]:m-0 data-[empty=true]:before:content-[attr(data-placeholder)] data-[empty=true]:before:text-muted-foreground/50 data-[empty=true]:before:pointer-events-none"
            onKeyDown={handleKeyDown}
            style={{
              outline: 'none',
              border: 'none',
              background: 'transparent',
              boxShadow: 'none',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: 'inherit',
            }}
          />
        </motion.div>

        {/* Bottom Toolbar */}
        <div className="flex flex-wrap items-center gap-1 py-1 px-1">
          <div className="flex items-center gap-1">
            <Toolbar options={finalBottomToolbarOptions} disabled={disabled} />
          </div>
          {showSubmitButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  disabled={
                    !editorRef.current?.innerHTML?.trim() || loading || disabled
                  }
                  className="size-7 ml-auto bg-muted/60 text-muted-foreground hover:bg-muted/80 disabled:bg-muted/30 disabled:text-muted-foreground/50"
                  aria-label="Send"
                  onClick={handleSubmit}
                >
                  <Send className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send message</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
