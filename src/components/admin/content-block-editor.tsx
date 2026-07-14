"use client";

import { useMemo, useState } from "react";

type BlockType = "text" | "image" | "cta";

export type EditableContentBlock = {
  id?: string;
  type?: string;
  title?: string;
  body?: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
};

type MediaOption = {
  id: string;
  url: string;
  altText: string | null;
  fileName: string | null;
  merchantName: string;
};

type EditorBlock = {
  id: string;
  type: BlockType;
  title: string;
  body: string;
  imageUrl: string;
  buttonText: string;
  buttonUrl: string;
};

type ContentBlockEditorProps = {
  initialBlocks: EditableContentBlock[];
  media: MediaOption[];
};

const blockTypeLabels: Record<BlockType, string> = {
  text: "文字區塊",
  image: "圖片區塊",
  cta: "按鈕區塊"
};

export function ContentBlockEditor({ initialBlocks, media }: ContentBlockEditorProps) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => normalizeBlocks(initialBlocks));
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const serializedBlocks = useMemo(() => {
    return JSON.stringify(
      blocks.map(({ type, title, body, imageUrl, buttonText, buttonUrl }) => ({
        type,
        ...(title.trim() ? { title: title.trim() } : {}),
        ...(body.trim() ? { body: body.trim() } : {}),
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
        ...(buttonText.trim() ? { buttonText: buttonText.trim() } : {}),
        ...(buttonUrl.trim() ? { buttonUrl: buttonUrl.trim() } : {})
      }))
    );
  }, [blocks]);

  function addBlock(type: BlockType) {
    setBlocks((current) => [...current, createEmptyBlock(type)]);
  }

  function updateBlock(index: number, patch: Partial<EditorBlock>) {
    setBlocks((current) =>
      current.map((block, currentIndex) =>
        currentIndex === index ? { ...block, ...patch } : block
      )
    );
  }

  function removeBlock(index: number) {
    setBlocks((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function moveBlock(fromIndex: number, toIndex: number) {
    setBlocks((current) => {
      if (toIndex < 0 || toIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  return (
    <div className="space-y-5" data-testid="admin-page-content-editor">
      <input type="hidden" name="useAdvancedContentBlocks" value="on" />
      <input type="hidden" name="contentBlocksJson" value={serializedBlocks} />

      <div className="flex flex-wrap gap-3">
        <AddBlockButton label="新增文字" onClick={() => addBlock("text")} />
        <AddBlockButton label="新增圖片" onClick={() => addBlock("image")} />
        <AddBlockButton label="新增按鈕" onClick={() => addBlock("cta")} />
      </div>

      {blocks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-slate-50 p-6 text-sm leading-6 text-muted">
          目前沒有內容區塊。請先點上方按鈕新增文字、圖片或按鈕區塊。
        </div>
      ) : null}

      <div className="space-y-4">
        {blocks.map((block, index) => (
          <article
            key={block.id}
            draggable
            onDragStart={() => setDraggingIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggingIndex !== null && draggingIndex !== index) {
                moveBlock(draggingIndex, index);
              }
              setDraggingIndex(null);
            }}
            onDragEnd={() => setDraggingIndex(null)}
            className={`rounded-lg border bg-white p-4 shadow-sm transition ${
              draggingIndex === index ? "border-brand-500 opacity-70" : "border-line"
            }`}
            data-testid="admin-page-content-block"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-ink">
                  {index + 1}. {blockTypeLabels[block.type]}
                </p>
                <p className="mt-1 text-xs text-muted">拖曳卡片可調整前台顯示順序。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <SmallButton
                  label="上移"
                  onClick={() => moveBlock(index, index - 1)}
                  disabled={index === 0}
                />
                <SmallButton
                  label="下移"
                  onClick={() => moveBlock(index, index + 1)}
                  disabled={index === blocks.length - 1}
                />
                <SmallButton label="刪除" tone="danger" onClick={() => removeBlock(index)} />
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <TextField
                label="區塊標題"
                value={block.title}
                onChange={(value) => updateBlock(index, { title: value })}
                placeholder="例如：服務特色"
              />

              {block.type === "text" ? (
                <TextArea
                  label="內文"
                  value={block.body}
                  onChange={(value) => updateBlock(index, { body: value })}
                  placeholder="直接輸入前台要顯示的內容，換行會保留。"
                />
              ) : null}

              {block.type === "image" ? (
                <>
                  <TextField
                    label="圖片網址"
                    value={block.imageUrl}
                    onChange={(value) => updateBlock(index, { imageUrl: value })}
                    placeholder="可貼圖片網址，或從下方媒體庫選擇"
                  />
                  {media.length > 0 ? (
                    <label className="block">
                      <span className="text-sm font-semibold text-ink">從媒體庫選擇圖片</span>
                      <select
                        value=""
                        onChange={(event) => {
                          if (event.target.value) {
                            updateBlock(index, { imageUrl: event.target.value });
                          }
                        }}
                        className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
                      >
                        <option value="">選擇圖片</option>
                        {media.map((item) => (
                          <option key={item.id} value={item.url}>
                            {item.fileName || item.altText || "未命名圖片"}（{item.merchantName}）
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <TextArea
                    label="圖片說明（選填）"
                    value={block.body}
                    onChange={(value) => updateBlock(index, { body: value })}
                    placeholder="這段文字會顯示在圖片下方。"
                  />
                </>
              ) : null}

              {block.type === "cta" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="按鈕文字"
                    value={block.buttonText}
                    onChange={(value) => updateBlock(index, { buttonText: value })}
                    placeholder="例如：查看商品"
                  />
                  <TextField
                    label="按鈕連結"
                    value={block.buttonUrl}
                    onChange={(value) => updateBlock(index, { buttonUrl: value })}
                    placeholder="例如：/products"
                  />
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function normalizeBlocks(blocks: EditableContentBlock[]) {
  const normalized = blocks
    .filter((block) => block && typeof block === "object" && !Array.isArray(block))
    .map((block) => {
      const type = normalizeBlockType(block.type);
      return {
        id: createId(),
        type,
        title: normalizeText(block.title),
        body: normalizeText(block.body),
        imageUrl: normalizeText(block.imageUrl),
        buttonText: normalizeText(block.buttonText),
        buttonUrl: normalizeText(block.buttonUrl)
      };
    });

  return normalized.length > 0 ? normalized : [createEmptyBlock("text")];
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeBlockType(type?: string): BlockType {
  if (type === "image" || type === "cta") {
    return type;
  }

  return "text";
}

function createEmptyBlock(type: BlockType): EditorBlock {
  return {
    id: createId(),
    type,
    title: type === "cta" ? "了解更多" : "",
    body: "",
    imageUrl: "",
    buttonText: type === "cta" ? "查看商品" : "",
    buttonUrl: type === "cta" ? "/products" : ""
  };
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

function AddBlockButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:border-brand-400 hover:bg-brand-100"
    >
      {label}
    </button>
  );
}

function SmallButton({
  label,
  onClick,
  disabled = false,
  tone = "default"
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === "danger"
          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-line bg-white text-ink hover:border-brand-300"
      }`}
    >
      {label}
    </button>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-12 w-full rounded border border-line px-4 text-sm outline-none focus:border-brand-500"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
        className="mt-2 w-full rounded border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
      />
    </label>
  );
}
