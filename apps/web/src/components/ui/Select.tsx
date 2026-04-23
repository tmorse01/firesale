import { Select as BaseSelect } from "@base-ui/react/select";
import { Icon } from "./Icon";

export type SelectOption = {
  description?: string;
  label: string;
  value: string;
};

type SelectProps = {
  disabled?: boolean;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  value: string;
};

export function Select({ disabled, onValueChange, options, placeholder = "Select an option", value }: SelectProps) {
  return (
    <BaseSelect.Root
      disabled={disabled}
      items={options}
      onValueChange={(nextValue) => {
        if (typeof nextValue === "string") {
          onValueChange(nextValue);
        }
      }}
      value={value}
    >
      <BaseSelect.Trigger
        className={(state) =>
          [
            "ui-select-trigger",
            state.open ? "is-open" : "",
            state.placeholder ? "is-placeholder" : ""
          ]
            .filter(Boolean)
            .join(" ")
        }
        disabled={disabled}
      >
        <BaseSelect.Value className="ui-select-value" placeholder={placeholder} />
        <BaseSelect.Icon className="ui-select-caret">
          <Icon name="expand_more" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>

      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={10}>
          <BaseSelect.Popup className="ui-select-popover">
            <BaseSelect.List className="ui-select-list">
              {options.map((option) => (
                <BaseSelect.Item
                  className={(state) =>
                    [
                      "ui-select-option",
                      state.highlighted ? "is-highlighted" : "",
                      state.selected ? "is-selected" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                  key={option.value}
                  label={option.label}
                  value={option.value}
                >
                <span className="ui-select-option-copy">
                    <BaseSelect.ItemText className="ui-select-option-label">{option.label}</BaseSelect.ItemText>
                  {option.description ? <span className="ui-select-option-description">{option.description}</span> : null}
                </span>
                  <BaseSelect.ItemIndicator className="ui-select-check">
                    <Icon filled name="check_circle" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
