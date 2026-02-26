// 채팅 입력 강화 훅 - /슬래시 커맨드 + @멘션 + 파일 첨부

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { filterCommands, type SlashCommand } from "../lib/chatCommands";
import type { MentionItem } from "../components/chat/MentionMenu";
import type { Buyer } from "./useBuyers";
import type { ProductEntry } from "../stores/types";

interface UseChatInputEnhancedProps {
  buyers: Buyer[];
  productEntries: ProductEntry[];
}

export function useChatInputEnhanced({ buyers, productEntries }: UseChatInputEnhancedProps) {
  // Slash menu state
  const [slashVisible, setSlashVisible] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);

  // Mention menu state
  const [mentionVisible, setMentionVisible] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);

  // File attachment state
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Convert buyers/products to MentionItems
  const mentionItems = useMemo<MentionItem[]>(() => {
    const bItems: MentionItem[] = buyers.map((b) => ({
      id: b.id,
      name: b.company_name,
      type: "buyer",
      detail: b.country || undefined,
    }));
    const pItems: MentionItem[] = productEntries.map((p) => ({
      id: p.id,
      name: p.productName,
      type: "product",
      detail: p.category || undefined,
    }));
    return [...bItems, ...pItems];
  }, [buyers, productEntries]);

  // Filtered slash commands
  const filteredCommands = useMemo(
    () => filterCommands(slashQuery),
    [slashQuery],
  );

  // Filtered mention items
  const filteredMentions = useMemo(() => {
    if (!mentionQuery) return mentionItems;
    const q = mentionQuery.toLowerCase();
    return mentionItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.detail && item.detail.toLowerCase().includes(q)),
    );
  }, [mentionItems, mentionQuery]);

  // Handle input value change with cursor position
  const handleInputChange = useCallback(
    (value: string, cursorPos: number) => {
      // Detect `/` at beginning of input or after whitespace
      const beforeCursor = value.slice(0, cursorPos);

      // Slash command detection
      const slashMatch = beforeCursor.match(/(?:^|\s)\/(\S*)$/);
      if (slashMatch) {
        setSlashVisible(true);
        setSlashQuery(slashMatch[1]);
        setSlashIndex(0);
        setMentionVisible(false);
        return;
      }
      setSlashVisible(false);

      // Mention detection
      const mentionMatch = beforeCursor.match(/@(\S*)$/);
      if (mentionMatch) {
        setMentionVisible(true);
        setMentionQuery(mentionMatch[1]);
        setMentionIndex(0);
        return;
      }
      setMentionVisible(false);
    },
    [],
  );

  // Select a slash command
  const selectSlashCommand = useCallback((cmd: SlashCommand) => {
    setSlashVisible(false);
    setSlashQuery("");
    setSlashIndex(0);
    return cmd.message;
  }, []);

  // Select a mention item - returns the text to insert
  const selectMention = useCallback(
    (item: MentionItem, currentValue: string, cursorPos: number) => {
      const beforeCursor = currentValue.slice(0, cursorPos);
      const afterCursor = currentValue.slice(cursorPos);
      // Replace @query with @name
      const newBefore = beforeCursor.replace(/@\S*$/, `@${item.name} `);
      setMentionVisible(false);
      setMentionQuery("");
      setMentionIndex(0);
      return { newValue: newBefore + afterCursor, newCursorPos: newBefore.length };
    },
    [],
  );

  // File management
  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const MAX_IMAGE_SIZE = 4 * 1024 * 1024;  // 4MB (Gemini 안전 한도)
    const MAX_PDF_SIZE = 10 * 1024 * 1024;   // 10MB

    const valid: File[] = [];
    for (const f of arr) {
      if (!ALLOWED.includes(f.type)) {
        toast.error("지원 형식: JPG, PNG, WEBP, PDF");
        continue;
      }
      const isImage = f.type.startsWith("image/");
      const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_PDF_SIZE;
      if (f.size > maxSize) {
        toast.error(`파일 크기 초과: ${isImage ? "이미지 4MB" : "PDF 10MB"} 이하로 업로드해주세요.`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length > 0) {
      setAttachedFiles((prev) => [...prev, ...valid]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setAttachedFiles([]);
  }, []);

  // Keyboard navigation
  const handleMenuKeyDown = useCallback(
    (key: string): boolean => {
      if (slashVisible) {
        const max = filteredCommands.length;
        if (!max) return false;
        if (key === "ArrowDown") {
          setSlashIndex((i) => (i + 1) % max);
          return true;
        }
        if (key === "ArrowUp") {
          setSlashIndex((i) => (i - 1 + max) % max);
          return true;
        }
        if (key === "Enter") return true; // handled by caller
        if (key === "Escape") {
          setSlashVisible(false);
          return true;
        }
      }
      if (mentionVisible) {
        const max = filteredMentions.length;
        if (!max) return false;
        if (key === "ArrowDown") {
          setMentionIndex((i) => (i + 1) % max);
          return true;
        }
        if (key === "ArrowUp") {
          setMentionIndex((i) => (i - 1 + max) % max);
          return true;
        }
        if (key === "Enter") return true;
        if (key === "Escape") {
          setMentionVisible(false);
          return true;
        }
      }
      return false;
    },
    [slashVisible, mentionVisible, filteredCommands.length, filteredMentions.length],
  );

  const isMenuOpen = slashVisible || mentionVisible;

  return {
    // Slash
    slashVisible,
    filteredCommands,
    slashIndex,
    selectSlashCommand,
    // Mention
    mentionVisible,
    filteredMentions,
    mentionIndex,
    selectMention,
    // Files
    attachedFiles,
    addFiles,
    removeFile,
    clearFiles,
    // Input handler
    handleInputChange,
    handleMenuKeyDown,
    isMenuOpen,
  };
}
