import React from 'react';

/**
 * Formatting state interface for tracking current text formatting
 */
export interface FormattingState {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  orderedList: boolean;
  unorderedList: boolean;
}

/**
 * Toolbar option interface for defining toolbar buttons and separators
 * - icon: React component for the button icon
 * - label: Accessibility label for the button
 * - command: The command to execute (used for fallback)
 * - onClick: Custom click handler (takes precedence over command)
 * - isActive: Whether the button should show as active/selected
 * - separator: If true, renders a visual separator instead of a button
 */
export interface ToolbarOption {
  id: string;
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
  command?: string;
  value?: string;
  onClick?: () => void;
  isActive?: boolean;
  separator?: boolean;
  disabled?: boolean;
}

/**
 * Rich text editor props interface
 */
export interface RichTextEditorProps {
  /** Initial content for the editor */
  initialContent?: string;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Whether to show the top toolbar */
  showTopToolbar?: boolean;
  /** Custom toolbar options for top toolbar */
  topToolbarOptions?: ToolbarOption[];
  /** Custom toolbar options for bottom toolbar */
  bottomToolbarOptions?: ToolbarOption[];
  /** Callback when content changes */
  onChange?: (content: string) => void;
  /** Callback when editor is submitted (Enter key without Shift) */
  onSubmit?: (content: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Whether the editor is in loading state */
  loading?: boolean;
  /** Whether to show the submit button in the bottom toolbar */
  showSubmitButton?: boolean;
  /** Maximum height for the editor */
  maxHeight?: string;
  /** Minimum height for the editor */
  minHeight?: string;
  /** Custom formatting state */
  formattingState?: FormattingState;
  /** Callback when formatting state changes */
  onFormattingStateChange?: (state: FormattingState) => void;
  /** Callback to get the editor ref for external focus control */
  onEditorRef?: (ref: HTMLDivElement | null) => void;
}

/**
 * Hook return type for useRichTextEditor
 */
export interface UseRichTextEditorReturn {
  /** Reference to the editor element */
  editorRef: React.RefObject<HTMLDivElement | null>;
  /** Current formatting state */
  formattingState: FormattingState;
  /** Whether top toolbar is visible */
  topToolbarVisible: boolean;
  /** Toggle top toolbar visibility */
  setTopToolbarVisible: (visible: boolean) => void;
  /** Apply formatting command */
  formatText: (command: string, value?: string) => void;
  /** Toggle bold formatting */
  toggleBold: () => void;
  /** Toggle italic formatting */
  toggleItalic: () => void;
  /** Toggle strikethrough formatting */
  toggleStrikethrough: () => void;
  /** Toggle ordered list */
  toggleOrderedList: () => void;
  /** Toggle unordered list */
  toggleUnorderedList: () => void;
  /** Insert code block or inline code */
  insertCode: () => void;
  /** Insert current time */
  insertTime: () => void;
  /** Insert emoji */
  insertEmoji: () => void;
  /** Insert mention */
  insertMention: () => void;
  /** Clear editor content */
  clearContent: () => void;
  /** Get current content */
  getContent: () => string;
  /** Set content */
  setContent: (content: string) => void;
  /** Focus the editor */
  focus: () => void;
}
