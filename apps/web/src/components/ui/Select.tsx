import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

export type SelectOption = {
  description?: string;
  label: string;
  value: string;
};

type SelectProps = {
  disabled?: boolean;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  value: string;
};

export function Select({ disabled, onValueChange, options, placeholder = "Select an option", value }: SelectProps) {
  const buttonId = useId();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const typeaheadTimeoutRef = useRef<number | null>(null);
  const typeaheadRef = useRef("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((option) => option.value === value)));

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  useEffect(() => {
    const nextIndex = options.findIndex((option) => option.value === value);
    setActiveIndex(nextIndex >= 0 ? nextIndex : 0);
  }, [options, value]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, isOpen]);

  useEffect(
    () => () => {
      if (typeaheadTimeoutRef.current) {
        window.clearTimeout(typeaheadTimeoutRef.current);
      }
    },
    []
  );

  function openSelect(index = activeIndex) {
    setActiveIndex(index);
    setIsOpen(true);
  }

  function closeSelect() {
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  function commitSelection(index: number) {
    const option = options[index];
    if (!option) {
      return;
    }

    onValueChange(option.value);
    setActiveIndex(index);
    closeSelect();
  }

  function moveActive(nextIndex: number) {
    const boundedIndex = Math.max(0, Math.min(options.length - 1, nextIndex));
    setActiveIndex(boundedIndex);
  }

  function handleTypeahead(key: string) {
    typeaheadRef.current = `${typeaheadRef.current}${key.toLowerCase()}`;

    if (typeaheadTimeoutRef.current) {
      window.clearTimeout(typeaheadTimeoutRef.current);
    }

    typeaheadTimeoutRef.current = window.setTimeout(() => {
      typeaheadRef.current = "";
    }, 400);

    const search = typeaheadRef.current;
    const currentIndex = Math.max(activeIndex, 0);
    const orderedOptions = [...options.slice(currentIndex + 1), ...options.slice(0, currentIndex + 1)];
    const match = orderedOptions.find((option) => option.label.toLowerCase().startsWith(search));

    if (!match) {
      return;
    }

    const matchIndex = options.findIndex((option) => option.value === match.value);
    if (matchIndex >= 0) {
      if (isOpen) {
        setActiveIndex(matchIndex);
      } else {
        onValueChange(match.value);
      }
    }
  }

  function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        openSelect(Math.min(options.length - 1, activeIndex + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        openSelect(Math.max(0, activeIndex - 1));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        openSelect();
        break;
      case "Home":
        event.preventDefault();
        openSelect(0);
        break;
      case "End":
        event.preventDefault();
        openSelect(options.length - 1);
        break;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          handleTypeahead(event.key);
        }
    }
  }

  function handleOptionKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActive(activeIndex + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveActive(activeIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        moveActive(0);
        break;
      case "End":
        event.preventDefault();
        moveActive(options.length - 1);
        break;
      case "Escape":
        event.preventDefault();
        closeSelect();
        break;
      case "Tab":
        setIsOpen(false);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        commitSelection(activeIndex);
        break;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          handleTypeahead(event.key);
        }
    }
  }

  return (
    <div className="ui-select" data-open={isOpen ? "true" : undefined} ref={containerRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="ui-select-trigger"
        disabled={disabled}
        id={buttonId}
        onClick={() => (isOpen ? setIsOpen(false) : openSelect())}
        onKeyDown={handleButtonKeyDown}
        ref={buttonRef}
        type="button"
      >
        <span className="ui-select-value">{selectedOption?.label ?? placeholder}</span>
        <span aria-hidden="true" className="ui-select-caret">
          <svg viewBox="0 0 16 16">
            <path d="M4 6.5 8 10.5 12 6.5" />
          </svg>
        </span>
      </button>

      {isOpen ? (
        <div
          aria-labelledby={buttonId}
          className="ui-select-popover"
          id={listboxId}
          role="listbox"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;

            return (
              <button
                aria-selected={isSelected}
                className="ui-select-option"
                data-active={isActive ? "true" : undefined}
                data-selected={isSelected ? "true" : undefined}
                key={option.value}
                onClick={() => commitSelection(index)}
                onKeyDown={handleOptionKeyDown}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                role="option"
                tabIndex={isActive ? 0 : -1}
                type="button"
              >
                <span className="ui-select-option-copy">
                  <span className="ui-select-option-label">{option.label}</span>
                  {option.description ? <span className="ui-select-option-description">{option.description}</span> : null}
                </span>
                {isSelected ? <span className="ui-select-check">Selected</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
