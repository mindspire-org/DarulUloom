import React from "react";
import { Input } from "@/components/ui/input";

export type CharacterBoxInputHandle = {
    focusFirst: () => void;
    focusLast: () => void;
};

interface CharacterBoxInputProps {
    value: string;
    onChange: (value: string) => void;
    length: number;
    type?: "number" | "text";
    pattern?: string; // e.g., "00000-0000000-0" for CNIC
    className?: string;
    onComplete?: () => void;
    onBackspaceAtStart?: () => void;
}

export const CharacterBoxInput = React.forwardRef<CharacterBoxInputHandle, CharacterBoxInputProps>(
    (
        {
            value,
            onChange,
            length,
            type = "text",
            pattern,
            className = "",
            onComplete,
            onBackspaceAtStart,
        },
        ref
    ) => {
        const inputId = React.useId();
        const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);

        const focusIndex = (idx: number) => {
            const el = inputRefs.current[idx];
            if (el) {
                el.focus();
                el.select();
            }
        };

        React.useImperativeHandle(
            ref,
            () => ({
                focusFirst: () => focusIndex(0),
                focusLast: () => focusIndex(Math.max(0, length - 1)),
            }),
            [length]
        );

        const distribute = (startIndex: number, raw: string) => {
            const incoming = String(raw ?? "");
            const chars = value.padEnd(length, " ").split("");

            let nextIndex = startIndex;
            for (let i = 0; i < incoming.length && nextIndex < length; i++) {
                const ch = incoming[i];
                if (!ch) continue;
                chars[nextIndex] = ch;
                nextIndex++;
            }

            const newFullValue = chars.join("").trimEnd();
            onChange(newFullValue);

            if (nextIndex < length) {
                window.requestAnimationFrame(() => focusIndex(nextIndex));
                return;
            }

            window.requestAnimationFrame(() => onComplete?.());
        };

        const handleChange = (index: number, newValue: string) => {
            if (!newValue) {
                const chars = value.padEnd(length, " ").split("");
                chars[index] = " ";
                const newFullValue = chars.join("").trimEnd();
                onChange(newFullValue);
                return;
            }

            const incoming = type === "number" ? newValue.replace(/\D/g, "") : newValue;
            distribute(index, incoming);
        };

        const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
            if (e.key === "Backspace") {
                const chars = value.padEnd(length, " ").split("");
                const currentHasValue = Boolean((chars[index] || "").trim());
                if (currentHasValue) {
                    chars[index] = " ";
                    const newFullValue = chars.join("").trimEnd();
                    onChange(newFullValue);
                    e.preventDefault();
                    return;
                }
                if (index > 0) {
                    chars[index - 1] = " ";
                    const newFullValue = chars.join("").trimEnd();
                    onChange(newFullValue);
                    focusIndex(index - 1);
                    e.preventDefault();
                    return;
                }
                onBackspaceAtStart?.();
                e.preventDefault();
            }
        };

        const handlePaste = (index: number, e: React.ClipboardEvent) => {
            const text = e.clipboardData.getData("text");
            if (!text) return;
            e.preventDefault();
            const incoming = type === "number" ? text.replace(/\D/g, "") : text;
            distribute(index, incoming);
        };

        const chars = value.padEnd(length, " ").split("");

        return (
            <div className={`flex gap-1 ${className}`}>
                {chars.map((char, index) => (
                    <Input
                        key={index}
                        data-char-index={`${inputId}-${index}`}
                        ref={(el) => {
                            inputRefs.current[index] = el;
                        }}
                        type={type === "number" ? "text" : "text"}
                        inputMode={type === "number" ? "numeric" : "text"}
                        value={char === " " ? "" : char}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={(e) => handlePaste(index, e)}
                        className="w-8 h-8 text-center p-0 border-2 border-black"
                        maxLength={1}
                    />
                ))}
            </div>
        );
    }
);
CharacterBoxInput.displayName = "CharacterBoxInput";

interface CNICInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function CNICInput({ value, onChange, className = "" }: CNICInputProps) {
    // CNIC format: 00000-0000000-0 (13 digits with dashes)
    const parts = value.split("-");
    const part1 = parts[0] || "";
    const part2 = parts[1] || "";
    const part3 = parts[2] || "";

    const part1Ref = React.useRef<CharacterBoxInputHandle | null>(null);
    const part2Ref = React.useRef<CharacterBoxInputHandle | null>(null);
    const part3Ref = React.useRef<CharacterBoxInputHandle | null>(null);

