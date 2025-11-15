import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  FormattingState,
  RichTextEditorProps,
  UseRichTextEditorReturn,
} from './types';

/**
 * Custom hook for managing rich text editor functionality
 * Extracts all the editor logic from the main component
 */
export function useRichTextEditor(
  initialContent = '',
  onChange?: (content: string) => void,
  onFormattingStateChange?: (state: FormattingState) => void,
  onEditorRef?: RichTextEditorProps['onEditorRef']
): UseRichTextEditorReturn {
  const editorRef = useRef<HTMLDivElement>(null);
  const [topToolbarVisible, setTopToolbarVisible] = useState(true);
  const [formattingState, setFormattingState] = useState<FormattingState>({
    bold: false,
    italic: false,
    strikethrough: false,
    underline: false,
    code: false,
    orderedList: false,
    unorderedList: false,
  });

  // Rich text editor functions
  const formatText = useCallback((command: string, value?: string) => {
    // Focus the editor first
    editorRef.current?.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // Handle different formatting commands with modern APIs
    switch (command) {
      case 'italic':
        if (range.collapsed) {
          const span = document.createElement('span');
          span.className = 'italic';
          span.innerHTML = '&#8203;';
          range.insertNode(span);
          range.setStart(span, 0);
          range.setEnd(span, 1);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          const span = document.createElement('span');
          span.className = 'italic';
          range.surroundContents(span);
        }
        break;

      case 'strikethrough':
        if (range.collapsed) {
          const span = document.createElement('span');
          span.className = 'line-through';
          span.innerHTML = '&#8203;';
          range.insertNode(span);
          range.setStart(span, 0);
          range.setEnd(span, 1);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          const span = document.createElement('span');
          span.className = 'line-through';
          range.surroundContents(span);
        }
        break;

      case 'insertOrderedList':
        document.execCommand('insertOrderedList', false);
        break;

      case 'insertUnorderedList':
        document.execCommand('insertUnorderedList', false);
        break;

      case 'insertText':
        document.execCommand('insertText', false, value);
        break;

      case 'insertHTML':
        document.execCommand('insertHTML', false, value);
        break;

      default:
        // For complex commands that are hard to replace, keep the deprecated API for now
        document.execCommand(command, false, value);
    }
  }, []);

  // Helper function to ensure cursor is in a clean, non-formatted context
  const ensureCleanCursorPosition = useCallback(
    (selection: Selection, editor: HTMLElement) => {
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      let container = range.startContainer;

      // Walk up the DOM tree to find if we're inside any formatting elements
      if (container.nodeType === Node.TEXT_NODE) {
        let parent = container.parentElement;
        while (parent && parent !== editor) {
          const tagName = parent.tagName.toLowerCase();
          const hasFormatting =
            tagName === 'strong' ||
            tagName === 'b' ||
            tagName === 'em' ||
            tagName === 'i' ||
            tagName === 's' ||
            tagName === 'strike' ||
            tagName === 'del' ||
            parent.classList.contains('font-semibold') ||
            parent.classList.contains('italic') ||
            parent.classList.contains('line-through');

          if (hasFormatting) {
            // Move cursor outside the formatted element
            const newRange = document.createRange();
            newRange.setStartAfter(parent);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            return;
          }
          parent = parent.parentElement;
        }
      }
    },
    []
  );

  // Helper function to remove formatting when cursor is inside formatted element
  const removeFormattingAtCursor = useCallback(
    (formattedElement: HTMLElement, range: Range, selection: Selection) => {
      const editor = editorRef.current;
      if (!editor || !range.collapsed) return false;

      const parent = formattedElement.parentNode;
      if (!parent) return false;

      try {
        // Create range for the entire formatted element
        const elementRange = document.createRange();
        elementRange.selectNodeContents(formattedElement);

        // Check cursor position relative to element boundaries using range comparison
        const compareStart = elementRange.compareBoundaryPoints(
          Range.START_TO_START,
          range
        );
        const compareEnd = elementRange.compareBoundaryPoints(
          Range.END_TO_END,
          range
        );

        // Check if cursor is at or before the start of the element
        if (compareStart >= 0) {
          range.setStartBefore(formattedElement);
          range.setEndBefore(formattedElement);
          selection.removeAllRanges();
          selection.addRange(range);
          return true;
        }

        // Check if cursor is at or after the end of the element
        if (compareEnd <= 0) {
          range.setStartAfter(formattedElement);
          range.setEndAfter(formattedElement);
          selection.removeAllRanges();
          selection.addRange(range);
          return true;
        }

        // Get cursor position for splitting
        const cursorContainer = range.startContainer;
        const cursorOffset = range.startOffset;

        // Cursor is in the middle - split the element
        // Create range from start to cursor
        const beforeRange = document.createRange();
        beforeRange.setStart(formattedElement, 0);
        beforeRange.setEnd(cursorContainer, cursorOffset);

        // Create range from cursor to end
        const afterRange = document.createRange();
        afterRange.setStart(cursorContainer, cursorOffset);
        afterRange.setEnd(formattedElement, formattedElement.childNodes.length);

        // Clone content before cursor (to keep as formatted)
        const beforeContent = beforeRange.cloneContents();

        // Extract content after cursor (to unwrap)
        const afterContent = afterRange.extractContents();

        // Helper to unwrap formatting recursively
        const unwrapNodes = (container: Node): Node[] => {
          const result: Node[] = [];
          const fragment = document.createDocumentFragment();

          if (container.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            fragment.appendChild(container.cloneNode(true));
          } else {
            fragment.appendChild(container.cloneNode(true));
          }

          const walker = document.createTreeWalker(
            fragment,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
            null
          );

          let node: Node | null;
          while ((node = walker.nextNode())) {
            if (node.nodeType === Node.TEXT_NODE) {
              result.push(node.cloneNode());
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const elem = node as HTMLElement;
              // Check if it's the same type of formatting element
              const isSameFormatting =
                (elem.classList.contains('font-semibold') ||
                  elem.classList.contains('italic') ||
                  elem.classList.contains('line-through') ||
                  elem.style.fontWeight ||
                  elem.style.fontStyle === 'italic' ||
                  elem.style.textDecorationLine?.includes('line-through')) &&
                elem.tagName === formattedElement.tagName;

              if (isSameFormatting) {
                // Unwrap this formatting element
                Array.from(elem.childNodes).forEach((child) => {
                  result.push(...unwrapNodes(child));
                });
              } else {
                result.push(elem.cloneNode(true));
              }
            }
          }

          return result;
        };

        // Unwrap the after content
        const unwrappedNodes = unwrapNodes(afterContent);

        // Create new formatted element with content before cursor
        if (beforeContent.childNodes.length > 0) {
          const newFormattedElement = formattedElement.cloneNode(
            false
          ) as HTMLElement;
          while (beforeContent.firstChild) {
            newFormattedElement.appendChild(beforeContent.firstChild);
          }
          parent.insertBefore(newFormattedElement, formattedElement);
        }

        // Create marker for cursor position
        const marker = document.createTextNode('\u200B');
        parent.insertBefore(marker, formattedElement);

        // Insert unwrapped nodes
        unwrappedNodes.forEach((node) => {
          parent.insertBefore(node, formattedElement);
        });

        // Remove old formatted element
        parent.removeChild(formattedElement);

        // Position cursor at marker, then remove it
        range.setStartBefore(marker);
        range.setEndBefore(marker);
        marker.remove();

        // Normalize to merge adjacent text nodes
        parent.normalize();

        selection.removeAllRanges();
        selection.addRange(range);
        return true;
      } catch (e) {
        // Fallback: just move cursor outside element
        range.setStartAfter(formattedElement);
        range.setEndAfter(formattedElement);
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
      }
    },
    []
  );

  // Helper function to check if a range is within a formatted element
  const findFormattedElement = useCallback(
    (
      range: Range,
      editor: HTMLElement,
      checkBold: boolean,
      checkItalic: boolean,
      checkStrikethrough: boolean
    ): HTMLElement | null => {
      let element: Node | null = range.commonAncestorContainer;
      while (element && element.nodeType !== Node.ELEMENT_NODE) {
        element = element.parentNode;
      }

      if (!element || !(element instanceof HTMLElement)) return null;

      let currentElement: HTMLElement | null = element;
      while (currentElement && currentElement !== editor) {
        const tagName = currentElement.tagName.toLowerCase();

        if (checkBold) {
          if (
            tagName === 'strong' ||
            tagName === 'b' ||
            (tagName === 'span' &&
              (currentElement.style.fontWeight === 'bold' ||
                currentElement.style.fontWeight === '600' ||
                currentElement.style.fontWeight === 'semibold' ||
                currentElement.classList.contains('font-semibold') ||
                parseInt(currentElement.style.fontWeight) >= 600))
          ) {
            return currentElement;
          }
        }

        if (checkItalic) {
          if (
            tagName === 'em' ||
            tagName === 'i' ||
            (tagName === 'span' &&
              (currentElement.style.fontStyle === 'italic' ||
                currentElement.classList.contains('italic')))
          ) {
            return currentElement;
          }
        }

        if (checkStrikethrough) {
          if (
            tagName === 's' ||
            tagName === 'strike' ||
            tagName === 'del' ||
            (tagName === 'span' &&
              (currentElement.style.textDecorationLine?.includes(
                'line-through'
              ) ||
                currentElement.classList.contains('line-through')))
          ) {
            return currentElement;
          }
        }

        currentElement = currentElement.parentElement;
      }

      return null;
    },
    []
  );

  // Update formatting state based on current selection
  const updateFormattingState = useCallback(() => {
    const selection = window.getSelection();
    const editor = editorRef.current;

    // If no editor or selection, reset state
    if (!editor || !selection || selection.rangeCount === 0) {
      const newState = {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        orderedList: false,
        unorderedList: false,
      };
      setFormattingState(newState);
      onFormattingStateChange?.(newState);
      return;
    }

    const range = selection.getRangeAt(0);
    let element = range.commonAncestorContainer;

    // If it's a text node, get the parent element
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement || element;
    }

    let isBold = false;
    let isItalic = false;
    let isStrikethrough = false;
    let isCode = false;
    let hasUnderline = false;
    let isOrderedList = false;
    let isUnorderedList = false;

    // Check if we're inside a code element or list (for both empty and non-empty selections)
    let currentElement: HTMLElement | null =
      element instanceof HTMLElement ? element : (editor as HTMLElement | null);

    while (currentElement) {
      if (
        currentElement.tagName === 'CODE' ||
        currentElement.tagName === 'PRE'
      ) {
        isCode = true;
      }
      // Check for list elements
      if (currentElement.tagName === 'OL') {
        isOrderedList = true;
      }
      if (currentElement.tagName === 'UL') {
        isUnorderedList = true;
      }
      // If we're inside an LI, check the parent list type
      if (currentElement.tagName === 'LI') {
        const parentList = currentElement.parentElement;
        if (parentList) {
          if (parentList.tagName === 'OL') {
            isOrderedList = true;
          } else if (parentList.tagName === 'UL') {
            isUnorderedList = true;
          }
        }
      }
      currentElement = currentElement.parentElement;
    }

    // If we have a valid element, do more detailed checking
    if (element && element instanceof HTMLElement) {
      const computedStyle = window.getComputedStyle(element);

      // Check for HTML elements (more reliable than computed styles)
      currentElement = element;
      while (currentElement) {
        const tagName = currentElement.tagName.toLowerCase();

        // Check for bold elements
        if (
          tagName === 'strong' ||
          tagName === 'b' ||
          (tagName === 'span' &&
            (currentElement.style.fontWeight === 'bold' ||
              currentElement.style.fontWeight === '600' ||
              currentElement.style.fontWeight === 'semibold' ||
              currentElement.classList.contains('font-semibold') ||
              parseInt(currentElement.style.fontWeight) >= 600))
        ) {
          isBold = true;
        }

        // Check for italic elements
        if (
          tagName === 'em' ||
          tagName === 'i' ||
          (tagName === 'span' &&
            (currentElement.style.fontStyle === 'italic' ||
              currentElement.classList.contains('italic')))
        ) {
          isItalic = true;
        }

        // Check for strikethrough elements
        if (
          tagName === 's' ||
          tagName === 'strike' ||
          tagName === 'del' ||
          (tagName === 'span' &&
            (currentElement.style.textDecorationLine?.includes(
              'line-through'
            ) ||
              currentElement.classList.contains('line-through')))
        ) {
          isStrikethrough = true;
        }

        // If we found any formatting, we can break early
        if (isBold || isItalic || isStrikethrough) {
          break;
        }

        currentElement = currentElement.parentElement;
      }

      // Fallback to computed styles if no HTML elements found
      if (!isBold) {
        const fontWeight = computedStyle.fontWeight;
        isBold =
          fontWeight === 'bold' ||
          fontWeight === '600' ||
          fontWeight === 'semibold' ||
          parseInt(fontWeight) >= 600;
      }

      if (!isItalic) {
        isItalic = computedStyle.fontStyle === 'italic';
        // Also check if parent element has italic class
        if (!isItalic && element && element instanceof HTMLElement) {
          let parent = element.parentElement;
          while (parent) {
            if (parent.classList.contains('italic')) {
              isItalic = true;
              break;
            }
            parent = parent.parentElement;
          }
        }
      }

      if (!isStrikethrough) {
        isStrikethrough =
          computedStyle.textDecorationLine.includes('line-through');
        // Also check if parent element has line-through class
        if (!isStrikethrough && element && element instanceof HTMLElement) {
          let parent = element.parentElement;
          while (parent) {
            if (parent.classList.contains('line-through')) {
              isStrikethrough = true;
              break;
            }
            parent = parent.parentElement;
          }
        }
      }

      hasUnderline = computedStyle.textDecorationLine.includes('underline');
    }

    const newState = {
      bold: isBold,
      italic: isItalic,
      strikethrough: isStrikethrough,
      underline: hasUnderline,
      code: isCode,
      orderedList: isOrderedList,
      unorderedList: isUnorderedList,
    };

    setFormattingState(newState);
    onFormattingStateChange?.(newState);
  }, [onFormattingStateChange]);

  const toggleBold = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0).cloneRange();
    const editor = editorRef.current;
    if (!editor) return;

    // Check if we're already in a bold element using the helper
    const boldElement = findFormattedElement(range, editor, true, false, false);

    if (boldElement) {
      // Remove bold formatting
      try {
        const parent = boldElement.parentNode;
        if (!parent) {
          requestAnimationFrame(() => {
            updateFormattingState();
          });
          return;
        }

        if (range.collapsed) {
          // Use helper function to remove formatting at cursor position
          if (removeFormattingAtCursor(boldElement, range, selection)) {
            // Ensure cursor is in a clean, non-formatted context
            ensureCleanCursorPosition(selection, editor);

            requestAnimationFrame(() => {
              updateFormattingState();
            });
            return;
          }
        } else {
          // There's a selection - unwrap the bold formatting
          const boldRange = document.createRange();
          boldRange.selectNodeContents(boldElement);

          // Check if selection is entirely within the bold element
          const startInside =
            boldRange.compareBoundaryPoints(Range.START_TO_START, range) <= 0 &&
            range.compareBoundaryPoints(Range.START_TO_START, boldRange) >= 0;
          const endInside =
            boldRange.compareBoundaryPoints(Range.END_TO_END, range) >= 0 &&
            range.compareBoundaryPoints(Range.END_TO_END, boldRange) <= 0;

          if (startInside && endInside) {
            // Selection is entirely within bold element - unwrap it
            const contents = range.extractContents();

            // Insert contents before the bold element to ensure clean context
            parent.insertBefore(contents, boldElement);

            // Clean up empty bold element
            if (!boldElement.textContent?.trim()) {
              parent.removeChild(boldElement);
            }

            // Position cursor at the end of the unwrapped content
            const newRange = document.createRange();
            newRange.setStartAfter(contents.lastChild || contents);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);

            parent.normalize();

            // Ensure cursor is in a clean position
            ensureCleanCursorPosition(selection, editor);
          } else {
            // Selection spans outside - unwrap the entire bold element
            while (boldElement.firstChild) {
              parent.insertBefore(boldElement.firstChild, boldElement);
            }
            parent.removeChild(boldElement);
            parent.normalize();

            // Restore selection after unwrapping
            selection.removeAllRanges();
            selection.addRange(range);

            // Ensure cursor is in a clean position
            ensureCleanCursorPosition(selection, editor);
          }
        }
      } catch (e) {
        // Fallback: unwrap the entire element
        const parent = boldElement.parentNode;
        if (parent) {
          while (boldElement.firstChild) {
            parent.insertBefore(boldElement.firstChild, boldElement);
          }
          parent.removeChild(boldElement);
          parent.normalize();
        }
      }
    } else {
      // Apply bold formatting
      if (range.collapsed) {
        // Insert a span with font-semibold class for collapsed selection
        const span = document.createElement('span');
        span.className = 'font-semibold';
        span.innerHTML = '&#8203;'; // Zero-width space
        range.insertNode(span);
        range.setStart(span, 0);
        range.setEnd(span, 1);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Wrap selected text in span with font-semibold class
        try {
          const span = document.createElement('span');
          span.className = 'font-semibold';
          range.surroundContents(span);
          // Restore selection after wrapping
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          // If surroundContents fails (e.g., range spans multiple blocks), use extractContents
          const contents = range.extractContents();
          const span = document.createElement('span');
          span.className = 'font-semibold';
          span.appendChild(contents);
          range.insertNode(span);
          // Move selection after the inserted span
          range.setStartAfter(span);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
    // Update state after DOM is settled
    requestAnimationFrame(() => {
      updateFormattingState();
    });
  }, [
    updateFormattingState,
    removeFormattingAtCursor,
    findFormattedElement,
    ensureCleanCursorPosition,
  ]);

  const toggleItalic = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0).cloneRange();
    const editor = editorRef.current;
    if (!editor) return;

    // Check if we're already in an italic element using the helper
    const italicElement = findFormattedElement(
      range,
      editor,
      false,
      true,
      false
    );

    if (italicElement) {
      // Remove italic formatting
      try {
        const parent = italicElement.parentNode;
        if (!parent) {
          requestAnimationFrame(() => {
            updateFormattingState();
          });
          return;
        }

        if (range.collapsed) {
          // Use helper function to remove formatting at cursor position
          if (removeFormattingAtCursor(italicElement, range, selection)) {
            // Ensure cursor is in a clean, non-formatted context
            ensureCleanCursorPosition(selection, editor);

            requestAnimationFrame(() => {
              updateFormattingState();
            });
            return;
          }
        } else {
          // Unwrap selection if it's entirely within italic element
          const italicRange = document.createRange();
          italicRange.selectNodeContents(italicElement);
          const selectionStart = italicRange.compareBoundaryPoints(
            Range.START_TO_START,
            range
          );
          const selectionEnd = italicRange.compareBoundaryPoints(
            Range.END_TO_END,
            range
          );

          if (selectionStart <= 0 && selectionEnd >= 0) {
            // Selection is entirely within italic - unwrap it
            const contents = range.extractContents();

            // Insert contents before the italic element to ensure clean context
            parent.insertBefore(contents, italicElement);

            // Clean up empty italic element
            if (!italicElement.textContent?.trim()) {
              parent.removeChild(italicElement);
            }

            // Position cursor at the end of the unwrapped content
            const newRange = document.createRange();
            newRange.setStartAfter(contents.lastChild || contents);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);

            parent.normalize();

            // Ensure cursor is in a clean position
            ensureCleanCursorPosition(selection, editor);
          } else {
            // Selection spans outside - unwrap the entire italic element
            while (italicElement.firstChild) {
              parent.insertBefore(italicElement.firstChild, italicElement);
            }
            parent.removeChild(italicElement);
            parent.normalize();

            // Restore selection after unwrapping
            selection.removeAllRanges();
            selection.addRange(range);

            // Ensure cursor is in a clean position
            ensureCleanCursorPosition(selection, editor);
          }
        }
      } catch (e) {
        // Fallback: unwrap the entire element
        const parent = italicElement.parentNode;
        if (parent) {
          while (italicElement.firstChild) {
            parent.insertBefore(italicElement.firstChild, italicElement);
          }
          parent.removeChild(italicElement);
          parent.normalize();
        }
      }
    } else {
      // Apply italic formatting
      if (range.collapsed) {
        const span = document.createElement('span');
        span.className = 'italic';
        span.innerHTML = '&#8203;';
        range.insertNode(span);
        range.setStart(span, 0);
        range.setEnd(span, 1);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        try {
          const span = document.createElement('span');
          span.className = 'italic';
          range.surroundContents(span);
          // Restore selection after wrapping
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          // If surroundContents fails, use extractContents
          const contents = range.extractContents();
          const span = document.createElement('span');
          span.className = 'italic';
          span.appendChild(contents);
          range.insertNode(span);
          // Move selection after the inserted span
          range.setStartAfter(span);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
    // Update state after DOM is settled
    requestAnimationFrame(() => {
      updateFormattingState();
    });
  }, [
    updateFormattingState,
    removeFormattingAtCursor,
    findFormattedElement,
    ensureCleanCursorPosition,
  ]);

  const toggleStrikethrough = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0).cloneRange();
    const editor = editorRef.current;
    if (!editor) return;

    // Check if we're already in a strikethrough element using the helper
    const strikethroughElement = findFormattedElement(
      range,
      editor,
      false,
      false,
      true
    );

    if (strikethroughElement) {
      // Remove strikethrough formatting
      try {
        const parent = strikethroughElement.parentNode;
        if (!parent) {
          requestAnimationFrame(() => {
            updateFormattingState();
          });
          return;
        }

        if (range.collapsed) {
          // Use helper function to remove formatting at cursor position
          if (
            removeFormattingAtCursor(strikethroughElement, range, selection)
          ) {
            // Ensure cursor is in a clean, non-formatted context
            ensureCleanCursorPosition(selection, editor);

            requestAnimationFrame(() => {
              updateFormattingState();
            });
            return;
          }
        } else {
          // Unwrap selection if it's entirely within strikethrough element
          const strikethroughRange = document.createRange();
          strikethroughRange.selectNodeContents(strikethroughElement);
          const selectionStart = strikethroughRange.compareBoundaryPoints(
            Range.START_TO_START,
            range
          );
          const selectionEnd = strikethroughRange.compareBoundaryPoints(
            Range.END_TO_END,
            range
          );

          if (selectionStart <= 0 && selectionEnd >= 0) {
            // Selection is entirely within strikethrough - unwrap it
            const contents = range.extractContents();

            // Insert contents before the strikethrough element to ensure clean context
            parent.insertBefore(contents, strikethroughElement);

            // Clean up empty strikethrough element
            if (!strikethroughElement.textContent?.trim()) {
              parent.removeChild(strikethroughElement);
            }

            // Position cursor at the end of the unwrapped content
            const newRange = document.createRange();
            newRange.setStartAfter(contents.lastChild || contents);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);

            parent.normalize();

            // Ensure cursor is in a clean position
            ensureCleanCursorPosition(selection, editor);
          } else {
            // Selection spans outside - unwrap the entire strikethrough element
            while (strikethroughElement.firstChild) {
              parent.insertBefore(
                strikethroughElement.firstChild,
                strikethroughElement
              );
            }
            parent.removeChild(strikethroughElement);
            parent.normalize();

            // Restore selection after unwrapping
            selection.removeAllRanges();
            selection.addRange(range);

            // Ensure cursor is in a clean position
            ensureCleanCursorPosition(selection, editor);
          }
        }
      } catch (e) {
        // Fallback: unwrap the entire element
        const parent = strikethroughElement.parentNode;
        if (parent) {
          while (strikethroughElement.firstChild) {
            parent.insertBefore(
              strikethroughElement.firstChild,
              strikethroughElement
            );
          }
          parent.removeChild(strikethroughElement);
          parent.normalize();
        }
      }
    } else {
      // Apply strikethrough formatting
      if (range.collapsed) {
        const span = document.createElement('span');
        span.className = 'line-through';
        span.innerHTML = '&#8203;';
        range.insertNode(span);
        range.setStart(span, 0);
        range.setEnd(span, 1);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        try {
          const span = document.createElement('span');
          span.className = 'line-through';
          range.surroundContents(span);
          // Restore selection after wrapping
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          // If surroundContents fails, use extractContents
          const contents = range.extractContents();
          const span = document.createElement('span');
          span.className = 'line-through';
          span.appendChild(contents);
          range.insertNode(span);
          // Move selection after the inserted span
          range.setStartAfter(span);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
    // Update state after DOM is settled
    requestAnimationFrame(() => {
      updateFormattingState();
    });
  }, [
    updateFormattingState,
    removeFormattingAtCursor,
    findFormattedElement,
    ensureCleanCursorPosition,
  ]);

  const toggleOrderedList = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const editor = editorRef.current;
    if (!editor) return;

    // Check if we're already in a list
    let listItem: Node | null = range.commonAncestorContainer;
    while (listItem && listItem.nodeType !== Node.ELEMENT_NODE) {
      listItem = listItem.parentNode;
    }

    if (listItem && (listItem as Element).tagName === 'LI') {
      // If we're in a list item, toggle the list
      const list = (listItem as Element).parentNode;
      if (list && (list as Element).tagName === 'OL') {
        // Convert to unordered list
        const ul = document.createElement('ul');
        while (list.firstChild) {
          ul.appendChild(list.firstChild);
        }
        list.parentNode?.replaceChild(ul, list);
      } else if (list && (list as Element).tagName === 'UL') {
        // Convert to ordered list
        const ol = document.createElement('ol');
        while (list.firstChild) {
          ol.appendChild(list.firstChild);
        }
        list.parentNode?.replaceChild(ol, list);
      }
    } else {
      // Create new ordered list
      const ol = document.createElement('ol');
      const li = document.createElement('li');
      if (range.collapsed) {
        li.innerHTML = '&#8203;'; // Zero-width space
      } else {
        li.appendChild(range.extractContents());
      }
      ol.appendChild(li);
      range.insertNode(ol);
      // Move cursor inside the list item
      range.setStart(li, 0);
      range.setEnd(li, 0);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    updateFormattingState();
  }, [updateFormattingState, removeFormattingAtCursor]);

  const toggleUnorderedList = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const editor = editorRef.current;
    if (!editor) return;

    // Check if we're already in a list
    let listItem: Node | null = range.commonAncestorContainer;
    while (listItem && listItem.nodeType !== Node.ELEMENT_NODE) {
      listItem = listItem.parentNode;
    }

    if (listItem && (listItem as Element).tagName === 'LI') {
      // If we're in a list item, toggle the list
      const list = (listItem as Element).parentNode;
      if (list && (list as Element).tagName === 'UL') {
        // Convert to ordered list
        const ol = document.createElement('ol');
        while (list.firstChild) {
          ol.appendChild(list.firstChild);
        }
        list.parentNode?.replaceChild(ol, list);
      } else if (list && (list as Element).tagName === 'OL') {
        // Convert to unordered list
        const ul = document.createElement('ul');
        while (list.firstChild) {
          ul.appendChild(list.firstChild);
        }
        list.parentNode?.replaceChild(ul, list);
      }
    } else {
      // Create new unordered list
      const ul = document.createElement('ul');
      const li = document.createElement('li');
      if (range.collapsed) {
        li.innerHTML = '&#8203;'; // Zero-width space
      } else {
        li.appendChild(range.extractContents());
      }
      ul.appendChild(li);
      range.insertNode(ul);
      // Move cursor inside the list item
      range.setStart(li, 0);
      range.setEnd(li, 0);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    updateFormattingState();
  }, [updateFormattingState, removeFormattingAtCursor]);

  const insertCode = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Insert code block if no selection
      const codeBlock = '<pre><code>code here</code></pre>';
      formatText('insertHTML', codeBlock);
      updateFormattingState();
      return;
    }

    // Wrap selected text in code tags
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (selectedText) {
      const codeElement = document.createElement('code');
      codeElement.textContent = selectedText;
      range.deleteContents();
      range.insertNode(codeElement);
      // Move cursor after the code element
      range.setStartAfter(codeElement);
      range.setEndAfter(codeElement);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    updateFormattingState();
  }, [formatText, updateFormattingState]);

  const insertTime = useCallback(() => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    formatText('insertText', timeString);
  }, [formatText]);

  const insertEmoji = useCallback(() => {
    // For now, insert a simple emoji - could be enhanced with an emoji picker
    formatText('insertText', '😊');
  }, [formatText]);

  const insertMention = useCallback(() => {
    formatText('insertText', '@');
  }, [formatText]);

  // Content management functions
  const clearContent = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      editorRef.current.setAttribute('data-empty', 'true');
      updateFormattingState();
      onChange?.('');
    }
  }, [onChange, updateFormattingState]);

  const getContent = useCallback(() => {
    return editorRef.current?.innerHTML || '';
  }, []);

  const setContent = useCallback(
    (content: string) => {
      if (editorRef.current) {
        editorRef.current.innerHTML = content;
        updateFormattingState();
        onChange?.(content);
      }
    },
    [onChange, updateFormattingState]
  );

  const focus = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  // Initialize content - only update on mount or when explicitly reset
  const prevInitialContentRef = useRef<string | null>(null);
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const currentContent = editor.innerHTML.trim();
    const newContent = initialContent.trim();

    // Only update if:
    // 1. Initial mount (prevInitialContentRef is null)
    // 2. Form was reset (previous content existed, now it's empty)
    const isInitialMount = prevInitialContentRef.current === null;
    const isFormReset =
      prevInitialContentRef.current !== null &&
      prevInitialContentRef.current !== '' &&
      newContent === '' &&
      currentContent !== '';

    if (isInitialMount || isFormReset) {
      if (newContent) {
        editor.innerHTML = initialContent;
        editor.removeAttribute('data-empty');
      } else {
        editor.innerHTML = '';
        editor.setAttribute('data-empty', 'true');
      }
    }

    // Track the initialContent value, but don't update editor on every change
    // This prevents the cursor position from being lost when user types
    prevInitialContentRef.current = initialContent;
  }, [initialContent]);

  // Auto-focus the editor on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  // Call onEditorRef callback when editor ref changes
  useEffect(() => {
    onEditorRef?.(editorRef.current);
  }, [onEditorRef]);

  // Add event listeners for formatting state updates
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleSelectionChange = () => {
      updateFormattingState();
    };

    const handleKeyUp = () => {
      updateFormattingState();
    };

    const handleMouseUp = () => {
      updateFormattingState();
    };

    const handleFocus = () => {
      updateFormattingState();
    };

    const handleInput = () => {
      // Handle placeholder visibility and content changes
      const target = editor;
      if (target.innerHTML === '<br>' || target.innerHTML === '') {
        target.innerHTML = '';
      }

      // Update placeholder visibility
      const isEmpty =
        !target.textContent?.trim() &&
        (target.innerHTML === '' || target.innerHTML === '<br>');
      if (isEmpty) {
        target.setAttribute('data-empty', 'true');
      } else {
        target.removeAttribute('data-empty');
      }

      // Update formatting state when content changes
      setTimeout(updateFormattingState, 0);

      onChange?.(target.innerHTML);
    };

    // Add event listeners
    document.addEventListener('selectionchange', handleSelectionChange);
    editor.addEventListener('keyup', handleKeyUp);
    editor.addEventListener('mouseup', handleMouseUp);
    editor.addEventListener('focus', handleFocus);
    editor.addEventListener('input', handleInput);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      editor.removeEventListener('keyup', handleKeyUp);
      editor.removeEventListener('mouseup', handleMouseUp);
      editor.removeEventListener('focus', handleFocus);
      editor.removeEventListener('input', handleInput);
    };
  }, [updateFormattingState, onChange]);

  return {
    editorRef,
    formattingState,
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
    clearContent,
    getContent,
    setContent,
    focus,
  };
}