    const handlePartChange = (partIndex: number, newValue: string) => {
        const newParts = [part1, part2, part3];
        newParts[partIndex] = newValue;
        onChange(newParts.filter(p => p).join("-"));
    };

    return (
        <div className={`flex items-center gap-1 ${className}`} dir="ltr">
            <CharacterBoxInput
                ref={part1Ref}
                value={part1}
                onChange={(v) => handlePartChange(0, v)}
                length={5}
                type="number"
                onComplete={() => part2Ref.current?.focusFirst()}
            />
            <span className="text-xl font-bold">-</span>
            <CharacterBoxInput
                ref={part2Ref}
                value={part2}
                onChange={(v) => handlePartChange(1, v)}
                length={7}
                type="number"
                onComplete={() => part3Ref.current?.focusFirst()}
                onBackspaceAtStart={() => part1Ref.current?.focusLast()}
            />
            <span className="text-xl font-bold">-</span>
            <CharacterBoxInput
                ref={part3Ref}
                value={part3}
                onChange={(v) => handlePartChange(2, v)}
                length={1}
                type="number"
                onBackspaceAtStart={() => part2Ref.current?.focusLast()}
            />
        </div>
    );
}

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function PhoneInput({ value, onChange, className = "" }: PhoneInputProps) {
    // Phone format: 03XX-XXXXXXX (11 digits with dash)
    const cleanValue = value.replace(/\D/g, "");
    const part1 = cleanValue.slice(0, 4);
    const part2 = cleanValue.slice(4, 11);

    const part1Ref = React.useRef<CharacterBoxInputHandle | null>(null);
    const part2Ref = React.useRef<CharacterBoxInputHandle | null>(null);

    const handlePartChange = (partIndex: number, newValue: string) => {
        if (partIndex === 0) {
            onChange(newValue + part2);
        } else {
            onChange(part1 + newValue);
        }
    };

    return (
        <div className={`flex items-center gap-1 ${className}`} dir="ltr">
            <CharacterBoxInput
                ref={part1Ref}
                value={part1}
                onChange={(v) => handlePartChange(0, v)}
                length={4}
                type="number"
                onComplete={() => part2Ref.current?.focusFirst()}
            />
            <span className="text-xl font-bold">-</span>
            <CharacterBoxInput
                ref={part2Ref}
                value={part2}
                onChange={(v) => handlePartChange(1, v)}
                length={7}
                type="number"
                onBackspaceAtStart={() => part1Ref.current?.focusLast()}
            />
        </div>
    );
}

interface DateBoxInputProps {
    value: string; // YYYY-MM-DD format
    onChange: (value: string) => void;
    className?: string;
}

export function DateBoxInput({ value, onChange, className = "" }: DateBoxInputProps) {
    // Date format: DD/MM/YYYY
    const parts = value.split("-");
    const year = parts[0] || "";
    const month = parts[1] || "";
    const day = parts[2] || "";

    const dayRef = React.useRef<CharacterBoxInputHandle | null>(null);
    const monthRef = React.useRef<CharacterBoxInputHandle | null>(null);
    const yearRef = React.useRef<CharacterBoxInputHandle | null>(null);

    const handlePartChange = (partIndex: number, newValue: string) => {
        const newParts = [year, month, day];
        if (partIndex === 0) newParts[2] = newValue; // day
        if (partIndex === 1) newParts[1] = newValue; // month
        if (partIndex === 2) newParts[0] = newValue; // year
        onChange(newParts.filter(p => p).join("-"));
    };

    return (
        <div className={`flex items-center gap-1 ${className}`} dir="ltr">
            <CharacterBoxInput
                ref={dayRef}
                value={day}
                onChange={(v) => handlePartChange(0, v)}
                length={2}
                type="number"
                onComplete={() => monthRef.current?.focusFirst()}
            />
            <span className="text-xl font-bold">/</span>
            <CharacterBoxInput
                ref={monthRef}
                value={month}
                onChange={(v) => handlePartChange(1, v)}
                length={2}
                type="number"
                onComplete={() => yearRef.current?.focusFirst()}
                onBackspaceAtStart={() => dayRef.current?.focusLast()}
            />
            <span className="text-xl font-bold">/</span>
            <CharacterBoxInput
                ref={yearRef}
                value={year}
                onChange={(v) => handlePartChange(2, v)}
                length={4}
                type="number"
                onBackspaceAtStart={() => monthRef.current?.focusLast()}
            />
        </div>
    );
}
